const crypto = require('crypto');
const { ENCRYPTION_KEY } = require('./security-config');

class EncryptionManager {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.key = Buffer.from(ENCRYPTION_KEY, 'utf8');
    }
    
    // Encrypt sensitive data
    encrypt(text) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher(this.algorithm, this.key);
            cipher.setAAD(Buffer.from('ntando-mods-pro', 'utf8'));
            
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return {
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            };
        } catch (error) {
            throw new Error('Encryption failed');
        }
    }
    
    // Decrypt sensitive data
    decrypt(encryptedData) {
        try {
            const { encrypted, iv, authTag } = encryptedData;
            const decipher = crypto.createDecipher(this.algorithm, this.key);
            
            decipher.setAAD(Buffer.from('ntando-mods-pro', 'utf8'));
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            throw new Error('Decryption failed');
        }
    }
    
    // Generate secure hash
    generateHash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    
    // Generate secure random string
    generateSecureRandom(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
}

module.exports = new EncryptionManager();
