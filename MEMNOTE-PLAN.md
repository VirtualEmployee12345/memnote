# MemNote - Privnote Clone with Memorable URLs

## Concept
Self-destructing notes like Privnote.com, but with human-readable URLs using word combinations instead of random characters.

**Example:**
- Privnote: `privnote.com/a7f9k2m8p3q`
- MemNote: `memnote.com/happy-blue-elephant`

## Core Features (MVP)

### 1. Note Creation
- Text area for note content
- Optional: Manual password encryption
- Optional: Expiration time (1 hour, 1 day, 1 week)
- Optional: Destruction notification email
- Generate memorable URL

### 2. Note Reading
- Visit memorable URL
- Enter password (if protected)
- View note once
- Auto-destruct after reading
- Show "already read" message if accessed again

### 3. Memorable URL System
- 3-word combinations from wordlist
- ~5,000 words = 125 billion unique combinations
- Words are common, easy to spell, type, remember
- No profanity, no similar-sounding words

## Technical Architecture

### Tech Stack
```
Frontend:    React + Vite (or simple HTML/JS if preferred)
Backend:     Node.js + Express
Database:    Redis (in-memory, TTL support for auto-expiry)
Encryption:  crypto (AES-256-GCM)
Hosting:     Render.com (Web Service + Redis)
Domain:      Custom or memnote.render.com
```

### Why Redis?
- Built-in TTL (Time To Live) for auto-expiration
- In-memory = fast reads/writes
- Perfect for temporary data
- Render.com has managed Redis

### Why Memorable Words?
- Use a curated wordlist (~5,000 words)
- Generate 3 random words: `adjective-noun-animal`
- Example: `happy-dog-running`, `blue-mountain-singing`
- Check for collisions (regenerate if exists)

---

## File Structure

### Root
```
memnote/
├── README.md
├── RENDER-DEPLOY.md          # Deployment instructions
├── package.json              # Node dependencies
├── .env.example              # Environment variables template
├── .gitignore
└── render.yaml               # Render.com blueprint
```

### Backend
```
server/
├── index.js                  # Express server entry
├── config/
│   └── redis.js              # Redis connection
├── routes/
│   ├── notes.js              # Create/read notes
│   └── health.js             # Health check
├── services/
│   ├── noteService.js        # Note CRUD + encryption
│   └── wordService.js        # Memorable URL generation
├── utils/
│   ├── encryption.js         # AES encryption/decryption
│   └── wordlist.js           # 5000-word list
└── middleware/
    ├── errorHandler.js
    └── rateLimiter.js        # Prevent abuse
```

### Frontend
```
client/
├── index.html
├── src/
│   ├── main.jsx              # React entry
│   ├── App.jsx               # Main app component
│   ├── components/
│   │   ├── CreateNote.jsx    # Note creation form
│   │   ├── ViewNote.jsx      # Note display component
│   │   ├── MemorableLink.jsx # Show generated URL
│   │   ├── PasswordInput.jsx # Password entry
│   │   └── ErrorMessage.jsx  # Error display
│   ├── styles/
│   │   └── main.css          # All styles
│   └── utils/
│       └── api.js            # API calls
└── public/
    └── favicon.ico
```

### Database Schema (Redis)
```
Key: note:happy-blue-elephant
Value: {
  "encryptedContent": "base64...",
  "iv": "base64...",
  "hasPassword": true/false,
  "passwordHash": "hash..." (if hasPassword),
  "expiresAt": timestamp,
  "isRead": false,
  "createdAt": timestamp,
  "notifyEmail": "user@email.com" (optional)
}
TTL: Set based on expiration (auto-delete by Redis)
```

---

## API Endpoints

### POST /api/notes
Create a new note
```json
{
  "content": "Secret message here",
  "password": "optional-password",
  "expiresIn": "1h" | "1d" | "7d",
  "notifyEmail": "optional@email.com"
}
```
Response:
```json
{
  "url": "https://memnote.com/happy-blue-elephant",
  "words": ["happy", "blue", "elephant"],
  "expiresAt": "2026-02-03T14:00:00Z"
}
```

### GET /api/notes/:word1-:word2-:word3
Check if note exists (without reading)
Response:
```json
{
  "exists": true,
  "hasPassword": true,
  "expiresAt": "2026-02-03T14:00:00Z"
}
```

### POST /api/notes/:word1-:word2-:word3/read
Read and destroy note
```json
{
  "password": "optional-password"
}
```
Response (if successful):
```json
{
  "content": "Decrypted secret message",
  "isDestroyed": true
}
```
Response (if already read):
```json
{
  "error": "Note has already been read and destroyed"
}
```

---

## Word List Strategy

### Word Selection Criteria
- Common English words (not obscure)
- Easy to spell
- No homophones (to/too/two)
- No profanity
- 4-8 characters (easy to type)
- No hyphenated words

### Word Categories (for memorable combinations)
```javascript
const adjectives = ["happy", "bright", "calm", "swift", "gentle", ...]; // ~1000
const nouns = ["mountain", "river", "forest", "ocean", "desert", ...]; // ~2000
const animals = ["elephant", "dolphin", "falcon", "tiger", "rabbit", ...]; // ~2000
```

### Generation Algorithm
```javascript
function generateMemorableUrl() {
  const word1 = randomFrom(adjectives);
  const word2 = randomFrom(nouns);
  const word3 = randomFrom(animals);
  const urlKey = `${word1}-${word2}-${word3}`;
  
  // Check if exists in Redis
  if (redis.exists(`note:${urlKey}`)) {
    return generateMemorableUrl(); // Retry
  }
  
  return urlKey;
}
```

---

## Security Considerations

### Encryption
- AES-256-GCM for content encryption
- Random IV per note
- If password provided: derive key with PBKDF2
- If no password: server generates random key (stored encrypted)

### Data Privacy
- Server never stores plaintext
- All encryption/decryption happens server-side (simpler) OR client-side (more private)
- **Decision:** Server-side for MVP, client-side as future enhancement

### Rate Limiting
- Max 10 notes per IP per hour
- Max 100 reads per IP per hour
- Prevent brute force on passwords

### Cleanup
- Redis TTL handles expiration automatically
- No persistent logs of note content
- Only store metadata (creation time, expiration)

---

## Deployment Plan (Render.com)

### Services Needed
1. **Web Service** (Node.js)
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Plan: Free ($0) or Starter ($7/month)

2. **Redis** (Managed)
   - Plan: Redis Cloud (free tier: 30MB)
   - Or: Upstash Redis (free tier: 10,000 commands/day)

3. **Custom Domain** (Optional)
   - Connect your domain to Render
   - Or use `memnote.onrender.com`

### render.yaml (Infrastructure as Code)
```yaml
services:
  - type: web
    name: memnote-api
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: REDIS_URL
        fromService:
          type: redis
          name: memnote-redis
          property: connectionString
      - key: NODE_ENV
        value: production
      - key: ENCRYPTION_KEY
        generateValue: true

  - type: redis
    name: memnote-redis
    plan: free
```

---

## Implementation Phases

### Phase 1: Backend Core
**Files:**
- `server/index.js` — Express setup
- `server/config/redis.js` — Redis connection
- `server/utils/wordlist.js` — Word list data
- `server/services/wordService.js` — URL generation
- `server/utils/encryption.js` — Crypto functions
- `server/services/noteService.js` — Note logic
- `server/routes/notes.js` — API endpoints
- `server/middleware/errorHandler.js`

**Features:**
- Create note with memorable URL
- Read and destroy note
- Basic encryption
- Redis storage

### Phase 2: Frontend MVP
**Files:**
- `client/index.html`
- `client/src/main.jsx`
- `client/src/App.jsx`
- `client/src/components/CreateNote.jsx`
- `client/src/components/ViewNote.jsx`
- `client/src/components/MemorableLink.jsx`
- `client/src/utils/api.js`
- `client/src/styles/main.css`

**Features:**
- Create note form
- Display generated URL
- View note page
- Basic styling

### Phase 3: Advanced Features
**Files:**
- `client/src/components/PasswordInput.jsx`
- `server/middleware/rateLimiter.js`

**Features:**
- Password protection
- Expiration options
- Rate limiting
- Email notifications

### Phase 4: Deployment
**Files:**
- `render.yaml`
- `README.md`
- `RENDER-DEPLOY.md`

**Features:**
- Render.com setup
- Environment variables
- Production build

---

## File Dependencies

```
Server Startup:
  index.js
    └─ config/redis.js
    └─ routes/notes.js
        └─ services/noteService.js
            └─ utils/encryption.js
            └─ services/wordService.js
                └─ utils/wordlist.js
    └─ middleware/errorHandler.js

Client Startup:
  main.jsx
    └─ App.jsx
        └─ CreateNote.jsx
        └─ ViewNote.jsx
        └─ MemorableLink.jsx
        └─ api.js
```

---

## Environment Variables

```
# .env
NODE_ENV=development
PORT=3000
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=your-32-character-secret-key-here!!
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=10
```

---

## Package.json Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "redis": "^4.6.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.0",
    "dotenv": "^16.3.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

---

## Questions Before Starting

1. **Client-side or server-side encryption?**
   - Server-side: Simpler, but server sees plaintext briefly
   - Client-side: More private, but more complex

2. **Custom domain?**
   - Do you own a domain to use?
   - Or use `memnote.onrender.com`?

3. **Word style preference?**
   - `adjective-noun-animal` (happy-blue-elephant)
   - `adjective-adjective-noun` (bright-happy-mountain)
   - `noun-verb-noun` (dog-runs-forest)

4. **Additional features?**
   - File attachments (images/docs)?
   - Burn after X reads (not just 1)?
   - QR code generation?

---

## Estimates

- **Phase 1 (Backend):** 7 files, ~2 hours
- **Phase 2 (Frontend):** 8 files, ~2 hours
- **Phase 3 (Advanced):** 2 files, ~1 hour
- **Phase 4 (Deploy):** 3 files, ~30 min

**Total: ~20 files, ~5-6 hours**

---

Ready to proceed? Reply with:
1. Encryption preference (client vs server)
2. Word combination style
3. Domain situation

Then I'll spawn Codex to build this out.
