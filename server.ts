import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { CURATED_LIVE_CATEGORIES, CURATED_LIVE_CHANNELS, CURATED_MOVIES, CURATED_SERIES } from './src/data/curatedData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE_PATH = path.resolve(__dirname, 'server-config.json');

const app = express();
const PORT = 3000;

app.use(express.json());

interface ServerConfig {
  host: string;
  username: string;
  password: string;
  m3uUrl: string;
  serverMode: 'xtream' | 'm3u';
  adminPin: string;
  announcement: string;
  version: number;
  updatedAt: string;
  fallbackEnabled: boolean;
}

const DEFAULT_CONFIG: ServerConfig = {
  host: 'http://teslaking.net:80',
  username: 'Dylan4k',
  password: 'aFHr5N1',
  m3uUrl: '',
  serverMode: 'xtream',
  adminPin: '7788',
  announcement: '',
  version: 1,
  updatedAt: new Date().toISOString(),
  fallbackEnabled: true,
};

let serverConfig: ServerConfig = { ...DEFAULT_CONFIG };

// Load config from disk
try {
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
    serverConfig = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } else {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
} catch (err) {
  console.warn('Could not read server-config.json, using default config:', err);
}

function saveServerConfig(newConfig: Partial<ServerConfig>) {
  serverConfig = {
    ...serverConfig,
    ...newConfig,
    updatedAt: new Date().toISOString(),
  };
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(serverConfig, null, 2));
  } catch (err) {
    console.error('Failed to write server-config.json:', err);
  }
}

// SSE (Server-Sent Events) connected clients for real-time broadcasts
const sseClients = new Set<Response>();

function broadcastToClients(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

const IPTV_USER_AGENT = 'IPTVSmartersPro/1.1.1 (Linux; Android 10)';

function normalizeHost(host: string): string {
  let cleaned = (host || '').trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'http://' + cleaned;
  }
  return cleaned.replace(/\/+$/, '');
}

/**
 * Robust M3U Playlist Parser
 */
function parseM3UPlaylist(content: string) {
  const lines = content.split('\n');
  const channels: any[] = [];
  const categoryMap = new Map<string, string>();
  let currentChannel: any = null;
  let count = 1;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const titleMatch = line.match(/,(.+)$/);

      const groupName = groupMatch ? groupMatch[1].trim() : 'کەناڵە گشتییەکان (General)';
      const groupId = groupName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'general';
      const name = titleMatch ? titleMatch[1].trim() : `Channel ${count}`;
      const icon = logoMatch ? logoMatch[1].trim() : '';

      categoryMap.set(groupId, groupName);

      currentChannel = {
        num: count,
        name,
        stream_type: 'live',
        stream_id: `m3u_${count}`,
        stream_icon: icon,
        category_id: groupId,
        category_name: groupName,
        quality: name.toUpperCase().includes('4K') ? '4K' : name.toUpperCase().includes('FHD') ? 'FHD' : 'HD',
      };
      count++;
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      if (currentChannel) {
        currentChannel.stream_url = `/api/stream/proxy?url=${encodeURIComponent(line)}`;
        channels.push(currentChannel);
        currentChannel = null;
      }
    }
  }

  const categories = Array.from(categoryMap.entries()).map(([id, name]) => ({
    category_id: id,
    category_name: name,
  }));

  return { channels, categories };
}

/**
 * 1. Public Config Endpoint (Checked by all Android TVs on launch & polling)
 */
app.get('/api/config/public', (_req: Request, res: Response) => {
  res.json({
    host: serverConfig.host,
    username: serverConfig.username,
    serverMode: serverConfig.serverMode,
    hasM3u: !!serverConfig.m3uUrl,
    announcement: serverConfig.announcement,
    version: serverConfig.version,
    updatedAt: serverConfig.updatedAt,
    fallbackEnabled: serverConfig.fallbackEnabled,
    activeViewersCount: sseClients.size,
  });
});

/**
 * 2. Real-Time SSE Stream for Instant Updates
 */
app.get('/api/config/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send initial handshake with current version
  res.write(`data: ${JSON.stringify({ event: 'CONNECTED', version: serverConfig.version, announcement: serverConfig.announcement })}\n\n`);

  sseClients.add(res);

  // Send keepalive ping every 25 seconds
  const pingInterval = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(pingInterval);
      sseClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(pingInterval);
    sseClients.delete(res);
  });
});

/**
 * 3. Admin Authentication Endpoint
 */
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { pin } = req.body;
  if (!pin || String(pin).trim() !== String(serverConfig.adminPin).trim()) {
    return res.status(401).json({
      ok: false,
      error: 'کۆدی نهێنی بەڕێوەبەر (PIN) هەڵەیە',
    });
  }

  return res.json({
    ok: true,
    config: serverConfig,
    activeViewersCount: sseClients.size,
  });
});

/**
 * 4. Admin Update Server Endpoint (Centralized instant broadcast to all users)
 */
app.post('/api/admin/update', async (req: Request, res: Response) => {
  const {
    pin,
    host,
    username,
    password,
    m3uUrl,
    serverMode,
    announcement,
    adminPin,
    fallbackEnabled,
  } = req.body;

  if (!pin || String(pin).trim() !== String(serverConfig.adminPin).trim()) {
    return res.status(401).json({ ok: false, error: 'ڕێگەپێدراو نیت' });
  }

  const newVersion = (serverConfig.version || 1) + 1;

  saveServerConfig({
    host: host !== undefined ? normalizeHost(host) : serverConfig.host,
    username: username !== undefined ? username.trim() : serverConfig.username,
    password: password !== undefined ? password.trim() : serverConfig.password,
    m3uUrl: m3uUrl !== undefined ? m3uUrl.trim() : serverConfig.m3uUrl,
    serverMode: serverMode || serverConfig.serverMode,
    announcement: announcement !== undefined ? announcement.trim() : serverConfig.announcement,
    adminPin: adminPin ? String(adminPin).trim() : serverConfig.adminPin,
    fallbackEnabled: fallbackEnabled !== undefined ? Boolean(fallbackEnabled) : serverConfig.fallbackEnabled,
    version: newVersion,
  });

  // Broadcast instant update to all connected Android TVs & browsers
  broadcastToClients({
    event: 'SERVER_UPDATED',
    version: newVersion,
    host: serverConfig.host,
    serverMode: serverConfig.serverMode,
    announcement: serverConfig.announcement,
    timestamp: serverConfig.updatedAt,
  });

  return res.json({
    ok: true,
    message: 'سێرڤەرەکە بە سەرکەوتوویی نوێکرایەوە و ڕاستەوخۆ نێردرا بۆ هەموو بەکارهێنەران!',
    config: serverConfig,
    activeViewersNotified: sseClients.size,
  });
});

/**
 * 5. Admin Test Server Connection
 */
app.post('/api/admin/test', async (req: Request, res: Response) => {
  const { host, username, password, m3uUrl, serverMode } = req.body;

  const mode = serverMode || serverConfig.serverMode;

  if (mode === 'm3u') {
    const url = m3uUrl || serverConfig.m3uUrl;
    if (!url) {
      return res.json({ ok: false, message: 'ناونیشانی بەستەری M3U دیارینەکراوە' });
    }
    try {
      const start = Date.now();
      const r = await fetch(url, { headers: { 'User-Agent': IPTV_USER_AGENT }, signal: AbortSignal.timeout(6000) });
      const latency = Date.now() - start;
      if (!r.ok) {
        return res.json({ ok: false, message: `M3U وەڵامی نەدایەوە: ${r.status} ${r.statusText}` });
      }
      const text = await r.text();
      const parsed = parseM3UPlaylist(text);
      return res.json({
        ok: true,
        message: `پەیوەندی سەرکەوتوو بوو! (${latency}ms) - ${parsed.channels.length} کەناڵ دۆزرایەوە`,
        channelCount: parsed.channels.length,
        categoryCount: parsed.categories.length,
      });
    } catch (err: any) {
      return res.json({ ok: false, message: `شکستی هێنا: ${err.message}` });
    }
  }

  // Xtream test
  const cleanHost = normalizeHost(host || serverConfig.host);
  const u = (username || serverConfig.username).trim();
  const p = (password || serverConfig.password).trim();
  const apiUrl = `${cleanHost}/player_api.php?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`;

  try {
    const start = Date.now();
    const r = await fetch(apiUrl, { headers: { 'User-Agent': IPTV_USER_AGENT }, signal: AbortSignal.timeout(6000) });
    const latency = Date.now() - start;
    const text = await r.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {}

    if (r.ok && data && (data.user_info || data.server_info)) {
      return res.json({
        ok: true,
        message: `سێرڤەری Xtream چالاکە! کاتی وەڵام: ${latency}ms`,
        user_info: data.user_info,
        server_info: data.server_info,
      });
    }
    return res.json({
      ok: false,
      message: `سێرڤەر وەڵامی نادروستی داوەتەوە (Status: ${r.status})`,
      statusCode: r.status,
    });
  } catch (err: any) {
    return res.json({ ok: false, message: `هەڵە لە پەیوەندیکردندا: ${err.message}` });
  }
});

/**
 * 6. Xtream Authentication Endpoint (Uses Centralized Config by default)
 */
app.all('/api/xtream/auth', async (req: Request, res: Response) => {
  const host = normalizeHost(req.body?.host || req.query.host as string || serverConfig.host);
  const username = (req.body?.username || req.query.username as string || serverConfig.username).trim();
  const password = (req.body?.password || req.query.password as string || serverConfig.password).trim();

  const apiUrl = `${host}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': IPTV_USER_AGENT,
        'Accept': '*/*',
        'Connection': 'keep-alive',
      },
    });
    clearTimeout(timeout);

    const text = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {}

    if (response.ok && data && (data.user_info || data.server_info)) {
      return res.json({
        ok: true,
        authenticated: data.user_info?.auth === 1,
        user_info: data.user_info || { username, status: 'Active', auth: 1 },
        server_info: data.server_info || { url: host, port: '80', server_protocol: 'http' },
        source: 'xtream_live',
        announcement: serverConfig.announcement,
      });
    }

    return res.json({
      ok: false,
      server_status_code: response.status,
      message: response.status === 512
        ? 'سێرڤەرەکە لەلایەن CDN بلۆککراوە یان بەسەرچووە. کەناڵە ناوخۆیی و گشتییەکان لە خزمەتتدایە.'
        : `پەیوەندی لەگەڵ سێرڤەر سەرکەوتوو نەبوو: کۆدی ${response.status}`,
      host,
      username,
      fallback_available: true,
      announcement: serverConfig.announcement,
    });
  } catch (err: any) {
    return res.json({
      ok: false,
      message: err.name === 'AbortError' ? 'کاتی چاوەڕوانی پەیوەندی بەسەرچوو (Timeout)' : err.message,
      host,
      username,
      fallback_available: true,
      announcement: serverConfig.announcement,
    });
  }
});

/**
 * 7. Xtream / M3U Categories Endpoint
 */
app.get('/api/xtream/categories', async (req: Request, res: Response) => {
  // If active mode is M3U
  if (serverConfig.serverMode === 'm3u' && serverConfig.m3uUrl) {
    try {
      const r = await fetch(serverConfig.m3uUrl, { headers: { 'User-Agent': IPTV_USER_AGENT }, signal: AbortSignal.timeout(6000) });
      if (r.ok) {
        const text = await r.text();
        const { categories } = parseM3UPlaylist(text);
        if (categories.length > 0) {
          return res.json([
            { category_id: 'all', category_name: 'هەموو کەناڵەکان (All Channels)' },
            ...categories,
          ]);
        }
      }
    } catch {}
  }

  const host = normalizeHost((req.query.host as string) || serverConfig.host);
  const username = ((req.query.username as string) || serverConfig.username).trim();
  const password = ((req.query.password as string) || serverConfig.password).trim();
  const type = (req.query.type as string) || 'live';

  const action = type === 'series' ? 'get_series_categories' : `get_${type}_categories`;
  const apiUrl = `${host}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=${action}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': IPTV_USER_AGENT },
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return res.json(data);
      }
    }
  } catch {}

  return res.json(CURATED_LIVE_CATEGORIES);
});

/**
 * 8. Xtream / M3U Streams Endpoint
 */
app.get('/api/xtream/streams', async (req: Request, res: Response) => {
  // If active mode is M3U
  if (serverConfig.serverMode === 'm3u' && serverConfig.m3uUrl) {
    try {
      const r = await fetch(serverConfig.m3uUrl, { headers: { 'User-Agent': IPTV_USER_AGENT }, signal: AbortSignal.timeout(7000) });
      if (r.ok) {
        const text = await r.text();
        const { channels } = parseM3UPlaylist(text);
        if (channels.length > 0) {
          const categoryId = req.query.category_id as string;
          if (categoryId && categoryId !== 'all') {
            return res.json(channels.filter(c => c.category_id === categoryId));
          }
          return res.json(channels);
        }
      }
    } catch {}
  }

  const host = normalizeHost((req.query.host as string) || serverConfig.host);
  const username = ((req.query.username as string) || serverConfig.username).trim();
  const password = ((req.query.password as string) || serverConfig.password).trim();
  const type = (req.query.type as string) || 'live';
  const categoryId = req.query.category_id as string;

  const action = type === 'series' ? 'get_series' : `get_${type}_streams`;
  let apiUrl = `${host}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=${action}`;
  if (categoryId && categoryId !== 'all') {
    apiUrl += `&category_id=${encodeURIComponent(categoryId)}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': IPTV_USER_AGENT },
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((item: any) => {
          let streamUrl = '';
          if (type === 'live') {
            streamUrl = `${host}/live/${username}/${password}/${item.stream_id}.m3u8`;
          } else if (type === 'vod') {
            const ext = item.container_extension || 'mp4';
            streamUrl = `${host}/movie/${username}/${password}/${item.stream_id}.${ext}`;
          }
          return {
            ...item,
            stream_url: `/api/stream/proxy?url=${encodeURIComponent(streamUrl)}`,
          };
        });
        return res.json(mapped);
      }
    }
  } catch {}

  // Return curated fallback
  if (type === 'live') {
    if (categoryId && categoryId !== 'all') {
      return res.json(CURATED_LIVE_CHANNELS.filter(c => c.category_id === categoryId));
    }
    return res.json(CURATED_LIVE_CHANNELS);
  } else if (type === 'vod') {
    return res.json(CURATED_MOVIES);
  } else {
    return res.json(CURATED_SERIES);
  }
});

/**
 * 9. Stream Proxy (Bypasses HTTPS mixed content & CORS)
 */
app.get('/api/stream/proxy', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': IPTV_USER_AGENT,
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      return res.status(response.status).send(`Upstream error: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'application/vnd.apple.mpegurl';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (
      targetUrl.includes('.m3u8') ||
      contentType.includes('mpegurl') ||
      contentType.includes('application/x-mpegURL')
    ) {
      const text = await response.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      const rewritten = text
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return line;

          let fullSegmentUrl = trimmed;
          if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            fullSegmentUrl = baseUrl + trimmed;
          }
          return `/api/stream/proxy?url=${encodeURIComponent(fullSegmentUrl)}`;
        })
        .join('\n');

      return res.send(rewritten);
    }

    if (!response.body) {
      return res.status(500).send('No response body from upstream');
    }

    const reader = response.body.getReader();
    const stream = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      },
    });

    const nodeStream = (await import('stream')).Readable.fromWeb(stream as any);
    nodeStream.pipe(res);
  } catch (err: any) {
    res.status(500).send(`Proxy failed: ${err.message}`);
  }
});

/**
 * 10. Curated Fallback Direct Endpoint
 */
app.get('/api/curated/all', (_req: Request, res: Response) => {
  res.json({
    categories: CURATED_LIVE_CATEGORIES,
    channels: CURATED_LIVE_CHANNELS,
    movies: CURATED_MOVIES,
    series: CURATED_SERIES,
  });
});

/**
 * Setup Vite dev server or static dist
 */
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[KurdTV] Server running on port ${PORT} with centralized Admin sync`);
  });
}

startServer().catch((err) => {
  console.error('[KurdTV] Server startup error:', err);
  process.exit(1);
});
