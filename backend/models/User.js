const bcrypt = require('bcryptjs');
const { run, get, all } = require('../database');

class User {
    static async create(userData) {
        const { username, email, password, firstName, lastName } = userData;
        
        // Şifreyi hashle
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const sql = `
            INSERT INTO users (username, email, password, firstName, lastName)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const result = await run(sql, [username, email, hashedPassword, firstName, lastName]);
        return this.findById(result.id);
    }
    
    static async findById(id) {
        const sql = 'SELECT * FROM users WHERE id = ?';
        const user = await get(sql, [id]);
        
        if (user) {
            delete user.password;
            return user;
        }
        return null;
    }
    
    static async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        return await get(sql, [email]);
    }
    
    static async findByUsername(username) {
        const sql = 'SELECT * FROM users WHERE username = ?';
        return await get(sql, [username]);
    }
    
    static async updateLastLogin(id) {
        const sql = 'UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?';
        await run(sql, [id]);
    }
    
    static async updateStorageUsed(id, storageUsed) {
        const sql = 'UPDATE users SET storageUsed = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?';
        await run(sql, [storageUsed, id]);
    }
    
    static async updateProfile(id, updateData) {
        const { firstName, lastName, email } = updateData;
        const sql = `
            UPDATE users 
            SET firstName = ?, lastName = ?, email = ?, updatedAt = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        await run(sql, [firstName, lastName, email, id]);
        return this.findById(id);
    }
    
    static async updatePassword(id, newPassword) {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        const sql = 'UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?';
        await run(sql, [hashedPassword, id]);
    }
    
    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
    
    static getStorageUsagePercentage(storageUsed, storageLimit) {
        return Math.round((storageUsed / storageLimit) * 100);
    }
    
    static formatStorageSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = User; 