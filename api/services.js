const express = require('express');
const router = express.Router();
const { getSiteData } = require('./data');

// Get all services
router.get('/', (req, res) => {
    const siteData = getSiteData();
    res.json({
        success: true,
        services: siteData.services
    });
});

// Get service by ID
router.get('/:id', (req, res) => {
    const siteData = getSiteData();
    const service = siteData.services.find(s => s.id === parseInt(req.params.id));
    
    if (service) {
        res.json({
            success: true,
            service: service
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Service not found'
        });
    }
});

module.exports = router;
