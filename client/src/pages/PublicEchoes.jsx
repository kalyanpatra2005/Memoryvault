import { useState, useEffect } from 'react';
import api from '../api';
import { 
  Globe, Heart, Calendar, User, Film, Image as ImageIcon, 
  Sparkles, MessageSquare, Share2 
} from 'lucide-react';

export default function PublicEchoes() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPublicPosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/public/posts');
      setPosts(data);
    } catch (err) {
      console.error('Failed to load public posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublicPosts();
  }, []);

  // Handle heart/like toggle
  const handleLike = async (postId) => {
    try {
      const { data } = await api.post(`/public/posts/${postId}/like`);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            user_liked: data.liked ? 1 : 0,
            likes_count: data.likesCount,
          };
        }
        return p;
      }));
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Community Banner */}
      <div className="bg-gradient-to-r from-sky-950/50 via-indigo-950/40 to-purple-950/50 border border-sky-500/20 rounded-3xl p-6 sm:p-8 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-xl">
            🌐
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Public Echoes & Stories</h1>
            <p className="text-sky-300/80 text-xs sm:text-sm">
              Cherished memories generously shared by our community members for everyone to admire.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-4xl animate-pulse mb-3">💫</div>
          <p className="text-sky-300 text-sm">Gathering community echoes…</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto">
          <div className="text-4xl mb-3">🕊️</div>
          <h3 className="text-lg font-bold text-white mb-1">No public posts yet</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Be the first to share an unforgettable memory or photograph with the community by choosing "Post Publicly" in your vault.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <div
              key={post.id}
              className="glass-card rounded-3xl overflow-hidden border border-white/5 hover:border-sky-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Author info header */}
                <div className="p-4 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-sky-600 text-white font-bold text-xs flex items-center justify-center">
                      {post.author_name ? post.author_name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{post.author_name}</h4>
                      <p className="text-[10px] text-slate-400">
                        {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 text-sky-300 border border-white/10">
                    {post.category}
                  </span>
                </div>

                {/* Media representation */}
                {post.media_url ? (
                  <div className="w-full h-60 bg-black/60 overflow-hidden flex items-center justify-center relative">
                    {post.media_type === 'video' ? (
                      <video
                        src={post.media_url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={post.media_url}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-full h-32 bg-sky-950/20 flex items-center justify-center text-2xl">
                    📜
                  </div>
                )}

                {/* Content body */}
                <div className="p-5">
                  <h3 className="font-bold text-white text-base mb-2">
                    {post.title}
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                    {post.description}
                  </p>
                </div>
              </div>

              {/* Like / reaction bar */}
              <div className="px-5 py-3.5 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    post.user_liked
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${post.user_liked ? 'fill-rose-400 text-rose-400' : ''}`} />
                  <span>{post.likes_count || 0} {post.likes_count === 1 ? 'Heart' : 'Hearts'}</span>
                </button>

                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-sky-400" />
                  <span>Public</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
