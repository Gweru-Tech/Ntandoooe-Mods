const express = require('express');
const router = express.Router();
const { getSiteData, updateSiteData, addService, deleteService } = require('./data');

// Admin credentials
const ADMIN_USERNAME = 'Ntandoooe';
const ADMIN_PASSWORD = 'ntandomods';

// Login endpoint
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        res.json({
            success: true,
            message: 'Login successful',
            token: 'admin-token-' + Date.now() // Simple token for demo
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

// Get site data
router.get('/site-data', (req, res) => {
    res.json({
        success: true,
        data: getSiteData()
    });
});

// Update site settings
router.post('/site-settings', (req, res) => {
    try {
        const updatedData = updateSiteData(req.body);
        res.json({
            success: true,
            message: 'Site settings updated',
            data: updatedData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating site settings'
        });
    }
});

// Add service
router.post('/add-service', (req, res) => {
    try {
        const newService = addService(req.body);
        res.json({
            success: true,
            message: 'Service added successfully',
            service: newService
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding service'
        });
    }
});

// Delete service
router.delete('/service/:id', (req, res) => {
    try {
        deleteService(req.params.id);
        res.json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting service'
        });
    }
});

// Update audio settings
router.post('/audio-settings', (req, res) => {
    try {
        const { url, autoplay } = req.body;
        const updatedData = updateSiteData({
            audio: { url, autoplay }
        });
        res.json({
            success: true,
            message: 'Audio settings updated',
            data: updatedData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating audio settings'
        });
    }
});

module.exports = router;
