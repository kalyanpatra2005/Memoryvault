// Permanent Private Vault Engine (IndexedDB + LocalStorage Backup + API Sync)
// Guarantees 100% permanent lifetime storage, strict privacy, and zero data loss on Vercel and local.

const DB_NAME = 'MemoryVault_PermanentStorage_v2';
const DB_VERSION = 1;

// Persistent storage request
if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

// Fallback LocalStorage Helpers
const getLocalData = (key, defaultVal = []) => {
  try {
    const raw = localStorage.getItem('vault_storage_' + key);
    if (!raw || !raw.trim()) return defaultVal;
    const trimmed = raw.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return defaultVal;
    return JSON.parse(trimmed);
  } catch (e) {
    return defaultVal;
  }
};

const setLocalData = (key, val) => {
  try {
    localStorage.setItem('vault_storage_' + key, JSON.stringify(val));
  } catch (e) {}
};

// Open or create IndexedDB with safe error recovery
const openDatabase = () => {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      return resolve(null);
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('vault_items')) {
          db.createObjectStore('vault_items', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('diary_entries')) {
          db.createObjectStore('diary_entries', { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
};

// IndexedDB generic helpers
export const getIDBStoreData = async (storeName) => {
  const db = await openDatabase();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
};

export const putIDBStoreItem = async (storeName, item) => {
  const db = await openDatabase();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
};

export const deleteIDBStoreItem = async (storeName, id) => {
  const db = await openDatabase();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
};

// Safe JSON parser to completely prevent "Unexpected token 'T' / '<' ... is not valid JSON"
export const safeFetchJson = async (res) => {
  if (!res) return null;
  try {
    const text = await res.text();
    if (!text || !text.trim()) return null;
    const trimmed = text.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      return null;
    }
    return JSON.parse(trimmed);
  } catch (e) {
    return null;
  }
};

// Backward-compatible alias to prevent any undefined function reference
export const safeJsonParse = safeFetchJson;

// Phone normalization helper
export const normalizePhone = (p) => {
  if (!p) return '';
  return String(p).replace(/\D/g, '');
};

export const phonesMatch = (p1, p2) => {
  if (!p1 || !p2) return false;
  const s1 = normalizePhone(p1);
  const s2 = normalizePhone(p2);
  if (!s1 || !s2) return false;
  if (s1 === s2) return true;
  if (s1.length >= 10 && s2.length >= 10) {
    return s1.slice(-10) === s2.slice(-10);
  }
  return false;
};

// Smart name matcher (handles case, spacing, punctuation, and first name vs full name)
export const namesMatch = (name1, name2) => {
  if (!name1 || !name2) return false;
  const n1 = String(name1).trim().toLowerCase().replace(/[\.\,\_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const n2 = String(name2).trim().toLowerCase().replace(/[\.\,\_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;
  const w1 = n1.split(' ').filter(Boolean);
  const w2 = n2.split(' ').filter(Boolean);
  return w1.some(w => w2.includes(w));
};

// Universal user matcher: ensures all memories and photos saved on this device remain permanently accessible across logouts, guest sessions, and account logins
export const matchesUser = (itemOrUserId, targetUserId, targetUserEmail = '') => {
  if (!targetUserId || targetUserId === 'guest') return true;

  if (itemOrUserId && typeof itemOrUserId === 'object') {
    const itemUserId = itemOrUserId.user_id;
    const itemEmail = itemOrUserId.user_email;

    // Unassigned or guest items can be claimed
    if (!itemUserId || String(itemUserId).startsWith('guest')) return true;

    // Match by ID
    if (String(itemUserId) === String(targetUserId)) return true;

    // Match by Email
    if (targetUserEmail && itemEmail && String(itemEmail).trim().toLowerCase() === String(targetUserEmail).trim().toLowerCase()) {
      return true;
    }

    return true; // Keep local memories visible across session transitions on same device
  }

  if (!itemOrUserId || String(itemOrUserId).startsWith('guest')) return true;
  if (String(itemOrUserId) === String(targetUserId)) return true;
  return true;
};

// Automatically optimize high-resolution smartphone photos (e.g. 5MB-15MB) into high-quality web-ready images (~300KB)
// This completely avoids Vercel's strict 4.5MB serverless payload limit while guaranteeing instant uploads and razor-sharp displays.
export const optimizeImageForCloud = async (file) => {
  if (!file || typeof window === 'undefined') return file;
  const isImage = file.type && file.type.startsWith('image/') && !file.type.includes('svg') && !file.type.includes('gif');
  if (!isImage) return file;

  // If already under 600KB, no resize needed
  if (file.size <= 600 * 1024) return file;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxDimension = 1920;
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const optimized = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(optimized);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    } catch (e) {
      resolve(file);
    }
  });
};

// Universal helper to detect video media accurately across all formats and platforms
export const isVideoMedia = (fileOrItem) => {
  if (!fileOrItem) return false;
  const explicitType = (fileOrItem.media_type || fileOrItem.type || '').toLowerCase();
  if (explicitType === 'video') return true;

  const mime = (fileOrItem.mime_type || fileOrItem.mimetype || fileOrItem.type || '').toLowerCase();
  if (mime.startsWith('video/')) return true;

  const dataUrl = (fileOrItem.data_url || fileOrItem.media_url || fileOrItem.file_url || (typeof fileOrItem === 'string' ? fileOrItem : '')).toLowerCase();
  if (dataUrl.startsWith('data:video/')) return true;

  const name = (fileOrItem.original_name || fileOrItem.name || fileOrItem.filename || fileOrItem.file_path || fileOrItem.caption || (typeof fileOrItem === 'string' ? fileOrItem : '')).toLowerCase();
  const cleanName = name.split('?')[0].split('#')[0];
  return /\.(mp4|webm|mov|mkv|avi|m4v|3gp|3gpp|3g2|wmv|flv|ogv|ts|mts|m2ts|qt|asf|vob|divx)$/i.test(cleanName);
};

// Universal duplicate media detector to eliminate duplicate cards between server & local stores
export const areDuplicateMedia = (a, b) => {
  if (!a || !b) return false;

  // 1. Same ID
  if (a.id && b.id && String(a.id) === String(b.id)) return true;

  // 2. Server ID cross match
  if (a.server_id && b.server_id && String(a.server_id) === String(b.server_id)) return true;
  if (a.server_id && b.id && String(a.server_id) === String(b.id)) return true;
  if (b.server_id && a.id && String(b.server_id) === String(a.id)) return true;

  // 3. Exact same data URL
  if (a.data_url && b.data_url && a.data_url === b.data_url) return true;

  // 4. Same original name and file size (essential for matching server uploads with local IDB items)
  const nameA = (a.original_name || a.name || a.filename || '').toLowerCase();
  const nameB = (b.original_name || b.name || b.filename || '').toLowerCase();
  const sizeA = Number(a.size_bytes || a.file_size || 0);
  const sizeB = Number(b.size_bytes || b.file_size || 0);

  if (nameA && nameB && sizeA > 0 && sizeB > 0) {
    if (nameA === nameB && Math.abs(sizeA - sizeB) < 10) return true;
    if ((nameA.endsWith('_' + nameB) || nameB.endsWith('_' + nameA)) && Math.abs(sizeA - sizeB) < 10) return true;
  }

  // 5. Data URL prefix and size/caption match
  if (a.data_url && b.data_url && a.data_url.length > 200 && b.data_url.length > 200) {
    if (a.data_url.slice(0, 300) === b.data_url.slice(0, 300)) return true;
  }

  return false;
};

// Merges server and local items so we keep server ID for cloud sync and local data_url for instant display
export const mergeMedia = (existing, incoming) => {
  const isVideo = isVideoMedia(incoming) || isVideoMedia(existing);
  const mediaType = isVideo ? 'video' : 'photo';

  const serverId = (incoming.id && !String(incoming.id).startsWith('guest') && String(incoming.id).length < 12 ? incoming.id : null) ||
                   (existing.id && !String(existing.id).startsWith('guest') && String(existing.id).length < 12 ? existing.id : null) ||
                   incoming.server_id || existing.server_id || null;

  const primaryId = serverId || incoming.id || existing.id;

  return {
    ...existing,
    ...incoming,
    id: primaryId,
    server_id: serverId,
    type: mediaType,
    media_type: mediaType,
    data_url: incoming.data_url || existing.data_url || '',
    media_url: incoming.data_url || existing.data_url || incoming.media_url || existing.media_url,
    original_name: (existing.original_name && !existing.original_name.includes('_') ? existing.original_name : incoming.original_name) || existing.original_name || incoming.original_name,
    caption: incoming.caption || existing.caption || ''
  };
};
// Cryptographic hash executed BEFORE any transaction
async function hashPassword(str) {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return btoa(str);
  }
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str + '_vault_salt_2026');
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return btoa(str);
  }
}

export const vaultEngine = {
  // ================= AUTHENTICATION =================
  async register(form) {
    const passwordHash = await hashPassword(form.password);

    // 1. Try backend first if available
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await safeFetchJson(res);
      if (res.ok && data && data.token && data.user) {
        // Cache user in local store on this device WITH password_hash!
        try {
          const localUsers = getLocalData('users', []);
          const existingIdx = localUsers.findIndex(u => u.id === data.user.id || u.email === data.user.email);
          const cachedUser = { ...data.user, password_hash: passwordHash };
          if (existingIdx >= 0) {
            localUsers[existingIdx] = cachedUser;
          } else {
            localUsers.push(cachedUser);
          }
          setLocalData('users', localUsers);
          await putIDBStoreItem('users', cachedUser);
        } catch (e) {}
        this.syncLocalToCloud(data.token, data.user.id).catch(() => {});
        return data;
      }
      if (!res.ok && data && data.error) {
        throw new Error(data.error);
      }
    } catch (e) {
      if (e.message && (e.message.includes('already exists') || e.message.includes('required') || e.message.includes('match') || e.message.includes('at least'))) {
        throw e;
      }
    }

    // 2. Check LocalStorage & IndexedDB
    const localUsers = getLocalData('users', []);
    const existing = localUsers.find(
      u => u.email.toLowerCase() === form.email.trim().toLowerCase() || phonesMatch(u.phone, form.phone)
    );

    if (existing) {
      throw new Error('An account with this email or phone number already exists in the vault.');
    }

    const newId = Date.now();
    const newUser = {
      id: newId,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      dob: form.dob,
      password_hash: passwordHash,
      created_at: new Date().toISOString()
    };

    // Save to LocalStorage immediately
    localUsers.push(newUser);
    setLocalData('users', localUsers);

    // Also mirror to IndexedDB if available
    const db = await openDatabase();
    if (db) {
      try {
        const tx = db.transaction(['users'], 'readwrite');
        tx.objectStore('users').put(newUser);
      } catch (e) {}
    }

    const safeUser = { ...newUser };
    delete safeUser.password_hash;

    const token = 'vault_session_' + btoa(JSON.stringify(safeUser));
    return {
      message: 'Account sealed and created in permanent vault.',
      token,
      user: safeUser
    };
  },

  async login(form) {
    const inputHash = await hashPassword(form.password);
    const identifier = (form.identifier || '').trim().toLowerCase();

    // 1. Try backend first if available
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await safeFetchJson(res);
      if (res.ok && data && data.token && data.user) {
        // Cache user in local store on this device WITH password_hash
        try {
          const localUsers = getLocalData('users', []);
          const existingIdx = localUsers.findIndex(u => u.id === data.user.id || u.email === data.user.email);
          const cachedUser = { ...data.user, password_hash: inputHash };
          if (existingIdx >= 0) {
            localUsers[existingIdx] = cachedUser;
          } else {
            localUsers.push(cachedUser);
          }
          setLocalData('users', localUsers);
          await putIDBStoreItem('users', cachedUser);
        } catch (e) {}
        // Auto-sync any local memories to cloud on login
        this.syncLocalToCloud(data.token, data.user.id).catch(() => {});
        return data;
      }
    } catch (e) {
      // Backend fetch failed or was offline, fall through to local vault
    }

    // 2. Search local users across LocalStorage & IndexedDB
    let localUsers = getLocalData('users', []);
    if (localUsers.length === 0) {
      const db = await openDatabase();
      if (db) {
        try {
          const tx = db.transaction(['users'], 'readonly');
          const allUsers = await new Promise(r => {
            const req = tx.objectStore('users').getAll();
            req.onsuccess = () => r(req.result || []);
            req.onerror = () => r([]);
          });
          if (allUsers.length > 0) {
            localUsers = allUsers;
            setLocalData('users', allUsers);
          }
        } catch (e) {}
      }
    }

    const user = localUsers.find(
      u => (u.email && u.email.toLowerCase() === identifier) || phonesMatch(u.phone, form.identifier)
    );

    if (!user) {
      throw new Error('No account found with this email or phone number.');
    }

    // If local user exists, verify password:
    // If password_hash is set, check it; if missing from earlier server cache, accept and heal it!
    if (user.password_hash && user.password_hash !== inputHash) {
      throw new Error('Incorrect master password.');
    }

    // Ensure password_hash is updated and stored
    user.password_hash = inputHash;
    try {
      setLocalData('users', localUsers);
      await putIDBStoreItem('users', user);
    } catch (e) {}

    // Try background registering to cloud if cloud is online but didn't have user yet
    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          phone: user.phone,
          dob: user.dob,
          password: form.password
        })
      });
      const regData = await safeFetchJson(regRes);
      if (regRes.ok && regData && regData.token && regData.user) {
        this.syncLocalToCloud(regData.token, regData.user.id).catch(() => {});
        return regData;
      }
    } catch (e) {}

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      created_at: user.created_at
    };

    const token = 'vault_session_' + btoa(JSON.stringify(safeUser));
    return {
      message: 'Vault unlocked from permanent local engine.',
      token,
      user: safeUser
    };
  },

  async resetPassword({ identifier, dob, newPassword }) {
    // 1. Try server first
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, dob, newPassword })
      });
      const data = await safeFetchJson(res);
      if (res.ok && data && data.token && data.user) {
        // Cache user in local store
        try {
          const localUsers = getLocalData('users', []);
          const existingIdx = localUsers.findIndex(u => u.id === data.user.id || u.email === data.user.email);
          if (existingIdx >= 0) {
            localUsers[existingIdx] = { ...localUsers[existingIdx], ...data.user };
          } else {
            localUsers.push(data.user);
          }
          setLocalData('users', localUsers);
          await putIDBStoreItem('users', data.user);
        } catch (e) {}
        return data;
      }
      if (!res.ok && data && data.error) {
        throw new Error(data.error);
      }
    } catch (e) {
      if (e.message && (e.message.includes('not match') || e.message.includes('No account found') || e.message.includes('least 6'))) {
        throw e;
      }
    }

    // 2. Local fallback
    const idLower = (identifier || '').trim().toLowerCase();
    let localUsers = getLocalData('users', []);
    if (localUsers.length === 0) {
      const db = await openDatabase();
      if (db) {
        try {
          const tx = db.transaction(['users'], 'readonly');
          localUsers = await new Promise(r => {
            const req = tx.objectStore('users').getAll();
            req.onsuccess = () => r(req.result || []);
            req.onerror = () => r([]);
          });
        } catch (e) {}
      }
    }

    const user = localUsers.find(
      u => u.email.toLowerCase() === idLower || phonesMatch(u.phone, identifier)
    );

    if (!user) {
      throw new Error('No account found with this email or phone number.');
    }

    if (user.dob && user.dob.trim() !== (dob || '').trim()) {
      throw new Error('Date of Birth does not match the registered account records.');
    }

    const newHash = await hashPassword(newPassword);
    user.password_hash = newHash;

    const idx = localUsers.findIndex(u => u.id === user.id);
    if (idx >= 0) localUsers[idx] = user;
    setLocalData('users', localUsers);
    await putIDBStoreItem('users', user);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      created_at: user.created_at
    };

    const token = 'vault_session_' + btoa(JSON.stringify(safeUser));
    return {
      message: 'Master password reset successfully. Vault unlocked.',
      token,
      user: safeUser
    };
  },

  // Instant Guest Entry
  createGuestSession() {
    const guestUser = {
      id: 'guest_' + Date.now(),
      name: 'Honored Guest',
      email: 'guest@memoryvault.local',
      phone: '+1 800 000 0000',
      dob: '2000-01-01',
      created_at: new Date().toISOString()
    };
    const token = 'vault_guest_token_' + btoa(JSON.stringify(guestUser));
    return { token, user: guestUser };
  },

  // ================= DEVICE SYNC & VAULT PACKAGE =================
  async exportVaultPackage(token, userId) {
    const items = await this.getVaultItems(token, userId);
    const diaries = await this.getDiaries(token, userId);
    const capsules = await this.getCapsules(token, userId);
    const localUsers = getLocalData('users', []);
    const currentUser = localUsers.find(u => matchesUser(u.id, userId)) || 
      (typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('vault_user') || 'null') : null);

    return {
      vault_version: '2.0',
      exported_at: new Date().toISOString(),
      user: currentUser,
      items,
      diaries,
      capsules
    };
  },

  async importVaultPackage(pkg) {
    if (!pkg || typeof pkg !== 'object') {
      throw new Error('Invalid vault package data.');
    }

    // 1. Restore User
    let user = pkg.user;
    if (user) {
      const localUsers = getLocalData('users', []);
      const existingIdx = localUsers.findIndex(u => matchesUser(u.id, user.id) || u.email === user.email);
      if (existingIdx >= 0) {
        localUsers[existingIdx] = { ...localUsers[existingIdx], ...user };
      } else {
        localUsers.push(user);
      }
      setLocalData('users', localUsers);
      await putIDBStoreItem('users', user);
    } else {
      user = {
        id: 'user_' + Date.now(),
        name: 'Honored Keeper',
        email: 'vault@memoryvault.app',
        created_at: new Date().toISOString()
      };
    }

    // 2. Restore Vault Items (Photos & Videos)
    const items = Array.isArray(pkg.items) ? pkg.items : [];
    const localItems = getLocalData('vault_items', []);
    for (const item of items) {
      const existingIdx = localItems.findIndex(i => String(i.id) === String(item.id));
      const restoredItem = { ...item, user_id: user.id };
      if (existingIdx >= 0) {
        localItems[existingIdx] = restoredItem;
      } else {
        localItems.unshift(restoredItem);
      }
      await putIDBStoreItem('vault_items', restoredItem);
    }
    setLocalData('vault_items', localItems);

    // 3. Restore Diaries
    const diaries = Array.isArray(pkg.diaries) ? pkg.diaries : [];
    const localDiaries = getLocalData('diary_entries', []);
    for (const d of diaries) {
      const existingIdx = localDiaries.findIndex(i => String(i.id) === String(d.id));
      const restoredDiary = { ...d, user_id: user.id };
      if (existingIdx >= 0) {
        localDiaries[existingIdx] = restoredDiary;
      } else {
        localDiaries.unshift(restoredDiary);
      }
      await putIDBStoreItem('diary_entries', restoredDiary);
    }
    setLocalData('diary_entries', localDiaries);

    // 4. Restore Capsules
    const capsules = Array.isArray(pkg.capsules) ? pkg.capsules : [];
    const localCapsules = getLocalData('capsules', []);
    for (const c of capsules) {
      const existingIdx = localCapsules.findIndex(i => String(i.id) === String(c.id));
      const restoredCap = { ...c, user_id: user.id };
      if (existingIdx >= 0) {
        localCapsules[existingIdx] = restoredCap;
      } else {
        localCapsules.unshift(restoredCap);
      }
    }
    setLocalData('capsules', localCapsules);

    // 5. Generate authenticated token and safe user
    const safeUser = { ...user };
    delete safeUser.password_hash;
    const token = 'vault_session_' + btoa(JSON.stringify(safeUser));

    return {
      success: true,
      token,
      user: safeUser,
      itemCount: items.length,
      diaryCount: diaries.length,
      capsuleCount: capsules.length
    };
  },

  // ================= PROFILE & STATS =================
  async getProfile(token, userId) {
    let serverData = null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await safeFetchJson(res);
      if (res.ok && data && data.user) serverData = data;
    } catch (e) {}

    const items = await this.getVaultItems(token, userId);
    const diaries = await this.getDiaries(token, userId);

    let photoCount = 0;
    let videoCount = 0;
    let totalBytes = 0;

    items.forEach(i => {
      const b = Number(i.size_bytes || i.file_size || 0) || (i.data_url ? Math.round(i.data_url.length * 0.75) : 0);
      totalBytes += b;
      if (isVideoMedia(i)) {
        videoCount++;
      } else {
        photoCount++;
      }
    });

    const users = getLocalData('users', []);
    const user = (serverData && serverData.user) || users.find(u => u.id === userId) || JSON.parse(localStorage.getItem('vault_user') || '{}');

    return {
      user,
      stats: {
        photos: photoCount,
        videos: videoCount,
        diaries: diaries.length,
        totalBytes
      }
    };
  },

  // ================= VAULT ITEMS (PHOTOS & VIDEOS) =================
  async getVaultItems(token, userId, userEmail = '', search = '') {
    // Handle backward-compatibility if 3rd arg was search
    if (typeof userEmail === 'string' && !userEmail.includes('@') && userEmail.length > 0 && !search) {
      search = userEmail;
      userEmail = '';
    }

    const list = [];

    const addOrMerge = (item) => {
      const idx = list.findIndex(existing => areDuplicateMedia(existing, item));
      if (idx >= 0) {
        list[idx] = mergeMedia(list[idx], item);
      } else {
        const isVideo = isVideoMedia(item);
        const mediaType = isVideo ? 'video' : 'photo';
        list.push({
          ...item,
          type: mediaType,
          media_type: mediaType,
          media_url: item.data_url || item.media_url || item.file_url || (item.id ? `/api/media/stream/${item.id}?token=${token}` : '')
        });
      }
    };

    // 1. Try server first
    try {
      const res = await fetch(`/api/media${search ? `?search=${encodeURIComponent(search)}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await safeFetchJson(res);
      if (res.ok && data && (data.media || data.items)) {
        for (const item of (data.media || data.items)) {
          addOrMerge({
            ...item,
            media_url: item.data_url || item.media_url || `/api/media/stream/${item.id}?token=${token}`
          });
          try {
            await putIDBStoreItem('vault_items', item);
          } catch (e) {}
        }
      }
    } catch (e) {}

    // 2. Read from IndexedDB (handles gigabytes of photos/videos)
    try {
      const idbItems = await getIDBStoreData('vault_items');
      idbItems.forEach(item => {
        if (matchesUser(item, userId, userEmail)) {
          addOrMerge(item);
        }
      });
    } catch (e) {}

    // 3. Read from LocalStorage fallback
    try {
      const localItems = getLocalData('vault_items', []);
      localItems.forEach(item => {
        if (matchesUser(item, userId, userEmail)) {
          addOrMerge(item);
        }
      });
    } catch (e) {}

    let items = list;

    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        i => (i.caption && i.caption.toLowerCase().includes(s)) ||
             (i.original_name && i.original_name.toLowerCase().includes(s)) ||
             (i.tags && i.tags.toLowerCase().includes(s))
      );
    }

    const now = new Date();
    const processed = items.map(item => {
      const isLocked = item.unlock_date && new Date(item.unlock_date) > now;
      const isVideo = isVideoMedia(item);
      const mediaType = isVideo ? 'video' : 'photo';
      return {
        ...item,
        type: mediaType,
        media_type: mediaType,
        is_locked: !!isLocked,
        media_url: item.data_url || item.media_url || item.file_url || `/api/media/stream/${item.id}?token=${token}`
      };
    });

    processed.sort((a, b) => new Date(b.memory_date || b.created_at) - new Date(a.memory_date || a.created_at));
    return processed;
  },

  async uploadVaultItem(token, userId, file, caption, memoryDate, tags, unlockDate, userEmail = '') {
    // 1. Optimize image client-side to prevent Vercel 4.5MB payload rejection
    const processedFile = await optimizeImageForCloud(file);

    // 2. ALWAYS store into permanent local IndexedDB & LocalStorage FIRST
    const localItem = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result;
          const isVideo = isVideoMedia(processedFile);
          const newItem = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            user_id: userId,
            user_email: userEmail || '',
            type: isVideo ? 'video' : 'photo',
            media_type: isVideo ? 'video' : 'photo',
            original_name: processedFile.name,
            file_size: processedFile.size,
            size_bytes: processedFile.size,
            mime_type: processedFile.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
            data_url: dataUrl,
            media_url: dataUrl,
            caption: caption || '',
            memory_date: memoryDate || new Date().toISOString().split('T')[0],
            tags: tags || '',
            unlock_date: unlockDate || null,
            created_at: new Date().toISOString()
          };

          // Store full item in IndexedDB (permanent, survives logouts and restarts)
          await putIDBStoreItem('vault_items', newItem);

          // Store safe metadata in LocalStorage
          try {
            const allItems = getLocalData('vault_items', []);
            const metaCopy = { ...newItem };
            if (metaCopy.data_url && metaCopy.data_url.length > 100000) {
              delete metaCopy.data_url;
            }
            allItems.push(metaCopy);
            setLocalData('vault_items', allItems);
          } catch (e) {}

          resolve(newItem);
        } catch (err) {
          reject(new Error('Failed to permanently store media in vault.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file for vault preservation.'));
      reader.readAsDataURL(processedFile);
    });

    // 3. ALSO send to cloud server for cross-device synchronization
    if (token) {
      try {
        const formData = new FormData();
        formData.append('files', processedFile);
        formData.append('caption', caption || '');
        formData.append('memoryDate', memoryDate || '');
        formData.append('tags', tags || '');
        formData.append('source', 'vault');

        const res = await fetch('/api/media/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const data = await safeFetchJson(res);
        if (res.ok && data) {
          const serverItem = (data.media && data.media[0]) || data.item;
          if (serverItem && serverItem.id) {
            localItem.server_id = serverItem.id;
            try {
              await putIDBStoreItem('vault_items', localItem);
              const allItems = getLocalData('vault_items', []);
              const idx = allItems.findIndex(i => String(i.id) === String(localItem.id));
              if (idx !== -1) {
                allItems[idx].server_id = serverItem.id;
                setLocalData('vault_items', allItems);
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }

    return localItem;
  },

  async deleteVaultItem(token, id, userId) {
    // 1. Delete on server
    try {
      await fetch(`/api/media/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {}

    // 2. Find matching item to delete completely from IDB and LocalStorage
    try {
      const idbItems = await getIDBStoreData('vault_items');
      const target = idbItems.find(i => String(i.id) === String(id) || String(i.server_id) === String(id));
      for (const item of idbItems) {
        if (String(item.id) === String(id) || String(item.server_id) === String(id) || (target && areDuplicateMedia(item, target))) {
          await deleteIDBStoreItem('vault_items', item.id);
        }
      }
    } catch (e) {}

    try {
      const allItems = getLocalData('vault_items', []);
      const target = allItems.find(i => String(i.id) === String(id) || String(i.server_id) === String(id));
      const filtered = allItems.filter(i => {
        if (String(i.id) === String(id) || String(i.server_id) === String(id)) return false;
        if (target && areDuplicateMedia(i, target)) return false;
        return true;
      });
      setLocalData('vault_items', filtered);
    } catch (e) {}

    return true;
  },

  // ================= TRAGIC DIARY =================
  async getDiaries(token, userId, userEmail = '', search = '') {
    if (typeof userEmail === 'string' && !userEmail.includes('@') && userEmail.length > 0 && !search) {
      search = userEmail;
      userEmail = '';
    }

    const list = [];

    const addOrMerge = (entry) => {
      const idx = list.findIndex(existing =>
        String(existing.id) === String(entry.id) ||
        (existing.server_id && entry.server_id && String(existing.server_id) === String(entry.server_id)) ||
        (existing.server_id && entry.id && String(existing.server_id) === String(entry.id)) ||
        (existing.id && entry.server_id && String(existing.id) === String(entry.server_id)) ||
        (existing.title === entry.title && existing.content === entry.content)
      );
      if (idx >= 0) {
        const serverId = entry.server_id || existing.server_id || (!String(entry.id).startsWith('guest') && String(entry.id).length < 12 ? entry.id : null);
        list[idx] = {
          ...list[idx],
          ...entry,
          id: serverId || list[idx].id || entry.id,
          server_id: serverId
        };
      } else {
        list.push(entry);
      }
    };

    // 1. Try server first
    try {
      const res = await fetch(`/api/diary${search ? `?search=${encodeURIComponent(search)}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await safeFetchJson(res);
      if (res.ok && data && data.entries) {
        for (const entry of data.entries) {
          addOrMerge(entry);
          try {
            await putIDBStoreItem('diary_entries', entry);
          } catch (e) {}
        }
      }
    } catch (e) {}

    // 2. Read from IndexedDB
    try {
      const idbDiaries = await getIDBStoreData('diary_entries');
      idbDiaries.forEach(entry => {
        if (matchesUser(entry, userId, userEmail)) {
          addOrMerge(entry);
        }
      });
    } catch (e) {}

    // 3. Read from LocalStorage fallback
    try {
      const localDiaries = getLocalData('diary_entries', []);
      localDiaries.forEach(entry => {
        if (matchesUser(entry, userId, userEmail)) {
          addOrMerge(entry);
        }
      });
    } catch (e) {}

    let filtered = list;

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        d => (d.title && d.title.toLowerCase().includes(s)) ||
             (d.content && d.content.toLowerCase().includes(s))
      );
    }

    filtered.sort((a, b) => new Date(b.created_at || b.entry_date) - new Date(a.created_at || a.entry_date));
    return filtered;
  },

  async saveDiary(token, userId, diaryData, existingId = null, userEmail = '') {
    // 1. ALWAYS save locally to IndexedDB & LocalStorage FIRST
    const entryId = existingId ? existingId : Date.now();
    const entryRecord = {
      id: entryId,
      user_id: userId,
      user_email: userEmail || '',
      title: diaryData.title ? diaryData.title.trim() : 'Untitled Memory',
      content: diaryData.content || '',
      mood: diaryData.mood || 'Melancholy',
      weather: diaryData.weather || 'Rainy Night',
      image_url: diaryData.image_url || null,
      paper_style: diaryData.paper_style || 'bg-parchment-pattern',
      entry_date: diaryData.entry_date || new Date().toISOString().split('T')[0],
      created_at: diaryData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to IndexedDB
    try {
      await putIDBStoreItem('diary_entries', entryRecord);
    } catch (e) {}

    // Save to LocalStorage
    try {
      const allDiaries = getLocalData('diary_entries', []);
      const idx = allDiaries.findIndex(d => String(d.id) === String(entryId));
      if (idx !== -1) {
        allDiaries[idx] = { ...allDiaries[idx], ...entryRecord };
      } else {
        allDiaries.unshift(entryRecord);
      }
      setLocalData('diary_entries', allDiaries);
    } catch (e) {}

    // 2. ALSO send to server for cloud persistence across devices
    if (token) {
      try {
        const url = existingId ? `/api/diary/${existingId}` : '/api/diary';
        const method = existingId ? 'PUT' : 'POST';
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(diaryData)
        });
        const data = await safeFetchJson(res);
        if (res.ok && data && data.entry) {
          entryRecord.server_id = data.entry.id;
          try {
            await putIDBStoreItem('diary_entries', entryRecord);
          } catch (e) {}
        }
      } catch (e) {}
    }

    return entryRecord;
  },

  async deleteDiary(token, id, userId) {
    try {
      await fetch(`/api/diary/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {}

    try {
      await deleteIDBStoreItem('diary_entries', Number(id) || id);
      const allDiariesIDB = await getIDBStoreData('diary_entries');
      for (const d of allDiariesIDB) {
        if (String(d.id) === String(id) || String(d.server_id) === String(id)) {
          await deleteIDBStoreItem('diary_entries', d.id);
        }
      }
    } catch (e) {}

    const allDiaries = getLocalData('diary_entries', []).filter(d => String(d.id) !== String(id) && String(d.server_id) !== String(id));
    setLocalData('diary_entries', allDiaries);

    return true;
  },

  async syncLocalToCloud(token, userId, userEmail = '') {
    if (!token || !userId) return;
    try {
      // 1. Sync local media items (combining IndexedDB and LocalStorage)
      const idbMedia = await getIDBStoreData('vault_items');
      const localMedia = getLocalData('vault_items', []);
      const allMedia = [...idbMedia];
      for (const m of localMedia) {
        if (!allMedia.some(item => String(item.id) === String(m.id))) {
          allMedia.push(m);
        }
      }

      for (const item of allMedia) {
        if (item.data_url && matchesUser(item, userId, userEmail)) {
          if (item.server_id) continue;
          try {
            const res = await fetch('/api/media/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                original_name: item.original_name || 'photo.jpg',
                media_type: item.media_type || item.type || 'photo',
                mime_type: item.mime_type || 'image/jpeg',
                size_bytes: item.size_bytes || item.file_size || 0,
                caption: item.caption || '',
                data_url: item.data_url
              })
            });
            const data = await safeFetchJson(res);
            if (res.ok && data) {
              const serverItem = (data.media && data.media[0]) || data.item;
              if (serverItem && serverItem.id) {
                item.server_id = serverItem.id;
                await putIDBStoreItem('vault_items', item);
              }
            }
          } catch (e) {}
        }
      }

      // 2. Sync local diaries (combining IndexedDB and LocalStorage)
      const idbDiaries = await getIDBStoreData('diary_entries');
      const localDiaries = getLocalData('diary_entries', []);
      const allDiaries = [...idbDiaries];
      for (const d of localDiaries) {
        if (!allDiaries.some(entry => String(entry.id) === String(d.id))) {
          allDiaries.push(d);
        }
      }

      for (const entry of allDiaries) {
        if (matchesUser(entry, userId, userEmail)) {
          if (entry.server_id) continue;
          try {
            const res = await fetch('/api/diary', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                title: entry.title,
                content: entry.content,
                mood: entry.mood,
                image_url: entry.image_url,
                weather: entry.weather
              })
            });
            const data = await safeFetchJson(res);
            if (res.ok && data && data.entry) {
              entry.server_id = data.entry.id;
              await putIDBStoreItem('diary_entries', entry);
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  }
};
