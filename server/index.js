const express = require('express');
const path = require('path');

const notesRouter = require('./routes/notes');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/notes', notesRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MemNote server running on ${PORT}`);
  });
}

module.exports = app;
