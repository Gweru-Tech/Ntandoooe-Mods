const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic security
app.use(helmet({
    contentSecurityPolicy: false, // Disable for easier deployment
    crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Simple contact API (without email for now)
app.post('/api/contact', (req, res) => {
    const { name, email, service, message } = req.body;
    
    // Log the contact form data (you can see this in Render logs)
    console.log('Contact Form Submission:', {
        name,
        email,
        service,
        message,
        timestamp: new Date().toISOString()
    });
    
    res.json({
        success: true,
        message: 'Message received! We will get back to you soon.'
    });
});

// Services API
app.get('/api/services', (req, res) => {
    const services = [
        {
            id: 'mobile',
            name: 'Mobile App Mods',
            description: 'Custom modifications for Android and iOS applications',
            features: ['UI/UX Enhancements', 'Feature Additions', 'Performance Optimization'],
            price: 'Starting from $299'
        },
        {
            id: 'game',
            name: 'Game Modifications',
            description: 'Professional game modding services',
            features: ['Custom Maps & Levels', 'Character Modifications', 'Gameplay Enhancements'],
            price: 'Starting from $199'
        },
        {
            id: 'software',
            name: 'Software Customization',
            description: 'Tailored software solutions and modifications',
            features: ['Interface Customization', 'Plugin Development', 'Integration Solutions'],
            price: 'Starting from $399'
        },
        {
            id: 'security',
            name: 'Security Audits',
            description: 'Comprehensive security analysis and vulnerability assessments',
            features: ['Code Review', 'Penetration Testing', 'Security Recommendations'],
            price: 'Starting from $499'
        }
    ];

    res.json({ success: true, services });
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
