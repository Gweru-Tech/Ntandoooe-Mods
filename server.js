const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 contact form submissions per hour
    message: 'Too many contact form submissions, please try again later.'
});

app.use(limiter);
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Email configuration
const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Validation middleware
const contactValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('service')
        .isIn(['mobile', 'game', 'software', 'security'])
        .withMessage('Please select a valid service'),
    
    body('message')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Message must be between 10 and 1000 characters')
];

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.post('/api/contact', contactLimiter, contactValidation, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { name, email, service, message } = req.body;

        // Service mapping
        const serviceNames = {
            mobile: 'Mobile App Mods',
            game: 'Game Modifications',
            software: 'Software Customization',
            security: 'Security Audits'
        };

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
            subject: `New Contact Form Submission - ${serviceNames[service]}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #00d4ff;">New Contact Form Submission</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Service:</strong> ${serviceNames[service]}</p>
                        <p><strong>Message:</strong></p>
                        <div style="background: white; padding: 15px; border-radius: 3px; margin-top: 10px;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    <p style="margin-top: 20px; color: #666; font-size: 12px;">
                        This email was sent from the Ntando Mods Pro contact form.
                    </p>
                </div>
            `
        };

        // Auto-reply to customer
        const autoReplyOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Thank you for contacting Ntando Mods Pro',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #00d4ff;">Thank You for Your Interest!</h2>
                    <p>Dear ${name},</p>
                    <p>Thank you for reaching out to Ntando Mods Pro regarding our <strong>${serviceNames[service]}</strong> services.</p>
                    <p>We have received your message and will get back to you within 24 hours with a detailed response.</p>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3>Your Message:</h3>
                        <p>${message.replace(/\n/g, '<br>')}</p>
                    </div>
                    <p>Best regards,<br>The Ntando Mods Pro Team</p>
                </div>
            `
        };

        // Send emails
        await transporter.sendMail(mailOptions);
        await transporter.sendMail(autoReplyOptions);

        res.json({
            success: true,
            message: 'Message sent successfully! We\'ll get back to you soon.'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.'
        });
    }
});

// Services API endpoint
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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Ntando Mods Pro server is running on port ${PORT}`);
    console.log(`📱 Local: http://localhost:${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📧 Email configured: ${process.env.EMAIL_USER ? '✅' : '❌'}`);
    console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
