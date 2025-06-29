const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// JWT token oluşturma fonksiyonu
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Kullanıcı kaydı
const register = async (req, res) => {
  try {
    // Validation hatalarını kontrol et
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation hatası',
        message: 'Lütfen tüm alanları doğru şekilde doldurun',
        details: errors.array()
      });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Kullanıcı adı kontrolü
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({
        error: 'Kullanıcı adı mevcut',
        message: 'Bu kullanıcı adı zaten kullanılıyor'
      });
    }

    // Email kontrolü
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        error: 'Email mevcut',
        message: 'Bu email adresi zaten kayıtlı'
      });
    }

    // Yeni kullanıcı oluştur
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName
    });

    // Token oluştur
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user,
      token
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Kayıt hatası',
      message: 'Kullanıcı oluşturulurken bir hata oluştu'
    });
  }
};

// Kullanıcı girişi
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation hatası',
        message: 'Lütfen tüm alanları doğru şekilde doldurun',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Kullanıcıyı bul
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Geçersiz kimlik bilgileri',
        message: 'Email veya şifre hatalı'
      });
    }

    // Hesap aktif mi kontrol et
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Hesap devre dışı',
        message: 'Hesabınız devre dışı bırakılmış'
      });
    }

    // Şifreyi kontrol et
    const isPasswordValid = await User.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Geçersiz kimlik bilgileri',
        message: 'Email veya şifre hatalı'
      });
    }

    // Son giriş zamanını güncelle
    await User.updateLastLogin(user.id);

    // Token oluştur
    const token = generateToken(user.id);

    // Kullanıcı bilgilerini döndür (şifre hariç)
    delete user.password;

    res.json({
      message: 'Giriş başarılı',
      user,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Giriş hatası',
      message: 'Giriş yapılırken bir hata oluştu'
    });
  }
};

// Kullanıcı profili getir
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Profil hatası',
      message: 'Profil bilgileri alınırken bir hata oluştu'
    });
  }
};

// Profil güncelleme
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation hatası',
        message: 'Lütfen tüm alanları doğru şekilde doldurun',
        details: errors.array()
      });
    }

    const { firstName, lastName, email } = req.body;
    const userId = req.user.id;

    // Email değişikliği varsa kontrol et
    if (email && email !== req.user.email) {
      const existingEmail = await User.findByEmail(email);
      if (existingEmail && existingEmail.id !== userId) {
        return res.status(400).json({
          error: 'Email mevcut',
          message: 'Bu email adresi zaten kullanılıyor'
        });
      }
    }

    // Profili güncelle
    const updatedUser = await User.updateProfile(userId, { firstName, lastName, email });

    res.json({
      message: 'Profil başarıyla güncellendi',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Güncelleme hatası',
      message: 'Profil güncellenirken bir hata oluştu'
    });
  }
};

// Şifre değiştirme
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation hatası',
        message: 'Lütfen tüm alanları doğru şekilde doldurun',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Mevcut kullanıcıyı al
    const user = await User.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({
        error: 'Kullanıcı bulunamadı',
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Mevcut şifreyi kontrol et
    const isCurrentPasswordValid = await User.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Geçersiz şifre',
        message: 'Mevcut şifre hatalı'
      });
    }

    // Yeni şifreyi güncelle
    await User.updatePassword(userId, newPassword);

    res.json({
      message: 'Şifre başarıyla değiştirildi'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Şifre değiştirme hatası',
      message: 'Şifre değiştirilirken bir hata oluştu'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
}; 