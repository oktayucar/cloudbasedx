const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT token doğrulama middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Erişim token\'ı gerekli',
        message: 'Lütfen giriş yapın'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Kullanıcıyı veritabanından kontrol et
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Geçersiz token',
        message: 'Kullanıcı bulunamadı'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Hesap devre dışı',
        message: 'Hesabınız devre dışı bırakılmış'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Geçersiz token',
        message: 'Token doğrulanamadı'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token süresi dolmuş',
        message: 'Lütfen tekrar giriş yapın'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Kimlik doğrulama hatası',
      message: 'Bir hata oluştu'
    });
  }
};

// Opsiyonel kimlik doğrulama (kullanıcı giriş yapmışsa user bilgisini ekle)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Token hatası olsa bile devam et (opsiyonel auth)
    next();
  }
};

// Admin kontrolü middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Yetkisiz erişim',
      message: 'Bu işlem için admin yetkisi gerekli'
    });
  }
  next();
};

// Kullanıcı ID kontrolü middleware
const requireOwnership = (req, res, next) => {
  const requestedUserId = req.params.userId || req.body.userId;
  
  if (!requestedUserId) {
    return res.status(400).json({ 
      error: 'Kullanıcı ID gerekli',
      message: 'İşlem için kullanıcı ID belirtilmeli'
    });
  }

  if (req.user.id !== parseInt(requestedUserId) && req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Yetkisiz erişim',
      message: 'Bu işlem için yetkiniz yok'
    });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireOwnership
}; 