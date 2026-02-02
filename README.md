# MemNote

MemNote is a lightweight note service with a simple HTTP API. It’s designed as a minimal backend you can extend with Redis-backed storage and a wordlist utility for generating short memos or prompts.

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
- `server/index.js` — Express app entry point
- `server/config/redis.js` — Redis connection helper
- `server/utils/wordlist.js` — Word lists (adjectives, nouns, animals)
- `server/tests/api.test.js` — API tests
