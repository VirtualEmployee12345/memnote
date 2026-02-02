const express = require('express');

const notesRouter = require('./routes/notes');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/notes', notesRouter);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MemNote server running on ${PORT}`);
  });
}

module.exports = app;
