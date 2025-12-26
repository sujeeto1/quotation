const express = require('express');
const path = require('path');
const app = express();

// Use the port provided by cPanel/Passenger or 3000 for local testing
const PORT = process.env.PORT || 3000;

// Explicitly handle .tsx and .ts files for browsers to recognize them as JS modules
// This is critical for shared hosting where default MIME types might be incorrect
app.use((req, res, next) => {
  if (req.url.endsWith('.tsx') || req.url.endsWith('.ts')) {
    res.type('application/javascript');
  }
  next();
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Handle Single Page Application (SPA) routing
// This redirects all requests to index.html so the frontend can handle the internal route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});