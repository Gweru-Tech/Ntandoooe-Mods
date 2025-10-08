const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs-extra');
const cron = require('node-cron');

// Import security modules
const { firewallManager } = require('./security/firewall');
const { generalLimiter, speedLimiter } = require('./security/rate-limiter');
const antiClone = require('./security/anti-clone');
const { SECURITY_HEADERS } = require('./security/security-config');

// Import API routes
const adminRoutes = require('./api/admin');
const servicesRoutes = require('./api/services');
const contactRoutes = require('./api/contact');
const uploadRoutes = require('./api/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure required directories exist
const ensureDirectories = async () => {
    await fs.ensureDir('./data');
    await fs.ensureDir('./uploads');
    await fs.ensureDir('./public');
    await fs.ensureDir('./security');
};

// Initialize directories
ensureDirectories().catch(console.error);

// Security middleware (apply first)
app.use(helmet({
    contentSecurityPolicy: SECURITY_HEADERS.contentSecurityPolicy,
    hsts: SECURITY_HEADERS.hsts,
    crossOriginEmbedderPolicy: false
}));

// Apply firewall protection
app.use(firewallManager.firewallMiddleware());

// Apply anti-clone protection
app.use(antiClone.protectionMiddleware());

// Apply rate limiting
app.use(generalLimiter);
app.use(speedLimiter);

// CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin is whitelisted
        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://infoatntando-modspro-zw.onrender.com/',
            'https://ntandoofczw.zone.id/'
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            firewallManager.logSecurityEvent('cors_violation', {
                origin,
                timestamp: new Date().toISOString()
            });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware with size limits
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        // Store raw body for signature verification if needed
        req.rawBody = buf;
    }
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// Security headers middleware
app.use((req, res, next) => {
    // Additional security headers
    res.setHeader('X-Powered-By', 'Ntando-Mods-Pro');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Custom security header with site fingerprint
    res.setHeader('X-Site-Verification', 'ntando-mods-pro-verified');
    
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    
    // Log request
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    
    // Log response time
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
        
        // Log to analytics if needed
        if (req.originalUrl.startsWith('/api/')) {
            firewallManager.logSecurityEvent('api_request', {
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                duration,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
        }
    });
    
    next();
});

// Serve static files with security
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Security headers for static files
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Serve uploads with additional security
app.use('/uploads', (req, res, next) => {
    // Additional checks for uploaded files
    const filename = req.params[0] || req.url.substring(1);
    const filePath = path.join(__dirname, 'uploads', filename);
    
    // Check if file exists and is safe
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
            // Set appropriate headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Content-Disposition', 'inline');
            next();
        } else {
            res.status(404).send('File not found');
        }
    } else {
        res.status(404).send('File not found');
    }
}, express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    etag: true
}));

// API routes with additional security
app.use('/api/admin', require('./security/rate-limiter').adminLimiter, adminRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/contact', require('./security/rate-limiter').contactLimiter, contactRoutes);
app.use('/api/upload', require('./security/rate-limiter').adminLimiter, uploadRoutes);

// Security endpoints
app.get('/api/security/status', async (req, res) => {
    try {
        const stats = await firewallManager.getSecurityStats();
        res.json({
            success: true,
            security: {
                status: 'active',
                ...stats,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving security status'
        });
    }
});

// Client-side protection script
app.get('/security.js', (req, res) => {
    const protectionScript = antiClone.generateClientProtection();
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(`
        // Ntando Mods Pro - Security Protection
        (function() {
            'use strict';
            
            ${protectionScript}
            
            // Additional client-side protection
            let devToolsOpen = false;
            const threshold = 160;
            
            setInterval(() => {
                if (window.outerHeight - window.innerHeight > threshold || 
                    window.outerWidth - window.innerWidth > threshold) {
                    if (!devToolsOpen) {
                        devToolsOpen = true;
                        console.clear();
                        console.warn('%cDeveloper tools detected!', 'color: red; font-size: 20px;');
                    }
                } else {
                    devToolsOpen = false;
                }
            }, 500);
            
            // Disable text selection on sensitive elements
            document.addEventListener('selectstart', function(e) {
                if (e.target.classList.contains('no-select')) {
                    e.preventDefault();
                }
            });
            
            // Watermark protection
            const watermark = document.createElement('div');
            watermark.innerHTML = 'Ntando Mods Pro - Licensed Content';
            watermark.style.cssText = \`
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 48px;
                color: rgba(0, 0, 0, 0.05);
                pointer-events: none;
                z-index: 9999;
                user-select: none;
                font-family: Arial, sans-serif;
            \`;
            document.body.appendChild(watermark);
            
        })();
    `);
});

// Main route with protection
app.get('/', (req, res) => {
    // Inject security script into HTML
    let html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
    
    // Add security script
    html = html.replace('</head>', `
        <script src="/security.js"></script>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="referrer" content="strict-origin-when-cross-origin">
        </head>
    `);
    
    // Add nonce for inline scripts if needed
    const nonce = require('crypto').randomBytes(16).toString('base64');
    res.setHeader('Content-Security-Policy', 
        `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline';`
    );
    
    res.send(html);
});

// Health check with security info
app.get('/health', async (req, res) => {
    try {
        const securityStats = await firewallManager.getSecurityStats();
        res.json({
            success: true,
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            security: {
                firewall: 'active',
                blockedIPs: securityStats.blockedIPs,
                lastSecurityCheck: new Date().toISOString()
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '1.0.0'
        });
    } catch (error) {
        res.json({
            success: true,
            message: 'Server is running',
            timestamp: new Date().toISOString()
        });
    }
});

// Robots.txt for SEO protection
app.get('/robots.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(`
User-agent: *
Disallow: /api/
Disallow: /uploads/
Disallow: /admin/
Disallow: /security.js
Allow: /

Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml
    `.trim());
});

// Security.txt for responsible disclosure
app.get('/.well-known/security.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(`
Contact: security@your-domain.com
Expires: 2025-12-31T23:59:59.000Z
Preferred-Languages: en
Policy: ${req.protocol}://${req.get('host')}/security-policy
    `.trim());
});

// Handle 404 errors
app.use((req, res) => {
    // Log 404 attempts
    firewallManager.logSecurityEvent('404_attempt', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer')
    });
    
    res.status(404).json({
        success: false,
        message: 'Page not found',
        code: 'NOT_FOUND'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    // Log error
    console.error('Server Error:', error);
    
    // Log security-related errors
    firewallManager.logSecurityEvent('server_error', {
        error: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });
    
    // Don't expose error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(isDevelopment && { error: error.message, stack: error.stack })
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

// Security monitoring cron jobs
cron.schedule('0 */6 * * *', async () => {
    // Clean up old security logs every 6 hours
    console.log('Running security cleanup...');
    try {
        const stats = await firewallManager.getSecurityStats();
        console.log(`Security stats: ${stats.totalEvents} total events, ${stats.blockedIPs} blocked IPs`);
    } catch (error) {
        console.error('Security cleanup error:', error);
    }
});

cron.schedule('0 0 * * *', async () => {
    // Daily security report
    console.log('Generating daily security report...');
    try {
        const stats = await firewallManager.getSecurityStats();
        console.log('Daily Security Report:', {
            date: new Date().toISOString().split('T')[0],
            eventsLast24h: stats.last24h,
            totalBlockedIPs: stats.blockedIPs,
            highSeverityEvents: stats.highSeverityEvents
        });
    } catch (error) {
        console.error('Security report error:', error);
    }
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Ntando Mods Pro Server running on port ${PORT}`);
    console.log(`🔒 Security features: ACTIVE`);
    console.log(`🛡️  Firewall: ENABLED`);
    console.log(`⚡ Rate limiting: ENABLED`);
    console.log(`🚫 Anti-clone protection: ENABLED`);
    console.log(`📊 Admin Panel: http://localhost:${PORT}/#admin`);
    console.log(`🔍 Security Status: http://localhost:${PORT}/api/security/status`);
    
    // Log server start
    firewallManager.logSecurityEvent('server_started', {
        port: PORT,
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform
    });
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
    firewallManager.logSecurityEvent('server_error', {
        error: error.message,
        code: error.code
    });
});

module.exports = app;

