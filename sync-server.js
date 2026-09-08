const http = require('http');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server || WebSocket.WebSocketServer || WebSocket;

const PORT = 8085;

let liveMatchState = {
  activeMatchId: 'match_final_2026',
  liveRuns: 178,
  liveWickets: 4,
  liveBalls: 104,
  liveThisOver: ['4', '1'],
  striker: 'Rohit Sharma (c)',
  nonStriker: 'Hardik Pandya',
  bowler: 'Mitchell Starc',
  currentInnings: 1,
  firstInningsSummary: null,
  activeScorer: {
    id: 'usr_rohit_45',
    name: 'Rohit Sharma (c)',
    role: 'Official Match Scorer & Captain',
    team: 'India',
    flag: '🇮🇳',
    avatar: 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/107.png',
  },
  lastUpdated: Date.now(),
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/status' || req.url === '/sync-state' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', connectedClients: wss.clients.size, matchState: liveMatchState }));
    return;
  }

  if ((req.url === '/sync' || req.url === '/sync-state') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        liveMatchState = { ...liveMatchState, ...payload, lastUpdated: Date.now() };
        broadcast({ type: 'MATCH_STATE_SYNCED', data: liveMatchState });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, matchState: liveMatchState }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('CricketAdda Real-Time Sync Server is running on port ' + PORT);
});

const wss = new WebSocketServer({ server });

function broadcast(msgObj, excludeClient = null) {
  const str = JSON.stringify(msgObj);
  wss.clients.forEach(client => {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(str);
    }
  });
}

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log('[SyncServer] 🟢 New client connected from ' + clientIp + '. Total connected: ' + wss.clients.size);

  ws.send(JSON.stringify({ type: 'INIT_STATE', data: liveMatchState }));

  ws.on('message', message => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'UPDATE_MATCH_STATE') {
        liveMatchState = {
          ...liveMatchState,
          ...parsed.payload,
          lastUpdated: Date.now(),
        };
        broadcast({ type: 'MATCH_STATE_SYNCED', data: liveMatchState, senderId: parsed.senderId }, ws);
      }
    } catch (e) {
      console.error('[SyncServer] Parse error:', e);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('CricketAdda Real-Time Sync Server is LIVE on 0.0.0.0:' + PORT);
});
