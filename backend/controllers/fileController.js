const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { validationResult } = require('express-validator');
const File = require('../models/File');
const User = require('../models/User');

// Multer konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // İzin verilen dosya türleri
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'text/plain', 'text/html', 'text/css', 'text/javascript',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Bu dosya türü desteklenmiyor'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Dosya yükleme
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Dosya gerekli',
        message: 'Lütfen bir dosya seçin'
      });
    }

    const { description, tags, isPublic } = req.body;
    const userId = req.user.id;

    // Kullanıcının depolama limitini kontrol et
    const user = await User.findByEmail(req.user.email);
    const newStorageUsed = user.storageUsed + req.file.size;

    if (newStorageUsed > user.storageLimit) {
      // Yüklenen dosyayı sil
      await fs.unlink(req.file.path);
      
      return res.status(400).json({
        error: 'Depolama alanı yetersiz',
        message: 'Dosya yüklemek için yeterli alan yok'
      });
    }

    // Dosya kaydını oluştur
    const file = await File.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      ownerId: userId,
      description: description || '',
      tags: tags || '',
      isPublic: isPublic === 'true'
    });

    // Kullanıcının depolama kullanımını güncelle
    await User.updateStorageUsed(userId, newStorageUsed);

    res.status(201).json({
      message: 'Dosya başarıyla yüklendi',
      file
    });

  } catch (error) {
    console.error('Upload file error:', error);
    
    // Hata durumunda dosyayı sil
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('File deletion error:', unlinkError);
      }
    }

    res.status(500).json({
      error: 'File upload error',
      message: 'An error occurred while uploading the file'
    });
  }
};

// List files
const getFiles = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', search = '', type = '' } = req.query;
    const userId = req.user.id;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order: order.toUpperCase(),
      search,
      type
    };

    const files = await File.findAccessibleByUser(userId, options);
    const total = await File.countAccessibleByUser(userId, options);

    res.json({
      files,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalFiles: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      error: 'File list error',
      message: 'An error occurred while getting files'
    });
  }
};

// Download file
const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The specified file does not exist'
      });
    }

    // File access control
    const access = await File.hasAccess(id, userId);
    if (!access.access) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this file'
      });
    }

    // Check if file exists
    try {
      await fs.access(file.path);
    } catch (error) {
      return res.status(404).json({
        error: 'File not found',
        message: 'File does not exist physically'
      });
    }

    // Increment download count
    await File.incrementDownload(id);

    res.download(file.path, file.originalName);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      error: 'File download error',
      message: 'An error occurred while downloading the file'
    });
  }
};

// Delete file
const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The specified file does not exist'
      });
    }

    // Only the file owner can delete
    if (file.owner.id !== userId) {
      return res.status(403).json({
        error: 'Unauthorized access',
        message: 'You do not have permission to delete this file'
      });
    }

    // Delete file physically
    try {
      await fs.unlink(file.path);
    } catch (error) {
      console.error('Physical file deletion error:', error);
    }

    // Update user storage usage
    const user = await User.findByEmail(req.user.email);
    const newStorageUsed = Math.max(0, user.storageUsed - file.size);
    await User.updateStorageUsed(userId, newStorageUsed);

    // Delete from database
    await File.delete(id);

    res.json({
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      error: 'File deletion error',
      message: 'An error occurred while deleting the file'
    });
  }
};

// Update file information
const updateFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, tags, isPublic } = req.body;
    const userId = req.user.id;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The specified file does not exist'
      });
    }

    // Only the file owner can update
    if (file.owner.id !== userId) {
      return res.status(403).json({
        error: 'Unauthorized access',
        message: 'You do not have permission to update this file'
      });
    }

    const updatedFile = await File.update(id, { description, tags, isPublic });

    res.json({
      message: 'File updated successfully',
      file: updatedFile
    });

  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({
      error: 'File update error',
      message: 'An error occurred while updating the file'
    });
  }
};

// Share file
const shareFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: shareWithUserId, permission = 'read' } = req.body;
    const userId = req.user.id;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The specified file does not exist'
      });
    }

    // Only the file owner can share
    if (file.owner.id !== userId) {
      return res.status(403).json({
        error: 'Unauthorized access',
        message: 'You do not have permission to share this file'
      });
    }

    // Cannot share with yourself
    if (parseInt(shareWithUserId) === userId) {
      return res.status(400).json({
        error: 'Invalid sharing',
        message: 'You cannot share a file with yourself'
      });
    }

    // Check if user exists
    const shareWithUser = await User.findById(shareWithUserId);
    if (!shareWithUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }

    // Share file
    await File.shareWithUser(id, shareWithUserId, permission);

    res.json({
      message: 'File shared successfully'
    });

  } catch (error) {
    console.error('Share file error:', error);
    res.status(500).json({
      error: 'File sharing error',
      message: 'An error occurred while sharing the file'
    });
  }
};

module.exports = {
  upload,
  uploadFile,
  getFiles,
  downloadFile,
  deleteFile,
  updateFile,
  shareFile
}; 