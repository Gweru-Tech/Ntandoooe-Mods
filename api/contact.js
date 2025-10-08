const express = require('express');
const router = express.Router();
const { saveContact, logAnalytics } = require('./data');

// Handle contact form submissions
router.post('/', async (req, res) => {
    const { name, email, service, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: 'Please fill in all required fields'
        });
    }
    
    try {
        // Save contact to file
        const contact = await saveContact({
            name,
            email,
            service,
            message,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        // Log analytics
        await logAnalytics('contact_form_submit', {
            contactId: contact.id,
            service,
            ip: req.ip
        });
        
        console.log('New Contact Form Submission:', contact);
        
        res.json({
            success: true,
            message: 'Message received! We will get back to you soon.',
            contactId: contact.id
        });
    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving your message. Please try again.'
        });
    }
});

module.exports = router;
