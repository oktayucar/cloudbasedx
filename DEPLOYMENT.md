# CloudBasedX Deployment Guide

Bu rehber, CloudBasedX projesini `cloudebasedx.com` domain'i ile canlıya almak için gerekli adımları içerir.

## 🚀 Deployment Seçenekleri

### 1. Render.com ile Backend + GitHub Pages ile Frontend (Önerilen)

#### Backend Deployment (Render.com)

1. **Render.com hesabı oluşturun:**
   - https://render.com adresine gidin
   - GitHub ile giriş yapın

2. **Projeyi Render'a deploy edin:**
   - "New Web Service" butonuna tıklayın
   - GitHub repository'nizi seçin
   - Aşağıdaki ayarları yapın:
     - **Name:** cloudbasedx-backend
     - **Environment:** Node
     - **Build Command:** `cd backend && npm install`
     - **Start Command:** `cd backend && node server.js`
     - **Plan:** Free

3. **Environment variables ekleyin:**
   - Settings > Environment sekmesine gidin
   - Aşağıdaki değişkenleri ekleyin:
   ```
   NODE_ENV=production
   JWT_SECRET=cloudebasedx-super-secret-jwt-key-2024
   PORT=10000
   ```

4. **Deploy edin:**
   - "Create Web Service" butonuna tıklayın
   - Deploy işleminin tamamlanmasını bekleyin
   - Backend URL'sini not edin (örn: https://cloudbasedx-backend.onrender.com)

#### Frontend Deployment (GitHub Pages)

1. **GitHub repository oluşturun:**
   ```bash
   git remote add origin https://github.com/yourusername/cloudbasedx.git
   git push -u origin main
   ```

2. **GitHub Pages'i etkinleştirin:**
   - Repository Settings > Pages
   - Source: "Deploy from a branch" seçin
   - Branch: "gh-pages" seçin
   - Save'e tıklayın

3. **Frontend URL'sini güncelleyin:**
   - Backend deploy edildikten sonra
   - `frontend/js/app.js` dosyasındaki API_BASE_URL'yi güncelleyin
   - Değişiklikleri commit edin ve push edin

#### Domain Ayarları

1. **DNS Ayarları:**
   - Domain sağlayıcınızın DNS panelinde:
   - A record: `@` → GitHub Pages IP (185.199.108.153)
   - CNAME record: `www` → `yourusername.github.io`

2. **GitHub Pages Custom Domain:**
   - Repository Settings > Pages
   - Custom domain: `cloudebasedx.com` girin
   - Save'e tıklayın

### 2. Vercel ile Full-Stack Deployment

1. **Vercel hesabı oluşturun:**
   - https://vercel.com adresine gidin
   - GitHub ile giriş yapın

2. **Projeyi import edin:**
   - "New Project" butonuna tıklayın
   - GitHub repository'nizi seçin
   - Framework Preset: "Other" seçin

3. **Environment variables ekleyin:**
   ```
   JWT_SECRET=cloudebasedx-super-secret-jwt-key-2024
   NODE_ENV=production
   ```

4. **Deploy edin:**
   - "Deploy" butonuna tıklayın

### 3. Netlify ile Deployment

1. **Netlify hesabı oluşturun:**
   - https://netlify.com adresine gidin
   - GitHub ile giriş yapın

2. **Projeyi deploy edin:**
   - "New site from Git" butonuna tıklayın
   - GitHub repository'nizi seçin
   - Build settings:
     - Build command: `npm install && cd backend && npm install`
     - Publish directory: `frontend`

## 🔧 Yerel Test

Deployment öncesi yerel test için:

```bash
# Backend'i başlat
cd backend && npm start

# Frontend'i başlat (yeni terminal)
cd frontend && python3 -m http.server 3000
```

## 📝 Notlar

- Backend URL'si değiştiğinde frontend'deki API_BASE_URL'yi güncellemeyi unutmayın
- JWT_SECRET'ı production'da güçlü bir değerle değiştirin
- SQLite veritabanı dosyası geçici olarak saklanır (Render'da)
- Dosya uploads için kalıcı storage çözümü gerekebilir (AWS S3, Cloudinary vb.)

## 🌐 Canlı Demo

Deployment tamamlandıktan sonra:
- **Website:** https://cloudebasedx.com
- **API:** https://cloudbasedx-backend.onrender.com

## 🔧 Environment Variables

Production için gerekli environment variables:

```env
JWT_SECRET=cloudebasedx-super-secret-jwt-key-2024
NODE_ENV=production
PORT=5050
```

## 📝 API URL Güncelleme

Backend deploy ettikten sonra, frontend'deki API URL'yi güncelleyin:

```javascript
// frontend/js/app.js dosyasında
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5050/api' 
  : 'https://your-backend-url.railway.app/api'; // Backend URL'nizi buraya yazın
```

## 🌐 DNS Ayarları

Domain sağlayıcınızda aşağıdaki DNS kayıtlarını ekleyin:

### Frontend için (GitHub Pages):
```
Type: A
Name: @
Value: 185.199.108.153

Type: CNAME
Name: www
Value: yourusername.github.io
```

### Backend için (Railway):
```
Type: CNAME
Name: api
Value: your-app.railway.app
```

## 🔒 SSL Sertifikası

- GitHub Pages: Otomatik SSL
- Railway: Otomatik SSL
- Vercel: Otomatik SSL
- Netlify: Otomatik SSL

## 📊 Monitoring ve Analytics

1. **Uptime monitoring:**
   - UptimeRobot: https://uptimerobot.com
   - Pingdom: https://pingdom.com

2. **Error tracking:**
   - Sentry: https://sentry.io
   - LogRocket: https://logrocket.com

## 🚨 Troubleshooting

### Port Hatası
```bash
# Port 5000 kullanımdaysa
lsof -ti:5000 | xargs kill -9
```

### Database Hatası
```bash
# SQLite dosyasını silin ve yeniden oluşturun
rm backend/database.sqlite
```

### CORS Hatası
```bash
# Backend'de CORS ayarlarını kontrol edin
# frontend origin'i ekleyin
```

## 📞 Destek

Deployment sırasında sorun yaşarsanız:
1. Console loglarını kontrol edin
2. Network tab'ını kontrol edin
3. Environment variables'ları kontrol edin
4. DNS ayarlarını kontrol edin

---

**Not:** Bu rehber Railway + GitHub Pages kombinasyonunu önerir çünkü:
- Railway: Backend için güvenilir ve hızlı
- GitHub Pages: Frontend için ücretsiz ve güvenilir
- Ayrı hosting: Daha iyi performans ve ölçeklenebilirlik 