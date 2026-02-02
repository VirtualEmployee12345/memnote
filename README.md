# NoteTransfer

NoteTransfer is a secure, self-destructing note sharing service. Create notes with memorable URLs that automatically delete after being read or when they expire.

## Features
- Express server with a health check endpoint
- Placeholder routes for creating and fetching notes
- Redis client configuration
- Wordlist utility for future content generation
- API tests for core endpoints

## Quick Start
1. Install dependencies: `npm install`
2. Run tests: `npm test`

## Project Structure
- `server/index.js` - Express app entry point
- `server/config/redis.js` - Redis connection helper
- `server/utils/wordlist.js` - Word lists (adjectives, nouns, animals)
- `server/tests/api.test.js` - API tests
