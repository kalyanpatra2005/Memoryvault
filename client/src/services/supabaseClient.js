import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

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
        const cleanEmail = (email || '').trim().toLowerCase();
        const id = 'mock-' + Math.random().toString(36).substring(2, 9);
        const defaultSettings = {
          theme: 'dark',
          fontStyle: 'serif',
          memoryView: 'grid',
          autoLock: 'never',
          defaultCategory: 'Personal',
          soundEnabled: true
        };
        mockUser = {
          id,
          email: cleanEmail,
          user_metadata: {
            full_name: options?.data?.full_name || cleanEmail.split('@')[0],
            settings: defaultSettings,
          },
        };
        try {
          localStorage.setItem(`vault_user_${cleanEmail}`, JSON.stringify(mockUser));
          localStorage.setItem(`vault_settings_${cleanEmail}`, JSON.stringify(defaultSettings));
          sessionStorage.setItem('timememory_session_user', JSON.stringify(mockUser));
        } catch (e) {}
        authListeners.forEach((fn) => fn('SIGNED_IN', { user: mockUser }));
        return { data: { user: mockUser, session: { user: mockUser } }, error: null };
      },
      async signInWithPassword({ email, password }) {
        if (!email || !password) {
          return { data: { user: null, session: null }, error: { message: 'Email and password required' } };
        }
        const cleanEmail = (email || '').trim().toLowerCase();
        
        // Restore permanently stored user data & settings
        let savedUser = null;
        try {
          const rawUser = localStorage.getItem(`vault_user_${cleanEmail}`);
          if (rawUser) savedUser = JSON.parse(rawUser);
        } catch (e) {}

        let savedSettings = {
          theme: 'dark',
          fontStyle: 'serif',
          memoryView: 'grid',
          autoLock: 'never',
          defaultCategory: 'Personal',
          soundEnabled: true
        };
        try {
          const rawSettings = localStorage.getItem(`vault_settings_${cleanEmail}`);
          if (rawSettings) {
            savedSettings = { ...savedSettings, ...JSON.parse(rawSettings) };
          }
        } catch (e) {}

        mockUser = {
          id: savedUser?.id || ('user-' + btoa(cleanEmail).substring(0, 10).toLowerCase()),
          email: cleanEmail,
          user_metadata: {
            full_name: savedUser?.user_metadata?.full_name || cleanEmail.split('@')[0],
            settings: savedSettings,
            ...(savedUser?.user_metadata || {})
          },
        };

        try {
          localStorage.setItem(`vault_user_${cleanEmail}`, JSON.stringify(mockUser));
          sessionStorage.setItem('timememory_session_user', JSON.stringify(mockUser));
        } catch (e) {}
        authListeners.forEach((fn) => fn('SIGNED_IN', { user: mockUser }));
        return { data: { user: mockUser, session: { user: mockUser } }, error: null };
      },
      async signOut() {
        mockUser = null;
        try {
          sessionStorage.removeItem('timememory_session_user');
        } catch (e) {}
        authListeners.forEach((fn) => fn('SIGNED_OUT', null));
        return { error: null };
      },
      async resetPasswordForEmail(email) {
        return { data: {}, error: null };
      },
      async updateUser({ password, data }) {
        if (mockUser) {
          if (!mockUser.user_metadata) mockUser.user_metadata = {};
          if (data?.full_name) {
            mockUser.user_metadata.full_name = data.full_name;
          }
          if (data?.settings) {
            mockUser.user_metadata.settings = {
              ...(mockUser.user_metadata.settings || {}),
              ...data.settings
            };
            try {
              localStorage.setItem(`vault_settings_${mockUser.email}`, JSON.stringify(mockUser.user_metadata.settings));
            } catch (e) {}
          }
          try {
            localStorage.setItem(`vault_user_${mockUser.email}`, JSON.stringify(mockUser));
            sessionStorage.setItem('timememory_session_user', JSON.stringify(mockUser));
          } catch (e) {}
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
        insert(records) {
          const list = Array.isArray(records) ? records : [records];
          const current = getMockTable(table);
          const withIds = list.map((r) => ({
            id: r.id || 'rec-' + Math.random().toString(36).substring(2, 9),
            created_at: new Date().toISOString(),
            ...r,
          }));
          saveMockTable(table, [...withIds, ...current]);
          const builder = {
            data: withIds,
            error: null,
            select(cols) {
              return {
                ...builder,
                async single() {
                  return { data: withIds[0] || null, error: null };
                },
                async then(resolve, reject) {
                  resolve({ data: withIds, error: null });
                }
              };
            },
            async single() {
              return { data: withIds[0] || null, error: null };
            },
            async then(resolve, reject) {
              resolve({ data: withIds, error: null });
            }
          };
          return builder;
        },
        update(updates) {
          const filters = [];
          const builder = {
            eq(field, val) {
              filters.push((r) => r[field] === val);
              return builder;
            },
            execute() {
              const current = getMockTable(table);
              const updated = current.map((r) => {
                if (filters.length > 0 && filters.every((f) => f(r))) {
                  return { ...r, ...updates, updated_at: new Date().toISOString() };
                }
                return r;
              });
              saveMockTable(table, updated);
              const matched = updated.filter((r) => filters.length > 0 && filters.every((f) => f(r)));
              return { data: matched, error: null };
            },
            select(cols) {
              return {
                eq(field, val) {
                  filters.push((r) => r[field] === val);
                  return this;
                },
                async single() {
                  const res = builder.execute();
                  return { data: res.data?.[0] || null, error: null };
                },
                async then(resolve, reject) {
                  try {
                    const res = builder.execute();
                    resolve(res);
                  } catch (err) {
                    if (reject) reject(err);
                    else resolve({ data: null, error: err });
                  }
                }
              };
            },
            async single() {
              const res = builder.execute();
              return { data: res.data?.[0] || null, error: null };
            },
            async then(resolve, reject) {
              try {
                const res = builder.execute();
                resolve(res);
              } catch (err) {
                if (reject) reject(err);
                else resolve({ data: null, error: err });
              }
            }
          };
          return builder;
        },
        delete() {
          const filters = [];
          const builder = {
            eq(field, val) {
              filters.push((r) => r[field] === val);
              return builder;
            },
            execute() {
              const current = getMockTable(table);
              const remaining = current.filter((r) => !filters.every((f) => f(r)));
              saveMockTable(table, remaining);
              return { data: true, error: null };
            },
            select(cols) {
              return {
                eq(field, val) {
                  filters.push((r) => r[field] === val);
                  return this;
                },
                async then(resolve, reject) {
                  try {
                    const res = builder.execute();
                    resolve(res);
                  } catch (err) {
                    if (reject) reject(err);
                    else resolve({ data: null, error: err });
                  }
                }
              };
            },
            async then(resolve, reject) {
              try {
                const res = builder.execute();
                resolve(res);
              } catch (err) {
                if (reject) reject(err);
                else resolve({ data: null, error: err });
              }
            }
          };
          return builder;
        },
      };
    },
    storage: {
      from(bucket) {
        return {
          async upload(path, file) {
            const dataUrl = await fileToDataUrl(file);
            try {
              localStorage.setItem('timememory_storage_' + path, dataUrl);
            } catch (e) {}
            try {
              sessionStorage.setItem('timememory_storage_' + path, dataUrl);
            } catch (e) {}
            return { data: { path }, error: null };
          },
          getPublicUrl(path) {
            let stored = '';
            try {
              stored = localStorage.getItem('timememory_storage_' + path) || sessionStorage.getItem('timememory_storage_' + path) || '';
            } catch (e) {}
            return { data: { publicUrl: stored } };
          },
          async remove(paths) {
            paths.forEach((p) => {
              try {
                localStorage.removeItem('timememory_storage_' + p);
                sessionStorage.removeItem('timememory_storage_' + p);
              } catch (e) {}
            });
            return { data: true, error: null };
          },
        };
      },
    },
  };
}

function getMockTable(name) {
  try {
    const raw = localStorage.getItem('timememory_db_' + name) || sessionStorage.getItem('timememory_db_' + name);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveMockTable(name, list) {
  try {
    localStorage.setItem('timememory_db_' + name, JSON.stringify(list));
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
