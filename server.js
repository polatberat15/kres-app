// ============================================================================
// BİZİM ANI DEFTERİMİZ - FULL ARKA PLAN KALPLİ SÜRÜM
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

app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.json({ limit: '100mb' }));
app.use(cookieParser());
app.use(express.static(__dirname));

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }
});

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://polatberat15_db_user:polat12345@cluster0.tuqm6tr.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log('❤️ Romantik Anı Defteri Bağlandı!'))
    .catch(err => console.error('MongoDB Bağlantı Hatası:', err));

const GOOGLE_FOLDER_ID = "1KIwGp39OyIZpdsL7rlQ72LCmDYLAMqAF";
const credentials = {
  "type": "service_account",
  "project_id": "woven-plane-506911-m8",
  "private_key_id": "8044520d001b5a5997aecfe45ec07da24a61b5a5",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCqwOSrubTVKk27\nu+N0DAx8os9WpQWmhHo3ikluRJWPb1sG/g5ESi75aY/9idLlFAca1JNMOQh0iqYd\nlI8mlTzO18F0gGaisAQREn2fIb/MuH/WoT3lJSc9f3/fpE8PrlmLqCwDz/j3kSkT\n4Lf7OJnTO6Xrb1MooPiDDvwMQgqIzjSwgJ2CGJkBRLgpYTrxYYibxyR2RY6hbk92\nd7r99mJIFAPklQ4thgJoCNT36hvo+/K5iTKIurUB9cFLMayOgy5bF+Brdn2snziF\nLOQuxgGf0Wwto0ggHty+9XTg5xWcks+kISLsrNZ/obiGx8eav/HhICsX81kYUTzz\nHDV2dzNNAgMBAAECggEAKU8MkyHUZlx7XT89bcnrbGyb0eeO2CPFCHI3RQqpDv/+\nytCEBY/X0OVxnQHuiBZiCKLkNqS2j7EqMk5KGmiwww6NweA9VD7WYQXy56BLzRxW\nawdrmKe2GEnj1ugia1X/2ko3Sb3Sypuuzx0GjWt6RVCxGWW/fb0Bmf0yS0nf0AwD\nW//I+G5vMPknjPT7QIPyEjt6YGCGoox7lYLSD8tCmLa+4lR7xaYqwDLH2TLDJ+jf\nqPiIzrb55lgegv/aCiLDHYFsU4yeZIh9x5TvFXiTlG/7xeT+qerD6kTU1ljqkgoc\n4AxTGgQvlxJ2KQTILE8GVxFIXaUVP8StnoSeX3UrkQKBgQDhw8nPfsSAOGA83lXd\naguDieQzZKCfEYBsj2QigZaV16iw0DzBjBNj/3p1hWbXT5Yef0l+y+sKuwmSWxQp\nln+h9va3fIf7luEBXv7bESlZGkGa3ZGvdpPSPqV75ZeEEWV+xiE1yr7xwwCNysYi\nhxXJpBey4M94FJD/p1FmCO21PQKBgQDBnxMwGZie9MwsLFAaHNmkK96c1aUpYcW4\NhAoxyTSKNPttsw8+4Or0wnN+60aIYRaXiXKWMhXQAxBvy5lcOHd2ri00t6rVkVK\n7Gl372sDykCaZ30zQ19semYVZ6RnbAb9RAK1i+UG/d51qr4c2canS1tuimzPjOzm\nDpSrIx/3UQKBgQCp2RuGIJADCubURE0DE9nvrxjg1U7F/WvJwKMMFsRMnP/Lbg6X\naiPYcocVzTQOvlBpR0fqvc1puEc+NYlYtGH3Xw5EAstnKx7CYk6IT0P1RfyfXxxQ\njnwti3YCXTt9X30lQDgR+SNoTVWoVypzJX/twKcXq2xKoeZof9+MTSFQ3QKBgQCy\nXvDXVA1FCvH5E82rcL6TvpJzW2KvT9JNVQjn+CYUseYjTU60M2Tm6yFSMLQUqaH7\nelZIJihSML/Z5d1BOI/ryS517vmRUIW/czHqepbUxANl+0bc7gk/rzbSK0vKtztt\ILV6OGmCWmgRcH15qKqYvhR6Lm31erdXbUFKs64kMQKBgBYIWnNfEnnA4pi8w0Yt\nJSfkl7jjyaLxF2vt0ZeE+4aTEmMMw8Mh5tIgqKNBurq9CWxqJBJM4w2OD0MGDfVq\nlATOW/kXxZcDi4eidDT/nES3XyQnrYLSt2VdH1NRQu3RdG51rE+/O9F0jiF+JoMA\nZkOIsXqAReUoz0CcDalZnLHx\n-----END PRIVATE KEY-----\n",
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
    accessPassword: { type: String, default: "1402" },
    gallery: { type: Array, default: [] }
});

const MemoryModel = mongoose.model('MemoryData', MemorySchema);

async function getDB() {
    let doc = await MemoryModel.findOne();
    if (!doc) doc = await MemoryModel.create({ accessPassword: "1402", gallery: [] });
    if (!Array.isArray(doc.gallery)) doc.gallery = [];
    return doc;
}

const themeStyle = `
<style>
    :root { --rose: #e11d48; --pink: #f43f5e; --bg: #fff1f2; --text: #4c0519; }
    html, body { 
        height: 100%;
        margin: 0;
        padding: 0;
    }
    body { 
        font-family: 'Segoe UI', sans-serif; 
        background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #fecdd3 100%); 
        background-attachment: fixed;
        padding-bottom: 60px; 
        color: var(--text); 
        -webkit-tap-highlight-color: transparent; 
        position: relative;
        min-height: 100vh;
    }
    /* Sayfanın en üstünden en altına kadar kalplerle ve minik simgelerle kaplı bir arka plan dokusu */
    body::before {
        content: "♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕 ♥ 💖 ♡ 💕";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        text-align: justify;
        color: rgba(225, 29, 72, 0.16);
        font-size: 26px;
        line-height: 2.2;
        letter-spacing: 25px;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
    }
    .header-card { background: linear-gradient(135deg, #f43f5e, #fb7185); color: white; padding: 35px 20px; border-radius: 0 0 35px 35px; text-align: center; box-shadow: 0 10px 25px rgba(244, 63, 94, 0.25); position: relative; z-index: 2; }
    .menu-btn { position: absolute; top: 22px; right: 20px; background: rgba(255,255,255,0.25); border: none; color: white; font-size: 22px; width: 42px; height: 42px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); transition: 0.2s; }
    .menu-btn:hover { background: rgba(255,255,255,0.4); transform: scale(1.05); }
    .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(76, 5, 25, 0.4); z-index: 100; backdrop-filter: blur(4px); justify-content: center; align-items: center; padding: 15px; box-sizing: border-box; }
    .modal-content { background: white; width: 100%; max-width: 450px; padding: 25px; border-radius: 24px; box-shadow: 0 15px 35px rgba(244,63,94,0.2); position: relative; animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 2px solid #ffe4e6; z-index: 101; }
    @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    .card { background: white; padding: 22px; border-radius: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.04); margin-bottom: 20px; border: 1px solid #ffe4e6; position: relative; z-index: 2; }
    .btn-main { background: linear-gradient(135deg, #f43f5e, #e11d48); color: white; border: none; padding: 12px 20px; border-radius: 14px; font-weight: bold; cursor: pointer; display: inline-block; text-decoration: none; text-align: center; width: 100%; box-shadow: 0 4px 12px rgba(244,63,94,0.3); transition: 0.2s; }
    .btn-main:hover { opacity: 0.95; transform: translateY(-1px); }
    input, textarea { width: 100%; padding: 12px 15px; margin: 6px 0 14px 0; border: 1px solid #fda4af; border-radius: 12px; background: #fff5f5; box-sizing: border-box; font-family: inherit; font-size: 14px; color: #4c0519; outline: none; transition: 0.2s; }
    input:focus, textarea:focus { border-color: #f43f5e; background: #fff; box-shadow: 0 0 0 3px rgba(244,63,94,0.1); }
    .memory-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 20px; position: relative; z-index: 2; }
    .memory-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 22px rgba(244,63,94,0.08); border: 1px solid #ffe4e6; display: flex; flex-direction: column; transition: 0.3s; }
    .memory-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(244,63,94,0.15); }
</style>`;

app.get('/', async (req, res) => {
    if (req.cookies.memory_auth === 'true') return res.redirect('/anilar');
    
    res.send(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Bizim Dünyamız</title>${themeStyle}</head><body>
        <div class="header-card" style="padding: 55px 20px;">
            <h1 style="margin:0; font-size:32px;">❤️ Sonsuz Hikayemiz</h1>
            <p style="margin:10px 0 0 0; opacity:0.9; font-size:14px;">Burası sadece ikimizin kalbinin attığı yer...</p>
        </div>
        <div style="max-width:380px; margin:50px auto; padding:0 20px; position:relative; z-index:2;">
            <form action="/giris" method="POST" class="card" style="text-align:center; padding:30px 20px;">
                <h3 style="color:var(--rose); margin-top:0;">🔒 Kalbinin Anahtarı</h3>
                <p style="font-size:13px; color:#881337; margin-bottom:18px;">Girmek için özel şifremizi gir sevgilim:</p>
                <input type="password" name="password" placeholder="••••" required style="text-align:center; font-size:24px; letter-spacing:6px;">
                <button type="submit" class="btn-main" style="margin-top:12px; padding:14px; font-size:16px;">Kapıyı Arala 💕</button>
            </form>
        </div>
    </body></html>`);
});

app.post('/giris', async (req, res) => {
    const db = await getDB();
    if (req.body.password === db.accessPassword) {
        res.cookie('memory_auth', 'true', { maxAge: 365 * 24 * 60 * 60 * 1000 });
        res.redirect('/anilar');
    } else {
        res.send(`<script>alert("Hatalı şifre sevgilim! 😊"); window.location.href="/";</script>`);
    }
});

app.get('/anilar', async (req, res) => {
    if (req.cookies.memory_auth !== 'true') return res.redirect('/');
    const db = await getDB();

    let memoriesHTML = db.gallery.map(m => {
        let mediaEl = '';
        if (m.imgUrl) {
            mediaEl = (m.imgUrl.includes('.mp4') || m.imgUrl.includes('video'))
                ? `<video controls width="100%" style="height:260px; object-fit:cover; background:black;"><source src="${m.imgUrl}"></video>`
                : `<img src="${m.imgUrl}" style="width:100%; height:260px; object-fit:cover; display:block;">`;
        } else {
            mediaEl = `<div style="height:120px; background:linear-gradient(135deg, #ffe4e6, #fecdd3); display:flex; align-items:center; justify-content:center; font-size:36px;">💌</div>`;
        }
            
        return `
        <div class="memory-card">
            ${mediaEl}
            <div style="padding:18px; display:flex; flex-direction:column; flex-grow:1;">
                <span style="font-size:12px; color:#f43f5e; font-weight:bold; margin-bottom:4px;">✨ ${m.date}</span>
                <h3 style="margin:0 0 8px 0; font-size:18px; color:#4c0519;">${m.title}</h3>
                <p style="margin:0 0 15px 0; font-size:14px; color:#6b7280; line-height:1.5; flex-grow:1; white-space: pre-wrap;">${m.note || ''}</p>
                <a href="/sil/${m.id}" onclick="return confirm('Bu güzel anıyı silmek istediğine emin misin?')" style="color:#ef4444; font-size:12px; text-decoration:none; align-self:flex-end; font-weight:bold;">🗑️ Sil</a>
            </div>
        </div>`;
    }).reverse().join('') || '<p style="text-align:center; color:#881337; grid-column: 1/-1; padding:60px; font-size:15px; position:relative; z-index:2;">Henüz buraya bir not veya anı eklemedik. Sağ üstteki üç noktaya dokunup ilk tatlı sözümüzü yazalım! 💌</p>';

    res.send(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Bizim Anılarımız</title>${themeStyle}</head><body>
        <div class="header-card">
            <button class="menu-btn" onclick="toggleModal(true)">⋮</button>
            <h1 style="margin:0; font-size:26px;">💖 Bizim Dünyamız</h1>
            <p style="margin:6px 0 0 0; opacity:0.9; font-size:13px;">Gözlerin aklıma geldiğinde kalbim gülümsüyor...</p>
        </div>

        <div id="memoryModal" class="modal-overlay">
            <div class="modal-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="color:var(--rose); margin:0;">✨ Yeni Anı veya Not</h3>
                    <button onclick="toggleModal(false)" style="background:none; border:none; font-size:24px; cursor:pointer; color:#881337; padding:0;">&times;</button>
                </div>
                <form action="/ekle" method="POST" enctype="multipart/form-data" style="margin:0;">
                    <label style="font-size:12px; font-weight:bold; color:#881337;">Başlık</label>
                    <input type="text" name="title" placeholder="Örn: İçimden geldi / İlk buluşmamız" required>
                    
                    <label style="font-size:12px; font-weight:bold; color:#881337;">Fotoğraf veya Video (İsteğe Bağlı)</label>
                    <input type="file" name="image" accept="image/*,video/*" style="background:white; padding:8px;">
                    
                    <label style="font-size:12px; font-weight:bold; color:#881337;">Tatlı Notun / Hissettiklerin</label>
                    <textarea name="note" placeholder="Bugün aklımdasın..." rows="3" required></textarea>
                    
                    <button type="submit" class="btn-main" style="padding:12px; font-size:15px; margin-top:5px;">Kalbime Kaydet 💕</button>
                </form>
            </div>
        </div>

        <div style="max-width:900px; margin:25px auto; padding:0 15px; position:relative; z-index:2;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h2 style="color:var(--text); margin:0; font-size:20px;">💌 Anı ve Not Defterimiz</h2>
                <a href="/cikis" style="color:#f43f5e; font-size:12px; text-decoration:none; font-weight:bold;">Güvenli Çıkış</a>
            </div>
            
            <div class="memory-grid">
                ${memoriesHTML}
            </div>
        </div>

        <script>
            function toggleModal(open) {
                document.getElementById('memoryModal').style.display = open ? 'flex' : 'none';
            }
        </script>
    </body></html>`);
});

app.post('/ekle', upload.single('image'), async (req, res) => {
    if (req.cookies.memory_auth !== 'true') return res.redirect('/');
    const db = await getDB();

    let imgUrl = '';
    if (req.file && req.file.buffer.length > 0) {
        try {
            imgUrl = await uploadToDrive(req.file);
        } catch (err) {
            console.error("Drive Yükleme Hatası:", err);
            return res.send(`<script>alert("Fotoğraf yüklenirken hata oluştu!"); window.location.href="/anilar";</script>`);
        }
    }

    db.gallery.push({
        id: Date.now().toString(),
        title: req.body.title,
        note: req.body.note || '',
        imgUrl: imgUrl,
        date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    });

    db.markModified('gallery');
    await db.save();
    res.redirect('/anilar');
});

app.get('/sil/:id', async (req, res) => {
    if (req.cookies.memory_auth !== 'true') return res.redirect('/');
    const db = await getDB();

    db.gallery = db.gallery.filter(m => m.id !== req.params.id);
    db.markModified('gallery');
    await db.save();
    res.redirect('/anilar');
});

app.get('/cikis', (req, res) => {
    res.cookie('memory_auth', '', { maxAge: 0 });
    res.redirect('/');
});

app.listen(PORT, '0.0.0.0', () => console.log(`❤️ Romantik Anı Defteri Çalışıyor: http://localhost:${PORT}`));