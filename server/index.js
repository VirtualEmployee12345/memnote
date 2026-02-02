const express = require('express');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Placeholder routes
app.post('/notes', (req, res) => {
  res.status(201).json({ id: 'placeholder-id', ...req.body });
});

app.get('/notes/:id', (req, res) => {
  res.json({ id: req.params.id, content: 'placeholder content' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MemNote server running on ${PORT}`);
  });
}

module.exports = app;
