// DeadTown Bot Presence - keeps the bot online with activity status
// Requires: Node 22+ (global WebSocket). Run: node bot-presence.js

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
    console.error('DISCORD_BOT_TOKEN is not set.');
    process.exit(1);
}

let heartbeatTimer = null;
let reconnectTimer = null;

function connect() {
    const socket = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');

    socket.onopen = () => {
        socket.send(JSON.stringify({
            op: 2,
            d: {
                token,
                intents: 0,
                properties: { os: 'windows', browser: 'deadtown', device: 'deadtown' },
                presence: {
                    since: Date.now(),
                    status: 'online',
                    afk: false
                }
            }
        }));
    };

    socket.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch (e) { return; }

        if (msg.op === 10) {
            if (heartbeatTimer) clearInterval(heartbeatTimer);
            heartbeatTimer = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ op: 1, d: null }));
            }, msg.d.heartbeat_interval);
        }
        if (msg.op === 0 && msg.t === 'READY') {
            console.log(`[DeadTown Bot] Online as ${msg.d.user.username} | no activity`);
        }
        if (msg.op === 11) {
            console.log('[DeadTown Bot] Heartbeat acknowledged');
        }
    };

    socket.onclose = () => {
        console.log('[DeadTown Bot] Connection closed - reconnecting in 5s...');
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connect, 5000);
    };

    socket.onerror = (err) => {
        console.error('[DeadTown Bot] WebSocket error:', err.message || 'unknown');
    };
}

connect();
