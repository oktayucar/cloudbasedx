# CloudBasedX Deployment Guide

Bu rehber, CloudBasedX projesini `cloudebasedx.com` domain'i ile canlıya almak için gerekli adımları içerir.

## 🚀 Hızlı Deployment (Önerilen)

### 1. Backend Deployment (Render.com)

1. **Render.com'a gidin:** https://render.com
2. **GitHub ile giriş yapın**
3. **"New +" → "Web Service"**
4. **GitHub repository'nizi seçin:** `oktayucar/cloudbasedx`
5. **Aşağıdaki ayarları yapın:**
   - **Name:** `cloudbasedx-backend`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && node server.js`
   - **Plan:** `Free`

6. **Environment Variables ekleyin:**
   - **NODE_ENV:** `production`
   - **JWT_SECRET:** `cloudebasedx-super-secret-jwt-key-2024`
   - **PORT:** `10000`

7. **"Create Web Service" butonuna tıklayın**

8. **Deploy tamamlandıktan sonra URL'yi not edin** (örn: https://cloudbasedx-backend.onrender.com)

### 2. Frontend Deployment (Netlify Drop)

1. **Netlify Drop'a gidin:** https://app.netlify.com/drop
2. **`frontend-final.zip` dosyasını sürükleyip bırakın**
3. **Site URL'yi not edin** (örn: https://amazing-site-123.netlify.app)

### 3. Frontend API URL Güncelleme

1. **Frontend ZIP dosyasını çıkarın**
2. **`frontend/js/app.js` dosyasını açın**
3. **API URL'yi güncelleyin:**
   ```javascript
   const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
     ? 'http://localhost:5050/api' 
     : 'https://YOUR_RENDER_URL.onrender.com/api'; // Render URL'nizi buraya yazın
   ```
4. **Yeni ZIP dosyası oluşturun ve Netlify'a tekrar yükleyin**

### 4. DNS Ayarları (Hosting Firması Panelinde)

Hosting firmanızın DNS panelinde şu ayarları yapın:

```
# Frontend için
Type: CNAME
Name: www
Value: your-netlify-site.netlify.app

# Backend için
Type: CNAME  
Name: api
Value: your-render-app.onrender.com

# Ana domain için
Type: A
Name: @
Value: 185.199.108.153 (Netlify IP)
```

### 5. Test

- **Frontend:** https://cloudebasedx.com
- **API:** https://api.cloudebasedx.com/api/health

## 🔧 Alternatif Deployment Yöntemleri

### Vercel (Full-Stack)

1. **Vercel.com'a gidin:** https://vercel.com
2. **GitHub ile giriş yapın**
3. **"New Project" → GitHub repository'nizi seçin**
4. **Environment variables ekleyin**
5. **Deploy edin**

### Railway

1. **Railway.app'e gidin:** https://railway.app
2. **GitHub ile giriş yapın**
3. **"New Project" → "Deploy from GitHub repo"**
4. **Repository'nizi seçin**
5. **Environment variables ekleyin**

## 📁 Hazır Dosyalar

- `frontend-final.zip` - Netlify Drop için
- `render.yaml` - Render.com deployment için
- `vercel.json` - Vercel deployment için
- `netlify.toml` - Netlify deployment için

## 🚨 Sorun Giderme

### Port Çakışması
```bash
# Port 5000'i kullanan process'leri bul ve sonlandır
lsof -ti:5000 | xargs kill -9

# Port 3000'i kullanan process'leri bul ve sonlandır  
lsof -ti:3000 | xargs kill -9
```

### Backend Bağlantı Sorunu
- Environment variables'ları kontrol edin
- CORS ayarlarını kontrol edin
- Health check endpoint'ini test edin: `/api/health`

### Frontend API Bağlantı Sorunu
- API URL'nin doğru olduğundan emin olun
- Browser console'da hata mesajlarını kontrol edin
- CORS ayarlarını kontrol edin

## 📞 Destek

Sorun yaşarsanız:
1. Console loglarını kontrol edin
2. Network tab'ında API çağrılarını kontrol edin
3. Environment variables'ları doğrulayın

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