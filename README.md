# 🏛️ Memory Vault & Time Capsule

A private, secure, and permanent personal digital vault designed for lifetime memories, photographs, motion pictures, sealed time capsules, and an evocative, antique-styled personal diary.

---

## 🌟 Key Features

1. **Authentication (Login & Register)**:
   - **Login**: Email or Phone number, Name, Password.
   - **Register**: Full Name, Email, Phone Number, Date of Birth, Password, Confirm Password with real-time validation.
2. **Strict Privacy & High Security**:
   - Zero access for outside eyes: all photos, videos, and entries are cryptographically isolated to the authenticated user ID (`user_id`).
   - Passwords hashed with `bcryptjs` (salt rounds: 10).
   - Authenticated JWT bearer tokens required for all endpoints, including media streaming.
3. **Permanent & 100% Free**:
   - Zero subscriptions, no hidden fees, no expiration dates.
   - Uploaded photos, videos, and entries stay in the vault permanently until the owner explicitly deletes them.
4. **The Tragic & Beautiful Personal Diary**:
   - Antique parchment paper design with warm candlelight flicker and aged wax seal watermarks.
   - Self-contained ambient rain and storm soundscape generator (Web Audio API, no external downloads needed).
   - Melancholic mood tags (*Nostalgia, Unspoken Words, Bittersweet, Solitude, Heartbreak, Lost in Time, Glimmer of Hope*).
   - Weather logging, photo attachments, and opened-book reading modal.
5. **Photo & Video Vault**:
   - Multi-file uploads up to 250MB for high-resolution images and videos.
   - Fullscreen lightbox viewer and video player with range-request streaming.
   - Complete delete control with confirmation warnings.
6. **Sealed Time Capsules**:
   - Forge letters and memories addressed to future dates.
   - Real-time countdown tickers (Days, Hours, Minutes, Seconds).
   - Unsealing ceremony once the lock date arrives.
7. **Complete Data Backup & Export**:
   - Download a full JSON archive of all diaries, capsules, and media catalog at any time from Settings.

---

## 🚀 Quick Start

### 1. Launch the All-in-One Server
```bash
cd server
npm start
```
The server will start on `http://localhost:5000`. You can open this address directly in any web browser to experience the full application.

### 2. (Optional) Run Frontend in Vite Development Mode
```bash
cd client
npm run dev
```
Runs at `http://localhost:5173` with instant hot reloading proxying to `http://localhost:5000`.

### 3. Run Automated Integration & Security Tests
```bash
cd server
node test_vault.js      # Tests auth, registration, login, diaries, capsules, user isolation
node test_upload.js     # Tests photo/video upload, streaming, and cross-user security
```

---

## 📁 Project Architecture

```
memory-vault/
├── server/
│   ├── index.js             # Express app, static SPA delivery & stats API
│   ├── db.js                # SQLite WAL database & schema migrations
│   ├── auth.js              # JWT & bcrypt authentication
│   ├── routes/
│   │   ├── authRoutes.js    # Register, login with email/phone & name
│   │   ├── diaryRoutes.js   # Tragic diary CRUD operations
│   │   ├── mediaRoutes.js   # Photo & video uploads, streaming proxy & delete
│   │   └── capsuleRoutes.js # Time capsule sealing, countdown & opening
│   ├── test_vault.js        # Automated API & isolation test suite
│   ├── test_upload.js       # File upload & privacy test suite
│   └── uploads/             # Partitioned private storage per user ID
└── client/
    ├── src/
    │   ├── App.jsx          # Tab routing & auth coordinator
    │   ├── index.css        # Vintage parchment textures & candle animations
    │   ├── context/
    │   │   └── AuthContext.jsx # Auth session provider
    │   ├── components/
    │   │   ├── Navbar.jsx   # Header, user badge & mobile navigation
    │   │   └── AuthModal.jsx# Login & Register modal matching all specified fields
    │   └── pages/
    │       ├── LandingPage.jsx   # Welcome & features presentation
    │       ├── Dashboard.jsx     # Vault hub & storage overview
    │       ├── DiaryPage.jsx     # Tragic beautiful parchment diary
    │       ├── MediaVaultPage.jsx# Photo & video gallery & player
    │       ├── TimeCapsulePage.jsx# Future locks & countdowns
    │       └── SettingsPage.jsx  # Security info & JSON backup export
```
