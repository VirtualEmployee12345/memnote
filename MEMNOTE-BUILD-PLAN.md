# MemNote Build Plan - With Testing & Verification

## Philosophy: "Test Early, Test Often"
Every phase has verification steps. Nothing moves forward without passing tests.

---

## Phase 1: Foundation (Easiest - Start Here)
**Goal:** Working backend API with Redis, no frontend yet
**Time:** ~1.5 hours
**Testing:** API endpoint tests with curl

### Files to Create

#### 1.1 Project Structure & Config
```
memnote/
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── server/
    ├── index.js
    ├── config/
    │   └── redis.js
    └── tests/
        └── api.test.js (verification script)
```

**File: package.json**
```json
{
  "name": "memnote",
  "version": "1.0.0",
  "description": "Self-destructing notes with memorable URLs",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js",
    "dev": "nodemon server/index.js",
    "test": "node server/tests/api.test.js",
    "test:redis": "node server/tests/redis.test.js"
  },
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

**File: .env.example**
```
NODE_ENV=development
PORT=3000
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=your-32-character-secret-key-here!!
```

**File: .gitignore**
```
node_modules/
.env
.DS_Store
*.log
dist/
```

#### 1.2 Word List (Curated)
**File: server/utils/wordlist.js**
```javascript
// 5,000 curated words - common, easy to spell, 4-8 chars
// Organized by category for memorable combinations

const adjectives = [
  "happy", "bright", "calm", "swift", "gentle", "brave", "clever", "warm",
  "cool", "fresh", "sweet", "brilliant", "vivid", "golden", "silver",
  "ancient", "modern", "silent", "loud", "mighty", "tiny", "grand",
  "fierce", "tender", "wild", "tame", "proud", "humble", "noble",
  // ... ~1000 total
];

const nouns = [
  "mountain", "river", "forest", "ocean", "desert", "meadow", "canyon",
  "valley", "island", "beach", "waterfall", "glacier", "volcano", "prairie",
  "thunder", "lightning", "rainbow", "sunset", "sunrise", "moonlight",
  "starlight", "breeze", "storm", "mist", "frost", "flame", "shadow",
  // ... ~2000 total
];

const animals = [
  "elephant", "dolphin", "falcon", "tiger", "rabbit", "wolf", "bear",
  "eagle", "owl", "deer", "fox", "lion", "panda", "koala", "zebra",
  "giraffe", "penguin", "seal", "whale", "shark", "turtle", "butterfly",
  // ... ~2000 total
];

const allWords = [...adjectives, ...nouns, ...animals];

module.exports = { adjectives, nouns, animals, allWords };
```

#### 1.3 Redis Connection
**File: server/config/redis.js**
```javascript
const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.error('Redis Client Error', err));
client.on('connect', () => console.log('Redis Connected'));

async function connect() {
  if (!client.isOpen) {
    await client.connect();
  }
}

module.exports = { client, connect };
```

#### 1.4 Basic Server
**File: server/index.js**
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connect } = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each IP to 100 requests per hour
  message: { error: 'Too many requests, please try again later' }
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Placeholder routes (to be implemented)
app.post('/api/notes', (req, res) => {
  res.json({ message: 'Create note - TODO' });
});

app.get('/api/notes/:key', (req, res) => {
  res.json({ message: 'Get note - TODO', key: req.params.key });
});

// Start server
async function start() {
  await connect();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
}

start().catch(console.error);
```

#### 1.5 Test Script (Verification)
**File: server/tests/api.test.js**
```javascript
// Simple test runner - no dependencies

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TESTS = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  TESTS.push({ name, fn });
}

async function runTests() {
  console.log('🧪 Running API Tests...\n');
  
  for (const { name, fn } of TESTS) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (err) {
      console.log(`❌ ${name}: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

// Helper: Make HTTP request
function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Tests
test('Health check returns 200', async () => {
  const res = await request('/health');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (res.body.status !== 'ok') throw new Error('Status not ok');
});

test('Create note endpoint exists', async () => {
  const res = await request('/api/notes', 'POST', { content: 'test' });
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
});

test('Get note endpoint exists', async () => {
  const res = await request('/api/notes/test-key');
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
});

// Check if server is running
console.log('🔍 Checking if server is running...');
request('/health')
  .then(() => runTests())
  .catch(() => {
    console.log('❌ Server not running. Start with: npm run dev');
    process.exit(1);
  });
```

### Verification Steps (Phase 1)
```bash
# 1. Install dependencies
npm install

# 2. Start Redis (if local)
redis-server

# 3. Start server
npm run dev

# 4. Run tests (in another terminal)
npm test

# Expected output:
# 🧪 Running API Tests...
# ✅ Health check returns 200
# ✅ Create note endpoint exists
# ✅ Get note endpoint exists
# 📊 Results: 3 passed, 0 failed
```

**Checkpoint:** If tests pass → Proceed to Phase 2
**If tests fail:** Debug before continuing

---

## Phase 2: Core Logic (Medium)
**Goal:** Working note creation, encryption, and retrieval
**Time:** ~2 hours
**Testing:** Full API flow tests

### Files to Create

#### 2.1 Encryption Utility
**File: server/utils/encryption.js**
```javascript
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key-32-chars-long-here', 'salt', 32);

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}

function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(encryptedData.iv, 'base64')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = { encrypt, decrypt };
```

#### 2.2 Word Service
**File: server/services/wordService.js**
```javascript
const { adjectives, nouns, animals } = require('../utils/wordlist');
const { client } = require('../config/redis');

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function generateUniqueKey() {
  const maxAttempts = 10;
  
  for (let i = 0; i < maxAttempts; i++) {
    const word1 = getRandom(adjectives);
    const word2 = getRandom(nouns);
    const word3 = getRandom(animals);
    const key = `${word1}-${word2}-${word3}`;
    
    // Check if exists
    const exists = await client.exists(`note:${key}`);
    if (!exists) {
      return { key, words: [word1, word2, word3] };
    }
  }
  
  throw new Error('Could not generate unique key after max attempts');
}

module.exports = { generateUniqueKey };
```

#### 2.3 Note Service
**File: server/services/noteService.js**
```javascript
const { client } = require('../config/redis');
const { encrypt, decrypt } = require('../utils/encryption');
const { generateUniqueKey } = require('./wordService');

const EXPIRY_OPTIONS = {
  '1h': 60 * 60,
  '1d': 24 * 60 * 60,
  '7d': 7 * 24 * 60 * 60
};

async function createNote({ content, password, expiresIn, notifyEmail }) {
  // Generate memorable URL
  const { key, words } = await generateUniqueKey();
  
  // Encrypt content
  const encrypted = encrypt(content);
  
  // Prepare data
  const noteData = {
    encryptedContent: encrypted.encrypted,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
    hasPassword: !!password,
    passwordHash: password ? hashPassword(password) : null,
    notifyEmail: notifyEmail || null,
    createdAt: Date.now(),
    isRead: false
  };
  
  // Store in Redis with TTL
  const ttl = EXPIRY_OPTIONS[expiresIn] || EXPIRY_OPTIONS['7d'];
  await client.setEx(`note:${key}`, ttl, JSON.stringify(noteData));
  
  return {
    key,
    words,
    url: `${process.env.BASE_URL || 'http://localhost:3000'}/${key}`,
    expiresIn: ttl
  };
}

async function getNote(key, password) {
  const data = await client.get(`note:${key}`);
  
  if (!data) {
    return { error: 'Note not found or expired', status: 404 };
  }
  
  const note = JSON.parse(data);
  
  if (note.isRead) {
    return { error: 'Note has already been read and destroyed', status: 410 };
  }
  
  // Check password if required
  if (note.hasPassword) {
    if (!password) {
      return { error: 'Password required', status: 401, requiresPassword: true };
    }
    if (hashPassword(password) !== note.passwordHash) {
      return { error: 'Invalid password', status: 403 };
    }
  }
  
  // Decrypt content
  const content = decrypt({
    encrypted: note.encryptedContent,
    iv: note.iv,
    authTag: note.authTag
  });
  
  // Mark as read (delete)
  await client.del(`note:${key}`);
  
  return { content, isDestroyed: true };
}

function hashPassword(password) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

module.exports = { createNote, getNote };
```

#### 2.4 Updated Routes
**File: server/routes/notes.js**
```javascript
const express = require('express');
const router = express.Router();
const { createNote, getNote } = require('../services/noteService');

// Create note
router.post('/', async (req, res) => {
  try {
    const { content, password, expiresIn, notifyEmail } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const result = await createNote({ content, password, expiresIn, notifyEmail });
    res.json(result);
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Check if note exists (without reading)
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { client } = require('../config/redis');
    
    const data = await client.get(`note:${key}`);
    
    if (!data) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    const note = JSON.parse(data);
    
    res.json({
      exists: true,
      hasPassword: note.hasPassword,
      createdAt: note.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check note' });
  }
});

// Read and destroy note
router.post('/:key/read', async (req, res) => {
  try {
    const { key } = req.params;
    const { password } = req.body;
    
    const result = await getNote(key, password);
    
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    
    res.json(result);
  } catch (err) {
    console.error('Read note error:', err);
    res.status(500).json({ error: 'Failed to read note' });
  }
});

module.exports = router;
```

#### 2.5 Updated Server
**File: server/index.js** (update routes section)
```javascript
// Replace placeholder routes with:
const notesRouter = require('./routes/notes');
app.use('/api/notes', notesRouter);
```

#### 2.6 Comprehensive Tests
**File: server/tests/full.test.js**
```javascript
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TESTS = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  TESTS.push({ name, fn });
}

async function runTests() {
  console.log('🧪 Running Full API Tests...\n');
  
  for (const { name, fn } of TESTS) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (err) {
      console.log(`❌ ${name}: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Store created note key for later tests
let createdNoteKey = null;
let createdNoteUrl = null;

// Tests
test('Create note with memorable URL', async () => {
  const res = await request('/api/notes', 'POST', {
    content: 'This is a secret message!',
    expiresIn: '1h'
  });
  
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!res.body.key) throw new Error('No key returned');
  if (!res.body.words || res.body.words.length !== 3) {
    throw new Error('Expected 3 words');
  }
  if (!res.body.url) throw new Error('No URL returned');
  
  createdNoteKey = res.body.key;
  createdNoteUrl = res.body.url;
  console.log(`   📝 Created: ${res.body.url}`);
});

test('Check note exists without reading', async () => {
  const res = await request(`/api/notes/${createdNoteKey}`);
  
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (!res.body.exists) throw new Error('Note should exist');
  if (res.body.hasPassword !== false) throw new Error('Should not have password');
});

test('Read and destroy note', async () => {
  const res = await request(`/api/notes/${createdNoteKey}/read`, 'POST');
  
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  if (res.body.content !== 'This is a secret message!') {
    throw new Error('Content mismatch');
  }
  if (res.body.isDestroyed !== true) {
    throw new Error('Should be marked as destroyed');
  }
});

test('Note is gone after reading', async () => {
  const res = await request(`/api/notes/${createdNoteKey}/read`, 'POST');
  
  if (res.status !== 410) throw new Error(`Expected 410, got ${res.status}`);
  if (!res.body.error.includes('already been read')) {
    throw new Error('Should indicate already read');
  }
});

test('Create password-protected note', async () => {
  const res = await request('/api/notes', 'POST', {
    content: 'Password secret!',
    password: 'mypassword123',
    expiresIn: '1h'
  });
  
  if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  
  const key = res.body.key;
  
  // Try to read without password
  const noPassRes = await request(`/api/notes/${key}/read`, 'POST');
  if (noPassRes.status !== 401) throw new Error('Should require password');
  
  // Read with wrong password
  const wrongPassRes = await request(`/api/notes/${key}/read`, 'POST', {
    password: 'wrong'
  });
  if (wrongPassRes.status !== 403) throw new Error('Should reject wrong password');
  
  // Read with correct password
  const correctRes = await request(`/api/notes/${key}/read`, 'POST', {
    password: 'mypassword123'
  });
  if (correctRes.status !== 200) throw new Error('Should accept correct password');
  if (correctRes.body.content !== 'Password secret!') {
    throw new Error('Content mismatch');
  }
});

test('Reject empty content', async () => {
  const res = await request('/api/notes', 'POST', { content: '' });
  if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
});

// Check server
console.log('🔍 Checking if server is running...');
request('/health')
  .then(() => runTests())
  .catch(() => {
    console.log('❌ Server not running. Start with: npm run dev');
    process.exit(1);
  });
```

### Verification Steps (Phase 2)
```bash
# 1. Run full tests
npm run test:full

# Expected output:
# 🧪 Running Full API Tests...
# ✅ Create note with memorable URL
n#    📝 Created: http://localhost:3000/happy-blue-elephant
# ✅ Check note exists without reading
# ✅ Read and destroy note
# ✅ Note is gone after reading
# ✅ Create password-protected note
# ✅ Reject empty content
# 📊 Results: 6 passed, 0 failed
```

**Checkpoint:** All 6 tests pass → Proceed to Phase 3

---

## Phase 3: Frontend MVP (Medium)
**Goal:** Simple UI for creating and reading notes
**Time:** ~2 hours
**Testing:** Manual browser testing + screenshot verification

### Files to Create

#### 3.1 Frontend Structure
```
client/
├── index.html
├── src/
│   ├── main.js (vanilla JS - no build step needed)
│   ├── api.js
│   └── styles.css
└── assets/
    └── favicon.ico
```

**File: client/index.html**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MemNote - Self-destructing notes with memorable URLs</title>
  <link rel="stylesheet" href="src/styles.css">
</head>
<body>
  <div id="app">
    <!-- Views injected here -->
  </div>
  <script src="src/api.js"></script>
  <script src="src/main.js"></script>
</body>
</html>
```

**File: client/src/api.js**
```javascript
const API_URL = window.location.origin + '/api';

const api = {
  async createNote(content, options = {}) {
    const res = await fetch(`${API_URL}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        password: options.password,
        expiresIn: options.expiresIn || '7d',
        notifyEmail: options.notifyEmail
      })
    });
    return res.json();
  },
  
  async checkNote(key) {
    const res = await fetch(`${API_URL}/notes/${key}`);
    return res.json();
  },
  
  async readNote(key, password) {
    const res = await fetch(`${API_URL}/notes/${key}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    return res.json();
  }
};
```

**File: client/src/main.js**
```javascript
// Router
const app = document.getElementById('app');

function router() {
  const path = window.location.pathname;
  
  if (path === '/' || path === '/index.html') {
    showCreateView();
  } else if (path.startsWith('/')) {
    const key = path.slice(1);
    if (key && !key.includes('.')) {
      showReadView(key);
    } else {
      show404();
    }
  }
}

// Create Note View
function showCreateView() {
  app.innerHTML = `
    <div class="container">
      <header>
        <h1>MemNote</h1>
        <p>Send notes that self-destruct after reading</p>
      </header>
      
      <main>
        <form id="create-form">
          <textarea 
            id="content" 
            placeholder="Write your secret note here..."
            rows="10"
            required
          ></textarea>
          
          <div class="options">
            <label>
              Password (optional):
              <input type="password" id="password" placeholder="Enter password">
            </label>
            
            <label>
              Expires in:
              <select id="expires">
                <option value="1h">1 hour</option>
                <option value="1d">1 day</option>
                <option value="7d" selected>7 days</option>
              </select>
            </label>
          </div>
          
          <button type="submit">Create Note</button>
        </form>
        
        <div id="result" class="hidden">
          <h2>Your note is ready!</h2>
          <p>Share this link:</p>
          <div class="url-box">
            <input type="text" id="note-url" readonly>
            <button id="copy-btn">Copy</button>
          </div>
          <p class="hint">This link will only work once, then the note will be destroyed.</p>
          <button id="new-note">Create another note</button>
        </div>
      </main>
      
      <footer>
        <p>MemNote - Easy to remember, safe to share</p>
      </footer>
    </div>
  `;
  
  // Event listeners
  document.getElementById('create-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const content = document.getElementById('content').value;
    const password = document.getElementById('password').value;
    const expiresIn = document.getElementById('expires').value;
    
    try {
      const result = await api.createNote(content, { password, expiresIn });
      
      if (result.error) {
        alert(result.error);
        return;
      }
      
      document.getElementById('note-url').value = result.url;
      document.getElementById('create-form').classList.add('hidden');
      document.getElementById('result').classList.remove('hidden');
    } catch (err) {
      alert('Failed to create note. Please try again.');
    }
  });
  
  document.getElementById('copy-btn').addEventListener('click', () => {
    const urlInput = document.getElementById('note-url');
    urlInput.select();
    document.execCommand('copy');
    document.getElementById('copy-btn').textContent = 'Copied!';
  });
  
  document.getElementById('new-note').addEventListener('click', () => {
    window.location.reload();
  });
}

// Read Note View
async function showReadView(key) {
  app.innerHTML = `
    <div class="container">
      <header>
        <h1>MemNote</h1>
      </header>
      
      <main id="read-content">
        <p>Loading...</p>
      </main>
    </div>
  `;
  
  try {
    // Check if note exists
    const check = await api.checkNote(key);
    
    if (check.error) {
      document.getElementById('read-content').innerHTML = `
        <div class="error">
          <h2>Note not found</h2>
          <p>This note may have expired or already been read.</p>
          <a href="/">Create a new note</a>
        </div>
      `;
      return;
    }
    
    // Show password prompt if needed
    if (check.hasPassword) {
      document.getElementById('read-content').innerHTML = `
        <form id="password-form">
          <h2>This note is password protected</h2>
          <input type="password" id="read-password" placeholder="Enter password" required>
          <button type="submit">View Note</button>
        </form>
      `;
      
      document.getElementById('password-form').addEventListener('submit', (e) => {
        e.preventDefault();
        loadNote(key, document.getElementById('read-password').value);
      });
    } else {
      await loadNote(key);
    }
  } catch (err) {
    document.getElementById('read-content').innerHTML = `
      <div class="error">
        <p>Error loading note. Please try again.</p>
      </div>
    `;
  }
}

async function loadNote(key, password = '') {
  document.getElementById('read-content').innerHTML = '<p>Loading...</p>';
  
  try {
    const result = await api.readNote(key, password);
    
    if (result.error) {
      if (result.error.includes('already been read')) {
        document.getElementById('read-content').innerHTML = `
          <div class="error">
            <h2>Note already read</h2>
            <p>This note has already been viewed and destroyed.</p>
            <a href="/">Create a new note</a>
          </div>
        `;
      } else if (result.error.includes('Invalid password')) {
        document.getElementById('read-content').innerHTML = `
          <div class="error">
            <p>Invalid password. Please try again.</p>
            <button onclick="showReadView('${key}')">Back</button>
          </div>
        `;
      } else {
        document.getElementById('read-content').innerHTML = `
          <div class="error">
            <p>${result.error}</p>
          </div>
        `;
      }
      return;
    }
    
    // Show note content
    document.getElementById('read-content').innerHTML = `
      <div class="note-display">
        <h2>🔥 This note has been destroyed</h2>
        <div class="note-content">${escapeHtml(result.content)}</div>
        <p class="warning">This note no longer exists. Refreshing this page will show an error.</p>
        <a href="/">Create your own note</a>
      </div>
    `;
  } catch (err) {
    document.getElementById('read-content').innerHTML = `
      <div class="error">
        <p>Error reading note. Please try again.</p>
      </div>
    `;
  }
}

function show404() {
  app.innerHTML = `
    <div class="container">
      <h1>404</h1>
      <p>Page not found</p>
      <a href="/">Go home</a>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
router();
```

**File: client/src/styles.css**
```css
/* Reset & Base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header */
header {
  text-align: center;
  margin-bottom: 2rem;
}

header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

header p {
  color: #666;
}

/* Forms */
form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

textarea, input, select {
  width: 100%;
  padding: 0.75rem;
  margin: 0.5rem 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

textarea:focus, input:focus, select:focus {
  outline: none;
  border-color: #333;
}

button {
  background: #000;
  color: white;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
}

button:hover {
  background: #333;
}

/* Options */
.options {
  margin: 1rem 0;
}

.options label {
  display: block;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

/* Result */
.url-box {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.url-box input {
  flex: 1;
  font-family: monospace;
}

.hint {
  color: #666;
  font-size: 0.9rem;
  margin: 1rem 0;
}

/* Note Display */
.note-display {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.note-content {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 4px;
  margin: 1rem 0;
  white-space: pre-wrap;
  font-family: monospace;
}

.warning {
  color: #c00;
  font-size: 0.9rem;
  margin: 1rem 0;
}

/* Errors */
.error {
  text-align: center;
  padding: 2rem;
}

.error h2 {
  margin-bottom: 1rem;
}

.error a {
  color: #000;
  text-decoration: underline;
}

/* Utilities */
.hidden {
  display: none;
}

/* Footer */
footer {
  text-align: center;
  margin-top: 3rem;
  color: #666;
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 600px) {
  .container {
    padding: 1rem;
  }
  
  header h1 {
    font-size: 2rem;
  }
  
  form {
    padding: 1rem;
  }
}
```

#### 3.2 Serve Static Files
**Update: server/index.js**
```javascript
const path = require('path');

// Add after middleware:
app.use(express.static(path.join(__dirname, '../client')));

// Add at end (before start()):
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});
```

### Verification Steps (Phase 3)
```bash
# 1. Start server
npm run dev

# 2. Open browser to http://localhost:3000

# 3. Manual Test Checklist:
# [ ] Homepage loads with form
# [ ] Can type note content
# [ ] Can set password
# [ ] Can select expiration
# [ ] Create button generates URL
# [ ] URL shows 3 memorable words
# [ ] Copy button works
# [ ] Visiting URL shows note
# [ ] Note self-destructs after reading
# [ ] Second visit shows "already read"
# [ ] Password-protected note requires password
# [ ] Wrong password shows error
# [ ] Mobile layout works
```

**Checkpoint:** All manual tests pass → Proceed to Phase 4

---

## Phase 4: Deployment (Final)
**Goal:** Live on Render.com
**Time:** ~1 hour
**Testing:** Live URL verification

### Files to Create

#### 4.1 Render Configuration
**File: render.yaml**
```yaml
services:
  - type: web
    name: memnote
    runtime: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: REDIS_URL
        fromService:
          type: redis
          name: memnote-redis
          property: connectionString
      - key: ENCRYPTION_KEY
        generateValue: true
      - key: BASE_URL
        value: https://memnote.onrender.com

  - type: redis
    name: memnote-redis
    plan: free
    ipAllowList: []
```

**File: RENDER-DEPLOY.md**
```markdown
# Deploy to Render.com

## Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial MemNote commit"
git remote add origin https://github.com/YOUR_USERNAME/memnote.git
git push -u origin main
```

## Step 2: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Blueprint"
4. Connect your GitHub repo
5. Render will read render.yaml and create services

## Step 3: Verify Deployment
1. Wait for build to complete (2-3 minutes)
2. Click on the web service URL
3. Test creating a note
4. Test reading a note

## Step 4: Custom Domain (Optional)
1. In Render dashboard, click web service
2. Go to "Settings" → "Custom Domains"
3. Add your domain
4. Follow DNS instructions
```

#### 4.2 Production Checklist
**File: PRODUCTION-CHECKLIST.md**
```markdown
# Pre-Launch Checklist

## Security
- [ ] ENCRYPTION_KEY is set and strong (32+ chars)
- [ ] Rate limiting is enabled
- [ ] Helmet.js headers are active
- [ ] No sensitive data in logs

## Functionality
- [ ] Create note works
- [ ] Memorable URL generates correctly
- [ ] Note self-destructs after reading
- [ ] Password protection works
- [ ] Expiration times work
- [ ] 404 pages work

## Performance
- [ ] Redis connection is fast
- [ ] API responds < 200ms
- [ ] Static assets are cached

## Monitoring
- [ ] Health check endpoint works
- [ ] Error logging is configured
- [ ] Can check Redis memory usage

## Legal/UX
- [ ] Terms of service (optional)
- [ ] Privacy policy (optional)
- [ ] Warning about self-destructing
```

### Verification Steps (Phase 4)
```bash
# 1. Deploy to Render
# Follow RENDER-DEPLOY.md

# 2. Live Tests (run against production URL)
curl https://memnote.onrender.com/health

# 3. Full Flow Test
# Create note via web UI
# Copy URL
# Open in incognito
# Verify note appears
# Refresh
# Verify "already read" message
```

---

## Codex Workflow Strategy

### Checkpoint System
After EVERY file creation, Codex must:
1. **Verify file was created** (ls -la)
2. **Check syntax** (node --check or eslint)
3. **Report status** (✅ File created and valid)

### Phase Gates
Codex cannot proceed to next phase until:
- All files in current phase are created
- Tests pass (or manual verification done)
- Explicit "go-ahead" from me

### Communication Protocol
Codex must send updates every 30 minutes or after each file:
```
[STATUS UPDATE]
Phase: X of 4
Files Complete: Y of Z
Current File: filename.js
Status: ✅ Created | 🔄 Testing | ❌ Error
Next: [what's next]
Blockers: [if any]
```

### Error Recovery
If Codex gets stuck:
1. Pause and report the error
2. Do not proceed until resolved
3. I will provide guidance or fix

---

## Summary

| Phase | Files | Time | Verification |
|-------|-------|------|--------------|
| 1: Foundation | 8 | 1.5h | `npm test` |
| 2: Core Logic | 6 | 2h | `npm run test:full` |
| 3: Frontend | 4 | 2h | Manual browser tests |
| 4: Deploy | 3 | 1h | Live URL tests |
| **Total** | **21 files** | **~6.5h** | **4 checkpoints** |

---

## Next Steps

**Ready to start?** I'll:
1. Create GitHub repo
2. Spawn Codex with this plan
3. Monitor checkpoints
4. Verify each phase before continuing

**Say "go" and I'll begin.**
