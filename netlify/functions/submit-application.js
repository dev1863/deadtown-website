const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1535971055267614730/Up0h6nVc30fdqjbZAsKZvPtyAHOib2xDEJBvWO8ifoWpHlmcTYs4mQlBwm584FzlSgTJ';
const SITE_LOGO = 'https://deadtown-website.netlify.app/assets/images/logo.png';

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

    const embed1 = {
        title: '📋 طلب وظيفة جديد',
        description: 'أرسل أحد اللاعبين استمارة تقديم إلى إدارة سيرفر **DeadTown** ⭐',
        color: 0xA333FF,
        thumbnail: { url: SITE_LOGO },
        fields: [
            { name: '🛡️ القطاع المطلوب', value: `>>> ${truncate(data.department, 100)}`, inline: true },
            { name: '🎫 رقم التذكرة', value: `>>> ${truncate(data.ticketId, 40)}`, inline: true },
            { name: '💬 اسم الديسكورد', value: `>>> ${truncate(data.discordUser, 60)}`, inline: true },
            { name: '🖥️ Steam Hex ID', value: `>>> ${truncate(data.steamHex, 40)}`, inline: true },
            { name: '🧑 اسم الشخصية', value: `>>> ${truncate(data.charName, 60)}`, inline: true },
            { name: '🎂 العمر', value: `>>> ${truncate(data.realAge, 10)}`, inline: true },
            { name: '⏰ ساعات التواجد', value: `>>> ${truncate(data.playHours, 30)}`, inline: true },
            { name: '🎙️ جودة المايكروفون', value: `>>> ${truncate(data.micQuality, 30)}`, inline: true },
            { name: '📊 حالة الطلب', value: '>>> ⏳ بانتظار المراجعة', inline: true }
        ],
        footer: { text: 'DeadTown | نظام التقديم على الوظائف', icon_url: SITE_LOGO },
        timestamp: new Date().toISOString()
    };

    const embed2 = {
        title: '📝 التفاصيل والإجابات',
        color: 0x53FC18,
        thumbnail: { url: SITE_LOGO },
        fields: [
            { name: '💼 الخبرات السابقة', value: truncate(data.experience, 1024) || 'لا توجد خبرات سابقة' },
            { name: '🧠 إجابة السيناريو', value: truncate(data.scenarioAnswer, 1024) || 'لم تتم الإجابة' }
        ],
        footer: { text: 'أرسلت الاستمارة من الموقع الرسمي 🌐', icon_url: SITE_LOGO },
        timestamp: new Date().toISOString()
    };

    const payload = JSON.stringify({ embeds: [embed1, embed2] });

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
