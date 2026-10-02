// ============================================================================
// BİZİM ALANIMIZ - KATEGORİLİ VE ÖZELLEŞTİRİLEBİLİR TAM SÜRÜM (ŞİFRE: 1234)
// ============================================================================
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const { google } = require('googleapis');
const stream = require('stream');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(__dirname));

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 30 * 1024 * 1024 }
});

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://polatberat15_db_user:BURAYA_SIFRENİ_YAZ@cluster0.tuqm6tr.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log('✨ Ortak Alan Veritabanına Bağlandı!'))
    .catch(err => console.error('MongoDB Bağlantı Hatası:', err));

const GOOGLE_FOLDER_ID = "1KIwGp39OyIZpdsL7rlQ72LCmDYLAMqAF";
const credentials = {
  "type": "service_account",
  "project_id": "woven-plane-506911-m8",
  "private_key_id": "8044520d001b5a5997aecfe45ec07da24a61b5a5",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCqwOSrubTVKk27\nu+N0DAx8os9WpQWmhHo3ikluRJWPb1sG/g5ESi75aY/9idLlFAca1JNMOQh0iqYd\nlI8mlTzO18F0gGaisAQREn2fIb/MuH/WoT3lJSc9f3/fpE8PrlmLqCwDz/j3kSkT\n4Lf7OJnTO6Xrb1MooPiDDvwMQgqIzjSwgJ2CGJkBRLgpYTrxYYibxyR2RY6hbk92\nd7r99mJIFAPklQ4thgJoCNT36hvo+/K5iTKIurUB9cFLMayOgy5bF+Brdn2snziF\nLOQuxgGf0Wwto0ggHty+9XTg5xWcks+kISLsrNZ/obiGx8eav/HhICsX81kYUTzz\nHDV2dzNNAgMBAAECggEAKU8MkyHUZlx7XT89bcnrbGyb0eeO2CPFCHI3RQqpDv/+\nytCEBY/X0OVxnQHuiBZiCKLkNqS2j7EqMk5KGmiwww6NweA9VD7WYQXy56BLzRxW\awdrmKe2GEnj1ugia1X/2ko3Sb3Sypuuzx0GjWt6RVCxGWW/fb0Bmf0yS0nf0AwD\nW//I+G5vMPknjPT7QIPyEjt6YGCGoox7lYLSD8tCmLa+4lR7xaYqwDLH2TLDJ+jf\nqPiIzrb55lgegv/aCiLDHYFsU4yeZIh9x5TvFXiTlG/7xeT+qerD6kTU1ljqkgoc\n4AxTGgQvlxJ2KQTILE8GVxFIXaUVP8StnoSeX3UrkQKBgQDhw8nPfsSAOGA83lXd\naguDieQzZKCfEYBsj2QigZaV16iw0DzBjBNj/3p1hWbXT5Yef0l+y+sKuwmSWxQp\ln+h9va3fIf7luEBXv7bESlZGkGa3ZGvdpPSPqV75ZeEEWV+xiE1yr7xwwCNysYi\nhxXJpBey4M94FJD/p1FmCO21PQKBgQDBnxMwGZie9MwsLFAaHNmkK96c1aUpYcW4\NhAoxyTSKNPttsw8+4Or0wnN+60aIYRaXiXKWMhXQAxBvy5lcOHd2ri00t6rVkVK\7Gl372sDykCaZ30zQ19semYVZ6RnbAb9RAK1i+UG/d51qr4c2canS1tuimzPjOzm\nDpSrIx/3UQKBgQCp2RuGIJADCubURE0DE9nvrxjg1U7F/WvJwKMMFsRMnP/Lbg6X\naiPYcocVzTQOvlBpR0fqvc1puEc+NYlYtGH3Xw5EAstnKx7CYk6IT0P1RfyfXxxQ\njnwti3YCXTt9X30lQDgR+SNoTVWoVypzJX/twKcXq2xKoeZof9+MTSFQ3QKBgQCy\nXvDXVA1FCvH5E82rcL6TvpJzW2KvT9JNVQjn+CYUseYjTU60M2Tm6yFSMLQUqaH7\nelZIJihSML/Z5d1BOI/ryS517vmRUIW/czHqepbUxANl+0bc7gk/rzbSK0vKtztt\ILV6OGmCWmgRcH15qKqYvhR6Lm31erdXbUFKs64kMQKBgBYIWnNfEnnA4pi8w0Yt\JSfkl7jjyaLxF2vt0ZeE+4aTEmMMw8Mh5tIgqKNBurq9CWxqJBJM4w2OD0MGDfVq\nlATOW/kXxZcDi4eidDT/nES3XyQnrYLSt2VdH1NRQu3RdG51rE+/O9F0jiF+JoMA\ZkOIsXqAReUoz0CcDalZnLHx\n-----END PRIVATE KEY-----\n",
  "client_email": "an-defteri@woven-plane-506911-m8.iam.gserviceaccount.com",
  "client_id": "107057228797529025368",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/an-defteri%40woven-plane-506911-m8.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file']
});
const drive = google.drive({ version: 'v3', auth });

async function uploadToDrive(fileObject) {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);

    const fileMetadata = {
        name: Date.now() + '-' + fileObject.originalname,
        parents: [GOOGLE_FOLDER_ID]
    };

    const media = {
        mimeType: fileObject.mimetype,
        body: bufferStream
    };

    const response = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
    });

    const fileId = response.data.id;

    await drive.permissions.create({
        fileId: fileId,
        requestBody: { role: 'reader', type: 'anyone' }
    });

    return `https://lh3.googleusercontent.com/d/${fileId}`;
}

const MemorySchema = new mongoose.Schema({
    accessPassword: { type: String, default: "1234" },
    gallery: { type: Array, default: [] },
    bucketList: { type: Array, default: [
        { id: '1', text: 'Güzel bir mekanda kahve içmek ☕', completed: false },
        { id: '2', text: 'Ortak bir müzik listesi yapmak 🎶', completed: false },
        { id: '3', text: 'Keyifli vakit geçirmek ✨', completed: false }
    ]},
    bgMusicUrl: { type: String, default: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf7f6.mp3?filename=romantic-guitars-112174.mp3" },
    specialLocations: { type: Array, default: [
        { id: '1', title: 'İlk Buluştuğumuz Yer ☕', mapsUrl: 'https://maps.google.com/?q=Istanbul', note: 'Güzel bir sohbete başladığımız o ilk köşe...' }
    ]}
});

const MemoryModel = mongoose.model('MemoryDataV3', MemorySchema);

async function getDB() {
    let doc = await MemoryModel.findOne();
    if (!doc) {
        doc = await MemoryModel.create({ 
            accessPassword: "1234", 
            gallery: [], 
            bucketList: [], 
            bgMusicUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf7f6.mp3?filename=romantic-guitars-112174.mp3",
            specialLocations: [
                { id: '1', title: 'İlk Buluştuğumuz Yer ☕', mapsUrl: 'https://maps.google.com/?q=Istanbul', note: 'Güzel bir sohbete başladığımız o ilk köşe...' }
            ]
        });
    } else if (doc.accessPassword !== "1234") {
        doc.accessPassword = "1234";
        await doc.save();
    }
    if (!Array.isArray(doc.gallery)) doc.gallery = [];
    if (!Array.isArray(doc.bucketList) || doc.bucketList.length === 0) {
        doc.bucketList = [
            { id: '1', text: 'Güzel bir mekanda kahve içmek ☕', completed: false },
            { id: '2', text: 'Ortak bir müzik listesi yapmak 🎶', completed: false },
            { id: '3', text: 'Keyifli vakit geçirmek ✨', completed: false }
        ];
        await doc.save();
    }
    if (!Array.isArray(doc.specialLocations)) {
        doc.specialLocations = [
            { id: '1', title: 'İlk Buluştuğumuz Yer ☕', mapsUrl: 'https://maps.google.com/?q=Istanbul', note: 'Güzel bir sohbete başladığımız o ilk köşe...' }
        ];
        await doc.save();
    }
    return doc;
}

const themeStyle = `
<style>
    :root { 
        --primary: #4f46e5; 
        --accent: #06b6d4; 
        --bg: #f8fafc; 
        --text: #1e293b; 
        --card-bg: #ffffff;
        --input-bg: #f1f5f9;
        --border-color: #e2e8f0;
    }
    body.dark-mode {
        --primary: #818cf8;
        --accent: #22d3ee;
        --bg: #0f172a;
        --text: #f1f5f9;
        --card-bg: #1e293b;
        --input-bg: #0f172a;
        --border-color: #334155;
    }
    html, body { height: 100%; margin: 0; padding: 0; }
    body { 
        font-family: 'Segoe UI', sans-serif; 
        background: var(--bg); 
        background-attachment: fixed;
        padding-bottom: 60px; 
        color: var(--text); 
        -webkit-tap-highlight-color: transparent; 
        position: relative;
        min-height: 100vh;
        transition: background 0.3s, color 0.3s;
    }
    body::before {
        content: "✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧";
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        text-align: justify;
        color: rgba(79, 70, 229, 0.06);
        font-size: 22px; line-height: 2.2; letter-spacing: 25px;
        pointer-events: none; z-index: 0; overflow: hidden;
    }
    body.dark-mode::before {
        color: rgba(129, 140, 248, 0.04);
    }
    .header-card { 
        background: linear-gradient(135deg, #4f46e5, #06b6d4); 
        color: white; 
        padding: 50px 20px 35px 20px; 
        border-radius: 0 0 35px 35px; 
        text-align: center; 
        box-shadow: 0 10px 25px rgba(79, 70, 229, 0.2); 
        position: relative; z-index: 2; 
    }
    .top-buttons { position: absolute; top: 35px; right: 20px; display: flex; gap: 8px; }
    .icon-btn { background: rgba(255,255,255,0.25); border: none; color: white; font-size: 16px; width: 38px; height: 38px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); transition: 0.2s; }
    .icon-btn:hover { background: rgba(255,255,255,0.4); transform: scale(1.05); }
    
    .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); z-index: 100; backdrop-filter: blur(4px); justify-content: center; align-items: center; padding: 15px; box-sizing: border-box; }
    .modal-content { background: var(--card-bg); color: var(--text); width: 100%; max-width: 450px; padding: 25px; border-radius: 24px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); position: relative; animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid var(--border-color); z-index: 101; max-height: 90vh; overflow-y: auto; }
    @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    
    .card { background: var(--card-bg); color: var(--text); padding: 22px; border-radius: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.04); margin-bottom: 20px; border: 1px solid var(--border-color); position: relative; z-index: 2; }
    .btn-main { background: linear-gradient(135deg, #4f46e5, #06b6d4); color: white; border: none; padding: 12px 20px; border-radius: 14px; font-weight: bold; cursor: pointer; display: inline-block; text-decoration: none; text-align: center; width: 100%; box-shadow: 0 4px 12px rgba(79,70,229,0.25); transition: 0.2s; }
    .btn-main:hover { opacity: 0.95; transform: translateY(-1px); }
    
    input, textarea, select { width: 100%; padding: 12px 15px; margin: 6px 0 14px 0; border: 1px solid var(--border-color); border-radius: 12px; background: var(--input-bg); box-sizing: border-box; font-family: inherit; font-size: 14px; color: var(--text); outline: none; transition: 0.2s; }
    input:focus, textarea:focus, select:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
    
    .filter-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px; margin-bottom: 15px; }
    .filter-btn { background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text); padding: 6px 14px; border-radius: 20px; font-size: 13px; cursor: pointer; white-space: nowrap; transition: 0.2s; }
    .filter-btn.active { background: var(--primary); color: white; border-color: var(--primary); }

    .memory-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 10px; position: relative; z-index: 2; }
    .memory-card { background: var(--card-bg); color: var(--text); border-radius: 20px; overflow: hidden; box-shadow: 0 8px 22px rgba(0,0,0,0.06); border: 1px solid var(--border-color); display: flex; flex-direction: column; transition: 0.3s; }
    .memory-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(79,70,229,0.12); }
    
    .bucket-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--input-bg); border-radius: 12px; margin-bottom: 8px; border: 1px solid var(--border-color); }
</style>`;

app.get('/', async (req, res) => {
    if (req.cookies.memory_auth === 'true') return res.redirect('/notlar');
    
    res.send(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Ortak Alan</title>${themeStyle}</head>
    <body class="${req.cookies.theme === 'dark' ? 'dark-mode' : ''}">
        <div class="header-card">
            <h1 style="margin:0; font-size:26px;">✨ Ortak Alanımız</h1>
            <p style="margin:8px 0 0 0; opacity:0.9; font-size:13px;">Güzel anlar ve ortak paylaşımlar için...</p>
        </div>
        <div style="max-width:380px; margin:40px auto; padding:0 20px; position:relative; z-index:2;">
            <form action="/giris" method="POST" class="card" style="text-align:center; padding:30px 20px;">
                <h3 style="color:var(--primary); margin-top:0;">🔐 Erişim Şifresi</h3>
                <p style="font-size:13px; opacity:0.8; margin-bottom:18px;">Devam etmek için şifreyi girmen yeterli:</p>
                <input type="password" name="password" placeholder="••••" required style="text-align:center; font-size:24px; letter-spacing:6px;">
                <button type="submit" class="btn-main" style="margin-top:12px; padding:14px; font-size:16px;">Giriş Yap ✨</button>
            </form>
        </div>
    </body></html>`);
});

app.post('/giris', async (req, res) => {
    const db = await getDB();
    if (req.body.password === db.accessPassword) {
        res.cookie('memory_auth', 'true', { maxAge: 365 * 24 * 60 * 60 * 1000 });
        res.redirect('/notlar');
    } else {
        res.send(`<script>alert("Hatalı şifre!"); window.location.href="/";</script>`);
    }
});

app.get('/notlar', async (req, res) => {
    if (req.cookies.memory_auth !== 'true') return res.redirect('/');
    const db = await getDB();
    const filter = req.query.cat || 'Tümü';

    let filteredGallery = db.gallery;
    if (filter !== 'Tümü') {
        filteredGallery = db.gallery.filter(m => m.category === filter);
    }

    let memoriesHTML = filteredGallery.map(m => {
        let mediaEl = '';
        if (m.imgUrl) {
            if (m.imgUrl.includes('.mp4') || m.imgUrl.includes('video')) {
                mediaEl = `<video controls width="100%" style="height:260px; object-fit:cover; background:black;"><source src="${m.imgUrl}"></video>`;
            } else if (m.imgUrl.includes('.mp3') || m.imgUrl.includes('audio') || m.imgUrl.includes('webm') || m.imgUrl.includes('wav')) {
                mediaEl = `<div style="padding:30px 20px; background:var(--input-bg); text-align:center;"><p style="margin:0 0 10px 0; font-weight:bold; color:var(--primary);">🎙️ Sesli Not</p><audio controls width="100%" style="width:100%;"><source src="${m.imgUrl}"></audio></div>`;
            } else {
                mediaEl = `<img src="${m.imgUrl}" style="width:100%; height:260px; object-fit:cover; display:block;">`;
            }
        } else {
            mediaEl = `<div style="height:100px; background:var(--input-bg); display:flex; align-items:center; justify-content:center; font-size:28px;">📌</div>`;
        }
            
        return `
        <div class="memory-card">
            ${mediaEl}
            <div style="padding:18px; display:flex; flex-direction:column; flex-grow:1;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="font-size:12px; color:var(--primary); font-weight:bold;">✨ ${m.date}</span>
                    <span style="font-size:11px; background:var(--input-bg); padding:2px 8px; border-radius:10px; opacity:0.8;">${m.category || 'Notlar'}</span>
                </div>
                <h3 style="margin:0 0 8px 0; font-size:18px;">${m.title}</h3>
                <p style="margin:0 0 15px 0; font-size:14px; opacity:0.8; line-height:1.5; flex-grow:1; white-space: pre-wrap;">${m.note || ''}</p>
                <a href="/sil/${m.id}" onclick="return confirm('Bu notu silmek istediğine emin misin?')" style="color:#ef4444; font-size:12px; text-decoration:none; align-self:flex-end; font-weight:bold;">🗑️ Sil</a>
            </div>
        </div>`;
    }).reverse().join('') || '<p style="text-align:center; opacity:0.8; grid-column: 1/-1; padding:60px; font-size:15px; position:relative; z-index:2;">Bu kategoride henüz bir paylaşım yok. Sağ üstteki menüden ekleyebilirsin! 📌</p>';

    let bucketListHTML = db.bucketList.map(item => `
        <div class="bucket-item">
            <span style="font-size:14px; text-decoration: ${item.completed ? 'line-through' : 'none'}; opacity: ${item.completed ? '0.6' : '1'};">${item.text}</span>
            <a href="/bucket-toggle/${item.id}" style="text-decoration:none; font-size:18px;" title="Tamamlandı olarak işaretle">${item.completed ? '✅' : '⬜'}</a>
        </div>
    `).join('');

    let locationsHTML = db.specialLocations.map(loc => `
        <div class="card" style="background: linear-gradient(135deg, var(--card-bg), var(--input-bg)); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px; margin-bottom: 12px;">
            <div style="flex: 1; min-width: 240px;">
                <span style="font-size: 11px; font-weight: bold; color: var(--primary); text-transform: uppercase; letter-spacing: 1px;">📍 Özel Nokta</span>
                <h3 style="margin: 4px 0 6px 0; font-size: 18px;">${loc.title}</h3>
                <p style="margin: 0 0 8px 0; font-size: 13px; opacity: 0.8; line-height: 1.4;">${loc.note}</p>
                <a href="/konum-sil/${loc.id}" onclick="return confirm('Bu konumu silmek istediğine emin misin?')" style="color:#ef4444; font-size:11px; text-decoration:none; font-weight:bold;">🗑️ Konumu Sil</a>
            </div>
            <div>
                <a href="${loc.mapsUrl}" target="_blank" class="btn-main" style="padding: 10px 18px; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; text-decoration: none;">🗺️ Haritada Gör</a>
            </div>
        </div>
    `).join('') || '<p style="text-align:center; opacity:0.8; font-size:13px; padding:10px;">Henüz özel bir konum eklemedik. Sağ üstteki 📍 butonundan ekleyebilirsin!</p>';

    res.send(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Ortak Alan</title>${themeStyle}</head>
    <body class="${req.cookies.theme === 'dark' ? 'dark-mode' : ''}">
        
        <audio id="bgMusic" loop>
            <source src="${db.bgMusicUrl}" type="audio/mpeg">
        </audio>

        <div class="header-card">
            <div class="top-buttons">
                <button class="icon-btn" onclick="toggleTheme()" title="Gece/Gündüz Modu">🌓</button>
                <button class="icon-btn" onclick="toggleMusic()" id="musicBtn" title="Müzik Aç/Kapat">🎵</button>
                <button class="icon-btn" onclick="toggleModal('locationModal', true)" title="Özel Konum Ekle">📍</button>
                <button class="icon-btn" onclick="toggleModal('musicSettingsModal', true)" title="Müzik Dosyası Yükle">⚙️</button>
                <button class="icon-btn" onclick="toggleModal('memoryModal', true)" title="Yeni Not Ekle">➕</button>
                <button class="icon-btn" onclick="toggleModal('bucketModal', true)" title="Plan Listesi">🎯</button>
            </div>
            <h1 style="margin:0; font-size:26px;">✨ Ortak Alanımız</h1>
            <p style="margin:6px 0 0 0; opacity:0.9; font-size:13px;">Ufak tefek kırgınlıklar geride kaldıysa, kaldığımız yerden devam edelim...</p>
        </div>

        <!-- ÖZEL KONUMLAR LİSTESİ -->
        <div style="max-width:900px; margin:25px auto 0 auto; padding:0 15px; position:relative; z-index:2;">
            <h2 style="margin:0 0 12px 0; font-size:20px;">📍 Özel Noktalarımız</h2>
            ${locationsHTML}
        </div>

        <!-- KONUM EKLEME MODALI -->
        <div id="locationModal" class="modal-overlay">
            <div class="modal-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="color:var(--primary); margin:0;">📍 Yeni Konum Ekle</h3>
                    <button onclick="toggleModal('locationModal', false)" style="background:none; border:none; font-size:24px; cursor:pointer; color:var(--text); padding:0;">&times;</button>
                </div>
                <form action="/konum-ekle" method="POST" style="margin:0;">
                    <label style="font-size:12px; font-weight:bold;">Mekan Başlığı</label>
                    <input type="text" name="title" placeholder="Örn: Gittiğimiz kafe" required>
                    
                    <label style="font-size:12px; font-weight:bold;">Google Maps Konum Linki</label>
                    <input type="text" name="mapsUrl" placeholder="https://maps.google.com/..." required>
                    
                    <label style="font-size:12px; font-weight:bold;">Not</label>
                    <textarea name="note" placeholder="Burayla ilgili küçük bir not..." rows="2" required></textarea>
                    
                    <button type="submit" class="btn-main" style="padding:12px; font-size:14px; margin-top:5px;">Listeye Ekle ✨</button>
                </form>
            </div>
        </div>

        <div id="musicSettingsModal" class="modal-overlay">
            <div class="modal-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="color:var(--primary); margin:0;">🎶 Arka Plan Şarkısı</h3>
                    <button onclick="toggleModal('musicSettingsModal', false)" style="background:none; border:none; font-size:24px; cursor:pointer; color:var(--text); padding:0;">&times;</button>
                </div>
                <form action="/muzik-yukle" method="POST" enctype="multipart/form-data" style="margin:0;">
                    <input type="file" name="musicFile" accept="audio/*" required style="background:var(--card-bg); padding:8px; margin-bottom:14px;">
                    <button type="submit" class="btn-main" style="padding:12px; font-size:14px;">Şarkıyı Yükle ✨</button>
                </form>
            </div>
        </div>

        <div id="memoryModal" class="modal-overlay">
            <div class="modal-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="color:var(--primary); margin:0;">✨ Yeni Paylaşım</h3>
                    <button onclick="toggleModal('memoryModal', false)" style="background:none; border:none; font-size:24px; cursor:pointer; color:var(--text); padding:0;">&times;</button>
                </div>
                <form action="/ekle" method="POST" enctype="multipart/form-data" style="margin:0;">
                    <label style="font-size:12px; font-weight:bold;">Kategori Seç</label>
                    <select name="category">
                        <option value="Notlar">📌 Notlar</option>
                        <option value="Mekanlar">☕ Mekanlar</option>
                        <option value="Öneriler">💡 Öneriler / Tavsiyeler</option>
                        <option value="Diğer">✨ Diğer</option>
                    </select>

                    <label style="font-size:12px; font-weight:bold;">Başlık</label>
                    <input type="text" name="title" placeholder="Örn: Keyifli bir gün" required>
                    
                    <label style="font-size:12px; font-weight:bold;">Medya (Foto, Video, Ses)</label>
                    <input type="file" name="image" id="fileInput" accept="image/*,video/*,audio/*" style="background:var(--card-bg); padding:8px;">
                    
                    <div style="background:var(--input-bg); padding:12px; border-radius:12px; margin-bottom:14px; border:1px dashed var(--border-color); text-align:center;">
                        <p style="margin:0 0 8px 0; font-size:12px; font-weight:bold;">🎙️ Veya Canlı Ses Kaydet</p>
                        <button type="button" id="recBtn" style="background:#4f46e5; color:white; border:none; padding:10px 15px; border-radius:10px; font-weight:bold; cursor:pointer;" onclick="toggleRecording()">🔴 Kaydı Başlat</button>
                        <span id="recStatus" style="font-size:12px; opacity:0.7; display:block; margin-top:6px;">Kayıt yapılmadı</span>
                        <audio id="audioPlayback" controls style="width:100%; margin-top:8px; display:none;"></audio>
                    </div>
                    <input type="hidden" name="audioData" id="audioData">

                    <label style="font-size:12px; font-weight:bold;">İçerik / Notun</label>
                    <textarea name="note" placeholder="Bugünden kalan güzel bir detay..." rows="3" required></textarea>
                    
                    <button type="submit" class="btn-main" style="padding:12px; font-size:15px; margin-top:5px;">Kaydet ✨</button>
                </form>
            </div>
        </div>

        <div id="bucketModal" class="modal-overlay">
            <div class="modal-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="color:var(--primary); margin:0;">🎯 Yapılacaklar Listesi</h3>
                    <button onclick="toggleModal('bucketModal', false)" style="background:none; border:none; font-size:24px; cursor:pointer; color:var(--text); padding:0;">&times;</button>
                </div>
                <div style="margin-bottom:15px; max-height:200px; overflow-y:auto;">
                    ${bucketListHTML}
                </div>
                <form action="/bucket-ekle" method="POST" style="margin:0;">
                    <input type="text" name="text" placeholder="Yeni bir fikir ekle..." required>
                    <button type="submit" class="btn-main" style="padding:10px; font-size:14px;">Listeye Ekle ✨</button>
                </form>
            </div>
        </div>

        <div style="max-width:900px; margin:25px auto; padding:0 15px; position:relative; z-index:2;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h2 style="margin:0; font-size:20px;">💌 Paylaşımlarımız</h2>
                <a href="/cikis" style="color:#ef4444; font-size:12px; text-decoration:none; font-weight:bold;">Güvenli Çıkış</a>
            </div>

            <!-- KATEGORİ FİLTRELEME SEKMELERİ -->
            <div class="filter-tabs">
                <button class="filter-btn ${filter === 'Tümü' ? 'active' : ''}" onclick="location.href='/notlar?cat=Tümü'">Tümü</button>
                <button class="filter-btn ${filter === 'Notlar' ? 'active' : ''}" onclick="location.href='/notlar?cat=Notlar'">📌 Notlar</button>
                <button class="filter-btn ${filter === 'Mekanlar' ? 'active' : ''}" onclick="location.href='/notlar?cat=Mekanlar'">☕ Mekanlar</button>
                <button class="filter-btn ${filter === 'Öneriler' ? 'active' : ''}" onclick="location.href='/notlar?cat=Öneriler'">💡 Öneriler</button>
                <button class="filter-btn ${filter === 'Diğer' ? 'active' : ''}" onclick="location.href='/notlar?cat=Diğer'">✨ Diğer</button>
            </div>
            
            <div class="memory-grid">
                ${memoriesHTML}
            </div>
        </div>

        <script>
            function toggleModal(modalId, open) {
                document.getElementById(modalId).style.display = open ? 'flex' : 'none';
            }

            function toggleTheme() {
                const isDark = document.body.classList.toggle('dark-mode');
                document.cookie = "theme=" + (isDark ? "dark" : "light") + "; max-age=31536000; path=/";
            }

            const bgMusic = document.getElementById('bgMusic');
            let isPlaying = false;

            window.addEventListener('DOMContentLoaded', () => {
                bgMusic.volume = 0.6;
                bgMusic.play().then(() => {
                    isPlaying = true;
                    document.getElementById('musicBtn').textContent = "🔇";
                }).catch(e => {
                    const unlockAudio = () => {
                        bgMusic.play().then(() => {
                            isPlaying = true;
                            document.getElementById('musicBtn').textContent = "🔇";
                            window.removeEventListener('click', unlockAudio);
                            window.removeEventListener('touchstart', unlockAudio);
                        }).catch(err => console.log("Müzik çalma hatası:", err));
                    };
                    window.addEventListener('click', unlockAudio);
                    window.addEventListener('touchstart', unlockAudio);
                });
            });

            function toggleMusic() {
                const musicBtn = document.getElementById('musicBtn');
                if (isPlaying) {
                    bgMusic.pause();
                    musicBtn.textContent = "🎵";
                    isPlaying = false;
                } else {
                    bgMusic.play().then(() => {
                        musicBtn.textContent = "🔇";
                        isPlaying = true;
                    });
                }
            }

            let mediaRecorder;
            let audioChunks = [];
            let isRecording = false;

            async function toggleRecording() {
                const recBtn = document.getElementById('recBtn');
                const recStatus = document.getElementById('recStatus');
                const audioPlayback = document.getElementById('audioPlayback');
                const audioDataInput = document.getElementById('audioData');
                const fileInput = document.getElementById('fileInput');

                if (!isRecording) {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        mediaRecorder = new MediaRecorder(stream);
                        audioChunks = [];

                        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
                        mediaRecorder.onstop = async () => {
                            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                            const reader = new FileReader();
                            reader.readAsDataURL(audioBlob);
                            reader.onloadend = function() {
                                audioDataInput.value = reader.result;
                                audioPlayback.src = reader.result;
                                audioPlayback.style.display = 'block';
                            };
                            fileInput.value = '';
                        };

                        mediaRecorder.start();
                        isRecording = true;
                        recBtn.textContent = "⏹️ Kaydı Durdur";
                        recBtn.style.background = "#b91c1c";
                        recStatus.textContent = "Kayıt yapılıyor...";
                    } catch (err) {
                        alert("Mikrofon izni alınamadı!");
                    }
                } else {
                    mediaRecorder.stop();
                    isRecording = false;
                    recBtn.textContent = "🔴 Yeniden Kaydet";
                    recBtn.style.background = "#4f46e5";
                    recStatus.textContent = "Ses kaydı başarıyla alındı! ✨";
                }
            }
        </script>
    </body></html>`);
});

app.post('/ekle', upload.single('image'), async (req, res) => {
    if (req.cookies.memory_auth !== 'true') return res.redirect('/');
    const db = await getDB();

    let imgUrl = '';
    if (req.body.audioData) {
        try {
            const matches = req.body.audioData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const buffer = Buffer.from(matches[2], 'base64');
                imgUrl = await uploadToDrive({ buffer: buffer, originalname: 'sesli-not.webm', mimetype: matches[1] });
            }
        } catch (err) { console.error(err); }
    } else if (req.file && req.file.buffer.length > 0) {
        try {
            imgUrl = await uploadToDrive(req.file);
        } catch (err) {
            return res.send(`<script>alert("Dosya yüklenirken hata oluştu!"); window.location.href="/notlar";</script>`);
        }
    }

    db.gallery.push({
        id: Date.now().toString(),
        title: req.body.title,
        category: req.body.category || 'Notlar',
        note: req.body.note || '',
        imgUrl: imgUrl,
        date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    });

    db.markModified('gallery');
    await db.save();
    res.redirect('/notlar');
});

app.post('/muzik-yukle', upload.single('musicFile'), async (req, res) => {
    if (req.cookies.memory_auth !== 'true') return res.redirect('/');
    const db = await getDB();
    if (req.file && req.file.buffer.length > 0) {
        try {
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            db.bgMusicUrl = `data:${req.file.mimetype};base64,${b64}`;
            db.markModified('bgMusicUrl');
            await db.save();
        } catch (err) {
            console.error("Müzik yükleme hatası:", err);
        }
    }
    res.redirect('/notlar');
});

app.post('/konum-ekle', async (req, res) => {
    if (req.cookies.memory_auth !== 'true') return res.redirect('/');
    const db = await getDB();
    db.specialLocations.push({
        id: Date.now().toString(),
        title: req.body.title,
        mapsUrl: req.body.mapsUrl,
        note: req.body.note
    });
    db.markModified('specialLocations');
    await db.save();
    res.redirect('/notlar');
});

app.get('/konum-sil/:id', async (req.res || req), async (res) => {
    // Express context fix
    const response = res.setHeader ? res : req;
    const request = res.setHeader ? req : res;
    // Standard handling below
});

// Güvenli silme yönlendirmeleri
app.get('/konum-sil/:id', async (req, res) => {
    if (req.cookies.memory_auth !== 'true') return res.redirect('/');
    const db = await getDB();
    db.specialLocations = db.specialLocations.filter(loc => loc.id !== req.params.id);
    db.markModified('specialLocations');
    await db.save();
    res.redirect('/notlar');
});

app.post('/bucket-ekle', async (req, res) => {
    if (req.cookies.memory_auth !== 'true') return res.redirect('/');
    const db = await getDB();
    db.bucketList.push({ id: Date.now().toString(), text: req.body.text, completed: false });
    db.markModified('bucketList');
    await db.save();
    res.redirect('/notlar');
});

app.get('/bucket-toggle/:id', async (req, res) => {
    if (req.cookies.memory_auth !== 'true') return res.redirect('/');
    const db = await getDB();
    const item = db.bucketList.find(b => b.id === req.params.id);
    if (item) item.completed = !item.completed;
    db.markModified('bucketList');
    await db.save();
    res.redirect('/notlar');
});

app.get('/sil/:id', async (req, res) => {
    if (req.cookies.memory_auth !== 'true') return res.redirect('/');
    const db = await getDB();
    db.gallery = db.gallery.filter(m => m.id !== req.params.id);
    db.markModified('gallery');
    await db.save();
    res.redirect('/notlar');
});

app.get('/cikis', (req, res) => {
    res.cookie('memory_auth', '', { maxAge: 0 });
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`✨ Ortak Alan sunucusu port ${PORT} üzerinde çalışıyor!`);
});