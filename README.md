# Memory Vault & Tragic Diary

A private, secure, and permanent personal memory vault and time capsule with an atmospheric **Tragic Diary** experience.

## Features

- **Authentication System**:
  - **New Registration**: Full Name, Email, Phone Number, Date of Birth, Password & Confirm Password.
  - **Login**: Email or Phone Number, Name, Master Password.
- **Photos & Videos Vault**:
  - Upload high-resolution photos and video memories with captions, memory dates, and tags.
  - **Time Capsule**: Option to seal memories to be unlocked on future dates/milestones.
  - Fullscreen media viewer and video player.
- **Old Tragic Beautiful Diary**:
  - Atmospheric antique parchment, tragic midnight noir, and Victorian sepia paper themes.
  - Handwritten quill, old typewriter, and classical antiqua typography.
  - Melancholic mood badges (Melancholy, Heartbroken, Lost Love, Solitude, Bittersweet, Nostalgic).
  - Melancholic rain & vinyl crackle audio synthesized with browser Web Audio API.
  - Searchable personal diary archives.
- **100% Free & No Subscriptions**:
  - Zero subscriptions, no paywalls, forever free.
- **Strict Privacy & High Security**:
  - Passwords hashed with salted bcrypt (10 rounds).
  - Strict owner-only access: only the customer who uploaded a photo/video can view or download it.
  - Permanent local SQLite storage: your files remain intact forever until you explicitly choose to delete them.

## Quick Start

### 1. Backend Server
```bash
cd server
npm install
npm start
```
Runs at `http://localhost:5000`

### 2. Frontend Client
```bash
cd client
npm install
npm run dev
```
Runs at `http://localhost:3000`

---
© Kalyan 2026 The Memory Vault & Tragic Diary • Built for permanent, sacred personal preservation.
