const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1535971055267614730/Up0h6nVc30fdqjbZAsKZvPtyAHOib2xDEJBvWO8ifoWpHlmcTYs4mQlBwm584FzlSgTJ';

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

    const embed = {
        title: '📋 طلب تقديم وظيفة جديد',
        color: 0xA333FF,
        fields: [
            { name: '🛡️ القطاع المطلوب', value: truncate(data.department, 100), inline: true },
            { name: '🎫 رقم التذكرة', value: truncate(data.ticketId, 100), inline: true },
            { name: '💬 اسم الديسكورد', value: truncate(data.discordUser, 100), inline: true },
            { name: '🖥️ Steam Hex ID', value: truncate(data.steamHex, 100), inline: true },
            { name: '🧑 اسم الشخصية', value: truncate(data.charName, 100), inline: true },
            { name: '🎂 العمر', value: truncate(data.realAge, 100), inline: true },
            { name: '⏰ ساعات التواجد', value: truncate(data.playHours, 100), inline: true },
            { name: '🎙️ جودة المايكروفون', value: truncate(data.micQuality, 100), inline: true },
            { name: '📝 الخبرات السابقة', value: truncate(data.experience, 1024) || '—' },
            { name: '🧠 إجابة السيناريو', value: truncate(data.scenarioAnswer, 1024) || '—' }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'DeadTown | نظام التقديم على الوظائف' }
    };

    const payload = JSON.stringify({ embeds: [embed] });

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
