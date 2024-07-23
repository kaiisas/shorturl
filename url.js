import express from 'express';
import shortid from 'shortid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3300;

app.use(express.json());
app.use(express.static('public'));

// Rute untuk halaman uji
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// Rute untuk halaman uji
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});



const ADMIN_ID = 'gl0rm#b3zzle@qu1rk^bl4st#sn00ze$qu@rk^tw1gl3*m3ep^gl@sh$fl1bbl3#z1p^tw1nk!3@dr00l^m@j0rk$fr1zz#bl@z3^spl!nk$gl@ss#sn1p^fl!nk';

function isIdExists(id) {
    const filePath = path.join(__dirname, 'data', 'urls', `${id}.json`);
    return fs.existsSync(filePath);
}

// Fungsi untuk memastikan URL memiliki skema
function ensureUrlHasScheme(url) {
    if (!/^https?:\/\//i.test(url)) {
        return 'http://' + url;
    }
    return url;
}

// Endpoint untuk menyingkat URL dengan path kustom
app.post('/api/shorten', (req, res) => {
    let { originalUrl, customPath } = req.body;
    if (!originalUrl) {
        return res.status(400).json({ error: 'URL tidak valid' });
    }

    originalUrl = ensureUrlHasScheme(originalUrl); // Pastikan URL memiliki skema
    let id = customPath || shortid.generate();  // Gunakan path kustom jika ada, atau ID acak jika tidak ada
    if (customPath && isIdExists(customPath)) {
        return res.status(400).json({ error: 'Path kustom sudah digunakan' });
    }
    const shortUrl = `${req.protocol}://${req.get('host')}/${id}`;
    const urlData = { id, originalUrl, shortUrl };

    fs.writeFileSync(path.join(__dirname, 'data', 'urls', `${id}.json`), JSON.stringify(urlData));

    // Buat folder di dalam web berdasarkan nama URL yang telah di-short
    const safeFolderName = encodeURIComponent(originalUrl); // Aman digunakan sebagai nama folder
    const webFolderPath = path.join(__dirname, 'web', safeFolderName);
    if (!fs.existsSync(webFolderPath)) {
        fs.mkdirSync(webFolderPath, { recursive: true });
    }

    res.json({ shortUrl, webFolderPath });
});

// Endpoint untuk menghapus URL
app.delete('/api/delete/:adminId/:id', (req, res) => {
    const { adminId, id } = req.params;

    if (adminId !== ADMIN_ID) {
        return res.status(403).json({ error: 'ID admin tidak valid' });
    }

    const filePath = path.join(__dirname, 'data', 'urls', `${id}.json`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'URL tidak ditemukan' });
    }

    fs.unlinkSync(filePath);
    res.json({ message: 'URL berhasil dihapus' });
});

// Endpoint untuk melaporkan URL
app.post('/api/report', (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: 'ID tidak valid' });
    }

    const urlFilePath = path.join(__dirname, 'data', 'urls', `${id}.json`);
    if (!fs.existsSync(urlFilePath)) {
        return res.status(404).json({ error: 'URL tidak ditemukan' });
    }

    const urlData = JSON.parse(fs.readFileSync(urlFilePath));
    const safeFolderName = encodeURIComponent(urlData.originalUrl); // Aman digunakan sebagai nama folder
    const webFolderPath = path.join(__dirname, 'web', safeFolderName);

    // Buat file laporan HTML
    const reportFilePath = path.join(webFolderPath, `${id}.html`);
    const reportContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reported URL</title>
        </head>
        <body>
            <h1>Reported URL</h1>
            <p>ID: ${id}</p>
            <p>Original URL: <a href="${urlData.originalUrl}" target="_blank">${urlData.originalUrl}</a></p>
        </body>
        </html>
    `;
    fs.writeFileSync(reportFilePath, reportContent);

    // Simpan laporan di file JSON
    const reportDataPath = path.join(__dirname, 'data', 'report.json');
    let reports = [];
    if (fs.existsSync(reportDataPath)) {
        reports = JSON.parse(fs.readFileSync(reportDataPath));
    }
    reports.push({ id, originalUrl: urlData.originalUrl });
    fs.writeFileSync(reportDataPath, JSON.stringify(reports));

    res.json({ message: 'URL berhasil dilaporkan' });
});

// Endpoint untuk mendapatkan daftar laporan
app.get('/api/reports', (req, res) => {
    const reportDataPath = path.join(__dirname, 'data', 'report.json');
    if (fs.existsSync(reportDataPath)) {
        const reports = JSON.parse(fs.readFileSync(reportDataPath));
        res.json(reports);
    } else {
        res.json([]);
    }
});

// Endpoint untuk mendapatkan semua URL yang ada di database
app.get('/api/urls', (req, res) => {
    const urlsDirectory = path.join(__dirname, 'data', 'urls');
    if (!fs.existsSync(urlsDirectory)) {
        return res.status(404).json({ error: 'URL directory tidak ditemukan' });
    }

    const urlFiles = fs.readdirSync(urlsDirectory);
    const urls = urlFiles.map(file => {
        const filePath = path.join(urlsDirectory, file);
        const urlData = JSON.parse(fs.readFileSync(filePath));
        return urlData;
    });

    res.json(urls);
});

// Endpoint untuk mendapatkan URL berdasarkan ID
app.get('/api/url/:id', (req, res) => {
    const { id } = req.params;
    const filePath = path.join(__dirname, 'data', 'urls', `${id}.json`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'URL tidak ditemukan' });
    }

    const urlData = JSON.parse(fs.readFileSync(filePath));
    res.json(urlData);
});

// Redirect endpoint untuk short URLs
app.get('/:id', (req, res) => {
    const { id } = req.params;
    const filePath = path.join(__dirname, 'data', 'urls', `${id}.json`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('URL tidak ditemukan');
    }

    const { originalUrl } = JSON.parse(fs.readFileSync(filePath));
    res.redirect(originalUrl);
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
