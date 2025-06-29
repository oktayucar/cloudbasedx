const { run, get, all } = require('../database');

class File {
    static async create(fileData) {
        const {
            filename,
            originalName,
            mimetype,
            size,
            path,
            ownerId,
            description = '',
            tags = '',
            isPublic = false
        } = fileData;
        
        const sql = `
            INSERT INTO files (filename, originalName, mimetype, size, path, ownerId, description, tags, isPublic)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await run(sql, [
            filename, originalName, mimetype, size, path, ownerId, description, tags, isPublic ? 1 : 0
        ]);
        
        return this.findById(result.id);
    }
    
    static async findById(id) {
        const sql = `
            SELECT f.*, u.username, u.firstName, u.lastName
            FROM files f
            LEFT JOIN users u ON f.ownerId = u.id
            WHERE f.id = ?
        `;
        const file = await get(sql, [id]);
        
        if (file) {
            return this.formatFile(file);
        }
        return null;
    }
    
    static async findByOwner(ownerId, options = {}) {
        const { page = 1, limit = 10, sort = 'createdAt', order = 'DESC', search = '', type = '' } = options;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE f.ownerId = ?';
        let params = [ownerId];
        
        if (search) {
            whereClause += ' AND (f.originalName LIKE ? OR f.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (type) {
            whereClause += this.getTypeFilter(type);
        }
        
        const sql = `
            SELECT f.*, u.username, u.firstName, u.lastName
            FROM files f
            LEFT JOIN users u ON f.ownerId = u.id
            ${whereClause}
            ORDER BY f.${sort} ${order}
            LIMIT ? OFFSET ?
        `;
        
        const files = await all(sql, [...params, limit, offset]);
        return files.map(file => this.formatFile(file));
    }
    
    static async findAccessibleByUser(userId, options = {}) {
        const { page = 1, limit = 10, sort = 'createdAt', order = 'DESC', search = '', type = '' } = options;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE (f.ownerId = ? OR f.isPublic = 1 OR fs.userId = ?)';
        let params = [userId, userId];
        
        if (search) {
            whereClause += ' AND (f.originalName LIKE ? OR f.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (type) {
            whereClause += this.getTypeFilter(type);
        }
        
        const sql = `
            SELECT DISTINCT f.*, u.username, u.firstName, u.lastName
            FROM files f
            LEFT JOIN users u ON f.ownerId = u.id
            LEFT JOIN file_shares fs ON f.id = fs.fileId
            ${whereClause}
            ORDER BY f.${sort} ${order}
            LIMIT ? OFFSET ?
        `;
        
        const files = await all(sql, [...params, limit, offset]);
        return files.map(file => this.formatFile(file));
    }
    
    static async countByOwner(ownerId, options = {}) {
        const { search = '', type = '' } = options;
        
        let whereClause = 'WHERE ownerId = ?';
        let params = [ownerId];
        
        if (search) {
            whereClause += ' AND (originalName LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (type) {
            whereClause += this.getTypeFilter(type);
        }
        
        const sql = `SELECT COUNT(*) as count FROM files ${whereClause}`;
        const result = await get(sql, params);
        return result.count;
    }
    
    static async countAccessibleByUser(userId, options = {}) {
        const { search = '', type = '' } = options;
        
        let whereClause = 'WHERE (f.ownerId = ? OR f.isPublic = 1 OR fs.userId = ?)';
        let params = [userId, userId];
        
        if (search) {
            whereClause += ' AND (f.originalName LIKE ? OR f.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (type) {
            whereClause += this.getTypeFilter(type);
        }
        
        const sql = `
            SELECT COUNT(DISTINCT f.id) as count
            FROM files f
            LEFT JOIN file_shares fs ON f.id = fs.fileId
            ${whereClause}
        `;
        
        const result = await get(sql, params);
        return result.count;
    }
    
    static async update(id, updateData) {
        const { description, tags, isPublic } = updateData;
        
        const sql = `
            UPDATE files 
            SET description = ?, tags = ?, isPublic = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        await run(sql, [description || '', tags || '', isPublic ? 1 : 0, id]);
        return this.findById(id);
    }
    
    static async delete(id) {
        const sql = 'DELETE FROM files WHERE id = ?';
        await run(sql, [id]);
    }
    
    static async incrementDownload(id) {
        const sql = 'UPDATE files SET downloadCount = downloadCount + 1 WHERE id = ?';
        await run(sql, [id]);
    }
    
    static async shareWithUser(fileId, userId, permission = 'read') {
        const sql = `
            INSERT OR REPLACE INTO file_shares (fileId, userId, permission, sharedAt)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        await run(sql, [fileId, userId, permission]);
        
        // Update file shared status
        await run('UPDATE files SET isShared = 1 WHERE id = ?', [fileId]);
    }
    
    static async getSharedUsers(fileId) {
        const sql = `
            SELECT fs.*, u.username, u.firstName, u.lastName
            FROM file_shares fs
            LEFT JOIN users u ON fs.userId = u.id
            WHERE fs.fileId = ?
        `;
        
        return await all(sql, [fileId]);
    }
    
    static async hasAccess(fileId, userId) {
        const sql = `
            SELECT f.ownerId, f.isPublic, fs.permission
            FROM files f
            LEFT JOIN file_shares fs ON f.id = fs.fileId AND fs.userId = ?
            WHERE f.id = ?
        `;
        
        const result = await get(sql, [userId, fileId]);
        
        if (!result) return { access: false, permission: null };
        
        if (result.ownerId === userId) {
            return { access: true, permission: 'owner' };
        }
        
        if (result.isPublic) {
            return { access: true, permission: 'public' };
        }
        
        if (result.permission) {
            return { access: true, permission: result.permission };
        }
        
        return { access: false, permission: null };
    }
    
    static getTypeFilter(type) {
        switch (type) {
            case 'image':
                return " AND mimetype LIKE 'image/%'";
            case 'video':
                return " AND mimetype LIKE 'video/%'";
            case 'audio':
                return " AND mimetype LIKE 'audio/%'";
            case 'document':
                return " AND (mimetype LIKE 'application/pdf' OR mimetype LIKE 'application/msword' OR mimetype LIKE 'application/vnd.openxmlformats%')";
            case 'archive':
                return " AND (mimetype LIKE 'application/zip' OR mimetype LIKE 'application/x-rar%' OR mimetype LIKE 'application/x-7z%')";
            default:
                return '';
        }
    }
    
    static formatFile(file) {
        if (!file) return null;
        
        return {
            ...file,
            isPublic: Boolean(file.isPublic),
            isShared: Boolean(file.isShared),
            sizeFormatted: this.formatFileSize(file.size),
            fileType: this.getFileType(file.mimetype),
            owner: {
                id: file.ownerId,
                username: file.username,
                firstName: file.firstName,
                lastName: file.lastName
            }
        };
    }
    
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    static getFileType(mimetype) {
        if (mimetype.startsWith('image/')) return 'image';
        if (mimetype.startsWith('video/')) return 'video';
        if (mimetype.startsWith('audio/')) return 'audio';
        if (mimetype.startsWith('text/')) return 'text';
        if (mimetype.includes('pdf')) return 'pdf';
        if (mimetype.includes('document') || mimetype.includes('word')) return 'document';
        if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) return 'spreadsheet';
        if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return 'presentation';
        if (mimetype.includes('archive') || mimetype.includes('zip') || mimetype.includes('rar')) return 'archive';
        
        return 'other';
    }
}

module.exports = File; 