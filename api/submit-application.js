const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1535971055267614730/Up0h6nVc30fdqjbZAsKZvPtyAHOib2xDEJBvWO8ifoWpHlmcTYs4mQlBwm584FzlSgTJ';

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
        headers: {
            'Content-Type': 'application/json'
        },
        body: payload
    });

    const ok = discordRes.status >= 200 && discordRes.status < 300;
    res.status(ok ? 200 : 500).json({ ok, statusCode: discordRes.status });
}
