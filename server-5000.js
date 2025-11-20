const express = require('express');
const app = express();
const port = 5000;

// Middleware to parse JSON
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend service is running!',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'backend'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    api: 'available',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Simple users endpoint
app.get('/users', (req, res) => {
  res.json([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ]);
});

app.listen(port, () => {
  console.log(`Backend service running at http://localhost:${port}`);
});