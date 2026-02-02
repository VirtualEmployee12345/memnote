const express = require('express');
const { createNote, getNote, checkNote } = require('../services/noteService');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { content, password, expiresIn, notifyEmail } = req.body || {};
    if (typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const { key, words } = await createNote({ content, password, expiresIn, notifyEmail });
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    return res.status(201).json({
      key,
      words,
      url: `${baseUrl}/notes/${key}`,
    });
  } catch (err) {
    console.error('Create note failed', err);
    return res.status(500).json({ error: 'Failed to create note' });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await checkNote(key);
    if (!result.exists) {
      return res.status(404).json({ error: 'Note not found' });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Check note failed', err);
    return res.status(500).json({ error: 'Failed to check note' });
  }
});

router.post('/:key/read', async (req, res) => {
  try {
    const { key } = req.params;
    const { password } = req.body || {};
    const note = await getNote(key, password);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    return res.status(200).json({ content: note.content });
  } catch (err) {
    if (err.code === 'PASSWORD_REQUIRED') {
      return res.status(401).json({ error: 'Password required' });
    }
    if (err.code === 'INVALID_PASSWORD') {
      return res.status(401).json({ error: 'Invalid password' });
    }

    console.error('Read note failed', err);
    return res.status(500).json({ error: 'Failed to read note' });
  }
});

module.exports = router;
