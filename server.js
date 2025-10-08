const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Import API routes
const adminRoutes = require('./api/admin');
const servicesRoutes = require('./api/services');
const contactRoutes = require('./api/contact');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic security
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/admin', adminRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/contact', contactRoutes);

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
