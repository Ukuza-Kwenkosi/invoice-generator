const express = require('express');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');

const app = express();
const port = 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Serve the index.ejs as HTML
app.get('/', (req, res) => {
  const template = fs.readFileSync(path.join(__dirname, 'index.ejs'), 'utf8');
  const html = ejs.render(template, {});
  res.send(html);
});

// Data endpoint for the dropdown items
app.get('/data.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'data.json'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Try to find an available port if 3000 is in use
app.listen(port, () => {
  console.log(`Local development server running at http://localhost:${port}`);
  console.log('Press Ctrl+C to stop');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${port} is already in use, trying port ${port + 1}`);
    app.listen(port + 1, () => {
      console.log(`Local development server running at http://localhost:${port + 1}`);
      console.log('Press Ctrl+C to stop');
    });
  } else {
    console.error('Error starting server:', err);
  }
}); 