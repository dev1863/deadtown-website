const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1535971055267614730/Up0h6nVc30fdqjbZAsKZvPtyAHOib2xDEJBvWO8ifoWpHlmcTYs4mQlBwm584FzlSgTJ';
const SITE_BASE = 'https://deadtown-website.netlify.app';
const SITE_LOGO = `${SITE_BASE}/assets/images/logo.png`;
const DIVIDER = '━━━━━━━━━━━━━━━━━━━━━━━━━━';

function deptInfo(dept) {
    const d = String(dept || '').toLowerCase();
    if (d.includes('شرطة') || d.includes('بوليس') || d.includes('مرور') || d.includes('police') || d.includes('lspd') || d.includes('swat')) return { icon: '🚔', color: 0x3B82F6, banner: `${SITE_BASE}/assets/images/banners/banner-police.png`, en: 'POLICE DEPARTMENT' };
    if (d.includes('إسعاف') || d.includes('اسعاف') || d.includes('طب') || d.includes('طبي') || d.includes('مستشفى') || d.includes('ems')) return { icon: '🚑', color: 0xEF4444, banner: `${SITE_BASE}/assets/images/banners/banner-ems.png`, en: 'EMERGENCY SERVICES' };
    if (d.includes('قضاء') || d.includes('محام') || d.includes('محكمة') || d.includes('doj')) return { icon: '⚖️', color: 0xF59E0B, banner: `${SITE_BASE}/assets/images/banners/banner-doj.png`, en: 'DEPARTMENT OF JUSTICE' };
    return { icon: '🎮', color: 0xA333FF, banner: `${SITE_BASE}/assets/images/banners/banner-default.png`, en: 'DEADTOWN ROLEPLAY' };
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
            field('📊 حالة الطلب', '⏳ بانتظار المراجعة'),
            field('💬 اسم الديسكورد', data.discordUser),
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

    const embed4 = {
        title: '💜 شكراً لتقديمك مع DeadTown',
        description: '> ⭐ مجتمعنا يرحب بك، ويتمنى لك رحلة ممتعة معنا\n> 🔗 انضم إلى ديسكورد السيرفر لمتابعة حالة طلبك',
        color: 0x8900FF,
        footer: { text: 'DeadTown — حيث يبدأ الطريق', icon_url: SITE_LOGO },
        timestamp: new Date().toISOString()
    };

    const payload = JSON.stringify({ embeds: [embed1, embed2, embed3, embed4] });

    const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
    });

    const ok = discordRes.status >= 200 && discordRes.status < 300;
    res.status(ok ? 200 : 500).json({ ok, statusCode: discordRes.status });
}
