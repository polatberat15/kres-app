// ============================================================================
// ALBAYRAK ÇOCUK AKADEMİSİ - %100 EKSİKSİZ VE TAM FİNAL SÜRÜM
// ============================================================================
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(__dirname));

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 }
});

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/kres";

mongoose.connect(MONGO_URI)
    .then(() => console.log('☁️ Kalıcı MongoDB Veritabanına Başarıyla Bağlanıldı!'))
    .catch(err => console.error('MongoDB Bağlantı Hatası:', err));

const DataSchema = new mongoose.Schema({
    adminCredentials: { 
        username: { type: String, default: "admin" }, 
        password: { type: String, default: "123" },
        waPhone: { type: String, default: "" },
        waApiKey: { type: String, default: "" }
    },
    siteContent: {
        badgeText: { type: String, default: "✨ 2026 - 2027 Erken Kayıtlarımız Başlamıştır" },
        heroTitle: { type: String, default: "Sevgiyle Büyüyen,\nDeğerleriyle Öğrenen Nesiller" },
        heroDesc: { type: String, default: "Albayrak Çocuk Akademisi olarak; modern eğitim yaklaşımları, uzman psikolog kadromuz ile geleceğin özgüvenli bireylerini yetiştiriyoruz." },
        contactPhone: { type: String, default: "05516046191" },
        instagramUrl: { type: String, default: "https://instagram.com/" },
        facebookUrl: { type: String, default: "https://facebook.com/" },
        gallery: { type: Array, default: [] },
        branches: { type: Array, default: [
            { id: "1", icon: "🧩", title: "Montessori", desc: "Keşfederek öğrenen özgür bireyler.", color: "#2563eb" },
            { id: "2", icon: "🧠", title: "Akıl Oyunları & Robotik", desc: "Erken kodlama becerileri.", color: "#f59e0b" }
        ]}
    },
    classes: { type: Array, default: [
        { id: "Minik_Kalpler", name: "Minik Kalpler Sınıfı", ageRange: "3-4" },
        { id: "Kelebekler", name: "Kelebekler Sınıfı", ageRange: "4-5" }
    ]},
    students: { type: Array, default: [] },
    teachers: { type: Array, default: [] },
    events: { type: Array, default: [] },
    classAlbums: { type: Array, default: [] }
});

const DataModel = mongoose.model('AcademyData', DataSchema);

async function getDB() {
    let doc = await DataModel.findOne();
    if (!doc) doc = await DataModel.create({});
    
    if (!doc.siteContent) doc.siteContent = {};
    if (!doc.siteContent.branches) doc.siteContent.branches = [];
    if (!doc.siteContent.gallery) doc.siteContent.gallery = [];
    if (!Array.isArray(doc.classAlbums)) doc.classAlbums = [];
    if (!doc.adminCredentials) {
        doc.adminCredentials = { username: "admin", password: "123", waPhone: "", waApiKey: "" };
    }
    
    doc.students.forEach(s => {
        if (!s.attendance) s.attendance = {};
        if (!s.reports) s.reports = {}; 
        if (typeof s.feePaid === 'undefined') s.feePaid = false;
        if (!s.allergy) s.allergy = "Belirtilmedi";
        if (!s.registrationDate) s.registrationDate = new Date().toISOString().split('T')[0];
        if (!s.startDate) s.startDate = new Date().toISOString().split('T')[0];
        if (typeof s.tuitionFee === 'undefined') s.tuitionFee = 0;
        if (typeof s.paidAmount === 'undefined') s.paidAmount = 0;
        if (!s.password) s.password = "1234"; 
        if (typeof s.mustChangePassword === 'undefined') s.mustChangePassword = true; 
    });
    
    doc.teachers.forEach(t => {
        if (!t.classes) t.classes = [];
        if (typeof t.directEvent === 'undefined') t.directEvent = false;
        if (typeof t.vitrin === 'undefined') t.vitrin = false;
    });
    
    return doc;
}

async function sendWaNotification(db, message) {
    const phone = db.adminCredentials.waPhone;
    const apikey = db.adminCredentials.waApiKey;
    if (phone && apikey) {
        try {
            const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apikey}`;
            await axios.get(url);
        } catch(e) {
            console.error('WA Bildirim Hatası:', e.message);
        }
    }
}

function bufferToDataURI(file) {
    if (!file || !file.buffer) return "";
    const mimeType = file.mimetype || "image/jpeg";
    return `data:${mimeType};base64,${file.buffer.toString('base64')}`;
}

function canManageVitrin(req, db) {
    if (req.cookies.admin_logged === 'true') return true;
    if (req.cookies.teacher_user) {
        const t = db.teachers.find(x => x.username === req.cookies.teacher_user);
        if (t && (t.vitrin || t.directEvent)) return true;
    }
    return false;
}

function getEmbedHTML(url) {
    if(!url) return '';
    if(url.includes('youtube.com') || url.includes('youtu.be')) {
        let vid = url.split('v=')[1] || url.split('.be/')[1];
        if(vid) {
            vid = vid.split('&')[0];
            return `<iframe width="100%" height="250" src="https://www.youtube.com/embed/${vid}" frameborder="0" allowfullscreen style="border-radius:10px; margin-top:10px; border:2px solid #e2e8f0;"></iframe>`;
        }
    } else if (url.includes('instagram.com')) {
        let cleanUrl = url.split('?')[0].replace(/\/$/, '');
        return `<iframe src="${cleanUrl}/embed" width="100%" height="400" frameborder="0" scrolling="no" allowtransparency="true" style="border-radius:10px; margin-top:10px; border:2px solid #e2e8f0;"></iframe>`;
    }
    return `<a href="${url}" target="_blank" class="btn-main btn-blue" style="margin-top:10px; display:block; text-align:center;">🎥 Videoyu İzle</a>`;
}

const portalTheme = `
<style>
    :root { --coral: #ef4444; --amber: #fca311; --cream: #f8fafc; --blue: #1e3a8a; }
    body { font-family: 'Segoe UI', sans-serif; background: var(--cream); margin: 0; padding-bottom: 80px; color:#333; }
    .header-card { background: linear-gradient(135deg, var(--blue), #3b82f6); color: white; padding: 35px 25px; border-radius: 0 0 40px 40px; text-align: center; box-shadow: 0 10px 25px rgba(30, 58, 138, 0.15); }
    .card { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.04); margin-bottom: 20px; border: 1px solid #f1f5f9; }
    .menu-grid { display: grid; grid-template-columns: 1fr; gap: 15px; padding: 15px; max-width: 450px; margin: 0 auto; }
    .menu-card { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 6px 15px rgba(0,0,0,0.05); text-align: center; cursor: pointer; border: 2px solid transparent; text-decoration: none; color: #1e293b; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; font-weight: 800; font-size: 16px; transition: 0.3s; }
    .menu-card:hover { border-color: var(--blue); transform: translateY(-3px); }
    .menu-icon { font-size: 32px; background: #eff6ff; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
    .btn-main { background: var(--coral); color: white; border: none; padding: 12px 18px; border-radius: 10px; font-weight: bold; cursor: pointer; display:inline-block; text-decoration:none; text-align:center; transition: 0.2s; }
    .btn-main:hover { opacity: 0.9; }
    .btn-success { background: #10b981; } .btn-blue { background: var(--blue); } .btn-danger { background: #ef4444; } .btn-wa { background: #25d366; color: white; }
    input, select, textarea { width: 100%; padding: 12px; margin: 8px 0 18px 0; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; box-sizing: border-box; font-family: inherit;}
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size:14px; }
    th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
    th { background: #f1f5f9; color: #475569; font-weight: 700; border-radius: 10px 10px 0 0; }
    
    .tab-content { display: none; }
    .tab-content.active { display: block; animation: fadeIn 0.4s; }
    .tab-btn { background: #e2e8f0; color: #334155; border: none; padding: 10px 15px; border-radius: 10px; font-weight: bold; cursor: pointer; margin-right: 5px; margin-bottom: 10px; font-size:14px; }
    .tab-btn.active-btn { background: var(--blue); color: white; box-shadow: 0 4px 10px rgba(30,58,138,0.3); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    .horizontal-slider { display: flex; overflow-x: auto; gap: 10px; padding-bottom: 10px; scroll-snap-type: x mandatory; }
    .img-container { position: relative; display: inline-block; flex-shrink: 0; scroll-snap-align: start; }
    .horizontal-slider img { width: 220px; height: 160px; object-fit: cover; border-radius: 10px; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .download-btn { position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 6px; padding: 6px 10px; font-size: 11px; font-weight: bold; text-decoration: none; display: flex; align-items: center; gap: 5px; backdrop-filter: blur(2px); transition:0.2s; }
    .download-btn:hover { background: rgba(0,0,0,0.8); }

    .install-box { background: #fffbeb; border: 2px dashed #f59e0b; padding: 15px 20px; border-radius: 15px; margin: 20px auto; max-width: 500px; color: #92400e; font-size: 13px; text-align: left; }
</style>
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/logo.jpeg">
<script>
    function showTab(tabId, event) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active-btn'));
        document.getElementById(tabId).classList.add('active');
        if(event) event.currentTarget.classList.add('active-btn');
    }
    function copyToClipboard(text, btn) {
        navigator.clipboard.writeText(text);
        let orig = btn.innerHTML;
        btn.innerHTML = '✅ Kopyalandı!';
        btn.style.background = '#10b981';
        setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2000);
    }
</script>`;

const iconWhatsapp = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.198-.198.347-.764.966-.937 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>`;
const iconInstagram = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
const iconFacebook = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>`;

const pwaInstallInfo = `
    <div class="install-box">
        <b>📱 Uygulamayı Telefonunuza (Ana Ekrana) Nasıl Eklersiniz?</b><br>
        • <b>iPhone (Safari):</b> Alttaki "Paylaş" (kare ve yukarı ok) ikonuna basın ve ardından <b>"Ana Ekrana Ekle"</b> seçeneğini seçin.<br>
        • <b>Android (Chrome):</b> Sağ üstteki üç noktaya basın ve <b>"Uygulamayı Yükle"</b> veya <b>"Ana Ekrana Ekle"</b> seçeneğine tıklayın.
    </div>
`;

// ============================================================================
// 1. ANA VİTRİN SAYFASI
// ============================================================================
app.get('/', async (req, res) => {
    const db = await getDB();
    const sc = db.siteContent;
    const today = new Date().toISOString().split('T')[0];
    const wpUrl = `https://wa.me/90${sc.contactPhone}?text=Merhaba,%20bilgi%20almak%20istiyorum.`;

    let galleryHTML = (sc.gallery || []).map(g => {
        let rawImgs = (g.imgUrls && g.imgUrls.length > 0) ? g.imgUrls : (g.imgUrl ? [g.imgUrl] : []);
        let imgsHTML = rawImgs.map(u => `
            <div class="img-container">
                <img src="${u}">
                <a href="${u}" download="akademi-galeri.jpg" class="download-btn">⬇️ İndir</a>
            </div>
        `).join('');
        let vid = getEmbedHTML(g.videoUrl);
        return `
        <div style="background:white; border-radius:15px; padding:15px; box-shadow:0 5px 15px rgba(0,0,0,0.05);">
            <b style="color:var(--blue); font-size:16px; display:block; margin-bottom:10px;">${g.title}</b>
            <div class="horizontal-slider">${imgsHTML}</div>
            ${vid}
        </div>`;
    }).join('');

    let branchesHTML = (sc.branches || []).map(b => `
        <div class="card" style="border-top: 5px solid ${b.color}; margin-bottom:0;">
            <div style="font-size:32px; margin-bottom:10px;">${b.icon}</div>
            <h3 style="color:var(--blue); margin-bottom:8px;">${b.title}</h3>
            <p style="color:#555; font-size:14px;">${b.desc}</p>
        </div>`).join('');

    let approvedUpcomingEvents = db.events.filter(e => e.status === 'approved' && e.date >= today);
    let eventsHTML = approvedUpcomingEvents.map(e => {
        let isFull = e.reservations.length >= e.quota;
        let actionHTML = isFull 
            ? `<div style="color:white; background:#ef4444; padding:8px; border-radius:8px; font-weight:bold; margin-bottom:15px; text-align:center;">🚨 Kontenjan Doldu!</div>
               <p style="font-size:13px; color:#64748b; margin-bottom:10px; text-align:center;">Yeni sınıf için talep bırakın:</p>
               <form action="/atolye-talep/${e.id}" method="POST" style="margin:0;">
                   <input type="text" name="name" placeholder="Veli Adı Soyadı" required>
                   <input type="text" name="phone" placeholder="Telefonunuz" required>
                   <button type="submit" class="btn-main btn-blue" style="width:100%;">Talep Bırak</button>
               </form>`
            : `<div style="color:white; background:#10b981; padding:8px; border-radius:8px; font-weight:bold; margin-bottom:15px; text-align:center;">✅ ${e.quota - e.reservations.length} Kişilik Yer Kaldı</div>
               <a href="/atolye-detay/${e.id}" class="btn-main btn-success" style="width:100%; text-align:center; box-sizing:border-box; display:block;">Etkinliğe Git & Kayıt Ol</a>`;
        
        let imgHTML = e.imgUrl ? `<img src="${e.imgUrl}" style="width:100%; height:200px; object-fit:cover; border-bottom:1px solid #e2e8f0;">` : `<div style="height:10px; background:var(--amber);"></div>`;
               
        return `<div class="card" style="padding:0; overflow:hidden; border:1px solid #e2e8f0; display:flex; flex-direction:column;">
            ${imgHTML}
            <div style="padding:25px; display:flex; flex-direction:column; flex-grow:1;">
                <h3 style="margin-top:0; color:var(--blue); font-size:22px;">🎨 ${e.title}</h3>
                <p style="font-size:15px; color:#475569; margin-bottom:20px;">📅 <b>Tarih:</b> ${e.date}<br>⏰ <b>Saat:</b> ${e.time} - ${e.endTime || 'Belirtilmedi'}<br>💰 <b>Ücret:</b> ${e.price} TL</p>
                <div style="margin-top:auto;">${actionHTML}</div>
            </div>
        </div>`;
    }).join('') || '<p style="text-align:center; color:#777; width:100%;">Şu an planlanan etkinlik bulunmuyor.</p>';

    res.send(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Albayrak Çocuk Akademisi</title>
    ${portalTheme}
    <style>
        .hero { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 60px 20px; text-align: center; border-radius: 0 0 40px 40px; }
        .hero h1 { font-size: 32px; margin-bottom: 15px; font-weight: 900; }
        .social-bar a { color: white; text-decoration: none; margin: 5px; font-size: 13px; font-weight: bold; background: rgba(0,0,0,0.2); padding: 8px 16px; border-radius: 20px; display:inline-flex; align-items:center; gap:8px; transition:0.3s; }
        .social-bar a:hover { transform: scale(1.05); }
        .floating-whatsapp { position: fixed !important; bottom: 30px !important; right: 30px !important; background: #25d366 !important; color: white !important; border-radius: 50px !important; padding: 14px 24px !important; display: flex !important; align-items: center !important; gap: 10px !important; font-weight: bold !important; font-size: 15px !important; text-decoration: none !important; z-index: 99999 !important; box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4) !important; transition: 0.3s !important; }
    </style></head><body>
    
    <div style="padding:15px 25px; background:white; display:flex; justify-content:space-between; align-items:center; box-shadow:0 4px 15px rgba(0,0,0,0.05); position:sticky; top:0; z-index:999;">
        <div style="display:flex; align-items:center; gap:10px; font-weight:900; color:var(--blue); font-size:18px;">
            <img src="/logo.jpeg" width="45" height="45" style="border-radius:10px; object-fit:contain;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'40\\\' height=\\\'40\\\'><rect width=\\\'100%\\\' height=\\\'100%\\\' fill=\\\'%231e3a8a\\\'/></svg>'">
            Albayrak Akademi
        </div>
        <a href="/portal-giris" class="btn-main" style="background:#e11d48; display:flex; align-items:center; gap:5px;">🔒 Kullanıcı Girişi</a>
    </div>

    <div class="hero">
        <div style="background:#e11d48; display:inline-block; padding:6px 16px; border-radius:20px; font-size:13px; font-weight:bold; margin-bottom:15px;">${sc.badgeText}</div>
        <h1>${sc.heroTitle.replace(/\n/g, '<br>')}</h1>
        <p style="opacity:0.9; max-width:600px; margin:0 auto 25px auto; font-size:16px;">${sc.heroDesc}</p>
        
        <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:20px;">
            <a href="${wpUrl}" class="btn-main" target="_blank" style="background:#25d366; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:14px 24px; font-size:15px;">
                ${iconWhatsapp} WhatsApp Randevu
            </a>
            <a href="/portal-giris" class="btn-main" style="background:#e11d48; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:14px 24px; font-size:15px;">
                🔒 Kullanıcı Girişi
            </a>
        </div>

        <div class="social-bar" style="margin-top:25px; display:flex; justify-content:center; flex-wrap:wrap;">
            ${sc.instagramUrl ? `<a href="${sc.instagramUrl}" target="_blank" style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);">${iconInstagram} Instagram</a>` : ''}
            ${sc.facebookUrl ? `<a href="${sc.facebookUrl}" target="_blank" style="background: #1877f2;">${iconFacebook} Facebook</a>` : ''}
        </div>
    </div>

    <div style="max-width:1100px; margin:0 auto; padding:30px 20px;">
        <h2 style="text-align:center; color:var(--blue); margin:20px 0 30px 0; font-size:28px;">🌟 Eğitim Modelimiz</h2>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:25px;">
            ${branchesHTML || '<p style="text-align:center; color:gray; width:100%;">Henüz eğitim modeli eklenmedi.</p>'}
        </div>

        <h2 style="text-align:center; color:var(--blue); margin:50px 0 30px 0; font-size:28px;">🎈 Etkinliklerimiz & Kayıt</h2>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:25px;">
            ${eventsHTML}
        </div>

        <h2 style="text-align:center; color:var(--blue); margin:50px 0 30px 0; font-size:28px;">📸 Geçmiş Etkinlikler & Akademi Albümü</h2>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
            ${galleryHTML || '<p style="text-align:center; color:gray; width:100%;">Galeride henüz paylaşım yok.</p>'}
        </div>
        
        <div style="text-align:center; margin-top:40px;">
            ${pwaInstallInfo}
        </div>
    </div>

    <a href="${wpUrl}" class="floating-whatsapp" target="_blank">${iconWhatsapp} WhatsApp</a>
    </body></html>`);
});

// ============================================================================
// 2. ETKİNLİK DETAY VE REZERVASYON ROTALARI
// ============================================================================
app.get('/atolye-detay/:id', async (req, res) => {
    const db = await getDB();
    const e = db.events.find(ev => ev.id == req.params.id);
    if (!e) return res.send("Etkinlik bulunamadı.");

    let imgHTML = e.imgUrl ? `<img src="${e.imgUrl}" style="width:100%; height:220px; object-fit:cover; border-radius:15px; margin-bottom:15px;">` : '';
    
    res.send(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">${portalTheme}</head><body>
        <div class="header-card">
            <h2 style="margin:0;">🎨 Etkinlik Kayıt Ekranı</h2>
            <a href="/" style="color:#bfdbfe; font-size:13px; text-decoration:none; display:inline-block; margin-top:10px;">← Ana Sayfaya Dön</a>
        </div>
        <div style="max-width:500px; margin:20px auto; padding:0 20px;">
            <div class="card">
                ${imgHTML}
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
                    <h2 style="color:var(--blue); margin-top:0;">${e.title}</h2>
                    <button onclick="copyToClipboard(window.location.href, this)" class="btn-main btn-blue" style="padding:8px 12px; font-size:12px; white-space:nowrap; border-radius:8px;">🔗 Linki Kopyala</button>
                </div>
                <p style="color:#475569; font-size:15px;">📅 <b>Tarih:</b> ${e.date}<br>⏰ <b>Saat:</b> ${e.time} - ${e.endTime || 'Belirtilmedi'}<br>💰 <b>Ücret:</b> ${e.price} TL<br>👥 <b>Kontenjan:</b> ${e.quota} Kişi</p>
                <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
                <form action="/atolye-rezervasyon/${e.id}" method="POST">
                    <label style="font-size:13px; font-weight:bold; color:#475569;">Çocuğun Adı Soyadı</label>
                    <input type="text" name="name" placeholder="Örn: Ali Yılmaz" required>
                    <label style="font-size:13px; font-weight:bold; color:#475569;">Çocuğun Yaşı</label>
                    <input type="number" name="age" placeholder="Örn: 4" required min="1" max="10">
                    <label style="font-size:13px; font-weight:bold; color:#475569;">Veli Telefon Numarası</label>
                    <input type="text" name="phone" placeholder="0555..." required>
                    <button type="submit" class="btn-main btn-success" style="width:100%; padding:14px; font-size:16px; margin-top:10px;">✅ Kaydı Tamamla</button>
                </form>
            </div>
        </div>
    </body></html>`);
});

app.post('/atolye-rezervasyon/:id', async (req, res) => { 
    const db = await getDB(); 
    const ev = db.events.find(e => e.id == req.params.id); 
    if(ev && ev.reservations.length < ev.quota) { 
        ev.reservations.push({ name: req.body.name, age: req.body.age, phone: req.body.phone }); 
        sendWaNotification(db, `✅ YENİ KAYIT: ${req.body.name} isimli öğrenci (Yaş:${req.body.age}) "${ev.title}" etkinliğine kayıt oldu! İletişim: ${req.body.phone}`);
        db.markModified('events');
        await db.save(); 
        res.send(`<script>alert("Rezervasyon başarıyla oluşturuldu!"); window.location.href="/";</script>`); 
    } else {
        res.send(`<script>alert("Hata: Kontenjan dolu veya etkinlik bulunamadı!"); window.location.href="/";</script>`); 
    }
});

app.post('/atolye-talep/:id', async (req, res) => { 
    const db = await getDB(); 
    const ev = db.events.find(e => e.id == req.params.id); 
    if(ev) { 
        if(!ev.waitlist) ev.waitlist = []; 
        ev.waitlist.push({ name: req.body.name, phone: req.body.phone }); 
        sendWaNotification(db, `⚠️ YENİ SINIF TALEBİ: "${ev.title}" kontenjanı dolduğu için ${req.body.name} isimli veli talep bıraktı. İletişim: ${req.body.phone}`);
        db.markModified('events');
        await db.save(); 
        res.send(`<script>alert("Talebiniz alındı! Yeni sınıf açıldığında haber vereceğiz."); window.location.href="/";</script>`); 
    } 
});

// ============================================================================
// 3. GİRİŞ KAPISI VE GİRİŞ EKRANLARI (PWA BİLGİLENDİRMESİ DAHİL)
// ============================================================================
app.get('/portal-giris', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">${portalTheme}</head><body>
        <div class="header-card">
            <img src="/logo.jpeg" width="80" height="80" style="border-radius:15px; background:white; margin-bottom:15px;" onerror="this.style.display='none'">
            <h2 style="margin:0 0 10px 0; font-size:24px;">Kullanıcı Girişi</h2>
            <a href="/" style="color:#bfdbfe; font-size:14px; text-decoration:none; font-weight:bold;">← Vitrine Dön</a>
        </div>
        <div class="menu-grid" style="margin-top:20px;">
            <a href="/login/admin" class="menu-card"><div class="menu-icon">👑</div><span>Müdür Paneli</span></a>
            <a href="/login/ogretmen" class="menu-card"><div class="menu-icon">👩‍🏫</div><span>Öğretmen Paneli</span></a>
            <a href="/login/veli" class="menu-card" style="border:2px solid var(--blue);"><div class="menu-icon" style="background:#dbeafe; color:var(--blue);">👨‍👩‍👧</div><span>Veli Portalı</span></a>
        </div>
        <div style="text-align:center; margin-top:30px;">
            ${pwaInstallInfo}
        </div>
    </body></html>`);
});

app.get('/login/admin', (req, res) => {
    res.send(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">${portalTheme}</head><body>
        <div class="header-card"><h2 style="margin:0;">👑 Müdür Girişi</h2><a href="/portal-giris" style="color:#bfdbfe; font-size:13px; text-decoration:none; display:inline-block; margin-top:10px;">← Geri</a></div>
        <div style="padding:30px; max-width:400px; margin:0 auto;">
            <form action="/login/admin" method="POST" class="card">
                <input type="text" name="username" placeholder="Kullanıcı Adı" required>
                <input type="password" name="password" placeholder="Şifre" required>
                <button type="submit" class="btn-main btn-blue" style="width:100%;">Giriş Yap</button>
            </form>
        </div>
    </body></html>`);
});

app.post('/login/admin', async (req, res) => {
    const db = await getDB();
    if (req.body.username === db.adminCredentials.username && req.body.password === db.adminCredentials.password) {
        res.cookie('admin_logged', 'true');
        res.redirect('/admin');
    } else {
        res.send(`<script>alert("Hatalı şifre!"); window.location.href="/login/admin";</script>`);
    }
});

// ============================================================================
// 4. MÜDÜR PANELİ (TAM VE EKSİKSİZ)
// ============================================================================
app.get('/admin', async (req, res) => {
    if (req.cookies.admin_logged !== 'true') return res.redirect('/login/admin');
    const db = await getDB();
    const sc = db.siteContent;
    const today = new Date().toISOString().split('T')[0];

    let totalExpected = 0;
    let totalReceived = 0;
    db.students.forEach(s => {
        totalExpected += parseInt(s.tuitionFee) || 0;
        totalReceived += parseInt(s.paidAmount) || 0;
    });
    let totalRemaining = totalExpected - totalReceived;

    let classOpts = db.classes.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    let classCheckboxes = db.classes.map(c => `<label style="display:block; margin-bottom:8px; cursor:pointer;"><input type="checkbox" name="classes" value="${c.name}"> ${c.name}</label>`).join('');
    
    let classRows = db.classes.map(c => {
        let ageText = c.ageRange ? `<span style="color:#64748b; font-size:12px; margin-left:5px;">(${c.ageRange} Yaş)</span>` : '';
        return `
        <div style="display:flex; justify-content:space-between; padding:12px; background:#f8fafc; border-radius:8px; margin-bottom:8px; align-items:center;">
            <span style="font-weight:bold;">🏷️ ${c.name} ${ageText}</span> 
            <div>
                <a href="/admin/edit-class/${c.id}" class="btn-main btn-blue" style="padding:6px 12px; font-size:11px; margin-right:5px;">✏️ Düzenle</a>
                <a href="/admin/delete-class/${c.id}" class="btn-main btn-danger" style="padding:6px 12px; font-size:11px;">Sil</a>
            </div>
        </div>`;
    }).join('');

    let galleryRows = (sc.gallery || []).map(g => {
        let rawImgs = (g.imgUrls && g.imgUrls.length > 0) ? g.imgUrls : (g.imgUrl ? [g.imgUrl] : []);
        let imgs = rawImgs.map(u => `<img src="${u}" style="width:30px; height:30px; border-radius:3px; object-fit:cover;">`).join('');
        return `
        <div style="display:flex; justify-content:space-between; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-top:10px; align-items:center;">
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="display:flex; gap:2px;">${imgs}</div>
                <b style="font-size:13px; color:#475569;">${g.title} ${g.videoUrl ? '🎥' : ''}</b>
            </div>
            <div>
                <a href="/manage/edit-gallery/${g.id}" class="btn-main btn-blue" style="padding:6px 12px; font-size:11px; margin-right:5px;">✏️ Düzenle</a>
                <a href="/manage/delete-gallery/${g.id}" class="btn-main btn-danger" style="padding:6px 12px; font-size:11px;">Sil</a>
            </div>
        </div>`;
    }).join('');

    let branchRows = (sc.branches || []).map(b => `
        <div style="display:flex; justify-content:space-between; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; margin-top:10px; align-items:center; border-left: 4px solid ${b.color};">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:20px;">${b.icon}</span>
                <b style="font-size:13px; color:#475569;">${b.title}</b>
            </div>
            <div>
                <a href="/manage/edit-branch/${b.id}" class="btn-main btn-blue" style="padding:6px 12px; font-size:11px; margin-right:5px;">✏️ Düzenle</a>
                <a href="/manage/delete-branch/${b.id}" class="btn-main btn-danger" style="padding:6px 12px; font-size:11px;">Sil</a>
            </div>
        </div>
    `).join('');

    let studentRows = db.students.map(s => {
        let attStatus = (s.attendance && s.attendance[today]) ? s.attendance[today] : 'Alınmadı';
        let attColor = attStatus === 'Geldi' ? 'green' : (attStatus === 'Gelmedi' ? 'red' : 'gray');
        let cleanPhone = s.parentPhone ? s.parentPhone.replace(/[^0-9]/g, '') : '';
        let aidatWaMsg = encodeURIComponent(`Sayın velimiz, ${s.name} isimli öğrencimizin okul aidatı eksiktir. Bilgi rica ederiz.`);
        let kalan = (s.tuitionFee || 0) - (s.paidAmount || 0);
        let aidatWaBtn = (kalan > 0) && cleanPhone ? `<a href="https://wa.me/90${cleanPhone}?text=${aidatWaMsg}" target="_blank" class="btn-main btn-wa" style="padding:4px 8px; font-size:11px; margin-top:5px; display:inline-block;">💬 Aidat Uyarısı At</a>` : '';

        return `<tr>
            <td>
                <b style="color:var(--blue); font-size:15px;">${s.name}</b><br>
                <small style="color:#64748b; font-weight:bold;">${s.class}</small><br>
                <small style="color:#64748b;">Kayıt: ${s.registrationDate} | Başlama: ${s.startDate}</small><br>
                <small style="color:#64748b;">Tel: ${s.parentPhone}</small><br>
                <small style="color:#64748b; font-weight:bold;">Veli Şifresi: ${s.password}</small><br>
                <small style="color:#e11d48; font-weight:bold;">Alerji: ${s.allergy}</small>
            </td>
            <td>
                <div style="background:#f8fafc; padding:8px; border-radius:8px;">
                    <span style="font-size:12px; color:#475569;">Toplam Aidat Borcu: <b style="color:#1e3a8a;">${s.tuitionFee} TL</b></span>
                    <form action="/admin/update-payment/${s.id}" method="POST" style="display:flex; align-items:center; gap:5px; margin:5px 0;">
                        <input type="number" name="paidAmount" value="${s.paidAmount}" placeholder="Ödenen" style="width:75px; padding:6px; margin:0; font-size:12px;">
                        <button type="submit" class="btn-main btn-success" style="padding:6px 10px; font-size:11px;">Kaydet</button>
                    </form>
                    <span style="font-size:12px; color:#ef4444; font-weight:bold;">Kalan: ${kalan} TL</span><br>
                    ${aidatWaBtn}
                </div>
            </td>
            <td style="text-align:center;">
                <div style="font-weight:bold; color:${attColor}; font-size:13px; margin-bottom:8px;">${attStatus}</div>
                <form action="/admin/attendance/${s.id}" method="POST" style="margin:0; display:flex; gap:5px; justify-content:center;">
                    <input type="hidden" name="date" value="${today}">
                    <button name="status" value="Geldi" class="btn-main btn-success" style="padding:4px 8px; font-size:11px;">Geldi</button>
                    <button name="status" value="Gelmedi" class="btn-main btn-danger" style="padding:4px 8px; font-size:11px;">Gelmedi</button>
                </form>
            </td>
            <td style="text-align:center;"><a href="/delete-student/${s.id}" class="btn-main btn-danger" style="padding:6px 12px; font-size:11px;" onclick="return confirm('Öğrenci silinecek, emin misiniz?')">Sil</a></td>
        </tr>`;
    }).join('');

    let teacherList = (db.teachers || []).map(t => {
        let assignedClasses = (t.classes && t.classes.length > 0) ? t.classes.join(', ') : 'Sınıf Atanmadı';
        return `
        <div style="background:#f8fafc; padding:15px; border-radius:12px; margin-bottom:10px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <b style="color:var(--blue); font-size:16px;">👤 ${t.username}</b><br>
                <small style="color:var(--coral); font-weight:bold;">Sorumluluk: ${assignedClasses}</small><br>
                <small style="color:#64748b;">Yetkiler: Yoklama: ${t.yoklama?'✔':'✘'} | Karne: ${t.rapor?'✔':'✘'} | Etkinlik Açma: ${t.directEvent?'✔':'✘'} | Vitrin: ${t.vitrin?'✔':'✘'}</small>
            </div>
            <div style="display:flex; flex-direction:column; gap:5px;">
                <a href="/admin/edit-teacher/${t.username}" class="btn-main btn-blue" style="font-size:11px; padding:6px 12px;">Düzenle</a>
                <a href="/admin/delete-teacher/${t.username}" class="btn-main btn-danger" style="font-size:11px; padding:6px 12px;" onclick="return confirm('Öğretmen hesabı silinsin mi?')">Sil</a>
            </div>
        </div>`;
    }).join('');

    let pendingEvents = db.events.filter(e => e.status === 'pending').map(e => `
        <div style="background:#fffbeb; padding:15px; border-left:5px solid #f59e0b; margin-bottom:10px; border-radius:10px;">
            <b>${e.title}</b> (${e.date} | ${e.time} - ${e.endTime || '?'})<br>
            Kontenjan: ${e.quota} - Ücret: ${e.price} TL
            <div style="margin-top:10px; display:flex; gap:10px;">
                <a href="/admin/approve-event/${e.id}" class="btn-main btn-success" style="flex:1;">✅ Onayla</a> 
                <a href="/manage/delete-event/${e.id}" class="btn-main btn-danger" style="flex:1;">🗑️ Reddet</a>
            </div>
        </div>
    `).join('') || '<p style="font-size:13px; color:gray;">Bekleyen etkinlik talebi yok.</p>';
    
    let activeUpcomingEvents = db.events.filter(e => e.status === 'approved' && e.date >= today).map(e => {
        let reservationsList = (e.reservations || []).map(r => `• ${r.name} (Yaş: ${r.age || 'Belirtilmedi'}, Tel: ${r.phone})`).join('<br>');
        return `
        <div style="background:#f0fdf4; padding:15px; border-left:5px solid #10b981; margin-bottom:15px; border-radius:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:5px;">
                <b>🎨 ${e.title} <span style="font-size:12px; color:gray; font-weight:normal;">(${e.date} | ${e.time})</span></b> 
                <div>
                    <button onclick="copyToClipboard(window.location.origin + '/atolye-detay/${e.id}', this)" class="btn-main btn-blue" style="padding:6px 12px; font-size:11px; margin-right:5px;">📋 Linki Kopyala</button>
                    <a href="/atolye-detay/${e.id}" target="_blank" class="btn-main btn-success" style="padding:6px 12px; font-size:11px; margin-right:5px;">🔗 Sayfaya Git</a>
                    <a href="/manage/edit-event/${e.id}" class="btn-main btn-blue" style="padding:6px 12px; font-size:11px; margin-right:5px;">✏️ Düzenle</a>
                    <a href="/manage/delete-event/${e.id}" class="btn-main btn-danger" style="padding:6px 12px; font-size:11px;" onclick="return confirm('Etkinliği silmek istiyor musunuz?')">🗑️ Sil</a>
                </div>
            </div>
            <div style="font-size:13px; color:#475569;">Kayıtlı: <b>${e.reservations.length}/${e.quota}</b></div>
            <div style="margin-top:8px; background:white; padding:10px; border-radius:8px; font-size:12px; border:1px solid #e2e8f0;">
                <b>Kayıt Yaptıranlar ve Yaşları:</b><br>${reservationsList || 'Henüz kayıt yaptıran yok.'}
            </div>
        </div>`;
    }).join('') || '<p style="font-size:13px;">Gelecek aktif etkinlik yok.</p>';
    
    let pastEventsHTML = db.events.filter(e => e.status === 'approved' && e.date < today).map(e => `
        <div style="background:#f1f5f9; padding:15px; border-left:5px solid #94a3b8; margin-bottom:10px; border-radius:10px; color:#475569;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <b>${e.title} <span style="font-size:12px; font-weight:normal;">(${e.date})</span></b> 
                <a href="/manage/delete-event/${e.id}" class="btn-main btn-danger" style="padding:4px 8px; font-size:11px;">Sil</a>
            </div>
            <div style="margin-top:5px; color:var(--blue); font-weight:bold;">Katılan Kişi Sayısı: ${e.reservations.length}</div>
        </div>
    `).join('') || '<p style="font-size:13px; color:gray;">Henüz geçmiş bir etkinlik kaydı yok.</p>';

    res.send(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">${portalTheme}</head><body>
        <div class="header-card">
            <h2 style="margin:0;">👑 Müdür Paneli</h2>
            <a href="/portal-giris" style="color:#bfdbfe; font-size:13px; text-decoration:none; display:inline-block; margin-top:10px;">Çıkış Yap</a>
        </div>
        <div style="max-width:1100px; margin:20px auto; padding:0 20px;">
            
            <div style="display:flex; flex-wrap:wrap; margin-bottom:25px;">
                <button class="tab-btn active-btn" onclick="showTab('t-finans', event)">💰 Finans</button>
                <button class="tab-btn" onclick="showTab('t-ogrenci', event)">👦 Öğrenciler</button>
                <button class="tab-btn" onclick="showTab('t-etkinlik', event)">🎈 Etkinlikler</button>
                <button class="tab-btn" onclick="showTab('t-sinif', event)">🏫 Sınıflar</button>
                <button class="tab-btn" onclick="showTab('t-vitrin', event)">🌐 Vitrin Yönetimi</button>
                <button class="tab-btn" onclick="showTab('t-ogretmen', event)">👩‍🏫 Personel</button>
                <button class="tab-btn" onclick="showTab('t-ayar', event)">🔑 Ayarlar</button>
            </div>

            <div id="t-finans" class="tab-content active">
                <div class="card" style="border-top: 5px solid #10b981;">
                    <h3 style="color:var(--blue); margin-top:0;">💰 Genel Finansal Özet</h3>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px; text-align:center;">
                        <div style="background:#f8fafc; padding:20px; border-radius:15px; border:1px solid #e2e8f0;">
                            <h4 style="margin:0 0 10px 0; color:#475569;">Beklenen Toplam Aidat</h4>
                            <div style="font-size:26px; font-weight:900; color:var(--blue);">${totalExpected} ₺</div>
                        </div>
                        <div style="background:#dcfce7; padding:20px; border-radius:15px; border:1px solid #bbf7d0;">
                            <h4 style="margin:0 0 10px 0; color:#166534;">Kasaya Giren Ödeme</h4>
                            <div style="font-size:26px; font-weight:900; color:#10b981;">${totalReceived} ₺</div>
                        </div>
                        <div style="background:#fee2e2; padding:20px; border-radius:15px; border:1px solid #fecaca;">
                            <h4 style="margin:0 0 10px 0; color:#991b1b;">Kalan Toplam Alacak</h4>
                            <div style="font-size:26px; font-weight:900; color:#ef4444;">${totalRemaining} ₺</div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="t-ogrenci" class="tab-content">
                <div class="card" style="border-top:5px solid #3b82f6;">
                    <h3 style="color:var(--blue); margin-top:0;">👦 Yeni Öğrenci Kaydı</h3>
                    <form action="/admin/add-student" method="POST" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin-bottom:10px;">
                        <input type="text" name="name" placeholder="Öğrenci Adı Soyadı" required style="margin:0;">
                        <select name="class" style="margin:0;">${classOpts}</select>
                        <input type="text" name="parentPhone" placeholder="Veli Telefonu" required style="margin:0;">
                        <input type="text" name="password" placeholder="Veli İlk Şifresi (Varsayılan: 1234)" style="margin:0;">
                        <input type="text" name="allergy" placeholder="Alerji Durumu (Opsiyonel)" style="margin:0;">
                        <div style="display:flex; align-items:center; gap:5px;"><small>Kayıt:</small> <input type="date" name="registrationDate" required style="margin:0;"></div>
                        <div style="display:flex; align-items:center; gap:5px;"><small>Başlama:</small> <input type="date" name="startDate" required style="margin:0;"></div>
                        <input type="number" name="baseFee" placeholder="Aylık Tam Aidat Bedeli (TL)" required style="margin:0;">
                        
                        <label style="font-size:12px; display:flex; align-items:center; gap:5px; grid-column: 1 / -1; cursor:pointer; background:#eff6ff; padding:10px; border-radius:8px; border:1px solid #bfdbfe; color:#1e3a8a; font-weight:bold; margin-top:5px;">
                            <input type="checkbox" name="prorate" value="true" checked style="width:auto; margin:0;">
                            Öğrenci ay ortasında başlıyorsa, ilk ay aidatını başlama tarihine göre (kıstelyevm) otomatik hesapla
                        </label>
                        
                        <button type="submit" class="btn-main btn-success" style="grid-column: 1 / -1; margin-top:10px;">➕ Öğrenciyi Kaydet</button>
                    </form>
                </div>
                <div class="card">
                    <h3 style="color:var(--blue); margin-top:0;">📋 Öğrenci Listesi, Finans & Yoklama</h3>
                    <div style="overflow-x:auto; border-radius:10px; border:1px solid #e2e8f0;">
                        <table style="margin:0;">
                            <thead><tr><th>Öğrenci Bilgisi</th><th>Aidat Durumu</th><th style="text-align:center;">Bugünkü Yoklama</th><th style="text-align:center;">İşlem</th></tr></thead>
                            <tbody>${studentRows || '<tr><td colspan="4" align="center" style="padding:20px; color:#64748b;">Kayıtlı öğrenci bulunmuyor.</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div id="t-etkinlik" class="tab-content">
                <div class="card" style="border-left:5px solid var(--blue); background:#eff6ff;">
                    <h3 style="color:var(--blue); margin-top:0;">👑 Yeni Etkinlik Yayınla</h3>
                    <form action="/manage/create-event" method="POST" enctype="multipart/form-data" style="margin:0;">
                        <input type="text" name="title" placeholder="Etkinlik Adı (Örn: Robotik Kodlama)" required>
                        <label style="font-size:12px; font-weight:bold; color:#475569;">Etkinlik Fotoğrafı Seçin:</label>
                        <input type="file" name="image" accept="image/*" required style="background:white; margin:0 0 10px 0;">
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;">
                            <div><label style="font-size:12px; font-weight:bold; color:#475569;">Tarih</label><input type="date" name="date" required style="margin:0;"></div>
                            <div><label style="font-size:12px; font-weight:bold; color:#475569;">Başlangıç</label><input type="time" name="time" required style="margin:0;"></div>
                            <div><label style="font-size:12px; font-weight:bold; color:#475569;">Bitiş</label><input type="time" name="endTime" required style="margin:0;"></div>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:15px;">
                            <div><label style="font-size:12px; font-weight:bold; color:#475569;">Kontenjan (Kişi)</label><input type="number" name="quota" placeholder="Örn: 15" required style="margin:0;"></div>
                            <div><label style="font-size:12px; font-weight:bold; color:#475569;">Ücret (TL)</label><input type="number" name="price" placeholder="Örn: 200" required style="margin:0;"></div>
                        </div>
                        <button type="submit" class="btn-main btn-blue" style="width:100%; margin-top:20px; padding:14px; font-size:15px;">Etkinliği Doğrudan Yayına Al</button>
                    </form>
                </div>
                <div class="card">
                    <h3 style="color:var(--blue); border-bottom:2px solid #f1f5f9; padding-bottom:15px; margin-top:0;">🎈 Yönetim (Düzenle & Sil)</h3>
                    <h4 style="color:#ea580c; margin:15px 0 10px 0;">⏳ Onay Bekleyen Talepler</h4>
                    ${pendingEvents}
                    <h4 style="color:#10b981; margin:30px 0 10px 0;">✅ Gelecek Etkinlikler (Yayında & Yaş Bilgileri)</h4>
                    ${activeUpcomingEvents}
                    <h4 style="color:#64748b; margin:30px 0 10px 0;">🕰️ Geçmiş Etkinlikler</h4>
                    ${pastEventsHTML}
                </div>
            </div>

            <div id="t-sinif" class="tab-content">
                <div class="card">
                    <h3 style="color:var(--blue); border-bottom:2px solid #f1f5f9; padding-bottom:15px; margin-top:0;">🏫 Sınıf Yönetimi</h3>
                    <form action="/admin/add-class" method="POST" style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;">
                        <input type="text" name="name" placeholder="Sınıf Adı" required style="margin:0; flex:1; min-width:150px;">
                        <input type="text" name="ageRange" placeholder="Yaş Aralığı (Örn: 3-4)" style="margin:0; flex:1; min-width:100px;">
                        <button type="submit" class="btn-main btn-blue">Sınıf Ekle</button>
                    </form>
                    <div>${classRows}</div>
                </div>
            </div>

            <div id="t-vitrin" class="tab-content">
                <div class="card">
                    <h3 style="color:var(--blue); border-bottom:2px solid #f1f5f9; padding-bottom:15px; margin-top:0;">🌐 Vitrin Ana Sayfa Düzenle</h3>
                    <form action="/manage/update-vitrin" method="POST" style="margin:0;">
                        <label style="font-size:13px; font-weight:bold; color:#475569;">Karşılama Başlığı</label>
                        <input type="text" name="heroTitle" value="${sc.heroTitle}">
                        <label style="font-size:13px; font-weight:bold; color:#475569;">Alt Açıklama</label>
                        <textarea name="heroDesc" rows="3">${sc.heroDesc}</textarea>
                        <label style="font-size:13px; font-weight:bold; color:#475569;">WhatsApp Numarası</label>
                        <input type="text" name="contactPhone" value="${sc.contactPhone}">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                            <div>
                                <label style="font-size:13px; font-weight:bold; color:#ea580c;">📸 Instagram Linki</label>
                                <input type="text" name="instagramUrl" value="${sc.instagramUrl}">
                            </div>
                            <div>
                                <label style="font-size:13px; font-weight:bold; color:#2563eb;">📘 Facebook Linki</label>
                                <input type="text" name="facebookUrl" value="${sc.facebookUrl}">
                            </div>
                        </div>
                        <button type="submit" class="btn-main btn-blue" style="width:100%; padding:14px; font-size:15px;">💾 Bilgileri Güncelle</button>
                    </form>
                </div>
                
                <div class="card">
                    <h3 style="color:var(--blue); border-bottom:2px solid #f1f5f9; padding-bottom:15px; margin-top:0;">🌟 Eğitim Modelleri (Branşlar) Yönetimi</h3>
                    <form action="/manage/add-branch" method="POST" style="margin-bottom:15px;">
                        <div style="display:grid; grid-template-columns: 1fr 3fr; gap:10px;">
                            <div><label style="font-weight:bold; font-size:13px;">İkon (Emoji vs)</label><input type="text" name="icon" placeholder="Örn: 🧩" required></div>
                            <div><label style="font-weight:bold; font-size:13px;">Model Adı</label><input type="text" name="title" placeholder="Örn: Montessori" required></div>
                        </div>
                        <label style="font-weight:bold; font-size:13px;">Açıklama</label>
                        <input type="text" name="desc" placeholder="Örn: Keşfederek öğrenen özgür bireyler." required>
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                            <label style="font-weight:bold; font-size:13px;">Tema Rengi Seçin:</label>
                            <input type="color" name="color" value="#2563eb" style="width:50px; height:40px; padding:0; cursor:pointer;">
                        </div>
                        <button type="submit" class="btn-main" style="background:#2563eb; width:100%;">➕ Eğitim Modeli Ekle</button>
                    </form>
                    <div>${branchRows || '<p style="font-size:12px; color:gray;">Henüz eğitim modeli eklenmedi.</p>'}</div>
                </div>

                <div class="card">
                    <h3 style="color:var(--blue); border-bottom:2px solid #f1f5f9; padding-bottom:15px; margin-top:0;">📸 Akademi Albümüne Gönderi Ekle</h3>
                    <form action="/manage/add-gallery" method="POST" enctype="multipart/form-data" style="display:flex; flex-direction:column; gap:10px; margin-bottom:15px;">
                        <input type="text" name="title" placeholder="Gönderi Başlığı (Örn: Doğa Gezimiz)" required style="margin:0;">
                        <label style="font-size:12px; font-weight:bold; color:#475569;">Fotoğraflar (Birden Fazla Seçebilirsiniz)</label>
                        <input type="file" name="images" accept="image/*" multiple style="background:white; margin:0;">
                        <label style="font-size:12px; font-weight:bold; color:#475569;">Video Linki (YouTube/Instagram - İsteğe Bağlı)</label>
                        <input type="text" name="videoUrl" placeholder="Örn: https://www.youtube.com/watch?v=..." style="margin:0;">
                        <button type="submit" class="btn-main" style="background:#f59e0b; margin-top:10px;">➕ Albüme Ekle</button>
                    </form>
                    <div>${galleryRows || '<p style="font-size:12px; color:gray;">Galeride henüz paylaşım yok.</p>'}</div>
                </div>
            </div>

            <div id="t-ogretmen" class="tab-content">
                <div class="card">
                    <h3 style="color:var(--blue); border-bottom:2px solid #f1f5f9; padding-bottom:15px; margin-top:0;">👩‍🏫 Öğretmen Ekle & Yetkilendir</h3>
                    <form action="/admin/add-teacher" method="POST">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                            <input type="text" name="username" placeholder="Öğretmen Kullanıcı Adı" required>
                            <input type="password" name="password" placeholder="Giriş Şifresi" required>
                        </div>
                        <div style="margin-bottom:20px; padding:15px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; margin-top:15px;">
                            <strong style="font-size:14px; color:var(--blue); display:block; margin-bottom:10px;">Sorumlu Olacağı Sınıflar:</strong>
                            <div style="font-size:14px; color:#475569; display:grid; grid-template-columns: 1fr 1fr; gap:10px;">${classCheckboxes || 'Önce Sınıf Ekleyin'}</div>
                        </div>
                        <div style="margin-bottom:20px; font-size:14px; font-weight:bold; color:#475569;">
                            <strong>Sistem Yetkileri:</strong><br><br>
                            <label style="cursor:pointer; margin-right:15px;"><input type="checkbox" name="yoklama" value="true"> Yoklama Alma</label>
                            <label style="cursor:pointer; margin-right:15px;"><input type="checkbox" name="rapor" value="true"> Günlük Karne</label>
                            <label style="cursor:pointer; color:#ef4444; margin-right:15px;"><input type="checkbox" name="directEvent" value="true"> <b>Sormadan Etkinlik Açma</b></label>
                            <label style="cursor:pointer; color:#8b5cf6;"><input type="checkbox" name="vitrin" value="true"> <b>Vitrin Yönetimi</b></label>
                        </div>
                        <button type="submit" class="btn-main btn-blue" style="width:100%; padding:14px; font-size:15px;">Öğretmeni Kaydet</button>
                    </form>
                    <div style="margin-top:30px;">
                        <h4 style="color:var(--blue); margin-bottom:15px;">📋 Sistemdeki Öğretmenler</h4>
                        ${teacherList || '<p style="font-size:13px;color:gray;">Kayıtlı öğretmen yok.</p>'}
                    </div>
                </div>
            </div>

            <div id="t-ayar" class="tab-content">
                <div class="card" style="border:2px solid #25d366; background:#f0fdf4;">
                    <h3 style="color:#166534; margin-top:0; border-bottom:2px solid #bbf7d0; padding-bottom:10px;">📱 WhatsApp Bildirim Ayarları</h3>
                    <p style="font-size:13px; color:#166534;">Yöneticinin anında haberdar olması için WhatsApp numaranızı bağlayın.<br><b>Nasıl Alınır?</b> CallMeBot sitesindeki numaraya <code>I allow callmebot to send me messages</code> yazıp gönderin ve gelen API Key'i girin.</p>
                    <form action="/admin/update-wa" method="POST" style="margin-bottom:0;">
                        <label style="font-size:13px; font-weight:bold; color:#166534;">WhatsApp Numaranız</label>
                        <input type="text" name="waPhone" placeholder="Örn: 905551234567" value="${db.adminCredentials.waPhone || ''}" style="background:white; margin-top:5px;">
                        
                        <label style="font-size:13px; font-weight:bold; color:#166534;">CallMeBot API Key</label>
                        <input type="text" name="waApiKey" placeholder="Bot'tan gelen API şifresi" value="${db.adminCredentials.waApiKey || ''}" style="background:white; margin-top:5px;">
                        
                        <button type="submit" class="btn-main btn-success" style="width:100%; margin-top:10px;">💾 Bildirim Ayarlarını Kaydet</button>
                    </form>
                </div>

                <div class="card" style="border:2px solid #fecaca; background:#fef2f2; margin-top:15px;">
                    <h3 style="color:#ef4444; border-bottom:2px solid #fecaca; padding-bottom:15px; margin-top:0;">🔑 Güvenlik: Giriş Bilgilerini Değiştir</h3>
                    <form action="/admin/update-credentials" method="POST" style="margin-bottom:0; display:flex; gap:10px;">
                        <input type="text" name="newUsername" placeholder="Yeni Kullanıcı Adı" value="${db.adminCredentials.username}" required style="margin:0; flex:1; background:white;">
                        <input type="text" name="newPassword" placeholder="Yeni Şifre" value="${db.adminCredentials.password}" required style="margin:0; flex:1; background:white;">
                        <button type="submit" class="btn-main btn-danger">Bilgilerimi Güncelle</button>
                    </form>
                </div>
            </div>

        </div>
    </body></html>`);
});

// ============================================================================
// 5. MÜDÜR İŞLEM ROTALARI
// ============================================================================
app.post('/admin/update-wa', async (req, res) => {
    if (req.cookies.admin_logged !== 'true') return res.redirect('/login/admin');
    const db = await getDB();
    db.adminCredentials.waPhone = req.body.waPhone;
    db.adminCredentials.waApiKey = req.body.waApiKey;
    db.markModified('adminCredentials');
    await db.save();
    res.redirect('/admin');
});

app.post('/admin/update-credentials', async (req, res) => {
    if (req.cookies.admin_logged !== 'true') return res.redirect('/login/admin');
    const db = await getDB(); 
    db.adminCredentials.username = req.body.newUsername; 
    db.adminCredentials.password = req.body.newPassword; 
    db.markModified('adminCredentials');
    await db.save();
    res.cookie('admin_logged', '', {maxAge: 0});
    res.send(`<script>alert("Giriş bilgileriniz güncellendi! Lütfen yeni bilgilerinizle tekrar giriş yapın."); window.location.href="/login/admin";</script>`);
});

app.post('/admin/add-teacher', async (req, res) => {
    if (req.cookies.admin_logged !== 'true') return res.redirect('/login/admin');
    const db = await getDB();
    let selectedClasses = req.body.classes || [];
    if (!Array.isArray(selectedClasses)) selectedClasses = [selectedClasses];
    db.teachers.push({
        username: req.body.username,
        password: req.body.password,
        classes: selectedClasses,
        yoklama: !!req.body.yoklama,
        rapor: !!req.body.rapor,
        directEvent: !!req.body.directEvent,
        vitrin: !!req.body.vitrin
    });
    db.markModified('teachers');
    await db.save();
    res.redirect('/admin');
});

app.get('/admin/delete-teacher/:username', async (req, res) => { 
    if (req.cookies.admin_logged !== 'true') return res.redirect('/login/admin'); 
    const db = await getDB(); 
    db.teachers = db.teachers.filter(t => t.username !== req.params.username); 
    db.markModified('teachers');
    await db.save(); 
    res.redirect('/admin'); 
});

app.get('/admin/edit-teacher/:username', async (req, res) => {
    if (req.cookies.admin_logged !== 'true') return res.redirect('/login/admin');
    const db = await getDB();
    const teacher = db.teachers.find(t => t.username === req.params.username);
    if (!teacher) return res.redirect('/admin');

    let classCheckboxes = db.classes.map(c => {
        let isChecked = teacher.classes && teacher.classes.includes(c.name) ? 'checked' : '';
        return `<label style="display:block; margin-bottom:8px; cursor:pointer;"><input type="checkbox" name="classes" value="${c.name}" ${isChecked}> ${c.name}</label>`;
    }).join('');

    res.send(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">${portalTheme}</head><body>
        <div class="header-card"><h2 style="margin:0;">✏️ Öğretmen Düzenle</h2></div>
        <div style="max-width:500px; margin:30px auto; padding:15px;">
            <div class="card">
                <form action="/admin/update-teacher/${teacher.username}" method="POST" style="margin:0;">
                    <label style="font-size:13px; font-weight:bold; color:#475569;">Kullanıcı Adı</label>
                    <input type="text" name="username" value="${teacher.username}" required>
                    <label style="font-size:13px; font-weight:bold; color:#475569;">Şifre</label>
                    <input type="text" name="password" value="${teacher.password}" required>
                    <div style="margin-bottom:20px; padding:15px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
                        <strong style="font-size:14px; color:var(--blue); display:block; margin-bottom:10px;">Sorumlu Olduğu Sınıflar:</strong>
                        <div style="font-size:14px; color:#475569;">${classCheckboxes || 'Önce Sınıf Ekleyin'}</div>
                    </div>
                    <div style="margin-bottom:25px; font-size:14px; font-weight:bold; color:#475569;">
                        <strong>Yetkiler:</strong><br><br>
                        <label style="cursor:pointer; margin-right:15px;"><input type="checkbox" name="yoklama" value="true" ${teacher.yoklama ? 'checked' : ''}> Yoklama</label>
                        <label style="cursor:pointer; margin-right:15px;"><input type="checkbox" name="rapor" value="true" ${teacher.rapor ? 'checked' : ''}> Karne</label>
                        <label style="cursor:pointer; color:#ef4444; margin-right:15px;"><input type="checkbox" name="directEvent" value="true" ${teacher.directEvent ? 'checked' : ''}> <b>Etkinlik Açma</b></label>
                        <label style="cursor:pointer; color:#8b5cf6;"><input type="checkbox" name="vitrin" value="true" ${teacher.vitrin ? 'checked' : ''}> <b>Vitrin Yönetimi</b></label>
                    </div>
                    <button type="submit" class="btn-main btn-success" style="width:100%; padding:14px; font-size:15px;">💾 Değişiklikleri Kaydet</button>
                    <a href="/admin" style="display:block; text-align:center; margin-top:15px; color:gray; text-decoration:none; font-weight:bold;">İptal Et</a>
                </form>
            </div>
        </div>
    </body></html>`);
});

app.post('/admin/update-teacher/:oldUsername', async (req, res) => {
    if (req.cookies.admin_logged !== 'true') return res.redirect('/login/admin');
    const db = await getDB(); 
    let tIndex = db.teachers.findIndex(t => t.username === req.params.oldUsername);
    if (tIndex > -1) {
        let selectedClasses = req.body.classes || []; 
        if (!Array.isArray(selectedClasses)) selectedClasses = [selectedClasses];
        db.teachers[tIndex] = { 
            username: req.body.username, 
            password: req.body.password, 
            classes: selectedClasses, 
            yoklama: !!req.body.yoklama, 
            rapor: !!req.body.rapor, 
            directEvent: !!req.body.directEvent, 
            vitrin: !!req.body.vitrin 
        }; 
        db.markModified('teachers');
        await db.save();
    }
    res.redirect('/admin');
});

app.post('/admin/add-class', async (req, res) => { 
    if (req.cookies.admin_logged !== 'true') return res.redirect('/login/admin');
    const db = await getDB(); 
    db.classes.push({ id: Date.now().toString(), name: req.body.name, ageRange: req.body.ageRange || '' }); 
    db.markModified('classes');
    await db.save(); 
    res.redirect('/admin'); 
});

app.get('/admin/delete-class/:id', async (req, res) => { 
    if (req.cookies.admin_logged !== 'true') return res.redirect('/login/admin');
    const db = await getDB(); 
    db.classes = db.classes.filter(c => c.id !== req.params.id); 
    db.markModified('classes');
    await db.save(); 
    res.redirect('/admin'); 
});

app.get('/admin/edit-class/:id', async (req, res) => {
    if (req.cookies.admin_logged !== 'true') return res.redirect('/login/admin');
    const db = await getDB();
    const c = db.classes.find(x => x.id === req.params.id);
    if(!c) return res.redirect('/admin');
    res.send(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">${portalTheme}</head><body>
        <div class="header-card"><h2>✏️ Sınıf Düzenle</h2></div>
        <div style="max-width:600px; margin:20px auto; padding:20px;">
            <form action="/admin/update-class/${c.id}" method="POST" class="card">
                <label style="font-weight:bold; font-size:13px;">Sınıf Adı</label>
                <input type="text" name="name" value="${c.name}" required>
                <label style="font-weight:bold; font-size:13px;">Yaş Aralığı (Örn: 3-4)</label>
                <input type="text" name="ageRange" value="${c.ageRange || ''}">
                <button type="submit" class="btn-main btn-blue" style="width:100%; margin-top:15px; padding:15px;">💾 Değişiklikleri Kaydet</button>
                <a href="/admin" style="display:block; text-align:center; margin-top:15px; color:gray; text-decoration:none; font-weight:bold;">İptal Et</a>
            </form>
        </div>
    </body></html>`);
});

app.post('/admin/update-class/:id', async (req, res) => {
    if (req.cookies.admin_logged !== 'true') return res.redirect('/login/admin');
    const db = await getDB();
    const c = db.classes.find(x => x.id === req.params.id);
    if(c) {
        c.name = req.body.name;
        c.ageRange = req.body.ageRange;
        db.markModified('classes');
        await db.save();
    }
    res.redirect('/admin');
});

app.post('/admin/update-payment/:id', async (req, res) => {
    if (req.cookies.admin_logged !== 'true') return res.redirect('/login/admin');
    const db = await getDB();
    const st = db.students.find(s => s.id == req.params.id);
    if(st) { st.paidAmount = parseInt(req.body.paidAmount) || 0; }
    db.markModified('students');
    await db.save();
    res.redirect('/admin');
});

app.post('/admin/attendance/:id', async (req, res) => { 
    if (req.cookies.admin_logged !== 'true') return res.redirect('/login/admin');
    const db = await getDB(); 
    const st = db.students.find(s => s.id == req.params.id); 
    if(st) { 
        if(!st.attendance) st.attendance = {}; 
        st.attendance[req.body.date] = req.body.status; 
    } 
    db.markModified('students');
    await db.save(); 
    res.redirect('/admin'); 
});

// AİDAT OTOMATİK HESAPLAMA (KISTELYEVM)
app.post('/admin/add-student', async (req, res) => { 
    if (req.cookies.admin_logged !== 'true') return res.redirect('/login/admin');
    const db = await getDB(); 
    
    let baseFee = parseInt(req.body.baseFee) || 0;
    let finalFee = baseFee;

    if (req.body.prorate === 'true' && req.body.startDate) {
        let start = new Date(req.body.startDate);
        let year = start.getFullYear();
        let month = start.getMonth() + 1;
        let day = start.getDate();
        
        let daysInMonth = new Date(year, month, 0).getDate();
        let remainingDays = daysInMonth - day + 1;
        
        if(remainingDays < 0) remainingDays = 0;
        if(remainingDays > daysInMonth) remainingDays = daysInMonth;
        
        finalFee = Math.round((baseFee / daysInMonth) * remainingDays);
    }

    db.students.push({ 
        id: Date.now().toString(), 
        name: req.body.name, 
        class: req.body.class, 
        parentPhone: req.body.parentPhone, 
        password: req.body.password || "1234",
        mustChangePassword: true,
        allergy: req.body.allergy || 'Yok', 
        registrationDate: req.body.registrationDate,
        startDate: req.body.startDate,
        tuitionFee: finalFee,
        paidAmount: 0,
        feePaid: false, 
        attendance: {}, 
        reports: {} 
    }); 
    db.markModified('students');
    await db.save(); 
    res.redirect('/admin'); 
});

app.get('/delete-student/:id', async (req, res) => { 
    if (req.cookies.admin_logged !== 'true') return res.redirect('/login/admin');
    const db = await getDB(); 
    db.students = db.students.filter(s => s.id != req.params.id); 
    db.markModified('students');
    await db.save(); 
    res.redirect('/admin'); 
});

app.get('/admin/approve-event/:id', async (req, res) => { 
    if (req.cookies.admin_logged !== 'true') return res.redirect('/login/admin');
    const db = await getDB(); 
    const ev = db.events.find(e => e.id == req.params.id); 
    if(ev) ev.status = 'approved'; 
    db.markModified('events');
    await db.save(); 
    res.redirect('/admin'); 
});

// ============================================================================
// 6. ORTAK VİTRİN VE ETKİNLİK YÖNETİMİ
// ============================================================================
app.post('/manage/create-event', upload.single('image'), async (req, res) => {
    const db = await getDB();
    if (!canManageVitrin(req, db)) return res.redirect('/portal-giris');
    
    let imgPath = '';
    if (req.file) {
        imgPath = bufferToDataURI(req.file);
    }
    db.events.push({ 
        id: Date.now().toString(), 
        title: req.body.title, 
        imgUrl: imgPath, 
        date: req.body.date, 
        time: req.body.time, 
        endTime: req.body.endTime || 'Belirtilmedi', 
        quota: parseInt(req.body.quota), 
        price: req.body.price, 
        status: 'approved', 
        reservations: [], 
        waitlist: [] 
    });
    db.markModified('events');
    await db.save(); 
    res.redirect(req.cookies.admin_logged === 'true' ? '/admin' : '/ogretmen-panel');
});

app.get('/manage/delete-event/:id', async (req, res) => { 
    const db = await getDB(); 
    if (!canManageVitrin(req, db)) return res.redirect('/portal-giris');
    db.events = db.events.filter(e => e.id != req.params.id); 
    db.markModified('events');
    await db.save(); 
    res.redirect(req.cookies.admin_logged === 'true' ? '/admin' : '/ogretmen-panel'); 
});

app.get('/manage/edit-event/:id', async (req, res) => {
    const db = await getDB();
    if (!canManageVitrin(req, db)) return res.redirect('/portal-giris');
    const e = db.events.find(ev => ev.id == req.params.id);
    if(!e) return res.redirect('/');
    res.send(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">${portalTheme}</head><body>
        <div class="header-card"><h2>✏️ Etkinlik Düzenle</h2></div>
        <div style="max-width:600px; margin:20px auto; padding:20px;">
            <form action="/manage/update-event/${e.id}" method="POST" enctype="multipart/form-data" class="card">
                <label style="font-weight:bold; font-size:13px;">Etkinlik Adı</label>
                <input type="text" name="title" value="${e.title}" required>
                
                <label style="font-weight:bold; font-size:13px; color:#ea580c;">Yeni Fotoğraf (Değiştirmek istemiyorsanız boş bırakın)</label>
                <input type="file" name="image" accept="image/*" style="background:white;">
                
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;">
                    <div><label>Tarih</label><input type="date" name="date" value="${e.date}" required></div>
                    <div><label>Başlangıç</label><input type="time" name="time" value="${e.time}" required></div>
                    <div><label>Bitiş</label><input type="time" name="endTime" value="${e.endTime || ''}" required></div>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                    <div><label>Kontenjan</label><input type="number" name="quota" value="${e.quota}" required></div>
                    <div><label>Ücret</label><input type="number" name="price" value="${e.price}" required></div>
                </div>
                <button type="submit" class="btn-main btn-blue" style="width:100%; margin-top:15px; padding:15px;">💾 Değişiklikleri Kaydet</button>
                <a href="javascript:history.back()" style="display:block; text-align:center; margin-top:15px; color:gray; text-decoration:none; font-weight:bold;">İptal Et</a>
            </form>
        </div>
    </body></html>`);
});

app.post('/manage/update-event/:id', upload.single('image'), async (req, res) => {
    const db = await getDB();
    if (!canManageVitrin(req, db)) return res.redirect('/portal-giris');
    
    const ev = db.events.find(e => e.id == req.params.id);
    if(ev) {
        ev.title = req.body.title; 
        ev.date = req.body.date; 
        ev.time = req.body.time; 
        ev.endTime = req.body.endTime; 
        ev.quota = parseInt(req.body.quota); 
        ev.price = req.body.price;
        if(req.file) {
            ev.imgUrl = bufferToDataURI(req.file);
        }
        db.markModified('events');
        await db.save();
    }
    res.redirect(req.cookies.admin_logged === 'true' ? '/admin' : '/ogretmen-panel');
});

app.post('/manage/update-vitrin', async (req, res) => { 
    const db = await getDB(); 
    if (!canManageVitrin(req, db)) return res.redirect('/portal-giris');
    db.siteContent.heroTitle = req.body.heroTitle; 
    db.siteContent.heroDesc = req.body.heroDesc; 
    db.siteContent.contactPhone = req.body.contactPhone; 
    db.siteContent.instagramUrl = req.body.instagramUrl; 
    db.siteContent.facebookUrl = req.body.facebookUrl; 
    db.markModified('siteContent');
    await db.save(); 
    res.redirect(req.cookies.admin_logged === 'true' ? '/admin' : '/ogretmen-panel');
});

app.post('/manage/add-branch', async (req, res) => {
    const db = await getDB();
    if (!canManageVitrin(req, db)) return res.redirect('/portal-giris');
    db.siteContent.branches.push({ id: Date.now().toString(), icon: req.body.icon, title: req.body.title, desc: req.body.desc, color: req.body.color });
    db.markModified('siteContent');
    await db.save();
    res.redirect(req.cookies.admin_logged === 'true' ? '/admin' : '/ogretmen-panel');
});

app.get('/manage/delete-branch/:id', async (req, res) => {
    const db = await getDB();
    if (!canManageVitrin(req, db)) return res.redirect('/portal-giris');
    db.siteContent.branches = db.siteContent.branches.filter(b => b.id != req.params.id);
    db.markModified('siteContent');
    await db.save();
    res.redirect(req.cookies.admin_logged === 'true' ? '/admin' : '/ogretmen-panel');
});

app.get('/manage/edit-branch/:id', async (req, res) => {
    const db = await getDB();
    if (!canManageVitrin(req, db)) return res.redirect('/portal-giris');
    const b = db.siteContent.branches.find(x => x.id == req.params.id);
    if(!b) return res.redirect('/');
    res.send(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">${portalTheme}</head><body>
        <div class="header-card"><h2>✏️ Eğitim Modelini Düzenle</h2></div>
        <div style="max-width:600px; margin:20px auto; padding:20px;">
            <form action="/manage/update-branch/${b.id}" method="POST" class="card">
                <div style="display:grid; grid-template-columns: 1fr 3fr; gap:10px;">
                    <div><label>İkon</label><input type="text" name="icon" value="${b.icon}" required></div>
                    <div><label>Model Adı</label><input type="text" name="title" value="${b.title}" required></div>
                </div>
                <label>Açıklama</label>
                <input type="text" name="desc" value="${b.desc}" required>
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                    <label style="font-weight:bold; font-size:13px;">Tema Rengi:</label>
                    <input type="color" name="color" value="${b.color}" style="width:50px; height:40px; padding:0; cursor:pointer;">
                </div>
                <button type="submit" class="btn-main btn-blue" style="width:100%; padding:15px;">💾 Değişiklikleri Kaydet</button>
                <a href="javascript:history.back()" style="display:block; text-align:center; margin-top:15px; color:gray; text-decoration:none; font-weight:bold;">İptal Et</a>
            </form>
        </div>
    </body></html>`);
});

app.post('/manage/update-branch/:id', async (req, res) => {
    const db = await getDB();
    if (!canManageVitrin(req, db)) return res.redirect('/portal-giris');
    const b = db.siteContent.branches.find(x => x.id == req.params.id);
    if(b) { 
        b.icon = req.body.icon; 
        b.title = req.body.title; 
        b.desc = req.body.desc; 
        b.color = req.body.color; 
        db.markModified('siteContent');
        await db.save();
    }
    res.redirect(req.cookies.admin_logged === 'true' ? '/admin' : '/ogretmen-panel');
});

app.post('/manage/add-gallery', upload.array('images', 10), async (req, res) => { 
    const db = await getDB(); 
    if (!canManageVitrin(req, db)) return res.redirect('/portal-giris');
    
    let imgUrls = [];
    if (req.files && req.files.length > 0) {
        for (let file of req.files) {
            let dataUri = bufferToDataURI(file);
            if (dataUri) imgUrls.push(dataUri);
        }
    }

    db.siteContent.gallery.push({ id: Date.now().toString(), title: req.body.title, imgUrls: imgUrls, videoUrl: req.body.videoUrl || '' }); 
    db.markModified('siteContent');
    await db.save(); 
    res.redirect(req.cookies.admin_logged === 'true' ? '/admin' : '/ogretmen-panel'); 
});

app.get('/manage/delete-gallery/:id', async (req, res) => { 
    const db = await getDB(); 
    if (!canManageVitrin(req, db)) return res.redirect('/portal-giris');
    db.siteContent.gallery = db.siteContent.gallery.filter(g => g.id != req.params.id); 
    db.markModified('siteContent');
    await db.save(); 
    res.redirect(req.cookies.admin_logged === 'true' ? '/admin' : '/ogretmen-panel'); 
});

app.get('/manage/edit-gallery/:id', async (req, res) => {
    const db = await getDB();
    if (!canManageVitrin(req, db)) return res.redirect('/portal-giris');
    const g = db.siteContent.gallery.find(x => x.id == req.params.id);
    if(!g) return res.redirect('/');
    res.send(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">${portalTheme}</head><body>
        <div class="header-card"><h2>✏️ Galeri Gönderisini Düzenle</h2></div>
        <div style="max-width:600px; margin:20px auto; padding:20px;">
            <form action="/manage/update-gallery/${g.id}" method="POST" enctype="multipart/form-data" class="card">
                <label style="font-weight:bold; font-size:13px;">Başlık</label>
                <input type="text" name="title" value="${g.title}" required>
                <label style="font-weight:bold; font-size:13px; color:#ea580c;">Yeni Fotoğraflar (Eklemek istemiyorsanız boş bırakın. Eskiler silinmez.)</label>
                <input type="file" name="images" accept="image/*" multiple style="background:white;">
                <label style="font-weight:bold; font-size:13px;">Video Linki</label>
                <input type="text" name="videoUrl" value="${g.videoUrl || ''}" placeholder="YouTube Linki">
                <button type="submit" class="btn-main btn-blue" style="width:100%; margin-top:15px; padding:15px;">💾 Değişiklikleri Kaydet</button>
                <a href="javascript:history.back()" style="display:block; text-align:center; margin-top:15px; color:gray; text-decoration:none; font-weight:bold;">İptal Et</a>
            </form>
        </div>
    </body></html>`);
});

app.post('/manage/update-gallery/:id', upload.array('images', 10), async (req, res) => {
    const db = await getDB();
    if (!canManageVitrin(req, db)) return res.redirect('/portal-giris');
    
    const g = db.siteContent.gallery.find(x => x.id == req.params.id);
    
    if(g) { 
        g.title = req.body.title; 
        g.videoUrl = req.body.videoUrl || '';
        if (req.files && req.files.length > 0) {
            if(!g.imgUrls) g.imgUrls = [];
            for (let file of req.files) {
                let dataUri = bufferToDataURI(file);
                if (dataUri) g.imgUrls.push(dataUri);
            }
        }
        db.markModified('siteContent');
        await db.save();
    }
    res.redirect(req.cookies.admin_logged === 'true' ? '/admin' : '/ogretmen-panel');
});

// ============================================================================
// 7. ÖĞRETMEN PANELİ VE SINIF İŞLEMLERİ (PWA BİLGİLENDİRMESİ DAHİL)
// ============================================================================
app.get('/login/ogretmen', (req, res) => {
    res.send(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">${portalTheme}</head><body>
        <div class="header-card">
            <h2 style="margin:0;">👩‍🏫 Öğretmen Girişi</h2>
            <a href="/portal-giris" style="color:#bfdbfe; font-size:13px; text-decoration:none; display:inline-block; margin-top:10px;">← Kullanıcı Girişine Dön</a>
        </div>
        <div style="padding:30px; max-width:400px; margin:0 auto;">
            <form action="/login/ogretmen" method="POST" class="card">
                <input type="text" name="username" placeholder="Kullanıcı Adı" required>
                <input type="password" name="password" placeholder="Şifre" required>
                <button type="submit" class="btn-main btn-blue" style="width:100%;">Giriş Yap</button>
            </form>
        </div>
        <div style="text-align:center; margin-top:20px;">
            ${pwaInstallInfo}
        </div>
    </body></html>`);
});

app.post('/login/ogretmen', async (req, res) => {
    const db = await getDB(); 
    const teacher = db.teachers.find(t => t.username === req.body.username && t.password === req.body.password);
    if (teacher) { 
        res.cookie('teacher_user', teacher.username); 
        res.redirect('/ogretmen-panel'); 
    } else {
        res.send(`<script>alert("Hatalı kullanıcı adı veya şifre!"); window.location.href="/login/ogretmen";</script>`);
    }
});

app.get('/ogretmen-panel', async (req, res) => {
    const db = await getDB(); 
    const today = new Date().toISOString().split('T')[0]; 
    const uName = req.cookies.teacher_user; 
    const teacher = db.teachers.find(t => t.username === uName);
    
    if (!teacher) return res.redirect('/login/ogretmen');

    let myStudents = db.students.filter(s => teacher.classes.includes(s.class));
    let studentOperationsHTML = myStudents.map(s => {
        let attStatus = (s.attendance && s.attendance[today]) ? s.attendance[today] : 'Belirtilmedi';
        let reportSent = (s.reports && s.reports[today]) ? true : false;
        let raporFormHTML = teacher.rapor ? `
            <div style="margin-top:15px; padding-top:15px; border-top:1px dashed #cbd5e1;">
                ${reportSent ? `<div style="color:#10b981; font-weight:bold; font-size:13px; text-align:center; padding:10px; background:#f0fdf4; border-radius:8px;">✅ Bugünkü Karne Veliye İletildi</div>` : `
                <form action="/teacher/send-report/${s.id}" method="POST" style="margin:0;">
                    <input type="hidden" name="date" value="${today}">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                        <div>
                            <label style="font-size:11px; font-weight:bold; color:#64748b;">Uyku Durumu</label>
                            <select name="uyku" required style="margin:0; padding:10px;">
                                <option value="Uyumadı">Uyumadı</option>
                                <option value="1 Saat Uyudu">1 Saat Uyudu</option>
                                <option value="2+ Saat Uyudu">2+ Saat Uyudu</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-size:11px; font-weight:bold; color:#64748b;">Yemek Durumu</label>
                            <select name="yemek" required style="margin:0; padding:10px;">
                                <option value="Hepsini Yedi">Hepsini Yedi</option>
                                <option value="Yarısını Yedi">Yarısını Yedi</option>
                                <option value="Yemedi">Yemedi</option>
                            </select>
                        </div>
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="font-size:11px; font-weight:bold; color:#64748b;">Ruh Hali</label>
                        <select name="ruhHali" required style="margin:0; padding:10px;">
                            <option value="Neşeli 😊">Neşeli 😊</option>
                            <option value="Sakin 😌">Sakin 😌</option>
                            <option value="Hareketli ⚡">Hareketli ⚡</option>
                        </select>
                    </div>
                    <textarea name="mesaj" placeholder="Özel veli notu..." rows="2" style="margin-bottom:10px; width:100%;"></textarea>
                    <button type="submit" class="btn-main btn-blue" style="width:100%; padding:12px;">📲 Veliye Karne Gönder</button>
                </form>`}
            </div>` : '';

        return `
        <div style="background:white; border:1px solid #e2e8f0; border-radius:15px; padding:20px; margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <b style="font-size:18px; color:var(--blue);">${s.name}</b><br>
                    <small style="color:#64748b; font-weight:bold;">${s.class}</small><br>
                    <small style="color:${attStatus==='Geldi'?'#10b981':(attStatus==='Gelmedi'?'#ef4444':'#94a3b8')}; font-weight:bold; font-size:13px; display:inline-block; margin-top:5px;">Yoklama: ${attStatus}</small>
                </div>
                ${teacher.yoklama ? `
                <form action="/teacher/attendance/${s.id}" method="POST" style="margin:0; display:flex; flex-direction:column; gap:5px;">
                    <input type="hidden" name="date" value="${today}">
                    <button name="status" value="Geldi" class="btn-main btn-success" style="padding:8px 15px; font-size:12px;">✔️ Geldi</button>
                    <button name="status" value="Gelmedi" class="btn-main btn-danger" style="padding:8px 15px; font-size:12px;">✖️ Gelmedi</button>
                </form>` : ''}
            </div>
            ${raporFormHTML}
        </div>`;
    }).join('') || '<div class="card" style="text-align:center; color:#ef4444; font-weight:bold;">Sınıfınızda öğrenci yok.</div>';

    let teacherClassUploadHTML = teacher.classes.map(clsName => {
        let photos = (db.classAlbums || []).filter(item => item && item.className === clsName);
        let photoGrid = photos.map(p => {
            let imgs = (p.imgUrls || []).map(u => `<img src="${u}" style="width:60px; height:60px; object-fit:cover; border-radius:8px; margin:2px;">`).join('');
            if(!imgs && !p.videoUrl) return '';

            return `
            <div style="position:relative; display:inline-block; margin:5px; padding:5px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
                <div style="display:flex; flex-wrap:wrap; max-width:140px;">${imgs}</div>
                ${p.videoUrl ? '<div style="font-size:10px; color:var(--blue); font-weight:bold; text-align:center; margin-top:3px;">🎥 Video</div>' : ''}
                <a href="/teacher/delete-gallery/${p.id}" style="position:absolute; top:-8px; right:-8px; background:red; color:white; border-radius:50%; width:22px; height:22px; text-align:center; line-height:22px; font-size:12px; text-decoration:none;">×</a>
            </div>`;
        }).join('') || '<p style="font-size:12px; color:gray;">Henüz paylaşım yapılmadı.</p>';

        return `
        <div class="card" style="border-top:4px solid var(--blue); margin-top:15px;">
            <h4 style="margin:0 0 15px 0; color:var(--blue);">📸 ${clsName} - Albüme Gönderi Ekle</h4>
            <form action="/teacher/upload-gallery" method="POST" enctype="multipart/form-data" style="display:flex; flex-direction:column; gap:10px; margin-bottom:10px; background:#f1f5f9; padding:15px; border-radius:10px;">
                <input type="hidden" name="className" value="${clsName}">
                <label style="font-size:12px; font-weight:bold; color:#475569; margin-bottom:-5px;">Fotoğraflar (Birden fazla seçilebilir)</label>
                <input type="file" name="images" accept="image/*" multiple style="background:white; margin:0; padding:8px;">
                
                <label style="font-size:12px; font-weight:bold; color:#475569; margin-bottom:-5px; margin-top:5px;">Video Linki (YouTube / Instagram - İsteğe Bağlı)</label>
                <input type="text" name="videoUrl" placeholder="Örn: https://www.youtube.com/..." style="margin:0;">
                
                <button type="submit" class="btn-main btn-success" style="padding:10px 15px; font-size:14px; margin-top:5px;">Sınıf Albümünde Paylaş</button>
            </form>
            <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:15px;">${photoGrid}</div>
        </div>`;
    }).join('');

    res.send(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">${portalTheme}</head><body>
        <div class="header-card">
            <h2 style="margin:0;">👩‍🏫 Hoşgeldiniz, ${uName}</h2>
            <a href="/portal-giris" style="color:#bfdbfe; font-size:13px; text-decoration:none; display:inline-block; margin-top:10px;">Çıkış Yap</a>
        </div>
        <div style="max-width:900px; margin:20px auto; padding:0 20px;">
            <div style="display:flex; flex-wrap:wrap; margin-bottom:25px;">
                <button class="tab-btn active-btn" onclick="showTab('t-sinifim', event)">📋 Sınıfım & Yoklama</button>
                <button class="tab-btn" onclick="showTab('t-galeri', event)">📸 Sınıf Albümü</button>
                <button class="tab-btn" onclick="showTab('t-etkinlik', event)">🎈 Etkinlikler</button>
            </div>
            <div id="t-sinifim" class="tab-content active">${studentOperationsHTML}</div>
            <div id="t-galeri" class="tab-content">${teacherClassUploadHTML}</div>
            <div id="t-etkinlik" class="tab-content">
                <div class="card">
                    <h3 style="color:#ea580c; margin-top:0;">🎈 Yeni Etkinlik Talebi</h3>
                    <form action="/teacher/request-event" method="POST" enctype="multipart/form-data" style="margin:0;">
                        <input type="text" name="title" placeholder="Etkinlik Adı" required>
                        <input type="file" name="image" accept="image/*" required style="background:white; margin:0 0 10px 0;">
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;">
                            <div><label>Tarih</label><input type="date" name="date" required></div>
                            <div><label>Başlama</label><input type="time" name="time" required></div>
                            <div><label>Bitiş</label><input type="time" name="endTime" required></div>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                            <div><label>Kontenjan</label><input type="number" name="quota" required></div>
                            <div><label>Ücret (TL)</label><input type="number" name="price" required></div>
                        </div>
                        <button type="submit" class="btn-main btn-blue" style="width:100%; margin-top:20px;">${teacher.directEvent ? 'Etkinliği Doğrudan Yayınla' : 'Talebi İlet'}</button>
                    </form>
                </div>
            </div>
        </div>
    </body></html>`);
});

app.post('/teacher/attendance/:id', async (req, res) => { 
    const db = await getDB(); 
    const st = db.students.find(s => s.id == req.params.id); 
    if(st) { 
        if(!st.attendance) st.attendance = {}; 
        st.attendance[req.body.date] = req.body.status; 
    } 
    db.markModified('students'); 
    await db.save(); 
    res.redirect('/ogretmen-panel'); 
});

app.post('/teacher/send-report/:id', async (req, res) => { 
    const db = await getDB(); 
    const st = db.students.find(s => s.id == req.params.id); 
    if(st) { 
        if(!st.reports) st.reports = {}; 
        st.reports[req.body.date] = { 
            uyku: req.body.uyku, 
            yemek: req.body.yemek, 
            ruhHali: req.body.ruhHali, 
            mesaj: req.body.mesaj, 
            timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) 
        }; 
    } 
    db.markModified('students'); 
    await db.save(); 
    res.redirect('/ogretmen-panel'); 
});

app.post('/teacher/upload-gallery', upload.array('images', 10), async (req, res) => {
    const db = await getDB(); 
    const teacher = db.teachers.find(t => t.username === req.cookies.teacher_user);
    const targetClass = req.body.className;
    
    if (!teacher || !teacher.classes.includes(targetClass)) return res.redirect('/ogretmen-panel');

    let imgUrls = []; 
    if (req.files && req.files.length > 0) { 
        for (let file of req.files) { 
            let dataUri = bufferToDataURI(file); 
            if (dataUri) imgUrls.push(dataUri); 
        } 
    }
    
    if (imgUrls.length === 0 && !req.body.videoUrl) {
        return res.send(`<script>alert("HATA: Fotoğraf seçilmedi veya video linki girilmedi."); window.location.href="/ogretmen-panel";</script>`);
    }

    if (!Array.isArray(db.classAlbums)) db.classAlbums = [];
    
    db.classAlbums.push({
        id: Date.now().toString(),
        className: targetClass,
        imgUrls: imgUrls,
        videoUrl: req.body.videoUrl || '',
        date: new Date().toLocaleDateString('tr-TR')
    });
    
    db.markModified('classAlbums'); 
    await db.save();
    res.redirect('/ogretmen-panel');
});

app.get('/teacher/delete-gallery/:id', async (req, res) => {
    const db = await getDB(); 
    const teacher = db.teachers.find(t => t.username === req.cookies.teacher_user);
    if (!teacher) return res.redirect('/ogretmen-panel');

    if (Array.isArray(db.classAlbums)) { 
        db.classAlbums = db.classAlbums.filter(x => x.id !== req.params.id);
        db.markModified('classAlbums'); 
        await db.save(); 
    } 
    res.redirect('/ogretmen-panel');
});

app.post('/teacher/request-event', upload.single('image'), async (req, res) => { 
    const db = await getDB(); 
    const teacher = db.teachers.find(t => t.username === req.cookies.teacher_user); 
    const status = (teacher && teacher.directEvent) ? 'approved' : 'pending'; 
    let imgPath = ''; 
    
    if (req.file) {
        imgPath = bufferToDataURI(req.file);
    }
    
    db.events.push({ 
        id: Date.now().toString(), 
        title: req.body.title, 
        imgUrl: imgPath, 
        date: req.body.date, 
        time: req.body.time, 
        endTime: req.body.endTime || 'Belirtilmedi', 
        quota: parseInt(req.body.quota), 
        price: req.body.price, 
        status: status, 
        reservations: [], 
        waitlist: [] 
    }); 
    
    if(status === 'pending') {
        sendWaNotification(db, `Öğretmen Talebi: ${teacher.username}, "${req.body.title}" adlı yeni bir etkinlik açmak istiyor. Müdür panelinden onaylayın.`);
    }

    db.markModified('events'); 
    await db.save(); 
    res.send(`<script>alert("Talebiniz kaydedildi!"); window.location.href="/ogretmen-panel";</script>`); 
});

// ============================================================================
// 8. VELİ PORTALI (PWA BİLGİLENDİRMESİ DAHİL)
// ============================================================================
app.get('/login/veli', (req, res) => {
    res.send(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">${portalTheme}</head><body>
        <div class="header-card">
            <h2 style="margin:0;">👨‍👩‍👧 Veli Girişi</h2>
            <a href="/portal-giris" style="color:#bfdbfe; font-size:13px; text-decoration:none; display:inline-block; margin-top:10px;">← Geri Dön</a>
        </div>
        <div style="padding:30px; max-width:400px; margin:0 auto;">
            <form action="/veli-giris" method="POST" class="card">
                <input type="text" name="phone" placeholder="Kayıtlı Veli Telefonu" required>
                <input type="password" name="password" placeholder="Şifreniz (İlk giriş: 1234)" required>
                <button type="submit" class="btn-main btn-blue" style="width:100%; margin-top:10px;">Giriş Yap</button>
            </form>
        </div>
        <div style="text-align:center; margin-top:20px;">
            ${pwaInstallInfo}
        </div>
    </body></html>`);
});

app.post('/veli-giris', async (req, res) => {
    const db = await getDB();
    let student = db.students.find(s => s.parentPhone === req.body.phone && s.password === req.body.password);
    if (student) { 
        res.cookie('veli_phone', student.parentPhone); 
        if (student.mustChangePassword) {
            return res.redirect('/veli-sifre-degistir'); 
        }
        return res.redirect('/veli-panel'); 
    } else { 
        res.send(`<script>alert("Hatalı telefon veya şifre!"); window.location.href="/login/veli";</script>`); 
    }
});

app.get('/veli-sifre-degistir', async (req, res) => {
    if (!req.cookies.veli_phone) return res.redirect('/login/veli');
    res.send(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">${portalTheme}</head><body>
        <div class="header-card"><h2 style="margin:0;">🔒 Güvenlik: Şifrenizi Değiştirin</h2></div>
        <div style="padding:30px; max-width:400px; margin:20px auto;">
            <form action="/veli-sifre-guncelle" method="POST" class="card">
                <p style="font-size:13px; color:#64748b;">Güvenliğiniz için ilk girişinizde şifrenizi değiştirmeniz gerekmektedir.</p>
                <input type="password" name="newPassword" placeholder="Yeni şifrenizi girin" required>
                <button type="submit" class="btn-main btn-success" style="width:100%; margin-top:10px;">Kaydet ve Devam Et</button>
            </form>
        </div>
    </body></html>`);
});

app.post('/veli-sifre-guncelle', async (req, res) => {
    const db = await getDB(); 
    const phone = req.cookies.veli_phone; 
    let student = db.students.find(s => s.parentPhone === phone);
    if (student) { 
        student.password = req.body.newPassword; 
        student.mustChangePassword = false; 
        db.markModified('students'); 
        await db.save(); 
        res.redirect('/veli-panel'); 
    } else {
        res.redirect('/login/veli');
    }
});

app.get('/veli-panel', async (req, res) => {
    const db = await getDB(); 
    const phone = req.cookies.veli_phone; 
    let student = db.students.find(s => s.parentPhone === phone);
    if (!student) return res.redirect('/login/veli');

    const today = new Date().toISOString().split('T')[0];
    const todayStatus = (student.attendance && student.attendance[today]) ? student.attendance[today] : 'Henüz Alınmadı';
    
    let todayReport = (student.reports && student.reports[today]) ? student.reports[today] : null;
    let reportHTML = todayReport ? `
        <div style="background:#fffbeb; padding:20px; border-radius:15px; border:2px solid #fde68a;">
            <p>😴 <b>Uyku:</b> ${todayReport.uyku}</p>
            <p>🍽️ <b>Yemek:</b> ${todayReport.yemek}</p>
            <p>🎭 <b>Ruh Hali:</b> ${todayReport.ruhHali}</p>
            ${todayReport.mesaj ? `<p style="background:white; padding:10px; border-radius:8px;"><i>"${todayReport.mesaj}"</i></p>` : ''}
        </div>` : `<p style="text-align:center; color:gray;">Bugünkü karne henüz girilmedi.</p>`;
    
    let kalanTutar = (student.tuitionFee || 0) - (student.paidAmount || 0);

    const photos = (db.classAlbums || []).filter(item => item && item.className === student.class);
    const galleryHTML = photos.map(p => {
        let rawImgs = (p.imgUrls && p.imgUrls.length > 0) ? p.imgUrls : [];
        let imgsHTML = rawImgs.map(u => `
            <div class="img-container">
                <img src="${u}">
                <a href="${u}" download="sinif-fotografi.jpg" class="download-btn">⬇️ İndir</a>
            </div>
        `).join('');
        let vid = getEmbedHTML(p.videoUrl);
        return `
        <div style="background:white; border-radius:15px; padding:15px; box-shadow:0 4px 10px rgba(0,0,0,0.05); margin-bottom:20px;">
            <div style="font-size:12px; color:gray; text-align:right; margin-bottom:10px; font-weight:bold;">📅 ${p.date}</div>
            <div class="horizontal-slider">${imgsHTML}</div>
            ${vid}
        </div>`;
    }).join('') || '<p style="text-align:center; color:gray;">Öğretmeniniz henüz bu sınıfa gönderi eklemedi.</p>';

    res.send(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">${portalTheme}</head><body>
        <div class="header-card">
            <h2 style="margin:0;">🎓 Veli Portalı</h2>
            <a href="/portal-giris" style="color:#bfdbfe; font-size:13px; text-decoration:none; display:inline-block; margin-top:10px;">Çıkış Yap</a>
        </div>
        <div style="max-width:600px; margin:0 auto; padding:20px;">
            <div class="card" style="text-align:center;">
                <h1 style="color:var(--blue); margin:0;">${student.name}</h1>
                <p style="margin:5px 0 0 0; color:#64748b;">${student.class}</p>
            </div>
            <div class="card">
                <h3>📑 Günlük Gelişim Karnesi</h3>
                ${reportHTML}
            </div>
            <div class="card">
                <h3>📸 Sınıf Albümü & Etkinlikler</h3>
                ${galleryHTML}
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                <div class="card" style="text-align:center;">
                    <h4>Okula Geldi Mi?</h4>
                    <b style="font-size:18px; color:var(--blue);">${todayStatus}</b>
                </div>
                <div class="card" style="text-align:center;">
                    <h4>Aidat Durumu</h4>
                    <b style="font-size:18px; color:${kalanTutar<=0?'#10b981':'#ef4444'}">${kalanTutar<=0?'ÖDENDİ':'KALAN VAR'}</b>
                    ${kalanTutar > 0 ? `<div style="font-size:12px; margin-top:5px; color:#ef4444;">Kalan: ${kalanTutar} TL</div>` : ''}
                </div>
            </div>
        </div>
    </body></html>`);
});

// Sunucuyu Başlat
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 ALBAYRAK ÇOCUK AKADEMİSİ BAŞARIYLA BAŞLATILDI: http://localhost:${PORT}`));