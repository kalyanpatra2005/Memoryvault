import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { vaultEngine } from '../services/vaultEngine';
import TimelineView from '../components/TimelineView';
import AddMemoryModal from '../components/AddMemoryModal';
import MemoryDetailModal from '../components/MemoryDetailModal';
import { GitCommit, Plus, ShieldCheck, Sparkles } from 'lucide-react';

export default function TimelinePage() {
  const { user, token } = useAuth();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeMemoryDetail, setActiveMemoryDetail] = useState(null);

  useEffect(() => {
    fetchTimelineMemories();
  }, [token, user?.id, user?.email]);

  const fetchTimelineMemories = async () => {
    try {
      setLoading(true);
      const items = await vaultEngine.getVaultItems(token, user?.id || 'guest', user?.email || '');
      items.sort((a, b) => new Date(b.memory_date || b.created_at || 0) - new Date(a.memory_date || a.created_at || 0));
      setMemories(items);
    } catch (err) {
      console.error('Failed to fetch timeline', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    try {
      await vaultEngine.deleteVaultItem(token, id, user?.id || 'guest');
      setMemories(prev => prev.filter(m => String(m.id) !== String(id)));
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleToggleFavorite = (memory) => {
    setMemories(prev => prev.map(m => {
      if (m.id === memory.id) {
        const currentFav = m.is_favorite || (Array.isArray(m.tags) && m.tags.includes('favorite'));
        const newFav = !currentFav;
        let updatedTags = Array.isArray(m.tags) ? [...m.tags] : [];
        if (newFav && !updatedTags.includes('favorite')) {
          updatedTags.push('favorite');
        } else if (!newFav) {
          updatedTags = updatedTags.filter(t => t !== 'favorite');
        }
        return { ...m, is_favorite: newFav, tags: updatedTags };
      }
      return m;
    }));
  };

  const handleMemoryAdded = (newItem) => {
    if (newItem) {
      setMemories(prev => [newItem, ...prev]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-stone-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
            <GitCommit className="w-4 h-4 text-amber-400" />
            <span>CHRONOLOGICAL LIFETIME JOURNEY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-sans text-stone-100 tracking-tight">
            The Memory Timeline
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm mt-1">
            Browse through years and months of your life in rich chronological sequence.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-bold text-xs shadow-lg shadow-amber-950/40 border border-amber-400/40 transition flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Moment to Timeline</span>
        </button>
      </div>

      {/* Timeline Component */}
      <TimelineView
        memories={memories}
        token={token}
        onViewMemory={(mem) => setActiveMemoryDetail(mem)}
        onDeleteMemory={handleDeleteMemory}
        onToggleFavorite={handleToggleFavorite}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Modals */}
      <AddMemoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleMemoryAdded}
      />

      <MemoryDetailModal
        memory={activeMemoryDetail}
        onClose={() => setActiveMemoryDetail(null)}
        onDelete={handleDeleteMemory}
        onToggleFavorite={handleToggleFavorite}
        token={token}
      />

    </div>
  );
}
