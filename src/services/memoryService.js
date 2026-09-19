import { supabase } from './supabaseClient';

export const memoryService = {
  // =========================================================================
  // 1. MEMORIES & PHOTOS / VIDEOS
  // =========================================================================
  async getMemories({ search = '', category = 'All', isFavoriteOnly = false } = {}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('memories')
      .select('*')
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
          .from('media')
          .select('*')
          .eq('user_id', user.id);

        if (mediaItems) {
          mediaItems.forEach(item => {
            if (item.memory_id) {
              if (!mediaMap[item.memory_id]) mediaMap[item.memory_id] = [];
              const { data } = supabase.storage.from('memory-media').getPublicUrl(item.file_path);
              mediaMap[item.memory_id].push({
                ...item,
                url: data?.publicUrl || item.file_path
              });
            }
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

    const { data: mediaItems } = await supabase
      .from('media')
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

  async createMemory({ title, description, memory_date, category, location, tags, is_favorite, file, files }) {
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

    // Upload files if provided
    const fileList = files || (file ? [file] : []);
    for (const f of fileList) {
      if (f && newMemory) {
        const ext = f.name.split('.').pop() || 'jpg';
        const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const filePath = `${user.id}/memories/${newMemory.id}/${cleanFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('memory-media')
          .upload(filePath, f);

        if (!uploadError) {
          await supabase
            .from('media')
            .insert({
              memory_id: newMemory.id,
              user_id: user.id,
              file_path: filePath,
              file_type: f.type.startsWith('video/') ? 'video' : 'photo',
              file_name: f.name
            });
        }
      }
    }

    return newMemory;
  },

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
      const filePath = `${user.id}/memories/${id}/${cleanFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('memory-media')
        .upload(filePath, newFile);

      if (!uploadError) {
        await supabase
          .from('media')
          .insert({
            memory_id: id,
            user_id: user.id,
            file_path: filePath,
            file_type: newFile.type.startsWith('video/') ? 'video' : 'photo',
            file_name: newFile.name
          });
      }
    }

    return Array.isArray(data) ? data[0] : data;
  },

  async deleteMemory(id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const { data: mediaItems } = await supabase
      .from('media')
      .select('file_path')
      .eq('memory_id', id)
      .eq('user_id', user.id);

    if (mediaItems && mediaItems.length > 0) {
      const paths = mediaItems.map(m => m.file_path);
      await supabase.storage.from('memory-media').remove(paths);
    }

    await supabase.from('media').delete().eq('memory_id', id);

    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  },

  async toggleFavorite(id, isFavorite) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const { data, error } = await supabase
      .from('memories')
      .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  },

  // =========================================================================
  // 2. DIGITAL DIARY ENTRIES
  // =========================================================================
  async getDiaryEntries({ search = '' } = {}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: entries, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false });

    if (error) throw error;
    if (!entries) return [];

    // Fetch media associated with diary entries
    const diaryIds = entries.map(e => e.id);
    let mediaMap = {};

    if (diaryIds.length > 0) {
      try {
        const { data: mediaItems } = await supabase
          .from('media')
          .select('*')
          .eq('user_id', user.id);

        if (mediaItems) {
          mediaItems.forEach(item => {
            if (item.diary_id) {
              if (!mediaMap[item.diary_id]) mediaMap[item.diary_id] = [];
              const { data } = supabase.storage.from('memory-media').getPublicUrl(item.file_path);
              mediaMap[item.diary_id].push({
                ...item,
                url: data?.publicUrl || item.file_path
              });
            }
          });
        }
      } catch (e) {}
    }

    let results = entries.map(e => ({
      ...e,
      media: mediaMap[e.id] || []
    }));

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter(e => 
        (e.title || '').toLowerCase().includes(q) || 
        (e.content || '').toLowerCase().includes(q)
      );
    }

    return results;
  },

  async getDiaryEntryById(id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Diary entry not found');

    const { data: mediaItems } = await supabase
      .from('media')
      .select('*')
      .eq('diary_id', id)
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

  async createDiaryEntry({ title, content, entry_date, files }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const { data, error } = await supabase
      .from('diary_entries')
      .insert({
        user_id: user.id,
        title: title?.trim() || null,
        content: content.trim(),
        entry_date: entry_date || new Date().toISOString().split('T')[0]
      })
      .select();

    if (error) throw error;
    const newEntry = Array.isArray(data) ? data[0] : data;

    // Upload attached photos if any
    if (files && files.length > 0 && newEntry) {
      for (const f of files) {
        const ext = f.name.split('.').pop() || 'jpg';
        const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const filePath = `${user.id}/diary/${newEntry.id}/${cleanFileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('memory-media')
          .upload(filePath, f);

        if (!uploadErr) {
          await supabase.from('media').insert({
            diary_id: newEntry.id,
            user_id: user.id,
            file_path: filePath,
            file_type: f.type.startsWith('video/') ? 'video' : 'photo',
            file_name: f.name
          });
        }
      }
    }

    return newEntry;
  },

  async updateDiaryEntry(id, fields, newFiles = []) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const { data, error } = await supabase
      .from('diary_entries')
      .update({
        ...fields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) throw error;

    if (newFiles && newFiles.length > 0) {
      for (const f of newFiles) {
        const ext = f.name.split('.').pop() || 'jpg';
        const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const filePath = `${user.id}/diary/${id}/${cleanFileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('memory-media')
          .upload(filePath, f);

        if (!uploadErr) {
          await supabase.from('media').insert({
            diary_id: id,
            user_id: user.id,
            file_path: filePath,
            file_type: f.type.startsWith('video/') ? 'video' : 'photo',
            file_name: f.name
          });
        }
      }
    }

    return Array.isArray(data) ? data[0] : data;
  },

  async deleteDiaryEntry(id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const { data: mediaItems } = await supabase
      .from('media')
      .select('file_path')
      .eq('diary_id', id)
      .eq('user_id', user.id);

    if (mediaItems && mediaItems.length > 0) {
      const paths = mediaItems.map(m => m.file_path);
      await supabase.storage.from('memory-media').remove(paths);
    }

    await supabase.from('media').delete().eq('diary_id', id);
    const { error } = await supabase.from('diary_entries').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    return true;
  },

  // =========================================================================
  // 3. TIME CAPSULES
  // =========================================================================
  async getTimeCapsules() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('time_capsules')
      .select('*')
      .eq('user_id', user.id)
      .order('target_date', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    // Attach public URLs for image_path
    return data.map(item => {
      let imageUrl = null;
      if (item.image_path) {
        const { data: storageData } = supabase.storage.from('memory-media').getPublicUrl(item.image_path);
        imageUrl = storageData?.publicUrl || item.image_path;
      }
      return {
        ...item,
        imageUrl
      };
    });
  },

  async createTimeCapsule({ title, message, target_date, file }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    let image_path = null;

    if (file) {
      const ext = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      image_path = `${user.id}/capsules/${cleanFileName}`;

      await supabase.storage.from('memory-media').upload(image_path, file);
    }

    const { data, error } = await supabase
      .from('time_capsules')
      .insert({
        user_id: user.id,
        title: title.trim(),
        message: message?.trim() || null,
        target_date: new Date(target_date).toISOString(),
        image_path,
        status: new Date(target_date) <= new Date() ? 'unlocked' : 'locked'
      })
      .select();

    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  },

  async deleteTimeCapsule(id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const { data: item } = await supabase
      .from('time_capsules')
      .select('image_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (item?.image_path) {
      await supabase.storage.from('memory-media').remove([item.image_path]);
    }

    const { error } = await supabase.from('time_capsules').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    return true;
  },

  // =========================================================================
  // 4. STATISTICS & UNIFIED TIMELINE
  // =========================================================================
  async getStatistics() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { totalMemories: 0, diaryCount: 0, capsuleCount: 0, mediaCount: 0, favoritesCount: 0 };
    }

    const [memories, diaries, capsules, media] = await Promise.all([
      supabase.from('memories').select('id, is_favorite').eq('user_id', user.id),
      supabase.from('diary_entries').select('id').eq('user_id', user.id),
      supabase.from('time_capsules').select('id').eq('user_id', user.id),
      supabase.from('media').select('id').eq('user_id', user.id)
    ]);

    const memList = memories.data || [];
    const favCount = memList.filter(m => m.is_favorite).length;

    return {
      totalMemories: memList.length,
      diaryCount: (diaries.data || []).length,
      capsuleCount: (capsules.data || []).length,
      mediaCount: (media.data || []).length,
      favoritesCount: favCount
    };
  },

  async getUnifiedTimeline() {
    const [memories, diaries, capsules] = await Promise.all([
      this.getMemories(),
      this.getDiaryEntries(),
      this.getTimeCapsules()
    ]);

    const timelineItems = [
      ...memories.map(m => ({
        ...m,
        timelineType: 'memory',
        timelineDate: m.memory_date || m.created_at
      })),
      ...diaries.map(d => ({
        ...d,
        timelineType: 'diary',
        timelineDate: d.entry_date || d.created_at
      })),
      ...capsules.map(c => ({
        ...c,
        timelineType: 'capsule',
        timelineDate: c.created_at
      }))
    ];

    timelineItems.sort((a, b) => new Date(b.timelineDate).getTime() - new Date(a.timelineDate).getTime());
    return timelineItems;
  },

  async searchAll(query) {
    if (!query || !query.trim()) return { memories: [], diaries: [], capsules: [] };
    const q = query.toLowerCase().trim();

    const [memories, diaries, capsules] = await Promise.all([
      this.getMemories({ search: q }),
      this.getDiaryEntries({ search: q }),
      this.getTimeCapsules()
    ]);

    const filteredCapsules = capsules.filter(c => 
      (c.title || '').toLowerCase().includes(q) || 
      (c.message || '').toLowerCase().includes(q)
    );

    return {
      memories,
      diaries,
      capsules: filteredCapsules
    };
  }
};
