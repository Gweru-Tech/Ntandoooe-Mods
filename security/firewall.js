const fs = require('fs-extra');
const path = require('path');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const { BLOCKED_COUNTRIES, SUSPICIOUS_PATTERNS } = require('./security-config');

const SECURITY_LOGS_FILE = path.join(__dirname, '../data/security-logs.json');
const BLOCKED_IPS_FILE = path.join(__dirname, '../data/blocked-ips.json');

class FirewallManager {
    constructor() {
        this.blockedIPs = new Set();
        this.suspiciousActivity = new Map();
        this.loadBlockedIPs();
    }
    
    // Load blocked IPs from file
    async loadBlockedIPs() {
        try {
            const blocked = await fs.readJson(BLOCKED_IPS_FILE);
            blocked.forEach(ip => this.blockedIPs.add(ip));
        } catch (error) {
            await fs.writeJson(BLOCKED_IPS_FILE, []);
        }
    }
    
    // Save blocked IPs to file
    async saveBlockedIPs() {
        await fs.writeJson(BLOCKED_IPS_FILE, Array.from(this.blockedIPs));
    }
    
    // Log security events
    async logSecurityEvent(event, data) {
        try {
            const logs = await fs.readJson(SECURITY_LOGS_FILE).catch(() => []);
            
            logs.push({
                event,
                data,
                timestamp: new Date().toISOString(),
                severity: this.getEventSeverity(event)
            });
            
            // Keep only last 1000 logs
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }
            
            await fs.writeJson(SECURITY_LOGS_FILE, logs, { spaces: 2 });
        } catch (error) {
            console.error('Failed to log security event:', error);
        }
    }
    
    // Get event severity
    getEventSeverity(event) {
        const highSeverity = ['sql_injection', 'xss_attempt', 'malware_detected', 'brute_force'];
        const mediumSeverity = ['suspicious_request', 'blocked_country', 'rate_limit_exceeded'];
        
        if (highSeverity.includes(event)) return 'high';
        if (mediumSeverity.includes(event)) return 'medium';
        return 'low';
    }
    
    // Check if IP is blocked
    isIPBlocked(ip) {
        return this.blockedIPs.has(ip);
    }
    
    // Block IP address
    async blockIP(ip, reason) {
        this.blockedIPs.add(ip);
        await this.saveBlockedIPs();
        await this.logSecurityEvent('ip_blocked', { ip, reason });
    }
    
    // Unblock IP address
    async unblockIP(ip) {
        this.blockedIPs.delete(ip);
        await this.saveBlockedIPs();
        await this.logSecurityEvent('ip_unblocked', { ip });
    }
    
    // Check for suspicious patterns
    checkSuspiciousPatterns(input) {
        for (const pattern of SUSPICIOUS_PATTERNS) {
            if (pattern.test(input)) {
                return true;
            }
        }
        return false;
    }
    
    // Analyze request for threats
    async analyzeRequest(req) {
        const ip = req.ip;
        const userAgent = req.get('User-Agent') || '';
        const url = req.originalUrl;
        const method = req.method;
        
        // Check if IP is blocked
        if (this.isIPBlocked(ip)) {
            await this.logSecurityEvent('blocked_ip_attempt', { ip, url, method });
            return { blocked: true, reason: 'IP blocked' };
        }
        
        // Check geographic location
        const geo = geoip.lookup(ip);
        if (geo && BLOCKED_COUNTRIES.includes(geo.country)) {
            await this.blockIP(ip, 'blocked_country');
            await this.logSecurityEvent('blocked_country', { ip, country: geo.country });
            return { blocked: true, reason: 'Country blocked' };
        }
        
        // Check user agent
        const ua = UAParser(userAgent);
        if (this.isSuspiciousUserAgent(userAgent, ua)) {
            await this.logSecurityEvent('suspicious_user_agent', { ip, userAgent });
            this.trackSuspiciousActivity(ip);
        }
        
        // Check for suspicious patterns in URL and body
        const requestData = JSON.stringify(req.body) + url + JSON.stringify(req.query);
        if (this.checkSuspiciousPatterns(requestData)) {
            await this.logSecurityEvent('suspicious_request', { ip, url, method });
            await this.blockIP(ip, 'suspicious_patterns');
            return { blocked: true, reason: 'Suspicious patterns detected' };
        }
        
        return { blocked: false };
    }
    
    // Check if user agent is suspicious
    isSuspiciousUserAgent(userAgent, parsed) {
        const suspiciousAgents = [
            'sqlmap', 'nikto', 'nmap', 'masscan', 'zap', 'burp',
            'wget', 'curl', 'python-requests', 'go-http-client'
        ];
        
        const lowerUA = userAgent.toLowerCase();
        return suspiciousAgents.some(agent => lowerUA.includes(agent));
    }
    
    // Track suspicious activity
    trackSuspiciousActivity(ip) {
        const current = this.suspiciousActivity.get(ip) || 0;
        this.suspiciousActivity.set(ip, current + 1);
        
        if (current + 1 >= 5) {
            this.blockIP(ip, 'multiple_suspicious_activities');
        }
    }
    
    // Middleware for firewall protection
    firewallMiddleware() {
        return async (req, res, next) => {
            try {
                const analysis = await this.analyzeRequest(req);
                
                if (analysis.blocked) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied',
                        code: 'FIREWALL_BLOCKED'
                    });
                }
                
                next();
            } catch (error) {
                console.error('Firewall error:', error);
                next(); // Continue on firewall error to avoid breaking the site
            }
        };
    }
    
    // Get security statistics
    async getSecurityStats() {
        try {
            const logs = await fs.readJson(SECURITY_LOGS_FILE).catch(() => []);
            const last24h = logs.filter(log => 
                new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            );
            
            return {
                totalEvents: logs.length,
                last24h: last24h.length,
                blockedIPs: this.blockedIPs.size,
                highSeverityEvents: logs.filter(log => log.severity === 'high').length,
                recentEvents: logs.slice(-20).reverse()
            };
        } catch (error) {
            return {
                totalEvents: 0,
                last24h: 0,
                blockedIPs: 0,
                highSeverityEvents: 0,
                recentEvents: []
            };
        }
    }
}

const firewallManager = new FirewallManager();

module.exports = {
    firewallManager,
    logSecurityEvent: (event, data) => firewallManager.logSecurityEvent(event, data)
};
