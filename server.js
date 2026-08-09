// =========================================================
// DeadTown - Local High-Performance HTTP Web Server
// Native Node.js - Zero External Dependencies Required
// =========================================================

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Discord Webhook for Job Applications
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1535971055267614730/Up0h6nVc30fdqjbZAsKZvPtyAHOib2xDEJBvWO8ifoWpHlmcTYs4mQlBwm584FzlSgTJ';

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.eot': 'application/vnd.ms-fontobject',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
    // Parse URL path and query
    let safeUrl = req.url.split('?')[0];
    try {
        safeUrl = decodeURIComponent(safeUrl);
    } catch (e) {
        safeUrl = req.url.split('?')[0];
    }

    // =================== Job Application Webhook Endpoint ===================
    if (req.method === 'POST' && safeUrl === '/submit-application') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 1e6) req.destroy();
        });
        req.on('end', () => {
            let data = {};
            try {
                data = JSON.parse(body);
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
                return;
            }

            const truncate = (str, max) => {
                const s = String(str || '').trim();
                return s.length > max ? s.substring(0, max - 1) + '…' : s;
            };

            const SITE_BASE = 'https://deadtown-website.netlify.app';
            const SITE_LOGO = `${SITE_BASE}/assets/images/logo.png`;
            const BANNER = `${SITE_BASE}/assets/images/webhook-banner.png`;
            const DIVIDER = '━━━━━━━━━━━━━━━━━━━━━━━━';

            const departmentColor = (dept) => {
                const d = String(dept || '').toLowerCase();
                if (d.includes('شرطة') || d.includes('بوليس') || d.includes('مرور') || d.includes('police') || d.includes('lspd') || d.includes('swat')) return 0x3B82F6;
                if (d.includes('إسعاف') || d.includes('اسعاف') || d.includes('طب') || d.includes('طبي') || d.includes('مستشفى') || d.includes('ems')) return 0xEF4444;
                if (d.includes('قضاء') || d.includes('محام') || d.includes('محكمة') || d.includes('doj')) return 0xF59E0B;
                return 0xA333FF;
            };

            const code = (v) => '`' + truncate(v, 40) + '`';
            const accent = departmentColor(data.department);

            const embed1 = {
                title: '📋 طلب وظيفة جديد — DeadTown',
                description: `**${truncate(data.discordUser, 60)}** أرسل طلب تقديم وظيفة في قطاع **${truncate(data.department, 50)}**\n${DIVIDER}`,
                color: accent,
                image: { url: BANNER },
                footer: { text: 'DeadTown | نظام التقديم على الوظائف', icon_url: SITE_LOGO },
                timestamp: new Date().toISOString()
            };

            const embed2 = {
                title: '🧑 معلومات المتقدم',
                color: accent,
                fields: [
                    { name: '🛡️ القطاع المطلوب', value: `>>> ${truncate(data.department, 150)}`, inline: true },
                    { name: '🎫 رقم التذكرة', value: `>>> ${code(data.ticketId)}`, inline: true },
                    { name: '📊 حالة الطلب', value: '>>> ⏳ بانتظار المراجعة', inline: true },
                    { name: '💬 اسم الديسكورد', value: `>>> ${truncate(data.discordUser, 150)}`, inline: true },
                    { name: '🧑 اسم الشخصية', value: `>>> ${truncate(data.charName, 150)}`, inline: true },
                    { name: '🎂 العمر', value: `>>> ${truncate(data.realAge, 10)}`, inline: true },
                    { name: '🖥️ Steam Hex ID', value: `>>> ${code(data.steamHex)}`, inline: true },
                    { name: '⏰ ساعات التواجد', value: `>>> ${truncate(data.playHours, 150)}`, inline: true },
                    { name: '🎙️ جودة المايكروفون', value: `>>> ${truncate(data.micQuality, 150)}`, inline: true }
                ],
                footer: { text: 'تُراجع الاستمارة من قبل الإدارة', icon_url: SITE_LOGO },
                timestamp: new Date().toISOString()
            };

            const embed3 = {
                title: '📝 إجابات المتقدم',
                color: 0x53FC18,
                fields: [
                    { name: '💼 الخبرات السابقة', value: truncate(data.experience, 1024) || 'لا توجد خبرات سابقة' },
                    { name: '🧠 إجابة السيناريو', value: truncate(data.scenarioAnswer, 1024) || 'لم تتم الإجابة' }
                ],
                footer: { text: 'أرسلت الاستمارة من الموقع الرسمي 🌐', icon_url: SITE_LOGO },
                timestamp: new Date().toISOString()
            };

            const payload = JSON.stringify({ embeds: [embed1, embed2, embed3] });

            const sendToDiscord = (cb) => {
                const url = new URL(DISCORD_WEBHOOK_URL);
                const options = {
                    hostname: url.hostname,
                    path: url.pathname,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(payload)
                    }
                };
                const reqHook = https.request(options, (resHook) => {
                    let resp = '';
                    resHook.on('data', (c) => { resp += c; });
                    resHook.on('end', () => cb(resHook.statusCode, resp));
                });
                reqHook.on('error', (e) => cb(0, e.message));
                reqHook.write(payload);
                reqHook.end();
            };

            sendToDiscord((statusCode) => {
                const ok = statusCode >= 200 && statusCode < 300;
                res.writeHead(ok ? 200 : 500, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ ok, statusCode }));
            });
        });
        return;
    }

    // Clean URL rewrites & routing
    let filePath = path.join(PUBLIC_DIR, safeUrl);

    // If root or route without extension
    if (safeUrl === '/' || safeUrl === '') {
        filePath = path.join(PUBLIC_DIR, 'index.html');
    } else if (safeUrl === '/rules') {
        filePath = path.join(PUBLIC_DIR, 'rules.html');
    } else if (safeUrl === '/job-application') {
        filePath = path.join(PUBLIC_DIR, 'job-application.html');
    }

    // Check if file exists, if not check with .html
    if (!fs.existsSync(filePath)) {
        if (fs.existsSync(filePath + '.html')) {
            filePath = filePath + '.html';
        } else {
            // Check in deadtown_clone as fallback
            const fallbackPath = path.join(PUBLIC_DIR, 'deadtown_clone', safeUrl);
            if (fs.existsSync(fallbackPath)) {
                filePath = fallbackPath;
            } else {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <!DOCTYPE html>
                    <html dir="rtl" lang="ar">
                    <head><meta charset="utf-8"/><title>404 - الصفحة غير موجودة</title>
                    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@700&display=swap" rel="stylesheet">
                    <style>body{font-family:'Tajawal',sans-serif;background:#0A0618;color:#FFF;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;} a{color:#A333FF;text-decoration:none;font-size:1.2rem;border:1px solid #A333FF;padding:10px 24px;border-radius:10px;margin-top:20px;display:inline-block;}</style>
                    </head>
                    <body><div><h1>404 | الصفحة غير موجودة</h1><p>الصفحة التي تبحث عنها غير متوفرة في سيرفر DeadTown.</p><a href="/">العودة للرئيسية</a></div></body>
                    </html>
                `);
                return;
            }
        }
    }

    // Directory check
    try {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
            if (!fs.existsSync(filePath)) {
                res.writeHead(403);
                res.end('Access Denied');
                return;
            }
        }

        const extname = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[extname] || 'application/octet-stream';

        // Video / Audio Streaming Range Request Handler (for rtwebsite.mp4)
        if (extname === '.mp4' || extname === '.webm' || extname === '.mp3') {
            const range = req.headers.range;
            const fileSize = stats.size;

            if (range) {
                const parts = range.replace(/bytes=/, '').split('-');
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;
                const file = fs.createReadStream(filePath, { start, end });

                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*'
                });
                file.pipe(res);
                return;
            } else {
                res.writeHead(200, {
                    'Content-Length': fileSize,
                    'Content-Type': contentType,
                    'Accept-Ranges': 'bytes',
                    'Access-Control-Allow-Origin': '*'
                });
                fs.createReadStream(filePath).pipe(res);
                return;
            }
        }

        // Standard Static File Serving with Caching Headers
        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        });
        fs.createReadStream(filePath).pipe(res);

    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Internal Server Error: ${err.message}`);
    }
});

server.listen(PORT, () => {
    console.log('\n======================================================');
    console.log('  🌟 سيرفر DeadTown جاهز ويعمل بنجاح! 🌟');
    console.log('======================================================');
    console.log(`  🌐 الرابط المحلي:   http://localhost:${PORT}`);
    console.log(`  📂 الصفحات المتاحة:`);
    console.log(`     - الرئيسية:         http://localhost:${PORT}/`);
    console.log(`     - القوانين:         http://localhost:${PORT}/rules`);
    console.log(`     - تقديم الوظائف:    http://localhost:${PORT}/job-application`);
    console.log('======================================================\n');
});
