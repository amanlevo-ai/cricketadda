// ============================================================================
// CRICKETADDA PRO - WEB ADMIN & SCORER CONTROL ENGINE
// Senior Full-Stack Architecture - Direct Real-Time Firebase RTDB Engine
// ============================================================================

const CONFIG = {
  FIREBASE_URL: 'https://cricketadda-live-default-rtdb.firebaseio.com',
  POLL_INTERVAL_MS: 2500,
  APP_ID: 'CricketAdda_Web_Admin_v2',
};

// Global Application State
const state = {
  matchesDb: {},
  activeMatchId: null,
  teams: [],
  users: [],
  currentTab: 'dashboard',
  editorSubTab: 'balls',
  matchFilter: 'all',
  editingBallIndex: null,
  isOnline: false,
  lastLatencyMs: null,
  pollTimer: null,
};

// Official Player Avatars & Fallback Generator
const PLAYER_AVATARS = {
  'Rohit Sharma': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/107.png',
  'Virat Kohli': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/164.png',
  'MS Dhoni': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/265.png',
  'Sachin Tendulkar': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/104.png',
  'Shubman Gill': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/3752.png',
  'KL Rahul': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/1120.png',
  'Sanju Samson': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/2967.png',
  'Rishabh Pant': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/657.png',
  'Suryakumar Yadav': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/1180.png',
  'Hardik Pandya': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/2740.png',
  'Shivam Dube': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/5431.png',
  'Axar Patel': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/1113.png',
  'Ravindra Jadeja': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/9.png',
  'Jasprit Bumrah': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/1124.png',
  'Arshdeep Singh': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/4698.png',
  'Mohammed Siraj': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/3840.png',
  'Kuldeep Yadav': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/261.png',
  'Mitchell Starc': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/490.png',
  'Pat Cummins': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/488.png',
  'Josh Hazlewood': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/857.png',
  'Adam Zampa': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/958.png',
  'Glenn Maxwell': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/282.png',
  'Travis Head': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/1020.png',
  'David Warner': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/170.png',
  'Mitchell Marsh': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/221.png',
  'Marcus Stoinis': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/964.png',
  'Josh Inglis': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/3655.png',
  'Quinton de Kock': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/834.png',
  'Heinrich Klaasen': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/3869.png',
  'David Miller': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/187.png',
  'Aiden Markram': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/1665.png',
  'Tristan Stubbs': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/5958.png',
  'Marco Jansen': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/5725.png',
  'Keshav Maharaj': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/3333.png',
  'Kagiso Rabada': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/1664.png',
  'Anrich Nortje': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/5433.png',
  'Jos Buttler': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/509.png',
  'Phil Salt': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/5472.png',
  'Harry Brook': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/4932.png',
  'Liam Livingstone': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/3644.png',
  'Jofra Archer': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/3547.png',
  'Mark Wood': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/1040.png',
  'Mohammad Rizwan': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/127.png',
  'Babar Azam': 'https://images.icc-cricket.com/image/upload/t_player-headshot-portrait/prd/assets/players/generic/275.png',
};

function resolveUserAvatar(user) {
  if (!user) return 'https://ui-avatars.com/api/?name=Player&background=0284c7&color=fff&bold=true&size=128&rounded=true';
  const rawUri = user.avatarUri || (user.profile && (user.profile.avatarUri || user.profile.avatar)) || user.avatar || user.profilePic || user.photoUrl || user.photo || '';
  if (rawUri && (rawUri.startsWith('http://') || rawUri.startsWith('https://') || rawUri.startsWith('data:image/'))) {
    return rawUri;
  }

  const cleanName = (user.name || '').replace(/\s*\((?:c|wk|vc|c & wk)\)/gi, '').trim();
  if (PLAYER_AVATARS[cleanName]) {
    return PLAYER_AVATARS[cleanName];
  }
  if (PLAYER_AVATARS[user.name]) {
    return PLAYER_AVATARS[user.name];
  }

  const colors = ['0284c7', '10b981', '8b5cf6', 'f59e0b', 'ec4899', '06b6d4', '3b82f6'];
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  const color = colors[Math.abs(hash) % colors.length];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName || 'Player')}&background=${color}&color=fff&bold=true&size=128&rounded=true`;
}

// Default Match Template
const EMPTY_MATCH = {
  id: 'match_' + Date.now(),
  title: 'Tournament Match',
  tournament: 'Cricket Adda Premier League',
  venue: 'Cricket Stadium',
  status: 'in_progress',
  teamA: 'India',
  teamB: 'Australia',
  flagA: '🇮🇳',
  flagB: '🇦🇺',
  toss: 'India won toss & elected to bat',
  currentInnings: 1,
  liveRuns: 0,
  liveWickets: 0,
  liveBalls: 0,
  liveThisOver: [],
  currentStriker: 'Striker',
  currentNonStriker: 'Non-Striker',
  currentBowler: 'Bowler',
  activeScorer: {
    name: 'Official Scorer',
    role: 'Scorer',
    phone: '',
  },
  innings1: {
    team: 'India',
    flag: '🇮🇳',
    runs: 0,
    wickets: 0,
    overs: '0.0',
    maxOvers: 20,
    crr: '0.00',
    batting: [],
    bowling: [],
    fallOfWickets: [],
    extras: { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
    oversDetail: [],
  },
  innings2: {
    team: 'Australia',
    flag: '🇦🇺',
    runs: 0,
    wickets: 0,
    overs: '0.0',
    maxOvers: 20,
    crr: '0.00',
    batting: [],
    bowling: [],
    fallOfWickets: [],
    extras: { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
    oversDetail: [],
  },
  liveState: {
    scoringHistory: [],
    liveCommentaryList: [],
  },
  lastUpdatedAt: Date.now(),
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  setupNavigation();
  restoreNavStateFromUrlOrStorage();
  setupEventListeners();

  // Initial Data Fetch
  await syncFromCloud();

  // Ensure restored tab and active match are rendered with fresh cloud data
  renderAllViews();

  // Start Real-Time Polling Loop (continuous real-time sync with mobile scorers)
  startRealtimePolling();
});

// ============================================================================
// CLOUD API & REALTIME SYNC
// ============================================================================

async function syncFromCloud(showNotification = false) {
  const startTime = performance.now();
  try {
    const [matchesDbRes, matchesLiveRes, teamsRes, teamsIndexRes, usersRes, regPlayersRes, usersByEmailRes] = await Promise.allSettled([
      fetch(`${CONFIG.FIREBASE_URL}/matches_db.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/matches.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/teams.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/teams_index.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/users.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/registered_players.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/users_by_email.json?t=${Date.now()}`),
    ]);

    const latency = Math.round(performance.now() - startTime);
    state.lastLatencyMs = latency;
    state.isOnline = true;
    updateCloudStatusPill(true, latency);

    // 1. Process Matches DB
    if (matchesDbRes.status === 'fulfilled' && matchesDbRes.value.ok) {
      const data = await matchesDbRes.value.json();
      state.matchesDb = data && typeof data === 'object' ? data : {};
    }

    // 2. Process Live In-Flight Matches (/matches)
    if (matchesLiveRes.status === 'fulfilled' && matchesLiveRes.value.ok) {
      const liveData = await matchesLiveRes.value.json();
      if (liveData && typeof liveData === 'object') {
        Object.entries(liveData).forEach(([mId, lMatch]) => {
          if (lMatch && typeof lMatch === 'object') {
            if (!state.matchesDb[mId]) {
              state.matchesDb[mId] = lMatch.match || lMatch;
            } else {
              // Merge in-flight live state
              state.matchesDb[mId] = {
                ...state.matchesDb[mId],
                ...(lMatch.match || {}),
                liveRuns: lMatch.liveRuns ?? state.matchesDb[mId].liveRuns,
                liveWickets: lMatch.liveWickets ?? state.matchesDb[mId].liveWickets,
                liveBalls: lMatch.liveBalls ?? state.matchesDb[mId].liveBalls,
                liveThisOver: lMatch.liveThisOver ?? state.matchesDb[mId].liveThisOver,
                activeScorer: lMatch.activeScorer ?? state.matchesDb[mId].activeScorer,
                currentInnings: lMatch.currentInnings ?? state.matchesDb[mId].currentInnings,
                firstInningsSummary: lMatch.firstInningsSummary ?? state.matchesDb[mId].firstInningsSummary,
                liveState: {
                  ...(state.matchesDb[mId].liveState || {}),
                  ...(lMatch.liveState || {}),
                  scoringHistory: lMatch.match?.liveState?.scoringHistory || lMatch.scoringHistory || state.matchesDb[mId].liveState?.scoringHistory || [],
                  liveCommentaryList: lMatch.liveCommentaryList || state.matchesDb[mId].liveState?.liveCommentaryList || [],
                }
              };
            }
          }
        });
      }
    }

    // 3. Process Teams & Squads (Merge /teams.json AND /teams_index.json)
    const teamMap = new Map();
    function addTeam(t) {
      if (!t || typeof t !== 'object') return;
      const id = t.id || `team_${t.name || Date.now()}`;
      if (!teamMap.has(id)) {
        teamMap.set(id, t);
      } else {
        // Merge team details if existing has less squad info
        const existing = teamMap.get(id);
        const curSquad = Array.isArray(t.squad) ? t.squad : [];
        const exSquad = Array.isArray(existing.squad) ? existing.squad : [];
        if (curSquad.length > exSquad.length) {
          teamMap.set(id, { ...existing, ...t });
        }
      }
    }

    if (teamsRes.status === 'fulfilled' && teamsRes.value.ok) {
      const tData = await teamsRes.value.json();
      if (Array.isArray(tData)) tData.forEach(addTeam);
      else if (tData && typeof tData === 'object') Object.values(tData).forEach(addTeam);
    }

    if (teamsIndexRes.status === 'fulfilled' && teamsIndexRes.value.ok) {
      const idxData = await teamsIndexRes.value.json();
      if (idxData && typeof idxData === 'object') Object.values(idxData).forEach(addTeam);
    }
    state.teams = Array.from(teamMap.values());

    // 4. Process Registered Players (Merge /users, /registered_players, /users_by_email)
    const playerMap = new Map();
    function ingestPlayer(raw) {
      if (!raw || typeof raw !== 'object') return;
      const prof = raw.profile || raw;
      const name = (prof.name || raw.name || '').trim();
      if (!name) return;

      const cleanPhone = String(prof.phone || raw.phone || '').replace(/[^0-9]/g, '');
      const cleanEmail = String(prof.email || raw.email || '').trim().toLowerCase();
      // Deduplicate key priority: 10+ digit phone, then email, then lowercase name
      const dedupeKey = cleanPhone && cleanPhone.length >= 10 ? cleanPhone : (cleanEmail || name.toLowerCase());

      const existing = playerMap.get(dedupeKey) || {};
      const rawAvatar = prof.avatarUri || prof.avatar || prof.profilePic || prof.photoUrl || prof.photo ||
                        raw.avatarUri || raw.avatar || raw.profilePic || raw.photoUrl || raw.photo || existing.avatarUri || '';

      playerMap.set(dedupeKey, {
        id: prof.id || raw.id || existing.id || `usr_${cleanPhone || Date.now()}`,
        name: prof.name || raw.name || existing.name || 'Unnamed Player',
        phone: cleanPhone || existing.phone || '',
        email: cleanEmail || existing.email || '',
        role: prof.role || raw.role || existing.role || 'Player',
        battingStyle: prof.battingStyle || raw.battingStyle || existing.battingStyle || '',
        bowlingStyle: prof.bowlingStyle || raw.bowlingStyle || existing.bowlingStyle || '',
        jersey: prof.jersey || raw.jersey || existing.jersey || '',
        avatarUri: rawAvatar,
        matchesPlayed: raw.careerStats?.matchOverview?.matchesPlayed ?? raw.careerStats?.careerStats?.batting?.innings ?? existing.matchesPlayed ?? 0,
        raw: raw,
      });
    }

    if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
      const uData = await usersRes.value.json();
      if (Array.isArray(uData)) uData.forEach(ingestPlayer);
      else if (uData && typeof uData === 'object') Object.values(uData).forEach(ingestPlayer);
    }

    if (regPlayersRes.status === 'fulfilled' && regPlayersRes.value.ok) {
      const rpData = await regPlayersRes.value.json();
      if (rpData && typeof rpData === 'object') Object.values(rpData).forEach(ingestPlayer);
    }

    if (usersByEmailRes.status === 'fulfilled' && usersByEmailRes.value.ok) {
      const ubeData = await usersByEmailRes.value.json();
      if (ubeData && typeof ubeData === 'object') Object.values(ubeData).forEach(ingestPlayer);
    }
    state.users = Array.from(playerMap.values());

    // Default active match if none selected
    const matchKeys = Object.keys(state.matchesDb);
    if (!state.activeMatchId && matchKeys.length > 0) {
      state.activeMatchId = matchKeys[0];
    }

    renderAllViews();
    if (showNotification) {
      showToast(`Synced ${state.users.length} registered players & ${state.teams.length} teams`, 'success');
    }
  } catch (err) {
    state.isOnline = false;
    updateCloudStatusPill(false);
    console.error('[Sync Error]', err);
    if (showNotification) {
      showToast('Connection error: ' + err.message, 'error');
    }
  }
}

function startRealtimePolling() {
  if (state.pollTimer) clearInterval(state.pollTimer);
  state.pollTimer = setInterval(async () => {
    // Silent sync in background
    await syncFromCloud(false);
  }, CONFIG.POLL_INTERVAL_MS);
}

function updateCloudStatusPill(isOnline, latency = null) {
  const pill = document.getElementById('cloud-status-pill');
  if (!pill) return;
  const text = document.getElementById('cloud-status-text');
  const badge = document.getElementById('cloud-latency-badge');
  const dot = pill.querySelector('span');

  if (isOnline) {
    if (!pill.classList.contains('border-slate-800')) {
      pill.classList.remove('border-red-800/80', 'bg-red-950/20');
      pill.classList.add('border-slate-800', 'bg-slate-900');
    }
    if (dot && !dot.className.includes('bg-emerald-400')) {
      dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 live-pulse';
    }
    if (text && text.textContent !== 'Database Connected') {
      text.textContent = 'Database Connected';
    }
    const badgeText = latency ? `${latency} ms` : 'Online';
    if (badge && badge.textContent !== badgeText) {
      badge.textContent = badgeText;
    }
    if (badge && !badge.className.includes('text-emerald-400')) {
      badge.className = 'text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 font-mono';
    }
  } else {
    if (!pill.classList.contains('border-red-800/80')) {
      pill.classList.add('border-red-800/80', 'bg-red-950/20');
      pill.classList.remove('border-slate-800', 'bg-slate-900');
    }
    if (dot && !dot.className.includes('bg-red-500')) {
      dot.className = 'w-2.5 h-2.5 rounded-full bg-red-500';
    }
    if (text && text.textContent !== 'Disconnected / Offline') {
      text.textContent = 'Disconnected / Offline';
    }
    if (badge && badge.textContent !== 'Retry') {
      badge.textContent = 'Retry';
    }
    if (badge && !badge.className.includes('text-red-300')) {
      badge.className = 'text-[10px] px-1.5 py-0.2 rounded bg-red-900 text-red-300 font-mono';
    }
  }
}

// Push Active Match to Firebase Realtime Database
async function pushMatchToCloud(matchId, customMatchState = null) {
  const mId = matchId || state.activeMatchId;
  if (!mId) return false;

  const currentMatch = customMatchState || state.matchesDb[mId];
  if (!currentMatch) return false;

  const updatedMatch = {
    ...currentMatch,
    lastUpdatedAt: Date.now(),
    adminEditedAt: Date.now(),
  };

  try {
    // 1. Update /matches_db/${mId}
    const resDb = await fetch(`${CONFIG.FIREBASE_URL}/matches_db/${mId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedMatch),
    });

    // 2. Broadcast to /matches/${mId} with remote admin sender id so all mobile clients ingest change immediately
    const livePayload = {
      senderClientId: `admin_portal_${Date.now()}`,
      activeMatchId: mId,
      battingTeamName: getActiveBattingTeam(updatedMatch),
      bowlingTeamName: getActiveBowlingTeam(updatedMatch),
      liveRuns: updatedMatch.liveRuns || 0,
      liveWickets: updatedMatch.liveWickets || 0,
      liveBalls: updatedMatch.liveBalls || 0,
      liveThisOver: updatedMatch.liveThisOver || [],
      currentInnings: updatedMatch.currentInnings || 1,
      match: updatedMatch,
      liveBatters: buildBattersMap(updatedMatch),
      liveBowlerStats: buildBowlersMap(updatedMatch),
      liveCommentaryList: updatedMatch.liveState?.liveCommentaryList || [],
      lastSyncedAt: Date.now(),
    };

    const resLive = await fetch(`${CONFIG.FIREBASE_URL}/matches/${mId}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(livePayload),
    });

    // Also update local state
    state.matchesDb[mId] = updatedMatch;
    renderAllViews();
    showToast('⚡ Match pushed live to Firebase! Mobile apps updated.', 'success');
    return true;
  } catch (err) {
    showToast('Failed to push match: ' + err.message, 'error');
    return false;
  }
}

// ============================================================================
// NAVIGATION & EVENT LISTENERS
// ============================================================================

function setupNavigation() {
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      if (target) switchTab(target);
    });
  });

  window.addEventListener('hashchange', () => {
    restoreNavStateFromUrlOrStorage();
  });
}

function restoreNavStateFromUrlOrStorage() {
  const hash = window.location.hash.replace(/^#/, '').trim();
  let tabId = 'dashboard';
  let matchId = null;

  if (hash) {
    const parts = hash.split('?');
    tabId = parts[0];
    if (parts[1]) {
      const params = new URLSearchParams(parts[1]);
      matchId = params.get('match');
    }
  } else {
    try {
      const storedTab = localStorage.getItem('cricketadda_admin_active_tab');
      if (storedTab) tabId = storedTab;
      const storedMatch = localStorage.getItem('cricketadda_admin_active_match');
      if (storedMatch) matchId = storedMatch;
    } catch (e) {}
  }

  const validTabs = ['dashboard', 'matches', 'editor', 'teams', 'users', 'settings'];
  if (!validTabs.includes(tabId)) tabId = 'dashboard';

  if (matchId) {
    state.activeMatchId = matchId;
  }

  try {
    const storedFilter = localStorage.getItem('cricketadda_admin_match_filter');
    if (storedFilter) state.matchFilter = storedFilter;
  } catch (e) {}

  switchTab(tabId, false);
}
window.restoreNavStateFromUrlOrStorage = restoreNavStateFromUrlOrStorage;

function switchTab(tabId, updateHistory = true) {
  if (!tabId) return;
  const validTabs = ['dashboard', 'matches', 'editor', 'teams', 'users', 'settings'];
  if (!validTabs.includes(tabId)) tabId = 'dashboard';

  state.currentTab = tabId;
  try {
    localStorage.setItem('cricketadda_admin_active_tab', tabId);
  } catch (e) {}

  if (updateHistory) {
    let newHash = '#' + tabId;
    if (tabId === 'editor' && state.activeMatchId) {
      newHash += `?match=${encodeURIComponent(state.activeMatchId)}`;
    }
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', newHash);
    }
  }

  document.querySelectorAll('.nav-tab').forEach(t => {
    const isActive = t.dataset.tab === tabId;
    t.classList.toggle('active', isActive);
    if (isActive) {
      t.classList.add('text-sky-400', 'border-sky-500');
      t.classList.remove('text-slate-400', 'border-transparent');
    } else {
      t.classList.remove('text-sky-400', 'border-sky-500');
      t.classList.add('text-slate-400', 'border-transparent');
    }
  });

  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.toggle('hidden', view.id !== `view-${tabId}`);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderAllViews();
}
// Export switchTab early for inline onclick handlers
window.switchTab = switchTab;

function setupEventListeners() {
  // Sync button
  document.getElementById('btn-sync-now')?.addEventListener('click', () => {
    syncFromCloud(true);
  });

  // Dashboard Metric Cards (Reliable click bindings)
  document.getElementById('card-stat-live')?.addEventListener('click', () => {
    switchTab('matches');
    filterMatches('live');
  });
  document.getElementById('card-stat-total')?.addEventListener('click', () => {
    switchTab('matches');
    filterMatches('all');
  });
  document.getElementById('card-stat-players')?.addEventListener('click', () => {
    switchTab('users');
  });
  document.getElementById('card-stat-teams')?.addEventListener('click', () => {
    switchTab('teams');
  });

  // Create Match Button
  document.getElementById('btn-create-match')?.addEventListener('click', () => {
    openModal('modal-create-match');
  });

  // Create Team Button in Teams View
  document.getElementById('btn-create-team')?.addEventListener('click', () => {
    const tName = prompt('Enter New Team Name:');
    if (!tName) return;
    const tFlag = prompt('Enter Team Flag/Emoji (e.g. 🇮🇳, 🇦🇺):', '🏏') || '🏏';
    const newTeam = { id: 'team_' + Date.now(), name: tName, flag: tFlag, squad: [] };
    state.teams.push(newTeam);
    fetch(`${CONFIG.FIREBASE_URL}/teams.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.teams),
    });
    renderTeamsView();
    showToast(`Team ${tName} registered!`, 'success');
  });

  // Admin Auth Toggle / Status Button
  document.getElementById('btn-auth-toggle')?.addEventListener('click', () => {
    showToast('Admin Session Active • Master Access Enabled', 'success');
  });

  // Modal close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn?.addEventListener('click', () => {
      closeAllModals();
    });
  });

  // Match filter buttons in Matches view
  document.querySelectorAll('.match-filter-btn').forEach(btn => {
    btn?.addEventListener('click', () => {
      filterMatches(btn.dataset.filter);
    });
  });

  // Search input in Matches view
  document.getElementById('matches-search')?.addEventListener('input', e => {
    renderMatchesView(e.target.value.toLowerCase());
  });

  // Search input in Users view
  document.getElementById('users-search')?.addEventListener('input', e => {
    renderUsersView(e.target.value.toLowerCase());
  });

  // Active match dropdown in Editor view
  document.getElementById('editor-match-select')?.addEventListener('change', e => {
    state.activeMatchId = e.target.value;
    renderEditorView();
  });

  // Push to Cloud Now button in Editor
  document.getElementById('btn-save-match-cloud')?.addEventListener('click', () => {
    pushMatchToCloud(state.activeMatchId);
  });

  // Auto Recalculate button in Editor
  document.getElementById('btn-recalculate-match')?.addEventListener('click', () => {
    recalculateActiveMatchStats();
  });

  // Swap Batters button
  document.getElementById('btn-swap-batters')?.addEventListener('click', () => {
    swapCreaseBatters();
  });

  // Live state input changes in Editor
  document.getElementById('editor-striker-input')?.addEventListener('change', e => {
    updateActiveMatchField('currentStriker', e.target.value);
  });
  document.getElementById('editor-nonstriker-input')?.addEventListener('change', e => {
    updateActiveMatchField('currentNonStriker', e.target.value);
  });
  document.getElementById('editor-bowler-input')?.addEventListener('change', e => {
    updateActiveMatchField('currentBowler', e.target.value);
  });
  document.getElementById('editor-thisover-input')?.addEventListener('change', e => {
    const raw = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    updateActiveMatchField('liveThisOver', raw);
  });
  document.getElementById('editor-innings-select')?.addEventListener('change', e => {
    updateActiveMatchField('currentInnings', Number(e.target.value));
  });
  document.getElementById('editor-status-select')?.addEventListener('change', e => {
    updateActiveMatchField('status', e.target.value);
  });
  document.getElementById('editor-target-input')?.addEventListener('change', e => {
    updateActiveMatchField('targetRuns', Number(e.target.value));
  });

  // Subtabs in Editor
  document.getElementById('subtab-btn-balls')?.addEventListener('click', () => setEditorSubTab('balls'));
  document.getElementById('subtab-btn-scorecard')?.addEventListener('click', () => setEditorSubTab('scorecard'));
  document.getElementById('subtab-btn-extras')?.addEventListener('click', () => setEditorSubTab('extras'));

  // Edit Ball Form submission
  document.getElementById('form-edit-ball')?.addEventListener('submit', handleSaveBallForm);

  // Runs choices in Edit Ball Modal
  document.querySelectorAll('#ball-runs-selector .btn-run-choice').forEach(btn => {
    btn?.addEventListener('click', () => {
      document.querySelectorAll('#ball-runs-selector .btn-run-choice').forEach(b => {
        b.classList.remove('ring-2', 'ring-sky-400');
      });
      btn.classList.add('ring-2', 'ring-sky-400');
      const rVal = btn.dataset.runs;
      const customInput = document.getElementById('edit-ball-runs-custom');
      if (customInput) {
        if (rVal === 'custom') {
          customInput.classList.remove('hidden');
          customInput.focus();
        } else {
          customInput.classList.add('hidden');
          customInput.value = rVal;
        }
      }
    });
  });

  // Wicket checkbox in Edit Ball Modal
  document.getElementById('edit-ball-is-wkt')?.addEventListener('change', e => {
    document.getElementById('wkt-fields-group')?.classList.toggle('hidden', !e.target.checked);
  });

  // Delete ball button
  document.getElementById('btn-delete-ball')?.addEventListener('click', handleDeleteBall);

  // Insert missed ball prompt
  document.getElementById('btn-insert-ball-prompt')?.addEventListener('click', handleInsertMissedBall);

  // Add Batter / Bowler buttons
  document.getElementById('btn-add-batter-row')?.addEventListener('click', promptAddBatter);
  document.getElementById('btn-add-bowler-row')?.addEventListener('click', promptAddBowler);

  // Settings: Latency test
  document.getElementById('btn-test-db-connection')?.addEventListener('click', async () => {
    const t0 = performance.now();
    try {
      const res = await fetch(`${CONFIG.FIREBASE_URL}/ping.json?t=${Date.now()}`);
      const lat = Math.round(performance.now() - t0);
      showToast(`Ping Success: ${lat}ms latency to Firebase RTDB`, 'success');
      updateCloudStatusPill(true, lat);
    } catch (e) {
      showToast(`Ping failed: ${e.message}`, 'error');
    }
  });

  // Settings: Full Database Backup (Matches + Teams + Players)
  document.getElementById('btn-backup-full-db')?.addEventListener('click', async () => {
    try {
      showToast('Preparing full database snapshot...', 'info');
      const [matchesRes, teamsRes, usersRes] = await Promise.allSettled([
        fetch(`${CONFIG.FIREBASE_URL}/matches_db.json?t=${Date.now()}`),
        fetch(`${CONFIG.FIREBASE_URL}/teams.json?t=${Date.now()}`),
        fetch(`${CONFIG.FIREBASE_URL}/users.json?t=${Date.now()}`),
      ]);

      const matchesData = matchesRes.status === 'fulfilled' && matchesRes.value.ok ? await matchesRes.value.json() : state.matchesDb;
      const teamsData = teamsRes.status === 'fulfilled' && teamsRes.value.ok ? await teamsRes.value.json() : state.teams;
      const usersData = usersRes.status === 'fulfilled' && usersRes.value.ok ? await usersRes.value.json() : state.users;

      const fullBackup = {
        app: 'CricketAdda Pro',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        timestamp: Date.now(),
        summary: {
          matchesCount: Object.keys(matchesData || {}).length,
          teamsCount: Array.isArray(teamsData) ? teamsData.length : Object.keys(teamsData || {}).length,
          usersCount: Array.isArray(usersData) ? usersData.length : Object.keys(usersData || {}).length,
        },
        data: {
          matches: matchesData || {},
          teams: teamsData || [],
          users: usersData || [],
        }
      };

      const jsonStr = JSON.stringify(fullBackup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cricketadda_full_database_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Full database backup successfully downloaded!', 'success');
    } catch (err) {
      showToast('Full backup failed: ' + err.message, 'error');
    }
  });

  // Settings: Matches Only Backup
  document.getElementById('btn-export-full-db')?.addEventListener('click', () => {
    const jsonStr = JSON.stringify(state.matchesDb, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cricketadda_matches_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Matches backup successfully downloaded!', 'success');
  });

  // Settings: Teams & Squads Backup
  document.getElementById('btn-backup-teams-db')?.addEventListener('click', () => {
    const teamsBackup = {
      app: 'CricketAdda Pro',
      type: 'teams_backup',
      exportedAt: new Date().toISOString(),
      teamsCount: state.teams.length,
      teams: state.teams,
    };
    const jsonStr = JSON.stringify(teamsBackup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cricketadda_teams_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Teams backup successfully downloaded!', 'success');
  });

  // Settings: Database Restore / Import
  const restoreFileInput = document.getElementById('input-restore-db-file');
  document.getElementById('btn-trigger-restore-db')?.addEventListener('click', () => {
    restoreFileInput?.click();
  });

  restoreFileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Reading backup file...', 'info');
      const text = await file.text();
      const parsed = JSON.parse(text);

      const confirmRestore = confirm(
        `Are you sure you want to restore database from "${file.name}"?\nThis will import and update matching data in Firebase Realtime Database.`
      );
      if (!confirmRestore) {
        restoreFileInput.value = '';
        return;
      }

      let restoredMatches = 0;
      let restoredTeams = 0;

      // Handle Full Backup structure
      if (parsed.data && parsed.data.matches) {
        await fetch(`${CONFIG.FIREBASE_URL}/matches_db.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data.matches),
        });
        restoredMatches = Object.keys(parsed.data.matches).length;
      } else if (parsed.matchesDb || (typeof parsed === 'object' && !parsed.teams && !Array.isArray(parsed))) {
        const matchesToRestore = parsed.matchesDb || parsed;
        await fetch(`${CONFIG.FIREBASE_URL}/matches_db.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(matchesToRestore),
        });
        restoredMatches = Object.keys(matchesToRestore).length;
      }

      // Handle Teams in Full Backup or Teams-only backup
      const teamsToRestore = parsed.data?.teams || parsed.teams || (Array.isArray(parsed) ? parsed : null);
      if (teamsToRestore && Array.isArray(teamsToRestore)) {
        await fetch(`${CONFIG.FIREBASE_URL}/teams.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(teamsToRestore),
        });
        // Also re-index
        teamsToRestore.forEach(t => {
          if (t && t.id) {
            fetch(`${CONFIG.FIREBASE_URL}/teams_index/${t.id}.json`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(t),
            }).catch(() => {});
          }
        });
        restoredTeams = teamsToRestore.length;
      }

      await syncFromCloud(false);
      renderAllViews();
      showToast(`Restore Complete! Imported ${restoredMatches} matches and ${restoredTeams} teams.`, 'success');
    } catch (err) {
      showToast('Restore failed: ' + err.message, 'error');
    } finally {
      restoreFileInput.value = '';
    }
  });

  // Settings: Raw JSON patch apply
  document.getElementById('btn-apply-raw-json')?.addEventListener('click', async () => {
    try {
      const rawText = document.getElementById('raw-json-editor')?.value;
      if (!rawText) return;
      const parsed = JSON.parse(rawText);
      if (parsed && parsed.id) {
        await pushMatchToCloud(parsed.id, parsed);
        showToast('Raw JSON hot-patch successfully applied!', 'success');
      }
    } catch (err) {
      showToast('Invalid JSON: ' + err.message, 'error');
    }
  });

  // Settings: Emergency wipe matches
  document.getElementById('btn-emergency-wipe-matches')?.addEventListener('click', async () => {
    const confirmPrompt = prompt('Type "WIPE" to confirm deleting all matches from database:');
    if (confirmPrompt === 'WIPE') {
      try {
        await fetch(`${CONFIG.FIREBASE_URL}/matches_db.json`, { method: 'DELETE' });
        await fetch(`${CONFIG.FIREBASE_URL}/matches.json`, { method: 'DELETE' });
        state.matchesDb = {};
        state.activeMatchId = null;
        renderAllViews();
        showToast('Matches wiped from database. User profiles were preserved.', 'warning');
      } catch (e) {
        showToast('Wipe failed: ' + e.message, 'error');
      }
    }
  });

  // Settings: Emergency wipe teams
  document.getElementById('btn-emergency-wipe-teams')?.addEventListener('click', async () => {
    const confirmPrompt = prompt('Type "WIPE TEAMS" to confirm deleting all teams from database:');
    if (confirmPrompt === 'WIPE TEAMS') {
      try {
        await Promise.all([
          fetch(`${CONFIG.FIREBASE_URL}/teams.json`, { method: 'DELETE' }),
          fetch(`${CONFIG.FIREBASE_URL}/teams_index.json`, { method: 'DELETE' }),
        ]);

        // Reset createdTeams in user profiles so client devices don't re-sync deleted teams
        try {
          const resUsers = await fetch(`${CONFIG.FIREBASE_URL}/users.json`);
          const usersData = await resUsers.json();
          if (Array.isArray(usersData)) {
            const updatedUsers = usersData.map(u => ({ ...u, createdTeams: [] }));
            const usersByEmail = {};
            updatedUsers.forEach(u => {
              if (u && u.email) {
                const safeKey = u.email.replace(/\./g, '_').replace(/@/g, '_at_');
                usersByEmail[safeKey] = u;
              }
            });
            await Promise.all([
              fetch(`${CONFIG.FIREBASE_URL}/users.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedUsers),
              }),
              fetch(`${CONFIG.FIREBASE_URL}/users_by_email.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(usersByEmail),
              }),
            ]);
          }
        } catch (uErr) {
          console.warn('Could not reset user createdTeams:', uErr);
        }

        state.teams = [];
        renderAllViews();
        showToast('All teams wiped from database. User profiles were preserved.', 'warning');
      } catch (e) {
        showToast('Wipe teams failed: ' + e.message, 'error');
      }
    }
  });
}

function setEditorSubTab(subTab) {
  state.editorSubTab = subTab;
  ['balls', 'scorecard', 'extras'].forEach(st => {
    const btn = document.getElementById(`subtab-btn-${st}`);
    const section = document.getElementById(`subtab-${st}`);
    if (st === subTab) {
      btn.className = 'px-3 py-2 text-xs font-bold uppercase tracking-wider text-sky-400 border-b-2 border-sky-400';
      section.classList.remove('hidden');
    } else {
      btn.className = 'px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b-2 border-transparent';
      section.classList.add('hidden');
    }
  });
}

// ============================================================================
// VIEW RENDERERS & HIGH-EFFICIENCY DOM CACHING
// Prevents continuous browser re-rendering / image flickering on background poll
// ============================================================================

const domCache = {
  usersTbody: null,
  teamsGrid: null,
  matchesContainer: null,
  spotlightCards: null,
  recentMatches: null,
  editorScoreboard: null,
  editorTimeline: null,
  editorBatting: null,
  editorBowling: null,
  editorExtras: null,
};

function updateElementHtmlIfChanged(elementOrId, newHtml, cacheKey, onUpdated) {
  const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!el) return false;
  if (domCache[cacheKey] !== newHtml) {
    domCache[cacheKey] = newHtml;
    el.innerHTML = newHtml;
    if (onUpdated) onUpdated(el);
    return true;
  }
  return false;
}

function updateElementTextIfChanged(elementOrId, newText) {
  const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!el) return;
  const str = String(newText ?? '');
  if (el.textContent !== str) {
    el.textContent = str;
  }
}

function renderAllViews() {
  renderDashboardView();
  renderMatchesView();
  renderEditorView();
  renderTeamsView();
  renderUsersView();
  renderSettingsView();

  // Tab count
  updateElementTextIfChanged('matches-tab-count', Object.keys(state.matchesDb).length);
}

// 1. DASHBOARD VIEW
function renderDashboardView() {
  const matches = Object.values(state.matchesDb || {});
  const liveMatches = matches.filter(m => m.status === 'in_progress' || m.status === 'live');

  updateElementTextIfChanged('stat-live-matches', liveMatches.length);
  updateElementTextIfChanged('stat-total-matches', matches.length);
  updateElementTextIfChanged('stat-registered-players', state.users.length);
  updateElementTextIfChanged('stat-registered-teams', state.teams.length);

  // Live spotlight cards
  const spotlightContainer = document.getElementById('live-spotlight-cards');
  let newSpotlightHtml = '';
  if (liveMatches.length === 0) {
    newSpotlightHtml = `
      <div class="col-span-2 glass-panel p-6 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
        ⚡ No live matches actively scoring right now. When a scorer scores on mobile, it will appear here in real-time.
      </div>
    `;
  } else {
    newSpotlightHtml = liveMatches.map(m => {
      const inn = m.currentInnings === 2 ? m.innings2 : m.innings1;
      const battingTeam = inn?.team || m.teamA;
      const bowlingTeam = inn?.team === m.teamA ? m.teamB : m.teamA;
      const runs = m.liveRuns ?? inn?.runs ?? 0;
      const wkts = m.liveWickets ?? inn?.wickets ?? 0;
      const balls = m.liveBalls ?? 0;
      const overs = `${Math.floor(balls / 6)}.${balls % 6}`;

      return `
        <div class="glass-panel p-4 rounded-xl border border-emerald-900/60 bg-emerald-950/10 space-y-3 card-hover cursor-pointer" onclick="openMatchInEditor('${m.id}')">
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              <span class="w-2 h-2 rounded-full bg-emerald-400 live-pulse"></span>
              Live • Innings ${m.currentInnings || 1}
            </span>
            <span class="text-[11px] text-slate-400 font-medium">${m.tournament || 'Match'}</span>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-base font-extrabold text-white">${battingTeam} vs ${bowlingTeam}</h4>
              <p class="text-xl font-black text-emerald-300 mt-1">${runs}/${wkts} <span class="text-xs text-slate-400 font-medium">(${overs} ov)</span></p>
            </div>
            <button class="btn-primary text-xs py-1.5 px-3">
              <span>Edit Live &rarr;</span>
            </button>
          </div>

          <div class="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Scorer: <strong class="text-slate-200">${m.activeScorer?.name || 'Scorer App'}</strong></span>
            <span>Striker: <strong class="text-sky-300">${m.currentStriker || 'N/A'}</strong></span>
          </div>
        </div>
      `;
    }).join('');
  }
  updateElementHtmlIfChanged(spotlightContainer, newSpotlightHtml, 'spotlightCards');

  // Recent Matches list in dashboard
  const recentContainer = document.getElementById('dashboard-recent-matches');
  let newRecentHtml = '';
  if (matches.length === 0) {
    newRecentHtml = '<p class="text-xs text-slate-400 py-4 text-center">No matches recorded yet.</p>';
  } else {
    const sorted = [...matches].sort((a, b) => (b.lastUpdatedAt || 0) - (a.lastUpdatedAt || 0)).slice(0, 5);
    newRecentHtml = sorted.map(m => {
      const inn1 = m.innings1 || {};
      const inn2 = m.innings2 || {};
      return `
        <div class="py-3 flex items-center justify-between text-xs hover:bg-slate-800/30 px-2 rounded-lg transition cursor-pointer" onclick="openMatchInEditor('${m.id}')">
          <div class="space-y-0.5">
            <h5 class="font-bold text-slate-200">${m.flagA || ''} ${m.teamA} vs ${m.flagB || ''} ${m.teamB}</h5>
            <p class="text-[11px] text-slate-400">${m.tournament} • ${m.venue || 'Stadium'}</p>
          </div>
          <div class="text-right">
            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadgeClass(m.status)}">
              ${m.status || 'setup'}
            </span>
            <p class="text-[11px] text-slate-400 mt-0.5">${m.result || (inn1.runs != null ? `${inn1.runs}/${inn1.wickets || 0}` : '')}</p>
          </div>
        </div>
      `;
    }).join('');
  }
  updateElementHtmlIfChanged(recentContainer, newRecentHtml, 'recentMatches');
}

// 2. MATCHES DIRECTORY VIEW
function renderMatchesView(query = null) {
  const container = document.getElementById('matches-container');
  if (!container) return;

  const searchInput = document.getElementById('matches-search');
  const activeQuery = (query !== null ? query : (searchInput ? searchInput.value : '')).toLowerCase().trim();

  let list = Object.values(state.matchesDb || {});

  // Apply Filter
  if (state.matchFilter === 'live') {
    list = list.filter(m => m.status === 'in_progress' || m.status === 'live');
  } else if (state.matchFilter === 'completed') {
    list = list.filter(m => m.status === 'completed');
  } else if (state.matchFilter === 'inningsBreak') {
    list = list.filter(m => m.status === 'innings_break');
  } else if (state.matchFilter === 'setup') {
    list = list.filter(m => m.status === 'setup');
  }

  // Apply Search Query
  if (activeQuery) {
    list = list.filter(m => {
      return (
        m.teamA?.toLowerCase().includes(activeQuery) ||
        m.teamB?.toLowerCase().includes(activeQuery) ||
        m.tournament?.toLowerCase().includes(activeQuery) ||
        m.venue?.toLowerCase().includes(activeQuery) ||
        m.id?.toLowerCase().includes(activeQuery)
      );
    });
  }

  let newHtml = '';
  if (list.length === 0) {
    newHtml = `
      <div class="col-span-3 glass-panel p-8 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
        No matches match the selected filter. Matches scored on mobile will appear here.
      </div>
    `;
  } else {
    newHtml = list.map(m => {
      const inn1 = m.innings1 || {};
      const inn2 = m.innings2 || {};
      const isLive = m.status === 'in_progress' || m.status === 'live';

      return `
        <div class="glass-panel p-4 rounded-xl border ${isLive ? 'border-emerald-700/60 bg-emerald-950/10' : 'border-slate-800'} space-y-3 card-hover">
          <div class="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <span class="text-[10px] font-bold uppercase tracking-wider ${isLive ? 'text-emerald-400' : 'text-slate-400'}">
              ${isLive ? '🔴 LIVE INNINGS ' + (m.currentInnings || 1) : m.tournament}
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadgeClass(m.status)}">
              ${m.status || 'setup'}
            </span>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-sm font-bold text-white">
              <span class="flex items-center gap-1.5">${m.flagA || ''} ${m.teamA}</span>
              <span class="text-sky-300 font-mono">${inn1.runs != null ? `${inn1.runs}/${inn1.wickets || 0} (${inn1.overs || '0.0'})` : '-'}</span>
            </div>
            <div class="flex items-center justify-between text-sm font-bold text-white">
              <span class="flex items-center gap-1.5">${m.flagB || ''} ${m.teamB}</span>
              <span class="text-sky-300 font-mono">${inn2.runs != null ? `${inn2.runs}/${inn2.wickets || 0} (${inn2.overs || '0.0'})` : '-'}</span>
            </div>
          </div>

          <p class="text-[11px] text-slate-400 italic">${m.result || m.toss || 'Scoring ready'}</p>

          <div class="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
            <button onclick="openMatchInEditor('${m.id}')" class="btn-primary text-xs py-1 px-3">
              <i data-lucide="edit-2" class="w-3 h-3"></i>
              <span>Open & Edit</span>
            </button>
            <button onclick="deleteMatchPrompt('${m.id}')" class="text-slate-400 hover:text-red-400 text-xs p-1" title="Delete Match">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  updateElementHtmlIfChanged(container, newHtml, 'matchesContainer', () => {
    if (window.lucide) window.lucide.createIcons();
  });
}

// 3. DEEP SCORER & BALL-BY-BALL EDITOR VIEW
function renderEditorView() {
  const matchSelect = document.getElementById('editor-match-select');
  const matches = Object.values(state.matchesDb || {});

  // Populate Match Select
  matchSelect.innerHTML = matches.map(m => {
    return `<option value="${m.id}" ${m.id === state.activeMatchId ? 'selected' : ''}>${m.teamA} vs ${m.teamB} (${m.tournament || 'Match'})</option>`;
  }).join('');

  const match = state.matchesDb[state.activeMatchId];
  if (!match) {
    const sb = document.getElementById('editor-scoreboard-card');
    if (sb) sb.innerHTML = `
      <div class="p-8 text-center text-slate-400 text-sm">
        No match selected. Select a match from the dropdown above or browse matches in the Matches tab.
      </div>
    `;
    const tl = document.getElementById('editor-timeline-container');
    if (tl) tl.innerHTML = '<div class="p-8 text-center text-slate-400 text-xs">No active match selected.</div>';
    const cnt = document.getElementById('balls-total-count');
    if (cnt) cnt.textContent = '0';
    const battingTbody = document.getElementById('editor-batting-table-body');
    if (battingTbody) battingTbody.innerHTML = '<tr><td colspan="8" class="text-center text-slate-400 py-3">No match selected.</td></tr>';
    const bowlingTbody = document.getElementById('editor-bowling-table-body');
    if (bowlingTbody) bowlingTbody.innerHTML = '<tr><td colspan="9" class="text-center text-slate-400 py-3">No match selected.</td></tr>';
    return;
  }

  // Populate Inputs without interrupting active typing
  const updateInputIfNotFocused = (id, val) => {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el && el.value !== String(val ?? '')) {
      el.value = val ?? '';
    }
  };
  updateInputIfNotFocused('editor-striker-input', match.currentStriker || '');
  updateInputIfNotFocused('editor-nonstriker-input', match.currentNonStriker || '');
  updateInputIfNotFocused('editor-bowler-input', match.currentBowler || '');
  updateInputIfNotFocused('editor-thisover-input', Array.isArray(match.liveThisOver) ? match.liveThisOver.join(', ') : '');
  updateInputIfNotFocused('editor-innings-select', String(match.currentInnings || 1));
  updateInputIfNotFocused('editor-status-select', match.status || 'in_progress');
  updateInputIfNotFocused('editor-target-input', match.targetRuns || '');

  // Render Scoreboard Card
  renderEditorScoreboardCard(match);

  // Render Ball Timeline
  renderBallTimeline(match);

  // Render Batting & Bowling tables
  renderEditorScorecardTables(match);

  // Render Extras Breakdown
  renderEditorExtras(match);
}

function renderEditorScoreboardCard(match) {
  const card = document.getElementById('editor-scoreboard-card');
  if (!card) return;
  const innNum = match.currentInnings || 1;
  const inn = innNum === 2 ? match.innings2 : match.innings1;
  const oppInn = innNum === 2 ? match.innings1 : match.innings2;

  const battingTeam = inn?.team || match.teamA;
  const bowlingTeam = oppInn?.team || match.teamB;
  const runs = match.liveRuns ?? inn?.runs ?? 0;
  const wkts = match.liveWickets ?? inn?.wickets ?? 0;
  const balls = match.liveBalls ?? 0;
  const overs = `${Math.floor(balls / 6)}.${balls % 6}`;
  const crr = balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00';

  const thisOverBalls = Array.isArray(match.liveThisOver) ? match.liveThisOver : [];

  const cardHtml = `
    <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 border-b border-slate-700">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusBadgeClass(match.status)}">
              ${match.status || 'in_progress'}
            </span>
            <span class="text-xs text-slate-400 font-medium">${match.tournament} • Innings ${innNum}</span>
          </div>
          <h2 class="text-2xl font-black text-white mt-1">
            ${battingTeam} <span class="text-emerald-400">${runs}/${wkts}</span>
            <span class="text-sm font-semibold text-slate-400 font-mono">(${overs} / ${inn?.maxOvers || 20} ov)</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">CRR: <strong class="text-sky-400">${crr}</strong> • Scorer: <strong class="text-slate-200">${match.activeScorer?.name || 'Mobile Scorer'}</strong></p>
        </div>

        <!-- Over tray balls display -->
        <div class="space-y-1.5 text-right">
          <span class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">This Over:</span>
          <div class="flex items-center gap-1.5 flex-wrap justify-end">
            ${thisOverBalls.length === 0 ? '<span class="text-xs text-slate-400">Over starting</span>' : thisOverBalls.map(renderBallBadgeHtml).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  updateElementHtmlIfChanged(card, cardHtml, 'editorScoreboard');
}

function renderBallTimeline(match) {
  const container = document.getElementById('editor-timeline-container');
  if (!container) return;
  const countBadge = document.getElementById('balls-total-count');

  const history = match.liveState?.scoringHistory || [];
  updateElementTextIfChanged(countBadge, history.length);

  let newTimelineHtml = '';
  if (history.length === 0) {
    newTimelineHtml = `
      <div class="p-8 text-center text-slate-400 text-xs">
        No delivery history recorded in this match yet. As scorer records balls, they appear here. You can also click "Insert Missed Ball".
      </div>
    `;
  } else {
    // Reverse chronological (newest first)
    const reversed = [...history].map((ball, idx) => ({ ...ball, originalIndex: idx })).reverse();

    newTimelineHtml = reversed.map(ball => {
      const ballSym = ball.ballSymbol || String(ball.addedRuns ?? '0');
      const isWkt = ball.isWkt || ballSym === 'W';
      const striker = ball.striker || 'Batter';
      const bowler = ball.bowler || 'Bowler';
      const runs = ball.addedRuns ?? 0;
      const comm = ball.dismissalDesc || (isWkt ? `Wicket! ${ball.dismissedPlayerName || striker} out` : `${runs} run${runs === 1 ? '' : 's'}`);

      return `
        <div class="timeline-item p-3 sm:px-4 flex items-center justify-between gap-3 cursor-pointer" onclick="openEditBallModal(${ball.originalIndex})">
          <div class="flex items-center gap-3">
            <div>${renderBallBadgeHtml(ballSym)}</div>
            <div>
              <p class="text-xs font-bold text-white flex items-center gap-1.5">
                <span>${striker}</span>
                <span class="text-[10px] text-slate-400">vs</span>
                <span class="text-slate-300 font-normal">${bowler}</span>
              </p>
              <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-1">${comm}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[11px] text-slate-400 font-mono">Ball #${ball.originalIndex + 1}</span>
            <button class="text-slate-400 hover:text-sky-400 p-1" title="Edit ball">
              <i data-lucide="edit" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  updateElementHtmlIfChanged(container, newTimelineHtml, 'editorTimeline', () => {
    if (window.lucide) window.lucide.createIcons();
  });
}

function renderEditorScorecardTables(match) {
  const innNum = match.currentInnings || 1;
  const inn = innNum === 2 ? match.innings2 : match.innings1;

  // Batting Table
  const battingTbody = document.getElementById('editor-batting-table-body');
  if (battingTbody && !battingTbody.contains(document.activeElement)) {
    const batters = inn?.batting || [];
    let newBattingHtml = '';
    if (batters.length === 0) {
      newBattingHtml = '<tr><td colspan="8" class="text-center text-slate-400 py-3">No batters in scorecard yet.</td></tr>';
    } else {
      newBattingHtml = batters.map((b, idx) => {
        const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
        return `
          <tr>
            <td><input type="text" class="form-input text-xs py-1" value="${b.name || ''}" onchange="updateBatterField(${idx}, 'name', this.value)"></td>
            <td><input type="text" class="form-input text-xs py-1" value="${b.dismissal || 'not out'}" onchange="updateBatterField(${idx}, 'dismissal', this.value)"></td>
            <td class="text-center"><input type="number" class="form-input text-xs py-1 text-center font-bold w-16" value="${b.runs ?? 0}" onchange="updateBatterField(${idx}, 'runs', Number(this.value))"></td>
            <td class="text-center"><input type="number" class="form-input text-xs py-1 text-center w-14" value="${b.balls ?? 0}" onchange="updateBatterField(${idx}, 'balls', Number(this.value))"></td>
            <td class="text-center"><input type="number" class="form-input text-xs py-1 text-center w-12 text-emerald-400" value="${b.fours ?? 0}" onchange="updateBatterField(${idx}, 'fours', Number(this.value))"></td>
            <td class="text-center"><input type="number" class="form-input text-xs py-1 text-center w-12 text-purple-400" value="${b.sixes ?? 0}" onchange="updateBatterField(${idx}, 'sixes', Number(this.value))"></td>
            <td class="text-center font-mono text-slate-300">${sr}</td>
            <td class="text-right">
              <button onclick="removeBatterRow(${idx})" class="text-slate-400 hover:text-red-400 p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </td>
          </tr>
        `;
      }).join('');
    }
    updateElementHtmlIfChanged(battingTbody, newBattingHtml, 'editorBatting', () => {
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // Bowling Table
  const bowlingTbody = document.getElementById('editor-bowling-table-body');
  if (bowlingTbody && !bowlingTbody.contains(document.activeElement)) {
    const bowlers = inn?.bowling || [];
    let newBowlingHtml = '';
    if (bowlers.length === 0) {
      newBowlingHtml = '<tr><td colspan="9" class="text-center text-slate-400 py-3">No bowlers in scorecard yet.</td></tr>';
    } else {
      newBowlingHtml = bowlers.map((bw, idx) => {
        return `
          <tr>
            <td><input type="text" class="form-input text-xs py-1" value="${bw.name || ''}" onchange="updateBowlerField(${idx}, 'name', this.value)"></td>
            <td class="text-center"><input type="text" class="form-input text-xs py-1 text-center font-bold w-16" value="${bw.overs || '0.0'}" onchange="updateBowlerField(${idx}, 'overs', this.value)"></td>
            <td class="text-center"><input type="number" class="form-input text-xs py-1 text-center w-12" value="${bw.maidens ?? 0}" onchange="updateBowlerField(${idx}, 'maidens', Number(this.value))"></td>
            <td class="text-center"><input type="number" class="form-input text-xs py-1 text-center w-14 font-bold" value="${bw.runs ?? 0}" onchange="updateBowlerField(${idx}, 'runs', Number(this.value))"></td>
            <td class="text-center"><input type="number" class="form-input text-xs py-1 text-center w-12 font-black text-red-400" value="${bw.wickets ?? 0}" onchange="updateBowlerField(${idx}, 'wickets', Number(this.value))"></td>
            <td class="text-center font-mono text-slate-300">${bw.econ || '0.00'}</td>
            <td class="text-center"><input type="number" class="form-input text-xs py-1 text-center w-12" value="${bw.wides ?? 0}" onchange="updateBowlerField(${idx}, 'wides', Number(this.value))"></td>
            <td class="text-center"><input type="number" class="form-input text-xs py-1 text-center w-12" value="${bw.noBalls ?? 0}" onchange="updateBowlerField(${idx}, 'noBalls', Number(this.value))"></td>
            <td class="text-right">
              <button onclick="removeBowlerRow(${idx})" class="text-slate-400 hover:text-red-400 p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </td>
          </tr>
        `;
      }).join('');
    }
    updateElementHtmlIfChanged(bowlingTbody, newBowlingHtml, 'editorBowling', () => {
      if (window.lucide) window.lucide.createIcons();
    });
  }
}

function renderEditorExtras(match) {
  const innNum = match.currentInnings || 1;
  const inn = innNum === 2 ? match.innings2 : match.innings1;
  const extras = inn?.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 };

  const updateInputIfNotFocused = (id, val) => {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el && el.value !== String(val ?? '')) {
      el.value = val ?? '';
    }
  };
  updateInputIfNotFocused('override-extras-wides', extras.wides ?? 0);
  updateInputIfNotFocused('override-extras-noballs', extras.noBalls ?? 0);
  updateInputIfNotFocused('override-extras-byes', extras.byes ?? 0);
  updateInputIfNotFocused('override-extras-legbyes', extras.legByes ?? 0);
  updateInputIfNotFocused('override-extras-penalty', extras.penalty ?? 0);

  // FOW list
  const fowList = document.getElementById('editor-fow-list');
  if (fowList) {
    const fow = inn?.fallOfWickets || [];
    let newFowHtml = '';
    if (fow.length === 0) {
      newFowHtml = '<p class="text-xs text-slate-400 py-2">No fall of wickets recorded.</p>';
    } else {
      newFowHtml = fow.map((item, idx) => `
        <div class="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs">
          <span>Wkt ${item.wkt || idx + 1}: <strong class="text-white">${item.score ?? 0} runs</strong> (${item.player || 'Batter'}, ov ${item.over || '0.0'})</span>
          <button onclick="removeFowRow(${idx})" class="text-slate-400 hover:text-red-400"><i data-lucide="trash" class="w-3 h-3"></i></button>
        </div>
      `).join('');
    }
    updateElementHtmlIfChanged(fowList, newFowHtml, 'editorFow', () => {
      if (window.lucide) window.lucide.createIcons();
    });
  }
}

// 4. TEAMS & SQUADS VIEW
function renderTeamsView() {
  const container = document.getElementById('teams-grid');
  if (!container) return;

  let newHtml = '';
  if (state.teams.length === 0) {
    newHtml = `
      <div class="col-span-3 glass-panel p-8 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
        No teams registered in the database.
      </div>
    `;
  } else {
    newHtml = state.teams.map(t => {
      const squad = Array.isArray(t.squad) ? t.squad : [];
      return `
        <div class="glass-panel p-4 rounded-xl border border-slate-800 space-y-3 card-hover">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shadow-inner">
              ${t.flag || t.logo || '🏏'}
            </div>
            <div>
              <h4 class="font-extrabold text-sm text-white">${t.name}</h4>
              <p class="text-xs text-slate-400">${squad.length} Players in Squad • ${t.captain ? `Cap: ${t.captain}` : 'Official Team'}</p>
            </div>
          </div>

          <div class="border-t border-slate-800/80 pt-2 space-y-1">
            <p class="text-[11px] text-slate-400 font-semibold uppercase">Roster Sample:</p>
            <div class="flex flex-wrap gap-1">
              ${squad.slice(0, 8).map(p => {
                const pName = typeof p === 'string' ? p : (p.name || 'Player');
                return `<span class="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">${pName}</span>`;
              }).join('')}
              ${squad.length > 8 ? `<span class="text-[10px] text-slate-400 font-medium">+${squad.length - 8} more</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateElementHtmlIfChanged(container, newHtml, 'teamsGrid');
}

// ============================================================================
// PLAYER TEAMS & CAREER DOSSIER ENGINE
// ============================================================================

function getPlayerTeams(user) {
  if (!user) return [];
  const foundTeams = [];
  const cleanName = (user.name || '').trim().toLowerCase();
  const cleanPhone = String(user.phone || '').replace(/[^0-9]/g, '');
  const cleanEmail = String(user.email || '').toLowerCase();

  // 1. Direct profile team if specified
  const directTeam = user.team || user.teamName || user.profile?.team || user.profile?.teamName;
  if (directTeam) {
    foundTeams.push({
      name: directTeam,
      flag: user.teamFlag || user.profile?.teamFlag || '🦁',
      role: user.role || 'Member',
    });
  }

  // 2. Search state.teams squads
  (state.teams || []).forEach(t => {
    if (!t) return;
    const squad = Array.isArray(t.squad) ? t.squad : [];
    const isMember = squad.some(p => {
      if (!p) return false;
      if (typeof p === 'string') {
        return p.trim().toLowerCase() === cleanName;
      }
      const pName = String(p.name || '').trim().toLowerCase();
      const pPhone = String(p.phone || '').replace(/[^0-9]/g, '');
      const pEmail = String(p.email || '').toLowerCase();
      return (cleanPhone && pPhone && cleanPhone === pPhone) ||
             (cleanName && pName && cleanName === pName) ||
             (cleanEmail && pEmail && cleanEmail === pEmail);
    });

    if (isMember && !foundTeams.some(existing => existing.name?.toLowerCase() === (t.name || '').toLowerCase())) {
      foundTeams.push({
        id: t.id,
        name: t.name,
        flag: t.flag || t.logo || '🏏',
        squadCount: squad.length,
      });
    }
  });

  return foundTeams;
}

// 5. USERS DIRECTORY VIEW
function renderUsersView(query = null) {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  const searchInput = document.getElementById('users-search');
  const activeQuery = (query !== null ? query : (searchInput ? searchInput.value : '')).toLowerCase().trim();

  let list = [...state.users];

  if (activeQuery) {
    list = list.filter(u => {
      const userTeams = getPlayerTeams(u);
      const teamMatch = userTeams.some(t => t.name?.toLowerCase().includes(activeQuery));
      return (
        u.name?.toLowerCase().includes(activeQuery) ||
        u.phone?.includes(activeQuery) ||
        u.email?.toLowerCase().includes(activeQuery) ||
        u.role?.toLowerCase().includes(activeQuery) ||
        u.jersey?.toLowerCase().includes(activeQuery) ||
        teamMatch
      );
    });
  }

  let newHtml = '';
  if (list.length === 0) {
    newHtml = '<tr><td colspan="6" class="text-center text-slate-400 py-8 text-xs">No registered players found matching your query.</td></tr>';
  } else {
    newHtml = list.map(u => {
      const roleText = u.role || 'Player';
      const bowlingStyle = u.bowlingStyle && u.bowlingStyle !== 'None' ? u.bowlingStyle : '';
      let secondaryStyle = '';
      if (bowlingStyle && !roleText.toLowerCase().includes(bowlingStyle.toLowerCase())) {
        secondaryStyle = bowlingStyle;
      }

      const avatarSrc = resolveUserAvatar(u);
      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'Player')}&background=0284c7&color=fff&bold=true&size=128&rounded=true`;
      const userKey = u.phone || u.id || u.email || u.name;

      const userTeams = getPlayerTeams(u);
      let teamsHtml = '';
      if (userTeams.length > 0) {
        teamsHtml = userTeams.map(t => `
          <span class="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[11px] font-semibold inline-flex items-center gap-1">
            <span>${t.flag || '🏏'}</span>
            <span class="truncate max-w-[120px]">${t.name}</span>
          </span>
        `).join(' ');
      } else {
        teamsHtml = `
          <span class="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/60 text-[10px] font-medium inline-flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            <span>No Team Yet</span>
          </span>
        `;
      }

      return `
        <tr class="hover:bg-slate-800/60 transition cursor-pointer group select-none" 
            onclick="openPlayerDossier('${encodeURIComponent(userKey)}')" 
            title="Click to view ${u.name || 'player'}'s complete career dossier & statistics">
          <td class="font-bold text-white flex items-center gap-3">
            <img src="${avatarSrc}" 
                 alt="${u.name || 'Player'}" 
                 class="w-10 h-10 rounded-full object-cover border-2 border-slate-700 group-hover:border-sky-400 shadow-sm bg-slate-800 shrink-0 transition" 
                 onerror="this.onerror=null; this.src='${fallbackUrl}';">
            <div class="flex items-center gap-1.5">
              ${u.jersey ? `<span class="px-1.5 py-0.2 rounded bg-slate-800 text-sky-400 font-mono text-[10px] font-bold group-hover:bg-sky-900/50">${u.jersey}</span>` : ''}
              <span class="group-hover:text-sky-300 transition font-semibold">${u.name || 'Unnamed Player'}</span>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition transform group-hover:translate-x-0.5"></i>
            </div>
          </td>
          <td class="font-mono text-slate-300">${u.phone ? `+91 ${u.phone.replace(/^91/, '')}` : '-'}</td>
          <td class="text-slate-400 font-mono text-xs">${u.email || '-'}</td>
          <td>
            <div class="space-y-0.5">
              <span class="inline-block px-2 py-0.5 rounded bg-slate-800/90 text-sky-400 font-semibold text-[11px]">${roleText}</span>
              ${secondaryStyle ? `<span class="block text-[10px] text-slate-400">${secondaryStyle}</span>` : ''}
            </div>
          </td>
          <td>
            <div class="flex flex-wrap gap-1 items-center">
              ${teamsHtml}
            </div>
          </td>
          <td class="text-right font-mono font-bold text-emerald-400">${u.matchesPlayed ?? 0}</td>
        </tr>
      `;
    }).join('');
  }

  updateElementHtmlIfChanged(tbody, newHtml, 'usersTbody');
}

// 6. SETTINGS VIEW
function renderSettingsView() {
  const jsonEditor = document.getElementById('raw-json-editor');
  if (jsonEditor && document.activeElement === jsonEditor) return;
  if (state.activeMatchId && state.matchesDb[state.activeMatchId]) {
    const formatted = JSON.stringify(state.matchesDb[state.activeMatchId], null, 2);
    if (jsonEditor && jsonEditor.value !== formatted) {
      jsonEditor.value = formatted;
    }
  }
}

// ============================================================================
// SCORER CORRECTION & CASCADING RECALCULATION ENGINE
// ============================================================================

function openEditBallModal(ballIndex) {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  const history = match.liveState?.scoringHistory || [];
  const ball = history[ballIndex];
  if (!ball) return;

  state.editingBallIndex = ballIndex;

  document.getElementById('edit-ball-id').value = ball.id || '';
  document.getElementById('edit-ball-index').value = String(ballIndex);
  document.getElementById('edit-ball-subheading').textContent = `Delivery #${ballIndex + 1} • Scored by ${ball.scoredBy || match.activeScorer?.name || 'Scorer'}`;

  // Runs
  const runs = ball.addedRuns ?? 0;
  let matchedBtn = false;
  document.querySelectorAll('#ball-runs-selector .btn-run-choice').forEach(btn => {
    btn.classList.remove('ring-2', 'ring-sky-400');
    if (btn.dataset.runs === String(runs)) {
      btn.classList.add('ring-2', 'ring-sky-400');
      matchedBtn = true;
    }
  });
  const customInput = document.getElementById('edit-ball-runs-custom');
  if (!matchedBtn) {
    customInput.classList.remove('hidden');
    customInput.value = runs;
  } else {
    customInput.classList.add('hidden');
    customInput.value = runs;
  }

  // Extras
  document.getElementById('edit-ball-extra-type').value = ball.extraType || 'none';
  document.getElementById('edit-ball-overthrow').value = ball.overthrowRuns ?? 0;

  // Wickets
  const isWkt = Boolean(ball.isWkt);
  const wktCheckbox = document.getElementById('edit-ball-is-wkt');
  wktCheckbox.checked = isWkt;
  document.getElementById('wkt-fields-group').classList.toggle('hidden', !isWkt);

  document.getElementById('edit-ball-wkt-type').value = ball.dismissalType || 'bowled';
  document.getElementById('edit-ball-dismissed-player').value = ball.dismissedPlayerName || '';
  document.getElementById('edit-ball-fielder').value = ball.finalFielder || '';
  document.getElementById('edit-ball-incoming-player').value = ball.incomingBatter || '';

  // Batters & Bowler
  document.getElementById('edit-ball-striker').value = ball.striker || match.currentStriker || '';
  document.getElementById('edit-ball-bowler').value = ball.bowler || match.currentBowler || '';
  document.getElementById('edit-ball-commentary').value = ball.dismissalDesc || '';

  openModal('modal-edit-ball');
}

function handleSaveBallForm(e) {
  e.preventDefault();
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  const idx = state.editingBallIndex;
  if (idx == null) return;

  const history = [...(match.liveState?.scoringHistory || [])];
  const oldBall = history[idx] || {};

  const runs = Number(document.getElementById('edit-ball-runs-custom').value) || 0;
  const extraType = document.getElementById('edit-ball-extra-type').value;
  const overthrowRuns = Number(document.getElementById('edit-ball-overthrow').value) || 0;
  const isWkt = document.getElementById('edit-ball-is-wkt').checked;

  let ballSymbol = String(runs);
  if (isWkt) ballSymbol = 'W';
  else if (extraType === 'wide') ballSymbol = runs > 1 ? `${runs}Wd` : 'Wd';
  else if (extraType === 'noBall') ballSymbol = runs > 0 ? `Nb+${runs}` : 'Nb';
  else if (extraType === 'bye') ballSymbol = `${runs}B`;
  else if (extraType === 'legBye') ballSymbol = `${runs}Lb`;

  const updatedBall = {
    ...oldBall,
    addedRuns: runs + overthrowRuns,
    isLegalDelivery: extraType !== 'wide' && extraType !== 'noBall',
    ballSymbol,
    extraType,
    overthrowRuns,
    isWkt,
    dismissalType: isWkt ? document.getElementById('edit-ball-wkt-type').value : null,
    dismissedPlayerName: isWkt ? document.getElementById('edit-ball-dismissed-player').value : null,
    finalFielder: isWkt ? document.getElementById('edit-ball-fielder').value : null,
    incomingBatter: isWkt ? document.getElementById('edit-ball-incoming-player').value : null,
    striker: document.getElementById('edit-ball-striker').value,
    bowler: document.getElementById('edit-ball-bowler').value,
    dismissalDesc: document.getElementById('edit-ball-commentary').value,
    adminEdited: true,
  };

  history[idx] = updatedBall;

  match.liveState = {
    ...(match.liveState || {}),
    scoringHistory: history,
  };

  closeAllModals();

  // Trigger automated cascading recalculation
  recalculateActiveMatchStats();
  showToast('Ball corrected and stats recalculated!', 'success');
}

function handleDeleteBall() {
  if (!confirm('Are you sure you want to delete this ball delivery? All match stats will automatically adjust.')) return;

  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  const idx = state.editingBallIndex;
  const history = [...(match.liveState?.scoringHistory || [])];
  history.splice(idx, 1);

  match.liveState = {
    ...(match.liveState || {}),
    scoringHistory: history,
  };

  closeAllModals();
  recalculateActiveMatchStats();
  showToast('Ball deleted and match stats recalculated.', 'warning');
}

function handleInsertMissedBall() {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  const runsPrompt = prompt('Enter runs for this missed ball (0, 1, 2, 3, 4, 6):', '1');
  if (runsPrompt === null) return;
  const runs = Number(runsPrompt) || 0;

  const newBall = {
    id: `admin_ball_${Date.now()}`,
    addedRuns: runs,
    isLegalDelivery: true,
    ballSymbol: String(runs),
    extraType: 'none',
    isWkt: false,
    striker: match.currentStriker || 'Striker',
    bowler: match.currentBowler || 'Bowler',
    dismissalDesc: `${runs} runs (Inserted by Admin)`,
    adminInserted: true,
    timestamp: Date.now(),
  };

  const history = [...(match.liveState?.scoringHistory || [])];
  history.push(newBall);

  match.liveState = {
    ...(match.liveState || {}),
    scoringHistory: history,
  };

  recalculateActiveMatchStats();
  showToast('Missed ball inserted and stats updated!', 'success');
}

// Master Automated Scorecard Recalculation Engine
function recalculateActiveMatchStats() {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  const innNum = match.currentInnings || 1;
  const history = match.liveState?.scoringHistory || [];

  let totalRuns = 0;
  let totalWickets = 0;
  let legalBalls = 0;
  const thisOver = [];

  const battersMap = {};
  const bowlersMap = {};
  const extras = { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 };
  const fow = [];

  history.forEach((ball, bIdx) => {
    const runs = Number(ball.addedRuns) || 0;
    totalRuns += runs;

    if (ball.isLegalDelivery) {
      legalBalls++;
    }

    if (ball.ballSymbol) {
      thisOver.push(ball.ballSymbol);
    }

    // Extras
    if (ball.extraType === 'wide') extras.wides += runs || 1;
    else if (ball.extraType === 'noBall') extras.noBalls += 1;
    else if (ball.extraType === 'bye') extras.byes += runs;
    else if (ball.extraType === 'legBye') extras.legByes += runs;
    else if (ball.extraType === 'penalty') extras.penalty += runs;

    // Batter stats
    const striker = ball.striker || 'Batter';
    if (!battersMap[striker]) {
      battersMap[striker] = { name: striker, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'not out' };
    }
    if (ball.extraType !== 'wide') {
      battersMap[striker].balls += 1;
      const offBatRuns = ball.extraType === 'none' ? runs - (ball.overthrowRuns || 0) : 0;
      battersMap[striker].runs += offBatRuns;
      if (offBatRuns === 4) battersMap[striker].fours += 1;
      if (offBatRuns === 6) battersMap[striker].sixes += 1;
    }

    // Bowler stats
    const bowler = ball.bowler || 'Bowler';
    if (!bowlersMap[bowler]) {
      bowlersMap[bowler] = { name: bowler, legalBalls: 0, runs: 0, wickets: 0, maidens: 0, wides: 0, noBalls: 0 };
    }
    bowlersMap[bowler].runs += (ball.extraType === 'bye' || ball.extraType === 'legBye') ? 0 : runs;
    if (ball.isLegalDelivery) {
      bowlersMap[bowler].legalBalls += 1;
    }
    if (ball.extraType === 'wide') bowlersMap[bowler].wides += 1;
    if (ball.extraType === 'noBall') bowlersMap[bowler].noBalls += 1;

    // Wicket
    if (ball.isWkt) {
      totalWickets++;
      bowlersMap[bowler].wickets += 1;
      const outPlayer = ball.dismissedPlayerName || striker;
      if (battersMap[outPlayer]) {
        battersMap[outPlayer].dismissal = ball.dismissalDesc || `${ball.dismissalType || 'out'} b ${bowler}`;
      }
      fow.push({
        wkt: totalWickets,
        score: totalRuns,
        player: outPlayer,
        over: `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`,
      });
    }
  });

  extras.total = extras.wides + extras.noBalls + extras.byes + extras.legByes + extras.penalty;

  // Format overs
  const oversFormatted = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;

  // Update in-flight live counters
  match.liveRuns = totalRuns;
  match.liveWickets = totalWickets;
  match.liveBalls = legalBalls;

  // Slice this over array to max 6 legal balls + extras
  match.liveThisOver = thisOver.slice(-8);

  // Update innings object
  const targetInn = innNum === 2 ? 'innings2' : 'innings1';
  match[targetInn] = {
    ...(match[targetInn] || {}),
    runs: totalRuns,
    wickets: totalWickets,
    overs: oversFormatted,
    crr: legalBalls > 0 ? ((totalRuns / legalBalls) * 6).toFixed(2) : '0.00',
    batting: Object.values(battersMap),
    bowling: Object.values(bowlersMap).map(b => ({
      ...b,
      overs: `${Math.floor(b.legalBalls / 6)}.${b.legalBalls % 6}`,
      econ: b.legalBalls > 0 ? ((b.runs / b.legalBalls) * 6).toFixed(2) : '0.00',
    })),
    extras,
    fallOfWickets: fow,
  };

  // Push directly to cloud
  pushMatchToCloud(state.activeMatchId, match);
}

function swapCreaseBatters() {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  const temp = match.currentStriker;
  match.currentStriker = match.currentNonStriker;
  match.currentNonStriker = temp;

  pushMatchToCloud(state.activeMatchId, match);
  showToast(`Swapped crease: ${match.currentStriker} is now Striker`, 'success');
}

function updateActiveMatchField(field, value) {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  match[field] = value;
  pushMatchToCloud(state.activeMatchId, match);
}

function updateBatterField(batterIdx, field, value) {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  const innKey = match.currentInnings === 2 ? 'innings2' : 'innings1';
  if (!match[innKey]?.batting?.[batterIdx]) return;

  match[innKey].batting[batterIdx][field] = value;
  pushMatchToCloud(state.activeMatchId, match);
}

function updateBowlerField(bowlerIdx, field, value) {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  const innKey = match.currentInnings === 2 ? 'innings2' : 'innings1';
  if (!match[innKey]?.bowling?.[bowlerIdx]) return;

  match[innKey].bowling[bowlerIdx][field] = value;
  pushMatchToCloud(state.activeMatchId, match);
}

function promptAddBatter() {
  const name = prompt('Enter new batter name:');
  if (!name) return;

  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  const innKey = match.currentInnings === 2 ? 'innings2' : 'innings1';
  match[innKey] = match[innKey] || {};
  match[innKey].batting = match[innKey].batting || [];

  match[innKey].batting.push({
    name,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    dismissal: 'not out',
  });

  pushMatchToCloud(state.activeMatchId, match);
  showToast(`Added ${name} to batting card`, 'success');
}

function promptAddBowler() {
  const name = prompt('Enter new bowler name:');
  if (!name) return;

  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  const innKey = match.currentInnings === 2 ? 'innings2' : 'innings1';
  match[innKey] = match[innKey] || {};
  match[innKey].bowling = match[innKey].bowling || [];

  match[innKey].bowling.push({
    name,
    overs: '0.0',
    maidens: 0,
    runs: 0,
    wickets: 0,
    econ: '0.00',
    wides: 0,
    noBalls: 0,
  });

  pushMatchToCloud(state.activeMatchId, match);
  showToast(`Added ${name} to bowling card`, 'success');
}

function removeBatterRow(idx) {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;
  const innKey = match.currentInnings === 2 ? 'innings2' : 'innings1';
  match[innKey]?.batting?.splice(idx, 1);
  pushMatchToCloud(state.activeMatchId, match);
}

function removeBowlerRow(idx) {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;
  const innKey = match.currentInnings === 2 ? 'innings2' : 'innings1';
  match[innKey]?.bowling?.splice(idx, 1);
  pushMatchToCloud(state.activeMatchId, match);
}

function removeFowRow(idx) {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;
  const innKey = match.currentInnings === 2 ? 'innings2' : 'innings1';
  match[innKey]?.fallOfWickets?.splice(idx, 1);
  pushMatchToCloud(state.activeMatchId, match);
}



function openMatchInEditor(matchId) {
  state.activeMatchId = matchId;
  try {
    localStorage.setItem('cricketadda_admin_active_match', matchId);
  } catch (e) {}
  switchTab('editor');
}

function deleteMatchPrompt(matchId) {
  if (!confirm('Are you sure you want to delete this match from the database?')) return;
  delete state.matchesDb[matchId];
  if (state.activeMatchId === matchId) {
    state.activeMatchId = Object.keys(state.matchesDb)[0] || null;
  }
  fetch(`${CONFIG.FIREBASE_URL}/matches_db/${matchId}.json`, { method: 'DELETE' });
  fetch(`${CONFIG.FIREBASE_URL}/matches/${matchId}.json`, { method: 'DELETE' });
  renderAllViews();
  showToast('Match deleted.', 'warning');
}

// ============================================================================
// HELPERS
// ============================================================================

function renderBallBadgeHtml(symbol) {
  const sym = String(symbol || '0').trim();
  let cls = 'ball-badge ball-runs';
  if (sym === '0') cls = 'ball-badge ball-dot';
  else if (sym === '4') cls = 'ball-badge ball-four';
  else if (sym === '6') cls = 'ball-badge ball-six';
  else if (sym === 'W' || sym.includes('Wkt')) cls = 'ball-badge ball-wicket';
  else if (sym.includes('Wd')) cls = 'ball-badge ball-wide';
  else if (sym.includes('Nb')) cls = 'ball-badge ball-noball';
  return `<span class="${cls}">${sym}</span>`;
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'in_progress':
    case 'live':
      return 'bg-emerald-950 text-emerald-400 border border-emerald-800';
    case 'innings_break':
      return 'bg-amber-950 text-amber-400 border border-amber-800';
    case 'completed':
      return 'bg-sky-950 text-sky-400 border border-sky-800';
    case 'tied':
      return 'bg-purple-950 text-purple-400 border border-purple-800';
    case 'abandoned':
      return 'bg-red-950 text-red-400 border border-red-800';
    default:
      return 'bg-slate-800 text-slate-300 border border-slate-700';
  }
}

function getActiveBattingTeam(match) {
  const inn = match.currentInnings === 2 ? match.innings2 : match.innings1;
  return inn?.team || match.teamA;
}

function getActiveBowlingTeam(match) {
  const inn = match.currentInnings === 2 ? match.innings1 : match.innings2;
  return inn?.team || match.teamB;
}

function buildBattersMap(match) {
  const inn = match.currentInnings === 2 ? match.innings2 : match.innings1;
  const map = {};
  (inn?.batting || []).forEach(b => {
    if (b && b.name) map[b.name] = b;
  });
  return map;
}

function buildBowlersMap(match) {
  const inn = match.currentInnings === 2 ? match.innings2 : match.innings1;
  const map = {};
  (inn?.bowling || []).forEach(b => {
    if (b && b.name) map[b.name] = b;
  });
  return map;
}

function openModal(modalId) {
  document.getElementById(modalId)?.classList.remove('hidden');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  let bg = 'bg-slate-900 border border-slate-700 text-slate-100';
  let icon = 'ℹ️';

  if (type === 'success') {
    bg = 'bg-emerald-950 border border-emerald-700 text-emerald-200';
    icon = '✅';
  } else if (type === 'error') {
    bg = 'bg-red-950 border border-red-700 text-red-200';
    icon = '❌';
  } else if (type === 'warning') {
    bg = 'bg-amber-950 border border-amber-700 text-amber-200';
    icon = '⚠️';
  }

  toast.className = `toast ${bg}`;
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function filterMatches(filterType) {
  state.matchFilter = filterType;
  try {
    localStorage.setItem('cricketadda_admin_match_filter', filterType);
  } catch (e) {}
  document.querySelectorAll('.match-filter-btn').forEach(b => {
    if (b.dataset.filter === filterType) {
      b.className = 'match-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-900/60 text-sky-300 border border-sky-700/60';
    } else {
      b.className = 'match-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700';
    }
  });
  renderMatchesView();
}

// Dismiss modals on backdrop click or ESC key
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAllModals();
  });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAllModals();
});
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', closeAllModals);
});

// ============================================================================
// PLAYER CAREER DOSSIER MODAL & ADVANCED ANALYTICS
// ============================================================================

let currentDossierUser = null;
let currentDossierTab = 'batting';

function openPlayerDossier(userKeyRaw) {
  const userKey = decodeURIComponent(userKeyRaw);
  const cleanKey = String(userKey).replace(/[^0-9]/g, '');
  const user = state.users.find(u => {
    const uPhone = String(u.phone || (u.profile && u.profile.phone) || '').replace(/[^0-9]/g, '');
    const uEmail = String(u.email || (u.profile && u.profile.email) || '').toLowerCase();
    const uId = String(u.id || (u.profile && u.profile.id) || '');
    const uName = String(u.name || (u.profile && u.profile.name) || '');
    return (cleanKey && uPhone === cleanKey) ||
           (uEmail && uEmail === userKey.toLowerCase()) ||
           (uId && uId === userKey) ||
           (uName && uName === userKey);
  });

  if (!user) {
    showToast('Player profile not found', 'warning');
    return;
  }

  currentDossierUser = user;
  currentDossierTab = 'batting';

  renderPlayerDossierModal(user);
  openModal('modal-player-dossier');
}

function switchDossierTab(tabId) {
  currentDossierTab = tabId;
  document.querySelectorAll('.dossier-tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.className = 'dossier-tab-btn px-4 py-2.5 border-b-2 border-sky-400 text-sky-400 font-bold transition flex items-center gap-1.5 whitespace-nowrap bg-sky-950/20';
    } else {
      btn.className = 'dossier-tab-btn px-4 py-2.5 border-b-2 border-transparent text-slate-400 hover:text-white transition flex items-center gap-1.5 whitespace-nowrap';
    }
  });

  document.querySelectorAll('.dossier-panel').forEach(panel => {
    panel.classList.toggle('hidden', panel.dataset.panel !== tabId);
  });
  if (window.lucide) lucide.createIcons();
}

function copyDossierText(text, label = 'Copied') {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} to clipboard! 📋`, 'info');
    }).catch(() => {});
  }
}

function renderPlayerDossierModal(user) {
  const container = document.getElementById('player-dossier-content');
  const titleEl = document.getElementById('dossier-header-title');
  if (!container) return;

  if (titleEl) {
    titleEl.textContent = `${user.name || 'Player'} • Career Dossier`;
  }

  const avatarSrc = resolveUserAvatar(user);
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Player')}&background=0284c7&color=fff&bold=true&size=128&rounded=true`;

  const teams = getPlayerTeams(user);
  const rawData = user.raw || {};
  const careerStats = rawData.careerStats?.careerStats || user.careerStats?.careerStats || rawData.careerStats || user.careerStats || {};
  const matchOverview = rawData.careerStats?.matchOverview || user.careerStats?.matchOverview || {};

  const batting = careerStats.batting || {};
  const bowling = careerStats.bowling || {};
  const fielding = careerStats.fielding || {};

  // Matches involving this player
  const cleanName = (user.name || '').trim().toLowerCase();
  const playerMatches = [];
  Object.values(state.matchesDb || {}).forEach(m => {
    if (!m) return;
    const inn1 = m.innings1 || {};
    const inn2 = m.innings2 || {};
    const inBat1 = (inn1.batting || []).some(b => String(b?.name || '').trim().toLowerCase() === cleanName);
    const inBat2 = (inn2.batting || []).some(b => String(b?.name || '').trim().toLowerCase() === cleanName);
    const inBowl1 = (inn1.bowling || []).some(b => String(b?.name || '').trim().toLowerCase() === cleanName);
    const inBowl2 = (inn2.bowling || []).some(b => String(b?.name || '').trim().toLowerCase() === cleanName);
    const isScorer = String(m.activeScorer?.name || '').trim().toLowerCase() === cleanName;

    if (inBat1 || inBat2 || inBowl1 || inBowl2 || isScorer) {
      playerMatches.push({
        id: m.id,
        title: m.title || `${m.teamA || 'Team A'} vs ${m.teamB || 'Team B'}`,
        tournament: m.tournament || 'Cricket Adda Championship',
        status: m.status || 'completed',
        summary: m.toss || 'Official Match',
        score1: inn1.team ? `${inn1.team}: ${inn1.runs || 0}/${inn1.wickets || 0} (${inn1.overs || 0} ov)` : '',
        score2: inn2.team ? `${inn2.team}: ${inn2.runs || 0}/${inn2.wickets || 0} (${inn2.overs || 0} ov)` : '',
      });
    }
  });

  const matchesCount = matchOverview.matchesPlayed ?? user.matchesPlayed ?? 0;
  const winsCount = matchOverview.wins ?? 0;
  const lossesCount = matchOverview.losses ?? 0;
  const winRate = matchOverview.winRate || (matchesCount > 0 ? `${Math.round((winsCount / matchesCount) * 100)}%` : '0%');
  const potmCount = matchOverview.potmCount ?? 0;

  const battingRuns = batting.runs ?? 0;
  const bowlingWkts = bowling.wickets ?? 0;
  const catchesCount = fielding.catches ?? 0;

  const roleText = user.role || 'Player';
  const battingStyle = user.battingStyle || (user.profile && user.profile.battingStyle) || 'Right-hand Bat';
  const bowlingStyle = user.bowlingStyle || (user.profile && user.profile.bowlingStyle) || 'Right-arm Fast';

  let teamsBadgeList = '';
  if (teams.length > 0) {
    teamsBadgeList = teams.map(t => `
      <span class="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm">
        <span>${t.flag || '🏏'}</span>
        <span>${t.name}</span>
      </span>
    `).join(' ');
  } else {
    teamsBadgeList = `
      <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium inline-flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-slate-500"></span>
        <span>No Team Yet (Free Agent)</span>
      </span>
    `;
  }

  container.innerHTML = `
    <!-- 1. Hero Player Profile Header -->
    <div class="glass-panel p-5 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/95 to-sky-950/30 flex flex-col sm:flex-row items-center sm:items-start gap-5 shadow-lg">
      <div class="relative shrink-0">
        <img src="${avatarSrc}" alt="${user.name || 'Player'}" 
             class="w-24 h-24 rounded-2xl object-cover border-2 border-sky-400 shadow-xl bg-slate-800" 
             onerror="this.onerror=null; this.src='${fallbackUrl}';">
        ${user.jersey ? `<span class="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-sky-500 text-white font-mono font-black text-xs shadow-md">${user.jersey}</span>` : ''}
      </div>

      <div class="flex-1 text-center sm:text-left space-y-2.5 min-w-0">
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
          <h2 class="text-2xl font-black text-white tracking-tight">${user.name || 'Unnamed Player'}</h2>
          <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1">
            <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
            <span>Verified Athlete</span>
          </span>
        </div>

        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
          <span class="px-3 py-1 rounded-lg bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">${roleText}</span>
          ${battingStyle ? `<span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-medium">🏏 ${battingStyle}</span>` : ''}
          ${bowlingStyle && bowlingStyle !== 'None' ? `<span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-medium">⚡ ${bowlingStyle}</span>` : ''}
        </div>

        <div class="pt-0.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span class="text-xs text-slate-400 font-semibold">Team:</span>
          ${teamsBadgeList}
        </div>

        <!-- Verified Contact Row with Click-to-Copy -->
        <div class="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-mono text-slate-300">
          ${user.phone ? `
            <button type="button" onclick="copyDossierText('${user.phone}', 'Phone number')" 
                    class="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 flex items-center gap-1.5 transition" title="Click to copy phone">
              <i data-lucide="phone" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span>+91 ${user.phone.replace(/^91/, '')}</span>
            </button>
          ` : ''}
          ${user.email ? `
            <button type="button" onclick="copyDossierText('${user.email}', 'Email address')" 
                    class="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 flex items-center gap-1.5 transition" title="Click to copy email">
              <i data-lucide="mail" class="w-3.5 h-3.5 text-sky-400"></i>
              <span>${user.email}</span>
            </button>
          ` : ''}
          ${user.id ? `
            <span class="text-[11px] text-slate-500 font-mono self-center">UID: ${user.id}</span>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- 2. Cricketer Top KPI Performance Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <!-- Card 1: Matches -->
      <div class="glass-panel p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>Matches Played</span>
          <i data-lucide="calendar" class="w-4 h-4 text-sky-400"></i>
        </div>
        <div class="text-2xl font-black text-white mt-1 font-mono">${matchesCount}</div>
        <div class="text-[11px] text-slate-400 mt-0.5">${winsCount} Wins • ${lossesCount} Losses</div>
      </div>

      <!-- Card 2: Win Rate -->
      <div class="glass-panel p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>Win Rate</span>
          <i data-lucide="trending-up" class="w-4 h-4 text-emerald-400"></i>
        </div>
        <div class="text-2xl font-black text-emerald-400 mt-1 font-mono">${winRate}</div>
        <div class="text-[11px] text-slate-400 mt-0.5">Career Performance</div>
      </div>

      <!-- Card 3: POTM -->
      <div class="glass-panel p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>POTM Awards</span>
          <i data-lucide="award" class="w-4 h-4 text-amber-400"></i>
        </div>
        <div class="text-2xl font-black text-amber-300 mt-1 font-mono">${potmCount}</div>
        <div class="text-[11px] text-slate-400 mt-0.5">Player of the Match</div>
      </div>

      <!-- Card 4: Impact -->
      <div class="glass-panel p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>Career Impact</span>
          <i data-lucide="zap" class="w-4 h-4 text-purple-400"></i>
        </div>
        <div class="text-2xl font-black text-purple-300 mt-1 font-mono">${battingRuns} <span class="text-xs text-slate-400 font-normal">Runs</span></div>
        <div class="text-[11px] text-slate-400 mt-0.5 font-mono">${bowlingWkts} Wkts • ${catchesCount} Catches</div>
      </div>
    </div>

    <!-- 3. Navigation Tabs -->
    <div class="flex border-b border-slate-800 gap-1 overflow-x-auto text-xs font-semibold">
      <button type="button" onclick="switchDossierTab('batting')" data-tab="batting" 
              class="dossier-tab-btn px-4 py-2.5 border-b-2 border-sky-400 text-sky-400 font-bold transition flex items-center gap-1.5 whitespace-nowrap bg-sky-950/20">
        <i data-lucide="crosshair" class="w-3.5 h-3.5"></i>
        <span>Batting Records</span>
      </button>
      <button type="button" onclick="switchDossierTab('bowling')" data-tab="bowling" 
              class="dossier-tab-btn px-4 py-2.5 border-b-2 border-transparent text-slate-400 hover:text-white transition flex items-center gap-1.5 whitespace-nowrap">
        <i data-lucide="target" class="w-3.5 h-3.5"></i>
        <span>Bowling Figures</span>
      </button>
      <button type="button" onclick="switchDossierTab('fielding')" data-tab="fielding" 
              class="dossier-tab-btn px-4 py-2.5 border-b-2 border-transparent text-slate-400 hover:text-white transition flex items-center gap-1.5 whitespace-nowrap">
        <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
        <span>Fielding Prowess</span>
      </button>
      <button type="button" onclick="switchDossierTab('teams')" data-tab="teams" 
              class="dossier-tab-btn px-4 py-2.5 border-b-2 border-transparent text-slate-400 hover:text-white transition flex items-center gap-1.5 whitespace-nowrap">
        <i data-lucide="users" class="w-3.5 h-3.5"></i>
        <span>Teams & Matches (${teams.length})</span>
      </button>
    </div>

    <!-- 4. Tab Panels -->
    <!-- Tab 1: Batting -->
    <div class="dossier-panel space-y-4" data-panel="batting">
      <!-- Primary Batting Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div class="glass-panel p-3 rounded-xl border border-slate-800">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Total Runs</p>
          <p class="text-xl font-black text-sky-400 font-mono mt-1">${batting.runs ?? 0}</p>
        </div>
        <div class="glass-panel p-3 rounded-xl border border-slate-800">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Batting Average</p>
          <p class="text-xl font-black text-white font-mono mt-1">${batting.avg || '0.00'}</p>
        </div>
        <div class="glass-panel p-3 rounded-xl border border-slate-800">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Strike Rate</p>
          <p class="text-xl font-black text-emerald-400 font-mono mt-1">${batting.sr || '0.00'}</p>
        </div>
        <div class="glass-panel p-3 rounded-xl border border-slate-800">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Highest Score</p>
          <p class="text-xl font-black text-amber-300 font-mono mt-1">${batting.highScore || '0'}</p>
        </div>
      </div>

      <!-- Boundaries & Milestones -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div class="glass-panel p-3 rounded-xl border border-slate-800">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Fifties (50s)</p>
          <p class="text-lg font-bold text-white font-mono mt-1">${batting.fifties ?? 0}</p>
        </div>
        <div class="glass-panel p-3 rounded-xl border border-slate-800">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Hundreds (100s)</p>
          <p class="text-lg font-bold text-purple-400 font-mono mt-1">${batting.hundreds ?? 0}</p>
        </div>
        <div class="glass-panel p-3 rounded-xl border border-slate-800">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Fours (4s)</p>
          <p class="text-lg font-bold text-emerald-400 font-mono mt-1">${batting.fours ?? 0}</p>
        </div>
        <div class="glass-panel p-3 rounded-xl border border-slate-800">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Sixes (6s)</p>
          <p class="text-lg font-bold text-amber-400 font-mono mt-1">${batting.sixes ?? 0}</p>
        </div>
      </div>

      <!-- Delivery Dynamics & Ducks -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-2">
          <p class="text-xs font-bold text-white flex items-center gap-1.5">
            <i data-lucide="gauge" class="w-3.5 h-3.5 text-sky-400"></i>
            <span>Ball Discipline & Control</span>
          </p>
          <div class="flex justify-between text-xs py-1 border-b border-slate-800/80">
            <span class="text-slate-400">Balls Faced:</span>
            <span class="font-mono font-bold text-white">${batting.ballsFaced ?? 0}</span>
          </div>
          <div class="flex justify-between text-xs py-1 border-b border-slate-800/80">
            <span class="text-slate-400">Dot Balls Faced:</span>
            <span class="font-mono font-bold text-white">${batting.dotBallsFaced ?? 0}</span>
          </div>
          <div class="flex justify-between text-xs pt-1">
            <span class="text-slate-400">Dot Ball Percentage:</span>
            <span class="font-mono font-bold text-sky-400">${batting.dotPct || '0.0%'}</span>
          </div>
        </div>

        <div class="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-2">
          <p class="text-xs font-bold text-white flex items-center gap-1.5">
            <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-400"></i>
            <span>Dismissals & Ducks</span>
          </p>
          <div class="flex justify-between text-xs py-1 border-b border-slate-800/80">
            <span class="text-slate-400">Total Ducks (0s):</span>
            <span class="font-mono font-bold text-red-400">${batting.ducks ?? 0}</span>
          </div>
          <div class="flex justify-between text-xs py-1 border-b border-slate-800/80">
            <span class="text-slate-400">Golden Ducks (1st Ball):</span>
            <span class="font-mono font-bold text-amber-400">${batting.goldenDucks ?? 0}</span>
          </div>
          <div class="flex justify-between text-xs pt-1">
            <span class="text-slate-400">Silver Ducks (2nd Ball):</span>
            <span class="font-mono font-bold text-slate-300">${batting.silverDucks ?? 0}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Bowling -->
    <div class="dossier-panel space-y-4 hidden" data-panel="bowling">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div class="glass-panel p-3 rounded-xl border border-slate-800">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Wickets Taken</p>
          <p class="text-xl font-black text-sky-400 font-mono mt-1">${bowling.wickets ?? 0}</p>
        </div>
        <div class="glass-panel p-3 rounded-xl border border-slate-800">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Best Bowling (BBI)</p>
          <p class="text-xl font-black text-emerald-400 font-mono mt-1">${bowling.best || '0/0'}</p>
        </div>
        <div class="glass-panel p-3 rounded-xl border border-slate-800">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Bowling Average</p>
          <p class="text-xl font-black text-white font-mono mt-1">${bowling.avg || '0.00'}</p>
        </div>
        <div class="glass-panel p-3 rounded-xl border border-slate-800">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Economy Rate</p>
          <p class="text-xl font-black text-amber-300 font-mono mt-1">${bowling.econ || '0.00'}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-2">
          <p class="text-xs font-bold text-white flex items-center gap-1.5">
            <i data-lucide="timer" class="w-3.5 h-3.5 text-sky-400"></i>
            <span>Over Workload</span>
          </p>
          <div class="flex justify-between text-xs py-1 border-b border-slate-800/80">
            <span class="text-slate-400">Overs Bowled:</span>
            <span class="font-mono font-bold text-white">${bowling.oversBowled || '0.0'}</span>
          </div>
          <div class="flex justify-between text-xs pt-1">
            <span class="text-slate-400">Runs Conceded:</span>
            <span class="font-mono font-bold text-red-400">${bowling.runsConceded ?? 0}</span>
          </div>
        </div>

        <div class="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-2">
          <p class="text-xs font-bold text-white flex items-center gap-1.5">
            <i data-lucide="shield" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>Dot Ball Pressure</span>
          </p>
          <div class="flex justify-between text-xs py-1 border-b border-slate-800/80">
            <span class="text-slate-400">Dot Balls Bowled:</span>
            <span class="font-mono font-bold text-emerald-400">${bowling.dotBallsBowled ?? 0}</span>
          </div>
          <div class="flex justify-between text-xs pt-1">
            <span class="text-slate-400">Dot Ball Percentage:</span>
            <span class="font-mono font-bold text-white">${bowling.dotPct || '0.0%'}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Fielding -->
    <div class="dossier-panel space-y-4 hidden" data-panel="fielding">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div class="glass-panel p-3 rounded-xl border border-slate-800">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Catches Taken</p>
          <p class="text-xl font-black text-sky-400 font-mono mt-1">${fielding.catches ?? 0}</p>
        </div>
        <div class="glass-panel p-3 rounded-xl border border-slate-800">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Direct Hits</p>
          <p class="text-xl font-black text-emerald-400 font-mono mt-1">${fielding.directHits ?? 0}</p>
        </div>
        <div class="glass-panel p-3 rounded-xl border border-slate-800">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Run-Outs</p>
          <p class="text-xl font-black text-amber-300 font-mono mt-1">${fielding.runOuts ?? 0}</p>
        </div>
        <div class="glass-panel p-3 rounded-xl border border-slate-800">
          <p class="text-[10px] text-slate-400 font-semibold uppercase">Stumpings</p>
          <p class="text-xl font-black text-purple-400 font-mono mt-1">${fielding.stumpings ?? 0}</p>
        </div>
      </div>

      <div class="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-2">
        <p class="text-xs font-bold text-white flex items-center gap-1.5">
          <i data-lucide="check-check" class="w-3.5 h-3.5 text-emerald-400"></i>
          <span>Catching Efficiency & Safety</span>
        </p>
        <div class="flex justify-between text-xs py-1 border-b border-slate-800/80">
          <span class="text-slate-400">Catch Efficiency Rate:</span>
          <span class="font-mono font-bold text-emerald-400">${fielding.catchEfficiency || '100.0%'}</span>
        </div>
        <div class="flex justify-between text-xs py-1 border-b border-slate-800/80">
          <span class="text-slate-400">Total Chances:</span>
          <span class="font-mono font-bold text-white">${fielding.totalChances ?? (fielding.catches || 0)}</span>
        </div>
        <div class="flex justify-between text-xs pt-1">
          <span class="text-slate-400">Dropped Catches:</span>
          <span class="font-mono font-bold text-red-400">${fielding.droppedCatches ?? 0}</span>
        </div>
      </div>
    </div>

    <!-- Tab 4: Teams & Matches -->
    <div class="dossier-panel space-y-4 hidden" data-panel="teams">
      <div>
        <p class="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
          <i data-lucide="shield" class="w-3.5 h-3.5 text-sky-400"></i>
          <span>Team Franchise Rosters (${teams.length})</span>
        </p>
        ${teams.length === 0 ? `
          <div class="glass-panel p-4 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
            <p>This player is not drafted in any team roster yet. Currently available as a <strong>Free Agent</strong>.</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${teams.map(t => `
              <div class="glass-panel p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${t.flag || '🏏'}</span>
                  <div>
                    <h4 class="font-bold text-white text-xs">${t.name}</h4>
                    <p class="text-[10px] text-slate-400">${t.squadCount ? t.squadCount + ' Squad members' : 'Official Team'}</p>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-semibold">Active Roster</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Match History -->
      <div>
        <p class="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
          <i data-lucide="activity" class="w-3.5 h-3.5 text-emerald-400"></i>
          <span>Recent Match Appearances (${playerMatches.length})</span>
        </p>
        ${playerMatches.length === 0 ? `
          <div class="glass-panel p-4 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
            No match appearances recorded for this player in current database.
          </div>
        ` : `
          <div class="space-y-2">
            ${playerMatches.slice(0, 5).map(m => `
              <div class="glass-panel p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span class="font-bold text-white">${m.title}</span>
                  <p class="text-[10px] text-slate-400">${m.tournament} • ${m.summary}</p>
                </div>
                <div class="text-right font-mono text-[11px] text-sky-300">
                  ${m.score1 ? `<div>${m.score1}</div>` : ''}
                  ${m.score2 ? `<div class="text-emerald-300">${m.score2}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;

  if (window.lucide) {
    lucide.createIcons();
  }
}

// Explicit Global Window Bindings for Inline Click & Event Handlers
window.switchTab = switchTab;
window.filterMatches = filterMatches;
window.openMatchInEditor = openMatchInEditor;
window.deleteMatchPrompt = deleteMatchPrompt;
window.openEditBallModal = openEditBallModal;
window.updateBatterField = updateBatterField;
window.updateBowlerField = updateBowlerField;
window.promptAddBatter = promptAddBatter;
window.promptAddBowler = promptAddBowler;
window.removeBatterRow = removeBatterRow;
window.removeBowlerRow = removeBowlerRow;
window.removeFowRow = removeFowRow;
window.setEditorSubTab = setEditorSubTab;
window.openModal = openModal;
window.closeAllModals = closeAllModals;
window.syncFromCloud = syncFromCloud;
window.pushMatchToCloud = pushMatchToCloud;
window.openPlayerDossier = openPlayerDossier;
window.switchDossierTab = switchDossierTab;
window.copyDossierText = copyDossierText;

