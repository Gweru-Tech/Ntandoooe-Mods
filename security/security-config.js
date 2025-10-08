const crypto = require('crypto');

// Generate secure keys (run once and save these)
const generateSecureKey = () => crypto.randomBytes(64).toString('hex');

module.exports = {
    // JWT Secret (change this to your own secure key)
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-change-this-immediately',
    
    // Encryption key for sensitive data
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key!!',
    
    // Admin credentials (hashed)
    ADMIN_CREDENTIALS: {
        username: 'Ntandoooe',
        // This is the hashed version of 'ntandomods' - change this!
        passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtGtrmu3VG'
    },
    
    // Rate limiting
    RATE_LIMITS: {
        general: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        },
        admin: {
            windowMs: 15 * 60 * 1000,
            max: 10 // stricter limit for admin routes
        },
        contact: {
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 5 // 5 contact form submissions per hour
        }
    },
    
    // Security headers
    SECURITY_HEADERS: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    },
    
    // Anti-cloning protection
    ANTI_CLONE: {
        domainWhitelist: [
            'localhost',
            '127.0.0.1',
            'your-domain.com', // Add your actual domain
            'www.your-domain.com'
        ],
        checkInterval: 5 * 60 * 1000, // Check every 5 minutes
        maxSuspiciousRequests: 50
    },
    
    // File upload security
    UPLOAD_SECURITY: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'audio/mpeg',
            'audio/wav',
            'audio/ogg',
            'video/mp4',
            'video/webm'
        ],
        scanForMalware: true
    },
    
    // Blocked countries (ISO country codes)
    BLOCKED_COUNTRIES: [], // Add country codes like ['CN', 'RU'] if needed
    
    // Suspicious patterns
    SUSPICIOUS_PATTERNS: [
        /\b(union|select|insert|delete|drop|create|alter|exec|script)\b/i,
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload|onerror|onclick/gi
    ]
};
