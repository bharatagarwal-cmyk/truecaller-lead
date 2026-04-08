const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// In-memory store: requestId -> profile data
// In production, replace with Redis or a DB
const pendingRequests = {};

// ─────────────────────────────────────────
// GET /  → Serve the frontend
// ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─────────────────────────────────────────
// POST /truecaller/callback
// Truecaller POSTs here after user approves
// Body: { requestId, accessToken, endpoint }
// ─────────────────────────────────────────
app.post('/truecaller/callback', async (req, res) => {
  const { requestId, accessToken, endpoint, status } = req.body;

  console.log('[Callback received]', req.body);

  // User rejected
  if (status === 'user_rejected') {
    pendingRequests[requestId] = { error: 'user_rejected' };
    return res.status(200).json({ ok: true });
  }

  if (!accessToken || !endpoint) {
    return res.status(400).json({ error: 'Missing accessToken or endpoint' });
  }

  try {
    // Fetch the user profile from Truecaller using the access token
    const profileRes = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache',
      },
    });

    if (!profileRes.ok) {
      console.error('[Profile fetch failed]', profileRes.status);
      pendingRequests[requestId] = { error: 'profile_fetch_failed' };
      return res.status(200).json({ ok: true });
    }

    const profile = await profileRes.json();
    console.log('[Profile fetched]', profile);

    // Store against requestId for the frontend to poll
    pendingRequests[requestId] = { profile };

    // ── Save lead here (log to console for prototype) ──
    console.log('═══ NEW LEAD ═══');
    console.log('Name :', profile.name?.first, profile.name?.last);
    console.log('Phone:', profile.phoneNumbers?.[0]);
    console.log('Email:', profile.onlineIdentities?.email);
    console.log('════════════════');

  } catch (err) {
    console.error('[Callback error]', err);
    pendingRequests[requestId] = { error: 'server_error' };
  }

  res.status(200).json({ ok: true });
});

// ─────────────────────────────────────────
// GET /truecaller/poll?requestId=xxx
// Frontend polls this every 2s after deeplink
// ─────────────────────────────────────────
app.get('/truecaller/poll', (req, res) => {
  const { requestId } = req.query;

  if (!requestId) return res.status(400).json({ error: 'Missing requestId' });

  const result = pendingRequests[requestId];

  if (!result) {
    // Still waiting
    return res.json({ status: 'pending' });
  }

  // Clean up memory after serving
  delete pendingRequests[requestId];

  if (result.error) {
    return res.json({ status: 'error', error: result.error });
  }

  return res.json({ status: 'success', profile: result.profile });
});

// ─────────────────────────────────────────
// GET /truecaller/config
// Returns partnerKey safely to frontend
// ─────────────────────────────────────────
app.get('/truecaller/config', (req, res) => {
  res.json({
    partnerKey: process.env.TRUECALLER_PARTNER_KEY || 'YOUR_PARTNER_KEY',
    partnerName: process.env.PARTNER_NAME || 'MyApp',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
