const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Vercel'de geçici dosya sistemi kullan
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/database.sqlite' 
  : path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath);

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    // Users tablosu
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ Users tablosu oluşturma hatası:', err);
        reject(err);
        return;
      }
      console.log('✅ Users tablosu oluşturuldu');
    });

    // Files tablosu
    db.run(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) {
        console.error('❌ Files tablosu oluşturma hatası:', err);
        reject(err);
        return;
      }
      console.log('✅ Files tablosu oluşturuldu');
      resolve();
    });
  });
};

// Veritabanı bağlantısını test et
db.get("SELECT name FROM sqlite_master WHERE type='table'", (err, row) => {
  if (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err);
  } else {
    console.log('✅ SQLite veritabanına bağlandı');
  }
});

module.exports = {
  db,
  initializeDatabase
}; 