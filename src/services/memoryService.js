import { supabase } from './supabaseClient';

export const memoryService = {
  // 1. Fetch user memories with optional search and filters
  async getMemories({ search = '', category = 'All', isFavoriteOnly = false } = {}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('memories')
      .select(`
        id,
        user_id,
        title,
        description,
        memory_date,
        category,
        location,
        tags,
        is_favorite,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('memory_date', { ascending: false });

    const { data: memories, error } = await query;
    if (error) throw error;
    if (!memories) return [];

    // Fetch media records for memories
    const memoryIds = memories.map(m => m.id);
    let mediaMap = {};

    if (memoryIds.length > 0) {
      try {
        const { data: mediaItems } = await supabase
          .from('memory_media')
          .select('*')
          .eq('user_id', user.id);

        if (mediaItems) {
          mediaItems.forEach(item => {
            if (!mediaMap[item.memory_id]) mediaMap[item.memory_id] = [];
            
            // Get public URL or storage URL
            const { data } = supabase.storage.from('memory-media').getPublicUrl(item.file_path);
            mediaMap[item.memory_id].push({
              ...item,
              url: data?.publicUrl || item.file_path
            });
          });
        }
      } catch (e) {
        console.error('Media fetch warning', e);
      }
    }

    let results = memories.map(m => ({
      ...m,
      media: mediaMap[m.id] || []
    }));

    // Client-side filtering for fast interactive search & category filtering
    if (category && category !== 'All') {
      results = results.filter(m => m.category === category);
    }

    if (isFavoriteOnly) {
      results = results.filter(m => m.is_favorite);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter(m => {
        const titleMatch = (m.title || '').toLowerCase().includes(q);
        const descMatch = (m.description || '').toLowerCase().includes(q);
        const catMatch = (m.category || '').toLowerCase().includes(q);
        const locMatch = (m.location || '').toLowerCase().includes(q);
        const tagsMatch = Array.isArray(m.tags) && m.tags.some(t => t.toLowerCase().includes(q));
        return titleMatch || descMatch || catMatch || locMatch || tagsMatch;
      });
    }

    return results;
  },

  // 2. Fetch single memory by ID (protected by RLS)
  async getMemoryById(id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Memory not found or access denied');

    // Fetch media
    const { data: mediaItems } = await supabase
      .from('memory_media')
      .select('*')
      .eq('memory_id', id)
      .eq('user_id', user.id);

    const mediaWithUrls = (mediaItems || []).map(item => {
      const { data: storageData } = supabase.storage.from('memory-media').getPublicUrl(item.file_path);
      return {
        ...item,
        url: storageData?.publicUrl || item.file_path
      };
    });

    return {
      ...data,
      media: mediaWithUrls
    };
  },

  // 3. Create a new memory
  async createMemory({ title, description, memory_date, category, location, tags, is_favorite, file }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const { data: memoryData, error: memError } = await supabase
      .from('memories')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        memory_date: memory_date || new Date().toISOString().split('T')[0],
        category: category || 'Personal',
        location: location?.trim() || null,
        tags: Array.isArray(tags) ? tags : [],
        is_favorite: Boolean(is_favorite)
      })
      .select();

    if (memError) throw memError;
    const newMemory = Array.isArray(memoryData) ? memoryData[0] : memoryData;

    // Upload media file if attached
    if (file && newMemory) {
      const ext = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      // File path isolated strictly by user_id
      const filePath = `${user.id}/${newMemory.id}/${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('memory-media')
        .upload(filePath, file);

      if (!uploadError) {
        await supabase
          .from('memory_media')
          .insert({
            memory_id: newMemory.id,
            user_id: user.id,
            file_path: filePath,
            file_type: file.type.startsWith('video/') ? 'video' : 'photo',
            file_name: file.name
          });
      }
    }

    return newMemory;
  },

  // 4. Update memory
  async updateMemory(id, fields, newFile = null) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const { data, error } = await supabase
      .from('memories')
      .update({
        ...fields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) throw error;

    if (newFile) {
      const ext = newFile.name.split('.').pop() || 'jpg';
      const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filePath = `${user.id}/${id}/${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('memory-media')
        .upload(filePath, newFile);

      if (!uploadError) {
        await supabase
          .from('memory_media')
          .insert({
            memory_id: id,
            user_id: user.id,
            file_path: filePath,
            file_type: newFile.type.startsWith('video/') ? 'video' : 'photo',
            file_name: newFile.name
          });
      }
    }

    return data;
  },

  // 5. Delete memory & remove storage files
  async deleteMemory(id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    // Find media files to remove from storage
    try {
      const { data: mediaItems } = await supabase
        .from('memory_media')
        .select('file_path')
        .eq('memory_id', id)
        .eq('user_id', user.id);

      if (mediaItems && mediaItems.length > 0) {
        const paths = mediaItems.map(m => m.file_path);
        await supabase.storage.from('memory-media').remove(paths);
      }
    } catch (e) {}

    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  },

  // 6. Toggle Favorite status
  async toggleFavorite(id, currentStatus) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const { error } = await supabase
      .from('memories')
      .update({ is_favorite: !currentStatus })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return !currentStatus;
  },

  // 7. Calculate real dashboard statistics (never fake stats)
  async getDashboardStats() {
    const memories = await this.getMemories();
    const totalMemories = memories.length;
    const favoriteMemories = memories.filter(m => m.is_favorite).length;

    // Calculate unique years captured
    const yearsSet = new Set();
    memories.forEach(m => {
      if (m.memory_date) {
        const y = new Date(m.memory_date).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });

    const yearsCaptured = yearsSet.size;

    // Recent activity: memories added in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivity = memories.filter(m => new Date(m.created_at || m.memory_date) >= thirtyDaysAgo).length;

    return {
      totalMemories,
      favoriteMemories,
      yearsCaptured,
      recentActivity,
      recentMemories: memories.slice(0, 6)
    };
  }
};
