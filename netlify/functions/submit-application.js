const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1535971055267614730/Up0h6nVc30fdqjbZAsKZvPtyAHOib2xDEJBvWO8ifoWpHlmcTYs4mQlBwm584FzlSgTJ';
const SITE_BASE = 'https://deadtown-website.netlify.app';
const SITE_LOGO = `${SITE_BASE}/assets/images/logo.png`;
const BANNER = `${SITE_BASE}/assets/images/webhook-banner.png`;
const DIVIDER = '━━━━━━━━━━━━━━━━━━━━━━━━';

function departmentColor(dept) {
    const d = String(dept || '').toLowerCase();
    if (d.includes('شرطة') || d.includes('بوليس') || d.includes('مرور') || d.includes('police') || d.includes('lspd') || d.includes('swat')) return 0x3B82F6;
    if (d.includes('إسعاف') || d.includes('اسعاف') || d.includes('طب') || d.includes('طبي') || d.includes('مستشفى') || d.includes('ems')) return 0xEF4444;
    if (d.includes('قضاء') || d.includes('محام') || d.includes('محكمة') || d.includes('doj')) return 0xF59E0B;
    return 0xA333FF;
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
    }

    let data = {};
    try {
        data = JSON.parse(event.body || '{}');
    } catch (e) {
        return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Invalid JSON' }) };
    }

    const truncate = (str, max) => {
        const s = String(str || '').trim();
        return s.length > max ? s.substring(0, max - 1) + '…' : s;
    };

    const code = (v) => '`' + truncate(v, 40) + '`';
    const f = (name, value) => ({ name, value: `>>> ${truncate(value, 150)}`, inline: true });
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

    const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
    });

    const ok = discordRes.status >= 200 && discordRes.status < 300;
    return {
        statusCode: ok ? 200 : 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok, statusCode: discordRes.status })
    };
};
