const express = require('express');
const router = express.Router();
const { 
    getSiteData, 
    updateSiteData, 
    addService, 
    updateService,
    deleteService, 
    getContacts,
    updateContactStatus,
    getAnalytics,
    logAnalytics
} = require('./data');

// Admin credentials
const ADMIN_USERNAME = 'Ntandoooe';
const ADMIN_PASSWORD = 'ntandomods';

// Login endpoint
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Log login
        await logAnalytics('admin_login', { 
            username, 
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        res.json({
            success: true,
            message: 'Login successful',
            token: 'admin-token-' + Date.now()
        });
    } else {
        await logAnalytics('admin_login_failed', { 
            username, 
            ip: req.ip 
        });
        
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

// Get site data
router.get('/site-data', async (req, res) => {
    try {
        const data = await getSiteData();
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error loading site data'
        });
    }
});

// Update site settings
router.post('/site-settings', async (req, res) => {
    try {
        const updatedData = await updateSiteData(req.body);
        await logAnalytics('site_settings_updated', { 
            changes: Object.keys(req.body),
            ip: req.ip 
        });
        
        res.json({
            success: true,
            message: 'Site settings updated successfully',
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
router.post('/add-service', async (req, res) => {
    try {
        const newService = await addService(req.body);
        await logAnalytics('service_added', { 
            serviceId: newService.id,
            serviceName: newService.name,
            ip: req.ip 
        });
        
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

// Update service
router.put('/service/:id', async (req, res) => {
    try {
        const updatedService = await updateService(req.params.id, req.body);
        if (updatedService) {
            await logAnalytics('service_updated', { 
                serviceId: req.params.id,
                ip: req.ip 
            });
            
            res.json({
                success: true,
                message: 'Service updated successfully',
                service: updatedService
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating service'
        });
    }
});

// Delete service
router.delete('/service/:id', async (req, res) => {
    try {
        await deleteService(req.params.id);
        await logAnalytics('service_deleted', { 
            serviceId: req.params.id,
            ip: req.ip 
        });
        
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

// Get contacts
router.get('/contacts', async (req, res) => {
    try {
        const contacts = await getContacts();
        res.json({
            success: true,
            contacts: contacts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error loading contacts'
        });
    }
});

// Update contact status
router.put('/contact/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedContact = await updateContactStatus(req.params.id, status);
        
        if (updatedContact) {
            res.json({
                success: true,
                message: 'Contact status updated',
                contact: updatedContact
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating contact status'
        });
    }
});

// Get analytics
router.get('/analytics', async (req, res) => {
    try {
        const analytics = await getAnalytics();
        
        // Process analytics data
        const stats = {
            totalVisits: analytics.filter(a => a.event === 'page_view').length,
            totalContacts: analytics.filter(a => a.event === 'contact_form_submit').length,
            adminLogins: analytics.filter(a => a.event === 'admin_login').length,
            recentActivity: analytics.slice(-50).reverse()
        };
        
        res.json({
            success: true,
            analytics: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error loading analytics'
        });
    }
});

// Backup data
router.get('/backup', async (req, res) => {
    try {
        const siteData = await getSiteData();
        const contacts = await getContacts();
        const analytics = await getAnalytics();
        
        const backup = {
            siteData,
            contacts,
            analytics,
            timestamp: new Date().toISOString()
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=backup-${Date.now()}.json`);
        res.json(backup);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating backup'
        });
    }
});

// Restore data
router.post('/restore', async (req, res) => {
    try {
        const { siteData } = req.body;
        
        if (siteData) {
            await updateSiteData(siteData);
            await logAnalytics('data_restored', { ip: req.ip });
            
            res.json({
                success: true,
                message: 'Data restored successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid backup data'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error restoring data'
        });
    }
});

module.exports = router;
