const express = require('express');
const { body } = require('express-validator');
const fileController = require('../controllers/fileController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Tüm route'larda kimlik doğrulama gerekli
router.use(authenticateToken);

// Validation rules
const updateFileValidation = [
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Açıklama en fazla 500 karakter olabilir'),
  
  body('tags')
    .optional()
    .isString()
    .withMessage('Etiketler string olmalı'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic boolean olmalı')
];

const shareFileValidation = [
  body('userId')
    .notEmpty()
    .withMessage('Kullanıcı ID gerekli')
    .isMongoId()
    .withMessage('Geçerli bir kullanıcı ID girin'),
  
  body('permission')
    .optional()
    .isIn(['read', 'write'])
    .withMessage('İzin türü read veya write olmalı')
];

// Routes
router.post('/upload', fileController.upload.single('file'), fileController.uploadFile);
router.get('/', fileController.getFiles);
router.get('/download/:id', fileController.downloadFile);
router.delete('/:id', fileController.deleteFile);
router.put('/:id', updateFileValidation, fileController.updateFile);
router.post('/:id/share', shareFileValidation, fileController.shareFile);

module.exports = router; 