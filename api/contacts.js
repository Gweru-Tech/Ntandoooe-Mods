const express = require('express');
const router = express.Router();

// Handle contact form submissions
router.post('/', (req, res) => {
    const { name, email, service, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: 'Please fill in all required fields'
        });
    }
    
    // Log the contact form data
    console.log('Contact Form Submission:', {
        name,
        email,
        service,
        message,
        timestamp: new Date().toISOString()
    });
    
    // In a real application, you would:
    // 1. Save to database
    // 2. Send email notification
    // 3. Send confirmation email to user
    
    res.json({
        success: true,
        message: 'Message received! We will get back to you soon.'
    });
});

module.exports = router;
