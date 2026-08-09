const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1535971055267614730/Up0h6nVc30fdqjbZAsKZvPtyAHOib2xDEJBvWO8ifoWpHlmcTYs4mQlBwm584FzlSgTJ';
const SITE_BASE = 'https://deadtown.netlify.app';
const SITE_LOGO = `${SITE_BASE}/assets/images/logo.png`;
const DIVIDER = '━━━━━━━━━━━━━━━━━━━━━━━━━━';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const GUILD_ID = process.env.DISCORD_GUILD_ID || '';

function deptInfo(dept) {
    const d = String(dept || '').toLowerCase();
    if (d.includes('شرطة') || d.includes('بوليس') || d.includes('مرور') || d.includes('police') || d.includes('lspd') || d.includes('swat')) return { icon: '🚔', color: 0x3B82F6, banner: `${SITE_BASE}/assets/images/banners/banner-police.png`, en: 'POLICE DEPARTMENT' };
    if (d.includes('إسعاف') || d.includes('اسعاف') || d.includes('طب') || d.includes('طبي') || d.includes('مستشفى') || d.includes('ems')) return { icon: '🚑', color: 0xEF4444, banner: `${SITE_BASE}/assets/images/banners/banner-ems.png`, en: 'EMERGENCY SERVICES' };
    if (d.includes('قضاء') || d.includes('محام') || d.includes('محكمة') || d.includes('doj')) return { icon: '⚖️', color: 0xF59E0B, banner: `${SITE_BASE}/assets/images/banners/banner-doj.png`, en: 'DEPARTMENT OF JUSTICE' };
    return { icon: '🎮', color: 0xA333FF, banner: `${SITE_BASE}/assets/images/banners/banner-default.png`, en: 'DEADTOWN ROLEPLAY' };
}

async function discordFetch(path, options = {}) {
    if (!BOT_TOKEN) return null;
    const res = await fetch(`https://discord.com/api/v10${path}`, {
        ...options,
        headers: { Authorization: `Bot ${BOT_TOKEN}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const text = await res.text();
    let json = {};
    try { json = JSON.parse(text); } catch (e) { json = { raw: text }; }
    return { status: res.status, json };
}

async function findMember(username) {
    const name = String(username || '').trim().replace(/^@/, '').toLowerCase();
    if (!name) return null;
    try {
        const r = await discordFetch(`/guilds/${GUILD_ID}/members/search?query=${encodeURIComponent(name)}&limit=10`);
        if (!r || !r.json || !Array.isArray(r.json)) return null;
        const member = r.json.find((m) => m.user && m.user.username.toLowerCase() === name);
        return member || (r.json[0] && r.json[0].user ? r.json[0] : null);
    } catch (e) {
        return null;
    }
}

async function sendDM(userId, data, dept) {
    if (!userId || !BOT_TOKEN) return false;
    try {
        const dm = await discordFetch('/users/@me/channels', { method: 'POST', body: JSON.stringify({ recipient_id: userId }) });
        if (!dm || dm.status !== 200 || !dm.json || !dm.json.id) return false;
        const msg = {
            content: `أهلاً بك **${String(data.discordUser || 'صديقنا').trim()}** في DeadTown 👋`,
            embeds: [
                {
                    title: `${dept.icon} تم استلام طلبك بنجاح!`,
                    description: [
                        `قدّمت على قطاع **${String(data.department || 'السيرفر').trim()}**`,
                        DIVIDER,
                        `> 🎫 رقم التذكرة: \`${String(data.ticketId || '—').trim()}\``,
                        '> ⏳ طلبك الآن **قيد المراجعة**',
                        '> ✨ ستصلك النتيجة **بالخاص خلال 24 ساعة**',
                        DIVIDER,
                        '> 💜 كل التوفيق، وبانتظارك في عالم DeadTown!'
                    ].join('\n'),
                    color: dept.color,
                    image: { url: dept.banner },
                    footer: { text: 'DeadTown — نظام التقديم على الوظائف', icon_url: SITE_LOGO },
                    timestamp: new Date().toISOString()
                }
            ],
        };
        const sent = await discordFetch(`/channels/${dm.json.id}/messages`, { method: 'POST', body: JSON.stringify(msg) });
        return sent && sent.status === 200;
    } catch (e) {
        return false;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ ok: false, error: 'Method not allowed' });
        return;
    }

    let data = {};
    try {
        data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    } catch (e) {
        res.status(400).json({ ok: false, error: 'Invalid JSON' });
        return;
    }

    const truncate = (str, max) => {
        const s = String(str || '').trim();
        return s.length > max ? s.substring(0, max - 1) + '…' : s;
    };

    const dept = deptInfo(data.department);
    const code = (v) => '`' + truncate(v, 40) + '`';
    const field = (name, value) => ({ name, value: `>>> ${truncate(value, 150)}`, inline: true });

    const member = BOT_TOKEN && GUILD_ID ? await findMember(data.discordUser) : null;
    const memberId = member && member.user ? member.user.id : null;

    const embed1 = {
        author: { name: 'DeadTown | نظام التقديم على الوظائف', icon_url: SITE_LOGO },
        title: `${dept.icon} طلب وظيفة جديد — ${dept.en}`,
        description: [
            `**${truncate(data.discordUser, 60)}** قدّم على قطاع **${truncate(data.department, 50)}**`,
            DIVIDER,
            '> ✨ سيراجع فريق الإدارة الطلب وسيتم الرد **عبر الديسكورد** خلال 24 ساعة',
            '> 📌 تأكد من تفعيل الرسائل الخاصة لاستقبال نتيجة طلبك'
        ].join('\n'),
        color: dept.color,
        image: { url: dept.banner },
        footer: { text: `${dept.icon} ${truncate(data.department, 60)}`, icon_url: SITE_LOGO },
        timestamp: new Date().toISOString()
    };

    const embed2 = {
        title: '🧑 معلومات المتقدم',
        color: dept.color,
        fields: [
            field('🛡️ القطاع المطلوب', data.department),
            field('🎫 رقم التذكرة', `#${truncate(data.ticketId, 30)}`),
            field('📊 حالة الطلب', memberId ? '🟢 تم إشعار المتقدم' : '⏳ بانتظار المراجعة'),
            field('💬 اسم الديسكورد', memberId ? `${data.discordUser} (<@${memberId}>)` : data.discordUser),
            field('🧑 اسم الشخصية', data.charName),
            field('🎂 العمر', data.realAge),
            { name: '🖥️ Steam Hex ID', value: `\`\`\`fix\n${truncate(data.steamHex, 40)}\`\`\``, inline: true },
            field('⏰ ساعات التواجد', data.playHours),
            field('🎙️ جودة المايكروفون', data.micQuality)
        ],
        footer: { text: 'بيانات مأخوذة من استمارة الموقع الرسمي', icon_url: SITE_LOGO },
        timestamp: new Date().toISOString()
    };

    const embed3 = {
        title: '📝 إجابات المتقدم',
        color: 0x53FC18,
        fields: [
            { name: '💼 الخبرات السابقة', value: truncate(data.experience, 1024) || 'لا توجد خبرات سابقة' },
            { name: '🧠 إجابة السيناريو', value: truncate(data.scenarioAnswer, 1024) || 'لم تتم الإجابة' }
        ],
        footer: { text: 'أُرسلت الاستمارة من الموقع الرسمي 🌐', icon_url: SITE_LOGO },
        timestamp: new Date().toISOString()
    };

    const payload = JSON.stringify({
        username: 'DeadTown',
        avatar_url: SITE_LOGO,
        content: memberId ? `📣 طلب وظيفة جديد من <@${memberId}>` : '',
        embeds: [embed1, embed2, embed3]
    });

    const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
    });

    const ok = discordRes.status >= 200 && discordRes.status < 300;
    const dmSent = memberId ? await sendDM(memberId, data, dept) : false;

    res.status(ok ? 200 : 500).json({ ok, statusCode: discordRes.status, memberFound: !!memberId, dmSent });
}
