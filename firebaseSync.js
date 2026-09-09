// ============================================================================
// CRICKETADDA BULLETPROOF CLOUD DATABASE CLIENT (FIREBASE REALTIME DATABASE)
// Zero external native SDK dependencies -> 100% crash-free on Android, iOS, & Web
// Multi-device real-time sync across any phones over 4G/5G/Wi-Fi worldwide
// ============================================================================

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAisjW7FzpNvyzlR436lp6Gj2vPeLRYh3E",
  authDomain: "cricketadda-live.firebaseapp.com",
  databaseURL: "https://cricketadda-live-default-rtdb.firebaseio.com",
  projectId: "cricketadda-live",
  storageBucket: "cricketadda-live.firebasestorage.app",
  messagingSenderId: "900717597444",
  appId: "1:900717597444:web:96b90d37bf5b5610f23651",
  measurementId: "G-RX7ZC53F98"
};

let activeFirebaseConfig = { ...DEFAULT_FIREBASE_CONFIG };

// Cloud sync toggle (Enabled for real live database mode)
export const ENABLE_CLOUD_SYNC = true;

export function isFirebaseConfigured() {
  return (
    ENABLE_CLOUD_SYNC &&
    Boolean(activeFirebaseConfig.apiKey) &&
    Boolean(activeFirebaseConfig.databaseURL) &&
    activeFirebaseConfig.databaseURL.includes('firebaseio.com')
  );
}

export function initFirebase(customConfig = null) {
  if (customConfig) {
    activeFirebaseConfig = { ...activeFirebaseConfig, ...customConfig };
  }
  console.log('[FirebaseSync] 🟢 Live Firebase Cloud Database Active at', activeFirebaseConfig.databaseURL);
  return true;
}

/**
 * Completely wipes all cloud database records on Firebase RTDB for a 100% fresh start
 */
export async function wipeAllFirebaseData() {
  if (!isFirebaseConfigured()) return false;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    await Promise.all([
      fetch(`${baseUrl}/matches.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
      fetch(`${baseUrl}/matches_db.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
      fetch(`${baseUrl}/teams.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([]),
      }),
      fetch(`${baseUrl}/users.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([]),
      }),
      fetch(`${baseUrl}/ping.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetAt: Date.now(), status: 'clean_fresh_start' }),
      }),
    ]);
    console.log('[FirebaseSync] 🧹 All cloud database records wiped successfully');
    return true;
  } catch (err) {
    console.log('[FirebaseSync] Wipe error:', err.message);
    return false;
  }
}

/**
 * Pushes live match state update to Firebase Realtime Database via REST
 */
export async function syncMatchToFirebase(matchId, matchState) {
  if (!isFirebaseConfigured()) return false;
  try {
    const id = matchId || 'match_final_2026';
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const url = `${baseUrl}/matches/${id}.json`;
    const payload = {
      ...matchState,
      lastSyncedAt: Date.now(),
    };
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.log('[FirebaseSync] Match sync notice:', err.message);
    return false;
  }
}

/**
 * Fetches single match from Firebase
 */
export async function fetchFirebaseMatch(matchId) {
  if (!isFirebaseConfigured()) return null;
  try {
    const id = matchId || 'match_final_2026';
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const url = `${baseUrl}/matches/${id}.json`;
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Subscribes to real-time updates for a specific match from Firebase via polling stream
 */
export function subscribeToFirebaseMatch(matchId, onMatchUpdate) {
  if (!isFirebaseConfigured()) return () => {};
  let isActive = true;
  const id = matchId || 'match_final_2026';
  const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
  const url = `${baseUrl}/matches/${id}.json`;

  const fetchLatest = async () => {
    if (!isActive) return;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof onMatchUpdate === 'function' && isActive) {
          onMatchUpdate(data);
        }
      }
    } catch (e) {}
  };

  fetchLatest();
  const interval = setInterval(fetchLatest, 1500);

  return () => {
    isActive = false;
    clearInterval(interval);
  };
}

/**
 * Sync entire matches database to Cloud
 */
export async function syncMatchesDbToFirebase(matchesDb) {
  if (!isFirebaseConfigured() || !matchesDb) return false;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const url = `${baseUrl}/matches_db.json`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchesDb),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

/**
 * Fetch matches database from Cloud
 */
export async function fetchFirebaseMatchesDb() {
  if (!isFirebaseConfigured()) return null;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const url = `${baseUrl}/matches_db.json`;
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Sync registered teams to Cloud
 */
export async function syncTeamsToFirebase(teams) {
  if (!isFirebaseConfigured() || !Array.isArray(teams)) return false;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const url = `${baseUrl}/teams.json`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teams),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

/**
 * Fetch registered teams from Cloud
 */
export async function fetchFirebaseTeams() {
  if (!isFirebaseConfigured()) return null;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const url = `${baseUrl}/teams.json`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') return Object.values(data);
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Sync registered users to Cloud
 */
export async function syncUsersToFirebase(users) {
  if (!isFirebaseConfigured() || !Array.isArray(users)) return false;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const url = `${baseUrl}/users.json`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

/**
 * Fetch registered users from Cloud
 */
export async function fetchFirebaseUsers() {
  if (!isFirebaseConfigured()) return null;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const url = `${baseUrl}/users.json`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') return Object.values(data);
    }
    return null;
  } catch (e) {
    return null;
  }
}
