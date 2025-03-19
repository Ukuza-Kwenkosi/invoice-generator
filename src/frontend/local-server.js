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
  // Sample data
  const data = [
    { name: "Pine Board 20mm", price: 250.00 },
    { name: "Oak Panel 12mm", price: 475.00 },
    { name: "Meranti Timber 16mm", price: 320.00 },
    { name: "Birch Plywood 18mm", price: 410.00 }
  ];
  
  res.json(data);
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