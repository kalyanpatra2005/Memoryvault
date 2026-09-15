const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'vault.sqlite');
const db = new Database(dbPath);

console.log('Seeding SQLite database at:', dbPath);

// Create user Kalyan Patra
const email = 'kalyan@example.com';
const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
let userId;

const passwordHash = bcrypt.hashSync('password123', 10);
const pinHash = bcrypt.hashSync('1234', 8);

if (existingUser) {
  userId = existingUser.id;
  db.prepare(`
    UPDATE users 
    SET name = ?, phone = ?, dob = ?, password_hash = ?, vault_pin = ?
    WHERE id = ?
  `).run('Kalyan Patra', '+91 98765 43210', '1998-04-12', passwordHash, pinHash, userId);
  console.log('Updated existing user Kalyan Patra with id:', userId);
} else {
  const result = db.prepare(`
    INSERT INTO users (name, email, phone, dob, password_hash, vault_pin)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Kalyan Patra', email, '+91 98765 43210', '1998-04-12', passwordHash, pinHash);
  userId = result.lastInsertRowid;
  console.log('Inserted user Kalyan Patra with id:', userId);
}

// Clear existing items for this user to avoid duplicates
db.prepare('DELETE FROM memories WHERE user_id = ?').run(userId);
db.prepare('DELETE FROM diaries WHERE user_id = ?').run(userId);
db.prepare('DELETE FROM time_capsules WHERE user_id = ?').run(userId);

// Insert Memories (Photos & Videos)
const memories = [
  {
    title: 'First Solo Trip',
    description: 'Sometimes, being alone is the most beautiful company.',
    category: 'Travel',
    media_type: 'photo',
    media_url: '/images/mountain_lake.jpg',
    memory_date: '2024-12-12',
    is_public: 0
  },
  {
    title: 'College Days',
    description: 'Golden campus afternoons, unforgettable friendships, and endless tea stall conversations.',
    category: 'College',
    media_type: 'photo',
    media_url: '/images/sunset_video.jpg',
    memory_date: '2023-08-21',
    is_public: 0
  },
  {
    title: 'Best Friends',
    description: 'A crimson sunset at the beach with the ones who make life wonderful.',
    category: 'Friends',
    media_type: 'photo',
    media_url: '/images/dashboard_hero.jpg',
    memory_date: '2023-01-10',
    is_public: 1
  },
  {
    title: 'Family Reunion & Celebration',
    description: 'Warm gatherings and laughter that echoes through generations.',
    category: 'Family',
    media_type: 'photo',
    media_url: '/images/welcome_screen_bg.jpg',
    memory_date: '2022-05-05',
    is_public: 0
  },
  {
    title: 'Special Moments by Candlelight',
    description: 'Quiet evenings spent writing, reflecting, and feeling grateful.',
    category: 'Special Moments',
    media_type: 'photo',
    media_url: '/images/diary_candle_header.jpg',
    memory_date: '2024-11-15',
    is_public: 0
  },
  {
    title: 'Nature Trails & Whispering Pines',
    description: 'Fresh mountain breeze through cedar and pine leaves.',
    category: 'Nature',
    media_type: 'photo',
    media_url: '/images/capsule_wax_letter.jpg',
    memory_date: '2024-10-02',
    is_public: 0
  },
  {
    title: 'Trip to Darjeeling',
    description: 'One of the best trips of my life ❤️',
    category: 'Travel',
    media_type: 'video',
    media_url: '/images/sunset_video.jpg',
    memory_date: '2024-12-12',
    is_public: 0
  },
  {
    title: 'College Fest',
    description: 'Rocking lights and electric youth vibes under the autumn night sky.',
    category: 'College',
    media_type: 'video',
    media_url: '/images/mountain_lake.jpg',
    memory_date: '2023-08-21',
    is_public: 0
  },
  {
    title: 'Sunset at Beach',
    description: 'Watching gentle rolling waves reflect the orange dusk.',
    category: 'Travel',
    media_type: 'video',
    media_url: '/images/dashboard_hero.jpg',
    memory_date: '2023-01-10',
    is_public: 1
  },
  {
    title: 'Family Moments',
    description: 'Festive dinner and traditional music shared together.',
    category: 'Family',
    media_type: 'video',
    media_url: '/images/welcome_screen_bg.jpg',
    memory_date: '2022-05-05',
    is_public: 0
  }
];

const insertMem = db.prepare(`
  INSERT INTO memories (user_id, title, description, category, media_type, media_url, memory_date, is_public)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const m of memories) {
  insertMem.run(userId, m.title, m.description, m.category, m.media_type, m.media_url, m.memory_date, m.is_public);
}
console.log(`Inserted ${memories.length} memories.`);

// Insert Diaries
const diaries = [
  {
    title: 'A New Beginning',
    content: 'Today I felt a strange peace. It was not happiness, not sadness... just a calm feeling that maybe, things will be better someday. I don\'t know what the future holds, but I am ready to face it.',
    mood: 'Peaceful',
    tragic_quote: 'Some days are just for you...',
    theme_style: 'parchment-gold',
    created_at: '2025-04-15 20:30:00'
  },
  {
    title: 'Rainy Thoughts',
    content: 'The rain always reminds me of the quiet afternoons spent reading by the window, listening to the drops tap gently against the glass pane. There is beauty in melancholy.',
    mood: 'Melancholy',
    tragic_quote: 'The rain always reminds me...',
    theme_style: 'parchment-rain',
    created_at: '2025-01-02 18:15:00'
  },
  {
    title: 'Dreams',
    content: 'I still dream about that place nestled in the valleys, where the morning mist kisses the pines and silence has a voice of its own.',
    mood: 'Nostalgic',
    tragic_quote: 'I still dream about that place...',
    theme_style: 'parchment-gold',
    created_at: '2024-11-18 22:45:00'
  },
  {
    title: 'Unspoken Words',
    content: 'Some words are better left in the quiet corridors of memory. Not everything needs to be spoken to be felt deeply.',
    mood: 'Contemplative',
    tragic_quote: 'Some words are better left...',
    theme_style: 'parchment-gold',
    created_at: '2024-10-05 19:10:00'
  }
];

const insertDiary = db.prepare(`
  INSERT INTO diaries (user_id, title, content, mood, tragic_quote, theme_style, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const d of diaries) {
  insertDiary.run(userId, d.title, d.content, d.mood, d.tragic_quote, d.theme_style, d.created_at);
}
console.log(`Inserted ${diaries.length} diary entries.`);

// Insert Time Capsules
const capsules = [
  {
    title: 'A message to my future self',
    message: 'Hey future me,\nI hope you are happy, healthy and living the life you always dreamed of.\nDon\'t forget how far you have come.',
    unlock_date: '2030-01-01 00:00:00',
    media_url: '/images/capsule_wax_letter.jpg',
    media_type: 'photo'
  },
  {
    title: 'The next chapter',
    message: 'Reflecting on where we started and where we are heading. Stay courageous and trust the journey.',
    unlock_date: '2028-06-15 00:00:00',
    media_url: '/images/dashboard_hero.jpg',
    media_type: 'photo'
  }
];

const insertCap = db.prepare(`
  INSERT INTO time_capsules (user_id, title, message, unlock_date, media_url, media_type)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const c of capsules) {
  insertCap.run(userId, c.title, c.message, c.unlock_date, c.media_url, c.media_type);
}
console.log(`Inserted ${capsules.length} time capsules.`);

console.log('✅ SEEDING COMPLETE FOR MEMORY VAULT!');
