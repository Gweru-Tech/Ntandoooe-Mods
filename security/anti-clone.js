const crypto = require('crypto');
const { ANTI_CLONE } = require('./security-config');
const { logSecurityEvent } = require('./firewall');

class AntiCloneProtection {
    constructor() {
        this.domainFingerprint = this.generateDomainFingerprint();
        this.requestPatterns = new Map();
        this.startMonitoring();
    }
    
    // Generate unique fingerprint for legitimate domain
    generateDomainFingerprint() {
        const data = ANTI_CLONE.domainWhitelist.join('') + Date.now();
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    
    // Check if domain is whitelisted
    isDomainWhitelisted(host) {
        if (!host) return false;
        
        // Remove port if present
        const domain = host.split(':')[0];
        
        return ANTI_CLONE.domainWhitelist.some(whitelist => {
            return domain === whitelist || domain.endsWith('.' + whitelist);
        });
    }
    
    // Detect cloning attempts
    async detectCloning(req) {
        const host = req.get('host');
        const referer = req.get('referer');
        const userAgent = req.get('user-agent') || '';
        const ip = req.ip;
        
        // Check if accessing from non-whitelisted domain
        if (!this.isDomainWhitelisted(host)) {
            await logSecurityEvent('unauthorized_domain_access', {
                host,
                ip,
                userAgent,
                referer,
                url: req.originalUrl
            });
            
            return {
                isClone: true,
                reason: 'unauthorized_domain',
                action: 'block'
            };
        }
        
        // Check for suspicious referers
        if (referer && !this.isDomainWhitelisted(new URL(referer).hostname)) {
            await logSecurityEvent('suspicious_referer', {
                host,
                referer,
                ip,
                userAgent
            });
        }
        
        // Track request patterns
        this.trackRequestPattern(ip, req.originalUrl);
        
        // Check for scraping patterns
        if (this.isScraping(ip, userAgent)) {
            await logSecurityEvent('scraping_detected', {
                ip,
                userAgent,
                host
            });
            
            return {
                isClone: true,
                reason: 'scraping_detected',
                action: 'block'
            };
        }
        
        return { isClone: false };
    }
    
    // Track request patterns to detect scraping
    trackRequestPattern(ip, url) {
        const key = `${ip}:${Date.now()}`;
        const current = this.requestPatterns.get(ip) || [];
        
        current.push({
            url,
            timestamp: Date.now()
        });
        
        // Keep only last 100 requests per IP
        if (current.length > 100) {
            current.splice(0, current.length - 100);
        }
        
        this.requestPatterns.set(ip, current);
    }
    
    // Check if IP is scraping
    isScraping(ip, userAgent) {
        const requests = this.requestPatterns.get(ip) || [];
        const recentRequests = requests.filter(r => 
            Date.now() - r.timestamp < 60000 // Last minute
        );
        
        // Too many requests in short time
        if (recentRequests.length > 30) {
            return true;
        }
        
        // Suspicious user agents
        const suspiciousAgents = [
            'wget', 'curl', 'scrapy', 'bot', 'crawler', 'spider',
            'python', 'java', 'go-http', 'node-fetch'
        ];
        
        const lowerUA = userAgent.toLowerCase();
        return suspiciousAgents.some(agent => lowerUA.includes(agent));
    }
    
    // Generate obfuscated JavaScript for client-side protection
    generateClientProtection() {
        const checks = [
            // Domain check
            `if(location.hostname !== '${ANTI_CLONE.domainWhitelist[0]}' && location.hostname !== 'localhost') {
                document.body.innerHTML = '<h1>Unauthorized Access</h1>';
                return;
            }`,
            
            // Console warning
            `console.warn('%cSTOP!', 'color: red; font-size: 50px; font-weight: bold;');
            console.warn('%cThis is a browser feature intended for developers. Unauthorized access or cloning is prohibited.', 'color: red; font-size: 16px;');`,
            
            // Disable right-click and dev tools (basic protection)
            `document.addEventListener('contextmenu', e => e.preventDefault());
            document.addEventListener('keydown', e => {
                if(e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                    e.preventDefault();
                }
            });`
        ];
        
        return checks.join('\n');
    }
    
    // Start monitoring for cloning attempts
    startMonitoring() {
        setInterval(() => {
            this.cleanupOldPatterns();
        }, ANTI_CLONE.checkInterval);
    }
    
    // Cleanup old request patterns
    cleanupOldPatterns() {
        const cutoff = Date.now() - (60 * 60 * 1000); // 1 hour ago
        
        for (const [ip, requests] of this.requestPatterns.entries()) {
            const filtered = requests.filter(r => r.timestamp > cutoff);
            
            if (filtered.length === 0) {
                this.requestPatterns.delete(ip);
            } else {
                this.requestPatterns.set(ip, filtered);
            }
        }
    }
    
    // Middleware for anti-clone protection
    protectionMiddleware() {
        return async (req, res, next) => {
            try {
                const result = await this.detectCloning(req);
                
                if (result.isClone && result.action === 'block') {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied',
                        code: 'CLONE_PROTECTION'
                    });
                }
                
                // Add protection headers
                res.setHeader('X-Frame-Options', 'DENY');
                res.setHeader('X-Content-Type-Options', 'nosniff');
                res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
                
                next();
            } catch (error) {
                console.error('Anti-clone protection error:', error);
                next();
            }
        };
    }
}

module.exports = new AntiCloneProtection();
