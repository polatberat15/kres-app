const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Atlas Veritabanı Bağlantısı (Google Drive tamamen kaldırıldı)
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB Veritabanı bağlantısı başarılı!"))
    .catch(err => console.log("Veritabanı bağlantı hatası:", err));

// Veritabanı Şemaları
const MemorySchema = new mongoose.Schema({
    title: String,
    content: String,
    category: { type: String, default: 'Genel' },
    date: { type: Date, default: Date.now }
});

const SettingSchema = new mongoose.Schema({
    key: { type: String, unique: true },
    value: String
});

const Memory = mongoose.model('Memory', MemorySchema);
const Setting = mongoose.model('Setting', SettingSchema);

// Varsayılan şifreyi kontrol et/oluştur
async function initSettings() {
    const passSetting = await Setting.findOne({ key: 'app_password' });
    if (!passSetting) {
        await Setting.create({ key: 'app_password', value: '1234' });
    }
}
initSettings();

// Ana Sayfa Rotaları
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Tüm Anıları Listeleme API
app.get('/api/memories', async (req, res) => {
    try {
        const memories = await Memory.find().sort({ date: -1 });
        res.json(memories);
    } catch (err) {
        res.status(500).json({ error: "Anılar yüklenirken bir hata oluştu." });
    }
});

// Yeni Anı Ekleme API
app.post('/api/memories', async (req, res) => {
    try {
        const { title, content, category } = req.body;
        const newMemory = new Memory({ title, content, category });
        await newMemory.save();
        res.json({ success: true, message: "Anı başarıyla eklendi!" });
    } catch (err) {
        res.status(500).json({ error: "Anı kaydedilemedi." });
    }
});

// Anı Silme API
app.get('/api/memories/delete/:id', async (req, res) => {
    try {
        await Memory.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Anı silindi." });
    } catch (err) {
        res.status(500).json({ error: "Silme işlemi başarısız." });
    }
});

// Gizli Panel İçin Şifre Güncelleme API
app.post('/api/update-password', async (req, res) => {
    try {
        const { newPassword, masterKey } = req.body;
        
        // Ekstra Güvenlik / Yönetici Şifresi Doğrulaması
        if (masterKey !== "ekstraGuvenlik123") {
            return res.status(403).json({ error: "Hatalı yönetici güvenlik şifresi!" });
        }

        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ error: "Yeni şifre en az 4 karakter olmalıdır." });
        }

        await Setting.findOneAndUpdate(
            { key: 'app_password' },
            { value: newPassword },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: "Anı defteri şifresi başarıyla güncellendi!" });
    } catch (err) {
        res.status(500).json({ error: "Şifre güncellenirken sunucu hatası oluştu." });
    }
});

// Sunucu Başlatma
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda başarıyla çalışıyor...`);
});