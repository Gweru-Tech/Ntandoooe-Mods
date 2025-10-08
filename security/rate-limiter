const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { RATE_LIMITS } = require('./security-config');
const { logSecurityEvent } = require('./firewall');

// General rate limiter
const generalLimiter = rateLimit({
    windowMs: RATE_LIMITS.general.windowMs,
    max: RATE_LIMITS.general.max,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: async (req, res) => {
        await logSecurityEvent('rate_limit_exceeded', {
            ip: req.ip,
            url: req.originalUrl,
            userAgent: req.get('User-Agent')
        });
        
        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later.',
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
});

// Admin rate limiter (stricter)
const adminLimiter = rateLimit({
    windowMs: RATE_LIMITS.admin.windowMs,
    max: RATE_LIMITS.admin.max,
    message: {
        success: false,
        message: 'Too many admin requests, please try again later.',
        code: 'ADMIN_RATE_LIMIT_EXCEEDED'
    },
    handler: async (req, res) => {
        await logSecurityEvent('admin_rate_limit_exceeded', {
            ip: req.ip,
            url: req.originalUrl,
            userAgent: req.get('User-Agent')
        });
        
        res.status(429).json({
            success: false,
            message: 'Too many admin requests, please try again later.',
            code: 'ADMIN_RATE_LIMIT_EXCEEDED'
        });
    }
});

// Contact form rate limiter
const contactLimiter = rateLimit({
    windowMs: RATE_LIMITS.contact.windowMs,
    max: RATE_LIMITS.contact.max,
    message: {
        success: false,
        message: 'Too many contact form submissions, please try again later.',
        code: 'CONTACT_RATE_LIMIT_EXCEEDED'
    },
    handler: async (req, res) => {
        await logSecurityEvent('contact_rate_limit_exceeded', {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        res.status(429).json({
            success: false,
            message: 'Too many contact form submissions, please try again later.',
            code: 'CONTACT_RATE_LIMIT_EXCEEDED'
        });
    }
});

// Slow down middleware for suspicious activity
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per 15 minutes at full speed
    delayMs: 500, // slow down subsequent requests by 500ms per request
    maxDelayMs: 20000, // maximum delay of 20 seconds
    onLimitReached: async (req, res) => {
        await logSecurityEvent('speed_limit_reached', {
            ip: req.ip,
            url: req.originalUrl
        });
    }
});

module.exports = {
    generalLimiter,
    adminLimiter,
    contactLimiter,
    speedLimiter
};
