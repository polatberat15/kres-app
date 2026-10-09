const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/manifest.json', (req, res) => {
    res.json({
        "name": "Bizim Anı Defterimiz",
        "short_name": "AnıDefteri",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#fff0f3",
        "theme_color": "#ff4d6d",
        "icons": [{ "src": "/logo.svg", "sizes": "512x512", "type": "image/svg+xml" }]
    });
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });
mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB Bağlandı!')).catch(err => console.error(err));

const MemorySchema = new mongoose.Schema({
    accessPassword: { type: String, default: "123" },
    gallery: { type: Array, default: [] },
    bucketList: { type: Array, default: [
        { id: '1', text: 'Güzel bir mekanda kahve içmek ☕', completed: false },
        { id: '2', text: 'Ortak bir müzik listesi yapmak 🎶', completed: false }
    ]},
    bgMusicUrl: { type: String, default: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf7f6.mp3" },
    specialLocations: { type: Array, default: [] }
});
const MemoryModel = mongoose.model('MemoryDataResponsive', MemorySchema);

async function getDB() {
    let doc = await MemoryModel.findOne();
    if (!doc) doc = await MemoryModel.create({ accessPassword: "123" });
    if (!Array.isArray(doc.gallery)) doc.gallery = [];
    if (!Array.isArray(doc.bucketList)) doc.bucketList = [];
    if (!Array.isArray(doc.specialLocations)) doc.specialLocations = [];
    return doc;
}

// Şifre Giriş Sayfası
app.get('/', async (req, res) => {
    if (req.cookies.memory_auth === 'true') return res.redirect('/notlar');
    res.send(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Giriş</title>
    <style>body{font-family:'Segoe UI',sans-serif;background:#fff0f3;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;padding:15px;box-sizing:border-box;}
    .card{background:#fff;padding:30px 20px;border-radius:20px;box-shadow:0 10px 25px rgba(255,77,109,0.15);text-align:center;width:100%;max-width:320px;border:1px solid #ffccd5;}
    input,button{width:100%;padding:12px;margin:10px 0;border-radius:12px;border:1px solid #ffccd5;box-sizing:border-box;font-size:15px;outline:none;}
    button{background:linear-gradient(135deg,#ff9a9e,#ff4d6d);color:#fff;border:none;font-weight:bold;cursor:pointer;box-shadow:0 4px 12px rgba(255,77,109,0.25);}</style></head>
    <body><div class="card"><h3 style="color:#ff4d6d;margin-top:0;">🔐 Erişim Şifresi</h3><p style="font-size:13px;color:#666;">Varsayılan şifre: 123</p><form action="/giris" method="POST">
    <input type="password" name="password" placeholder="••••" required style="text-align:center;font-size:20px;letter-spacing:4px;"><button type="submit">Giriş Yap ❤️</button></form></div></body></html>`);
});

app.post('/giris', async (req, res) => {
    const db = await getDB();
    if (req.body.password === db.accessPassword) {
        res.cookie('memory_auth', 'true', { maxAge: 365 * 24 * 60 * 60 * 1000 });
        res.redirect('/notlar');
    } else { res.send(`<script>alert("Hatalı şifre!"); window.location.href="/";</script>`); }
});

// Güvenlik Şifresi Doğrulama
app.post('/api/verify-master', async (req, res) => {
    const { masterKey } = req.body;
    const db = await getDB();
    if (masterKey === db.accessPassword || masterKey === "123") {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Şifre Değiştirme
app.post('/api/update-password', async (req, res) => {
    const { newPassword, masterKey } = req.body;
    const db = await getDB();
    if (masterKey !== db.accessPassword && masterKey !== "123") {
        return res.status(403).json({ error: "Hatalı yönetici şifresi!" });
    }
    db.accessPassword = newPassword;
    await db.save();
    res.json({ success: true, message: "Şifre başarıyla değiştirildi!" });
});

app.get('/notlar', async (req, res) => {
    if (req.cookies.memory_auth !== 'true') return res.redirect('/');
    const fs = require('fs');
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (!fs.existsSync(indexPath)) return res.send("Hata: index.html bulunamadı!");

    let html = fs.readFileSync(indexPath, 'utf8');
    const db = await getDB();
    const filter = req.query.cat || 'Tümü';

    let filteredGallery = db.gallery;
    if (filter !== 'Tümü') filteredGallery = db.gallery.filter(m => m.category === filter);

    let memoriesHTML = filteredGallery.map(m => {
        let mediaEl = '';
        if (m.imgUrl) {
            if (m.imgUrl.includes('.mp4') || m.imgUrl.includes('video')) {
                mediaEl = `<video controls width="100%" style="height:220px; object-fit:cover; background:black;"><source src="${m.imgUrl}"></video>`;
            } else if (m.imgUrl.includes('.mp3') || m.imgUrl.includes('audio') || m.imgUrl.includes('webm') || m.imgUrl.includes('wav') || m.imgUrl.includes('data:audio')) {
                mediaEl = `<div style="padding:20px 15px; background:var(--input-bg); text-align:center;"><p style="margin:0 0 8px 0; font-weight:bold; color:var(--primary); font-size:13px;">🎙️ Sesli Not</p><audio controls width="100%"><source src="${m.imgUrl}"></audio></div>`;
            } else {
                mediaEl = `<img src="${m.imgUrl}" style="width:100%; height:220px; object-fit:cover; display:block;">`;
            }
        } else {
            mediaEl = `<div style="height:80px; background:var(--input-bg); display:flex; align-items:center; justify-content:center; font-size:24px;">📌</div>`;
        }
            
        return `
        <div class="memory-card">
            ${mediaEl}
            <div style="padding:15px; display:flex; flex-direction:column; flex-grow:1;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="font-size:11px; color:var(--primary); font-weight:bold;">✨ ${m.date}</span>
                    <span style="font-size:10px; background:var(--input-bg); padding:2px 6px; border-radius:8px; opacity:0.8;">${m.category || 'Notlar'}</span>
                </div>
                <h3 style="margin:0 0 6px 0; font-size:16px;">${m.title}</h3>
                <p style="margin:0 0 12px 0; font-size:13px; opacity:0.8; line-height:1.4; flex-grow:1; white-space: pre-wrap;">${m.note || ''}</p>
                <a href="/sil/${m.id}" onclick="return confirm('Silmek istediğine emin misin?')" style="color:#ff4d6d; font-size:11px; text-decoration:none; align-self:flex-end; font-weight:bold;">🗑️ Sil</a>
            </div>
        </div>`;
    }).reverse().join('') || '<p style="text-align:center; opacity:0.8; grid-column: 1/-1; padding:40px; font-size:13px;">Bu kategoride henüz paylaşım yok. 📌</p>';

    let bucketListHTML = db.bucketList.map(item => `
        <div class="bucket-item">
            <span style="font-size:13px; text-decoration: ${item.completed ? 'line-through' : 'none'}; opacity: ${item.completed ? '0.6' : '1'};">${item.text}</span>
            <a href="/bucket-toggle/${item.id}" style="text-decoration:none; font-size:16px;">${item.completed ? '✅' : '⬜'}</a>
        </div>
    `).join('');

    let locationsHTML = db.specialLocations.map(loc => `
        <div class="card" style="background: linear-gradient(135deg, var(--card-bg), var(--input-bg)); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 10px; padding: 15px;">
            <div style="flex: 1; min-width: 220px;">
                <span style="font-size: 10px; font-weight: bold; color: var(--primary); text-transform: uppercase;">📍 Özel Nokta</span>
                <h3 style="margin: 3px 0 5px 0; font-size: 16px;">${loc.title}</h3>
                <p style="margin: 0 0 6px 0; font-size: 12px; opacity: 0.8;">${loc.note}</p>
                <a href="/konum-sil/${loc.id}" onclick="return confirm('Silmek istediğine emin misin?')" style="color:#ff4d6d; font-size:11px; text-decoration:none; font-weight:bold;">🗑️ Sil</a>
            </div>
            <div><a href="${loc.mapsUrl}" target="_blank" class="btn-main" style="padding: 8px 14px; font-size: 12px; text-decoration:none;">🗺️ Harita</a></div>
        </div>
    `).join('') || '<p style="text-align:center; opacity:0.8; font-size:12px; padding:10px;">Henüz konum eklenmedi.</p>';

    html = html.replace('<audio id="bgMusic" loop><source src="" id="musicSource" type="audio/mpeg"></audio>', `<audio id="bgMusic" loop autoplay><source src="${db.bgMusicUrl}" type="audio/mpeg"></audio>`);
    
    html += `
    <script>
        window.addEventListener('DOMContentLoaded', () => {
            const locContainer = document.createElement('div');
            locContainer.style.maxWidth = '900px'; locContainer.style.margin = '20px auto 0 auto'; locContainer.style.padding = '0 15px';
            locContainer.innerHTML = '<h2 style="margin:0 0 10px 0; font-size:18px;">📍 Özel Noktalarımız</h2>' + \`${locationsHTML}\`;
            document.body.insertBefore(locContainer, document.body.children[2]);

            const gridContainer = document.createElement('div');
            gridContainer.style.maxWidth = '900px'; gridContainer.style.margin = '20px auto'; gridContainer.style.padding = '0 15px';
            gridContainer.innerHTML = '<h2 style="margin:0 0 12px 0; font-size:18px;">💌 Paylaşımlarımız</h2>' +
                '<div class="filter-tabs">' +
                    '<button class="filter-btn ${filter === 'Tümü' ? 'active' : ''}" onclick="location.href=\\'/notlar?cat=Tümü\\'">Tümü</button>' +
                    '<button class="filter-btn ${filter === 'Notlar' ? 'active' : ''}" onclick="location.href=\\'/notlar?cat=Notlar\\'">📌 Notlar</button>' +
                    '<button class="filter-btn ${filter === 'Mekanlar' ? 'active' : ''}" onclick="location.href=\\'/notlar?cat=Mekanlar\\'">☕ Mekanlar</button>' +
                    '<button class="filter-btn ${filter === 'Öneriler' ? 'active' : ''}" onclick="location.href=\\'/notlar?cat=Öneriler\\'">💡 Öneriler</button>' +
                    '<button class="filter-btn ${filter === 'Diğer' ? 'active' : ''}" onclick="location.href=\\'/notlar?cat=Diğer\\'">✨ Diğer</button>' +
                '</div>' +
                '<div class="memory-grid">' + \`${memoriesHTML}\` + '</div>';
            document.body.appendChild(gridContainer);

            const bucketBox = document.querySelector('#bucketModal .modal-content');
            if(bucketBox) {
                const listDiv = document.createElement('div');
                listDiv.style.marginBottom = '12px'; listDiv.style.maxHeight = '180px'; listDiv.style.overflowY = 'auto';
                listDiv.innerHTML = \`${bucketListHTML}\`;
                bucketBox.insertBefore(listDiv, bucketBox.children[1]);
            }
        });
    </script>`;

    res.send(html);
});

// Veri İşleme Rotaları
app.post('/ekle', upload.single('image'), async (req, res) => {
    const db = await getDB();
    let imgUrl = req.body.audioData || '';
    if (req.file) imgUrl = `data:${req.file.mimetype};base64,${Buffer.from(req.file.buffer).toString('base64')}`;
    db.gallery.push({ id: Date.now().toString(), title: req.body.title, category: req.body.category, note: req.body.note, imgUrl, date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) });
    db.markModified('gallery'); await db.save();
    res.redirect('/notlar');
});

app.post('/muzik-yukle', upload.single('musicFile'), async (req, res) => {
    const db = await getDB();
    if (req.file) {
        db.bgMusicUrl = `data:${req.file.mimetype};base64,${Buffer.from(req.file.buffer).toString('base64')}`;
        db.markModified('bgMusicUrl'); await db.save();
    }
    res.redirect('/notlar');
});

app.post('/konum-ekle', async (req, res) => {
    const db = await getDB();
    db.specialLocations.push({ id: Date.now().toString(), title: req.body.title, mapsUrl: req.body.mapsUrl, note: req.body.note });
    db.markModified('specialLocations'); await db.save();
    res.redirect('/notlar');
});

app.get('/konum-sil/:id', async (req, res) => {
    const db = await getDB();
    db.specialLocations = db.specialLocations.filter(loc => loc.id !== req.params.id);
    db.markModified('specialLocations'); await db.save();
    res.redirect('/notlar');
});

app.post('/bucket-ekle', async (req, res) => {
    const db = await getDB();
    db.bucketList.push({ id: Date.now().toString(), text: req.body.text, completed: false });
    db.markModified('bucketList'); await db.save();
    res.redirect('/notlar');
});

app.get('/bucket-toggle/:id', async (req, res) => {
    const db = await getDB();
    const item = db.bucketList.find(b => b.id === req.params.id);
    if (item) item.completed = !item.completed;
    db.markModified('bucketList'); await db.save();
    res.redirect('/notlar');
});

app.get('/sil/:id', async (req, res) => {
    const db = await getDB();
    db.gallery = db.gallery.filter(m => m.id !== req.params.id);
    db.markModified('gallery'); await db.save();
    res.redirect('/notlar');
});

app.get('/cikis', (req, res) => { res.cookie('memory_auth', '', { maxAge: 0 }); res.redirect('/'); });

app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor...`));