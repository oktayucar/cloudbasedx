# CloudBasedX - Bulut Tabanlı Dosya Depolama Sistemi

Modern ve güvenli bulut tabanlı dosya depolama sistemi. Node.js backend, React frontend ve SQLite veritabanı kullanır.

## 🌐 Canlı Demo

**Website:** https://cloudebasedx.com

## 🚀 Özellikler

- ✅ Kullanıcı kaydı ve girişi
- ✅ JWT tabanlı kimlik doğrulama
- ✅ Dosya yükleme ve indirme
- ✅ Dosya listesi görüntüleme
- ✅ Dosya silme
- ✅ Responsive tasarım
- ✅ Güvenli dosya depolama

## 🛠️ Teknolojiler

- **Backend:** Node.js, Express.js
- **Frontend:** HTML, CSS, JavaScript
- **Veritabanı:** SQLite
- **Kimlik Doğrulama:** JWT
- **Dosya İşleme:** Multer
- **Hosting:** Vercel

## 📦 Kurulum

### Yerel Geliştirme

1. **Projeyi klonlayın:**
```bash
git clone <repository-url>
cd CloudbasedFileStorage
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
cd backend && npm install
```

3. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
```

4. **Tarayıcıda açın:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5050

## 🌍 Production Deployment

### Vercel ile Deployment

1. **Vercel CLI'yi yükleyin:**
```bash
npm i -g vercel
```

2. **Vercel'e giriş yapın:**
```bash
vercel login
```

3. **Projeyi deploy edin:**
```bash
vercel
```

4. **Domain'i bağlayın:**
- Vercel dashboard'da projenizi seçin
- Settings > Domains bölümüne gidin
- `cloudebasedx.com` domain'ini ekleyin
- DNS ayarlarını domain sağlayıcınızda yapılandırın

### DNS Ayarları

Domain sağlayıcınızda aşağıdaki DNS kayıtlarını ekleyin:

```
Type: A
Name: @
Value: 76.76.19.19

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## 🔧 Environment Variables

Production için gerekli environment variables:

```env
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

## 📁 Proje Yapısı

```
CloudbasedFileStorage/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── database.js
│   └── server.js
├── frontend/
│   ├── css/
│   ├── js/
│   └── index.html
├── vercel.json
└── package.json
```

## 🔒 Güvenlik

- JWT token tabanlı kimlik doğrulama
- Şifrelenmiş parola saklama (bcrypt)
- CORS koruması
- Rate limiting
- Helmet.js güvenlik başlıkları

## 📝 API Endpoints

### Kimlik Doğrulama
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/me` - Kullanıcı bilgileri

### Dosya İşlemleri
- `GET /api/files` - Dosya listesi
- `POST /api/files/upload` - Dosya yükleme
- `GET /api/files/download/:id` - Dosya indirme
- `DELETE /api/files/:id` - Dosya silme

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **Website:** https://cloudebasedx.com
- **Email:** [your-email@example.com]

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
