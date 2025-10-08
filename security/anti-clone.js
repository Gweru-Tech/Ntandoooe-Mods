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
    
    // Check if domain is whitelisted (now for monitoring only)
    isDomainWhitelisted(host) {
        if (!host) return false;
        
        // Remove port if present
        const domain = host.split(':')[0];
        
        return ANTI_CLONE.domainWhitelist.some(whitelist => {
            return domain === whitelist || domain.endsWith('.' + whitelist);
        });
    }
    
    // Monitor access patterns (no blocking)
    async monitorAccess(req) {
        const host = req.get('host');
        const referer = req.get('referer');
        const userAgent = req.get('user-agent') || '';
        const ip = req.ip;
        
        // Log access from non-whitelisted domains (monitoring only)
        if (!this.isDomainWhitelisted(host)) {
            await logSecurityEvent('external_domain_access', {
                host,
                ip,
                userAgent,
                referer,
                url: req.originalUrl,
                severity: 'info' // Changed to info level
            });
        }
        
        // Log suspicious referers (monitoring only)
        if (referer && !this.isDomainWhitelisted(new URL(referer).hostname)) {
            await logSecurityEvent('external_referer', {
                host,
                referer,
                ip,
                userAgent,
                severity: 'info' // Changed to info level
            });
        }
        
        // Track request patterns for analytics
        this.trackRequestPattern(ip, req.originalUrl);
        
        // Log potential scraping (monitoring only)
        if (this.isScraping(ip, userAgent)) {
            await logSecurityEvent('potential_scraping', {
                ip,
                userAgent,
                host,
                severity: 'warning' // Just a warning, no blocking
            });
        }
        
        // Always allow access
        return { 
            isClone: false, 
            action: 'allow',
            monitored: true 
        };
    }
    
    // Track request patterns for analytics
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
    
    // Check if IP shows scraping patterns (for monitoring only)
    isScraping(ip, userAgent) {
        const requests = this.requestPatterns.get(ip) || [];
        const recentRequests = requests.filter(r => 
            Date.now() - r.timestamp < 60000 // Last minute
        );
        
        // High request rate (monitoring threshold)
        if (recentRequests.length > 50) { // Increased threshold
            return true;
        }
        
        // Suspicious user agents (for monitoring)
        const suspiciousAgents = [
            'wget', 'curl', 'scrapy', 'spider',
            'python-requests', 'go-http'
        ];
        
        const lowerUA = userAgent.toLowerCase();
        return suspiciousAgents.some(agent => lowerUA.includes(agent));
    }
    
    // Generate minimal client-side protection (non-intrusive)
    generateClientProtection() {
        const checks = [
            // Friendly console message
            `console.log('%cWelcome!', 'color: blue; font-size: 20px; font-weight: bold;');
            console.log('%cThis site is publicly accessible. Please respect our terms of service.', 'color: blue; font-size: 14px;');`,
            
            // Optional: Add site branding
            `console.log('%cPowered by YourSite', 'color: gray; font-size: 12px;');`
        ];
        
        return checks.join('\n');
    }
    
    // Start monitoring (no blocking actions)
    startMonitoring() {
        setInterval(() => {
            this.cleanupOldPatterns();
            this.generateAccessReport();
        }, ANTI_CLONE.checkInterval);
    }
    
    // Generate access analytics report
    generateAccessReport() {
        const totalIPs = this.requestPatterns.size;
        const activeIPs = Array.from(this.requestPatterns.entries())
            .filter(([ip, requests]) => {
                const recentRequests = requests.filter(r => 
                    Date.now() - r.timestamp < 300000 // Last 5 minutes
                );
                return recentRequests.length > 0;
            }).length;
        
        console.log(`Access Report - Total IPs: ${totalIPs}, Active IPs: ${activeIPs}`);
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
    
    // Middleware for monitoring (no blocking)
    protectionMiddleware() {
        return async (req, res, next) => {
            try {
                // Monitor access patterns
                const result = await this.monitorAccess(req);
                
                // Add security headers (good practice)
                res.setHeader('X-Content-Type-Options', 'nosniff');
                res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
                
                // Optional: Add custom header to identify legitimate responses
                res.setHeader('X-Site-Access', 'allowed');
                
                // Always continue to next middleware
                next();
            } catch (error) {
                console.error('Access monitoring error:', error);
                // Continue even if monitoring fails
                next();
            }
        };
    }
    
    // Get access statistics (useful for analytics)
    getAccessStats() {
        const now = Date.now();
        const stats = {
            totalIPs: this.requestPatterns.size,
            last24h: 0,
            lastHour: 0,
            topIPs: []
        };
        
        const ipCounts = new Map();
        
        for (const [ip, requests] of this.requestPatterns.entries()) {
            const last24h = requests.filter(r => now - r.timestamp < 86400000);
            const lastHour = requests.filter(r => now - r.timestamp < 3600000);
            
            if (last24h.length > 0) stats.last24h++;
            if (lastHour.length > 0) stats.lastHour++;
            
            ipCounts.set(ip, requests.length);
        }
        
        // Get top 10 most active IPs
        stats.topIPs = Array.from(ipCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([ip, count]) => ({ ip, requests: count }));
        
        return stats;
    }
}

module.exports = new AntiCloneProtection();
