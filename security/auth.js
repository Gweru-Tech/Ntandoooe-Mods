const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET, ADMIN_CREDENTIALS } = require('./security-config');
const { logSecurityEvent } = require('./firewall');

class AuthManager {
    // Generate JWT token
    generateToken(payload) {
        return jwt.sign(payload, JWT_SECRET, { 
            expiresIn: '24h',
            issuer: 'ntando-mods-pro',
            audience: 'admin'
        });
    }
    
    // Verify JWT token
    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    }
    
    // Hash password
    async hashPassword(password) {
        return await bcrypt.hash(password, 12);
    }
    
    // Verify password
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }
    
    // Authenticate admin
    async authenticateAdmin(username, password, req) {
        try {
            // Check credentials
            if (username !== ADMIN_CREDENTIALS.username) {
                await logSecurityEvent('auth_failed', {
                    reason: 'invalid_username',
                    username,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
                return { success: false, message: 'Invalid credentials' };
            }
            
            const isValidPassword = await this.verifyPassword(password, ADMIN_CREDENTIALS.passwordHash);
            if (!isValidPassword) {
                await logSecurityEvent('auth_failed', {
                    reason: 'invalid_password',
                    username,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
                return { success: false, message: 'Invalid credentials' };
            }
            
            // Generate token
            const token = this.generateToken({
                username,
                role: 'admin',
                loginTime: Date.now()
            });
            
            await logSecurityEvent('auth_success', {
                username,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            return { 
                success: true, 
                token,
                message: 'Authentication successful'
            };
            
        } catch (error) {
            await logSecurityEvent('auth_error', {
                error: error.message,
                ip: req.ip
            });
            return { success: false, message: 'Authentication error' };
        }
    }
    
    // Middleware to verify admin token
    verifyAdminToken(req, res, next) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }
        
        const decoded = this.verifyToken(token);
        if (!decoded || decoded.role !== 'admin') {
            logSecurityEvent('invalid_token', {
                token: token.substring(0, 20) + '...',
                ip: req.ip
            });
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        req.admin = decoded;
        next();
    }
}

module.exports = new AuthManager();
