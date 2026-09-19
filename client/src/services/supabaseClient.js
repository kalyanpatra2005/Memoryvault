import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id')
);

// Real Supabase Client if configured, or Cloud Database Client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createCloudSupabaseClient();

export function createCloudSupabaseClient() {
  const getSessionToken = () => {
    try {
      return (
        localStorage.getItem('timememory_session_token') ||
        sessionStorage.getItem('timememory_session_token') ||
        ''
      );
    } catch (e) {
      return '';
    }
  };

  const getCachedUser = () => {
    try {
      const raw =
        localStorage.getItem('timememory_session_user') ||
        sessionStorage.getItem('timememory_session_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const saveSession = (user, token) => {
    try {
      if (token) {
        localStorage.setItem('timememory_session_token', token);
        sessionStorage.setItem('timememory_session_token', token);
      }
      if (user) {
        localStorage.setItem('timememory_session_user', JSON.stringify(user));
        sessionStorage.setItem('timememory_session_user', JSON.stringify(user));
      }
    } catch (e) {}
  };

  const clearSession = () => {
    try {
      localStorage.removeItem('timememory_session_token');
      sessionStorage.removeItem('timememory_session_token');
      localStorage.removeItem('timememory_session_user');
      sessionStorage.removeItem('timememory_session_user');
    } catch (e) {}
  };

  const authListeners = new Set();
  const notifyAuth = (event, session) => {
    authListeners.forEach((fn) => {
      try {
        fn(event, session);
      } catch (err) {
        console.error('Auth listener error:', err);
      }
    });
  };

  return {
    auth: {
      async getSession() {
        const token = getSessionToken();
        const user = getCachedUser();
        if (!token) {
          return { data: { session: null }, error: null };
        }
        return {
          data: {
            session: {
              access_token: token,
              token,
              user
            }
          },
          error: null
        };
      },

      async getUser() {
        const user = getCachedUser();
        const token = getSessionToken();
        if (!token || !user) {
          return { data: { user: null }, error: null };
        }
        return { data: { user }, error: null };
      },

      async signUp({ email, password, options }) {
        const cleanEmail = (email || '').trim().toLowerCase();
        try {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password, options })
          });
          const json = await res.json();
          if (!res.ok) {
            return { data: { user: null, session: null }, error: json.error ? { message: json.error } : json };
          }
          saveSession(json.user, json.token);
          notifyAuth('SIGNED_IN', json.session || { user: json.user, access_token: json.token });
          return { data: { user: json.user, session: json.session || { user: json.user, access_token: json.token } }, error: null };
        } catch (err) {
          return { data: { user: null, session: null }, error: { message: err.message } };
        }
      },

      async signInWithPassword({ email, password }) {
        const cleanEmail = (email || '').trim().toLowerCase();
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password })
          });
          const json = await res.json();
          if (!res.ok) {
            return { data: { user: null, session: null }, error: json.error ? { message: json.error } : json };
          }
          saveSession(json.user, json.token);
          notifyAuth('SIGNED_IN', json.session || { user: json.user, access_token: json.token });
          return { data: { user: json.user, session: json.session || { user: json.user, access_token: json.token } }, error: null };
        } catch (err) {
          return { data: { user: null, session: null }, error: { message: err.message } };
        }
      },

      async signOut() {
        clearSession();
        notifyAuth('SIGNED_OUT', null);
        return { error: null };
      },

      async resetPasswordForEmail(email) {
        try {
          const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: email })
          });
          const json = await res.json();
          return { data: json, error: res.ok ? null : { message: json.error } };
        } catch (err) {
          return { data: null, error: { message: err.message } };
        }
      },

      async updateUser({ password, data }) {
        const token = getSessionToken();
        try {
          const res = await fetch('/api/auth/update-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ password, data })
          });
          const json = await res.json();
          if (!res.ok) {
            return { data: { user: null }, error: json.error ? { message: json.error } : json };
          }
          if (json.user) {
            saveSession(json.user, json.token || token);
            notifyAuth('USER_UPDATED', { user: json.user, access_token: json.token || token });
          }
          return { data: { user: json.user }, error: null };
        } catch (err) {
          return { data: { user: null }, error: { message: err.message } };
        }
      },

      onAuthStateChange(callback) {
        authListeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe() {
                authListeners.delete(callback);
              }
            }
          }
        };
      }
    },

    from(table) {
      return {
        select(cols = '*') {
          const filters = {};
          let orderBy = null;
          let orderAsc = true;
          let limitCount = null;

          const queryBuilder = {
            eq(field, val) {
              filters[field] = val;
              return queryBuilder;
            },
            order(field, { ascending = true } = {}) {
              orderBy = field;
              orderAsc = ascending;
              return queryBuilder;
            },
            limit(n) {
              limitCount = n;
              return queryBuilder;
            },
            async single() {
              const res = await queryBuilder.execute();
              if (res.error) return { data: null, error: res.error };
              return { data: res.data?.[0] || null, error: null };
            },
            async then(resolve, reject) {
              try {
                const res = await queryBuilder.execute();
                resolve(res);
              } catch (err) {
                if (reject) reject(err);
                else resolve({ data: null, error: { message: err.message } });
              }
            },
            async execute() {
              const token = getSessionToken();
              const queryParams = new URLSearchParams();
              for (const [k, v] of Object.entries(filters)) {
                queryParams.append(`eq_${k}`, v);
              }
              if (orderBy) {
                queryParams.append('order_by', orderBy);
                queryParams.append('order_asc', String(orderAsc));
              }
              if (limitCount) {
                queryParams.append('limit', String(limitCount));
              }

              const res = await fetch(`/api/db/${table}?${queryParams.toString()}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
              });
              if (!res.ok) {
                const errJson = await res.json().catch(() => ({ error: { message: `Query failed with status ${res.status}` } }));
                return { data: null, error: errJson.error || errJson };
              }
              const json = await res.json();
              return { data: json.data || [], error: null };
            }
          };

          return queryBuilder;
        },

        insert(records) {
          const list = Array.isArray(records) ? records : [records];
          const builder = {
            select(cols) {
              return builder;
            },
            async single() {
              const res = await builder.execute();
              if (res.error) return { data: null, error: res.error };
              return { data: res.data?.[0] || null, error: null };
            },
            async then(resolve, reject) {
              try {
                const res = await builder.execute();
                resolve(res);
              } catch (err) {
                if (reject) reject(err);
                else resolve({ data: null, error: { message: err.message } });
              }
            },
            async execute() {
              const token = getSessionToken();
              const res = await fetch(`/api/db/${table}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(list)
              });
              if (!res.ok) {
                const errJson = await res.json().catch(() => ({ error: { message: `Insert failed with status ${res.status}` } }));
                return { data: null, error: errJson.error || errJson };
              }
              const json = await res.json();
              return { data: json.data || [], error: null };
            }
          };
          return builder;
        },

        upsert(records) {
          return this.insert(records);
        },

        update(updates) {
          const filters = {};
          const builder = {
            eq(field, val) {
              filters[field] = val;
              return builder;
            },
            select(cols) {
              return builder;
            },
            async single() {
              const res = await builder.execute();
              if (res.error) return { data: null, error: res.error };
              return { data: res.data?.[0] || null, error: null };
            },
            async then(resolve, reject) {
              try {
                const res = await builder.execute();
                resolve(res);
              } catch (err) {
                if (reject) reject(err);
                else resolve({ data: null, error: { message: err.message } });
              }
            },
            async execute() {
              const token = getSessionToken();
              const queryParams = new URLSearchParams();
              for (const [k, v] of Object.entries(filters)) {
                queryParams.append(`eq_${k}`, v);
              }

              const res = await fetch(`/api/db/${table}?${queryParams.toString()}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(updates)
              });
              if (!res.ok) {
                const errJson = await res.json().catch(() => ({ error: { message: `Update failed with status ${res.status}` } }));
                return { data: null, error: errJson.error || errJson };
              }
              const json = await res.json();
              return { data: json.data || [], error: null };
            }
          };
          return builder;
        },

        delete() {
          const filters = {};
          const builder = {
            eq(field, val) {
              filters[field] = val;
              return builder;
            },
            select(cols) {
              return builder;
            },
            async then(resolve, reject) {
              try {
                const res = await builder.execute();
                resolve(res);
              } catch (err) {
                if (reject) reject(err);
                else resolve({ data: null, error: { message: err.message } });
              }
            },
            async execute() {
              const token = getSessionToken();
              const queryParams = new URLSearchParams();
              for (const [k, v] of Object.entries(filters)) {
                queryParams.append(`eq_${k}`, v);
              }

              const res = await fetch(`/api/db/${table}?${queryParams.toString()}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {}
              });
              if (!res.ok) {
                const errJson = await res.json().catch(() => ({ error: { message: `Delete failed with status ${res.status}` } }));
                return { data: null, error: errJson.error || errJson };
              }
              return { data: true, error: null };
            }
          };
          return builder;
        }
      };
    },

    storage: {
      from(bucket) {
        return {
          async upload(path, file, options = {}) {
            const token = getSessionToken();
            const dataUrl = await fileToDataUrl(file);
            const res = await fetch('/api/storage/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify({
                path,
                data_url: dataUrl,
                file_name: file?.name || 'media',
                mime_type: file?.type || 'image/jpeg',
                size_bytes: file?.size || 0,
                file_type: file?.type?.startsWith('video/') ? 'video' : 'photo',
                memory_id: options?.memory_id || null,
                diary_id: options?.diary_id || null
              })
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({ error: 'Upload failed' }));
              return { data: null, error: err };
            }
            return { data: { path, dataUrl }, error: null };
          },

          getPublicUrl(path) {
            const token = getSessionToken();
            const publicUrl = `/api/storage/file?path=${encodeURIComponent(path)}&token=${encodeURIComponent(token)}`;
            return { data: { publicUrl } };
          },

          async createSignedUrl(path, expiresIn = 3600) {
            const token = getSessionToken();
            try {
              const res = await fetch(`/api/storage/signed-url?path=${encodeURIComponent(path)}&expiresIn=${expiresIn}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
              });
              if (!res.ok) {
                return { data: null, error: new Error('Failed to create signed URL') };
              }
              const json = await res.json();
              return { data: { signedUrl: json.data?.signedUrl || json.signedUrl || json.url }, error: null };
            } catch (err) {
              return { data: null, error: err };
            }
          },

          async remove(paths) {
            const token = getSessionToken();
            try {
              const res = await fetch('/api/storage/remove', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ paths })
              });
              if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Remove failed' }));
                return { data: null, error: err };
              }
              return { data: true, error: null };
            } catch (err) {
              return { data: null, error: err };
            }
          }
        };
      }
    }
  };
}

export function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) return resolve('');
    if (typeof file === 'string') return resolve(file);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}
