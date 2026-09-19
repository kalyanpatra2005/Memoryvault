import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id')
);

// Real Supabase Client if configured, or developer mock fallback
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createMockSupabase();

function createMockSupabase() {
  let mockUser = null;
  try {
    const raw = sessionStorage.getItem('timememory_session_user');
    if (raw) mockUser = JSON.parse(raw);
  } catch (e) {}

  const authListeners = new Set();

  return {
    auth: {
      async getSession() {
        return { data: { session: mockUser ? { user: mockUser } : null }, error: null };
      },
      async getUser() {
        return { data: { user: mockUser }, error: null };
      },
      async signUp({ email, password, options }) {
        const id = 'mock-' + Math.random().toString(36).substring(2, 9);
        mockUser = {
          id,
          email,
          user_metadata: {
            full_name: options?.data?.full_name || email.split('@')[0],
          },
        };
        sessionStorage.setItem('timememory_session_user', JSON.stringify(mockUser));
        authListeners.forEach((fn) => fn('SIGNED_IN', { user: mockUser }));
        return { data: { user: mockUser, session: { user: mockUser } }, error: null };
      },
      async signInWithPassword({ email, password }) {
        if (!email || !password) {
          return { data: { user: null, session: null }, error: { message: 'Email and password required' } };
        }
        mockUser = {
          id: 'user-' + btoa(email).substring(0, 10).toLowerCase(),
          email,
          user_metadata: {
            full_name: email.split('@')[0],
          },
        };
        sessionStorage.setItem('timememory_session_user', JSON.stringify(mockUser));
        authListeners.forEach((fn) => fn('SIGNED_IN', { user: mockUser }));
        return { data: { user: mockUser, session: { user: mockUser } }, error: null };
      },
      async signOut() {
        mockUser = null;
        sessionStorage.removeItem('timememory_session_user');
        authListeners.forEach((fn) => fn('SIGNED_OUT', null));
        return { error: null };
      },
      async resetPasswordForEmail(email) {
        return { data: {}, error: null };
      },
      async updateUser({ password, data }) {
        if (mockUser && data?.full_name) {
          mockUser.user_metadata.full_name = data.full_name;
          sessionStorage.setItem('timememory_session_user', JSON.stringify(mockUser));
        }
        return { data: { user: mockUser }, error: null };
      },
      onAuthStateChange(callback) {
        authListeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe() {
                authListeners.delete(callback);
              },
            },
          },
        };
      },
    },

    from(table) {
      return {
        select(cols = '*') {
          let filters = [];
          let sortField = null;
          let sortAscending = true;

          const queryBuilder = {
            eq(field, val) {
              filters.push((r) => r[field] === val);
              return queryBuilder;
            },
            order(field, { ascending = true } = {}) {
              sortField = field;
              sortAscending = ascending;
              return queryBuilder;
            },
            async single() {
              const res = await queryBuilder.execute();
              return { data: res.data?.[0] || null, error: null };
            },
            async then(resolve) {
              const res = await queryBuilder.execute();
              resolve(res);
            },
            async execute() {
              let items = getMockTable(table);
              for (const f of filters) {
                items = items.filter(f);
              }
              if (sortField) {
                items.sort((a, b) => {
                  if (a[sortField] < b[sortField]) return sortAscending ? -1 : 1;
                  if (a[sortField] > b[sortField]) return sortAscending ? 1 : -1;
                  return 0;
                });
              }
              return { data: items, error: null };
            }
          };

          return queryBuilder;
        },
        async insert(records) {
          const list = Array.isArray(records) ? records : [records];
          const current = getMockTable(table);
          const withIds = list.map((r) => ({
            id: r.id || 'rec-' + Math.random().toString(36).substring(2, 9),
            created_at: new Date().toISOString(),
            ...r,
          }));
          saveMockTable(table, [...withIds, ...current]);
          return { 
            data: withIds, 
            error: null,
            select() { return Promise.resolve({ data: withIds, error: null }); }
          };
        },
        update(updates) {
          return {
            eq(field, val) {
              return {
                async select() {
                  const current = getMockTable(table);
                  const updated = current.map((r) => (r[field] === val ? { ...r, ...updates, updated_at: new Date().toISOString() } : r));
                  saveMockTable(table, updated);
                  return { data: updated.filter((r) => r[field] === val), error: null };
                },
                async then(resolve) {
                  const current = getMockTable(table);
                  const updated = current.map((r) => (r[field] === val ? { ...r, ...updates, updated_at: new Date().toISOString() } : r));
                  saveMockTable(table, updated);
                  resolve({ data: updated.filter((r) => r[field] === val), error: null });
                }
              };
            },
          };
        },
        delete() {
          return {
            eq(field, val) {
              return {
                async select() {
                  const current = getMockTable(table);
                  const remaining = current.filter((r) => r[field] !== val);
                  saveMockTable(table, remaining);
                  return { data: true, error: null };
                },
                async then(resolve) {
                  const current = getMockTable(table);
                  const remaining = current.filter((r) => r[field] !== val);
                  saveMockTable(table, remaining);
                  resolve({ data: true, error: null });
                }
              };
            },
          };
        },
      };
    },
    storage: {
      from(bucket) {
        return {
          async upload(path, file) {
            const dataUrl = await fileToDataUrl(file);
            sessionStorage.setItem('timememory_storage_' + path, dataUrl);
            return { data: { path }, error: null };
          },
          getPublicUrl(path) {
            const stored = sessionStorage.getItem('timememory_storage_' + path);
            return { data: { publicUrl: stored || '' } };
          },
          async remove(paths) {
            paths.forEach((p) => sessionStorage.removeItem('timememory_storage_' + p));
            return { data: true, error: null };
          },
        };
      },
    },
  };
}

function getMockTable(name) {
  try {
    const raw = sessionStorage.getItem('timememory_db_' + name);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveMockTable(name, list) {
  try {
    sessionStorage.setItem('timememory_db_' + name, JSON.stringify(list));
  } catch (e) {}
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}
