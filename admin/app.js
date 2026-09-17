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
  setupEventListeners();

  // Initial Data Fetch
  await syncFromCloud();

  // Start Real-Time Polling Loop (continuous real-time sync with mobile scorers)
  startRealtimePolling();
});

// ============================================================================
// CLOUD API & REALTIME SYNC
// ============================================================================

async function syncFromCloud(showNotification = false) {
  const startTime = performance.now();
  try {
    const [matchesRes, teamsRes, usersRes] = await Promise.all([
      fetch(`${CONFIG.FIREBASE_URL}/matches_db.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/teams.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/users.json?t=${Date.now()}`),
    ]);

    const latency = Math.round(performance.now() - startTime);
    state.lastLatencyMs = latency;
    state.isOnline = true;
    updateCloudStatusPill(true, latency);

    if (matchesRes.ok) {
      const data = await matchesRes.json();
      state.matchesDb = data && typeof data === 'object' ? data : {};
    }

    // Also check active /matches node for any active live matches
    try {
      const liveRes = await fetch(`${CONFIG.FIREBASE_URL}/matches.json?t=${Date.now()}`);
      if (liveRes.ok) {
        const liveData = await liveRes.json();
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
    } catch (e) {}

    if (teamsRes.ok) {
      const tData = await teamsRes.json();
      state.teams = Array.isArray(tData) ? tData.filter(Boolean) : (tData && typeof tData === 'object' ? Object.values(tData) : []);
    }

    if (usersRes.ok) {
      const uData = await usersRes.json();
      state.users = Array.isArray(uData) ? uData.filter(Boolean) : (uData && typeof uData === 'object' ? Object.values(uData) : []);
    }

    // Default active match if none selected
    const matchKeys = Object.keys(state.matchesDb);
    if (!state.activeMatchId && matchKeys.length > 0) {
      state.activeMatchId = matchKeys[0];
    }

    renderAllViews();
    if (showNotification) {
      showToast('Synced fresh data from Cloud RTDB', 'success');
    }
  } catch (err) {
    state.isOnline = false;
    updateCloudStatusPill(false);
    console.error('[CloudSync Error]', err);
    if (showNotification) {
      showToast('Cloud connection error: ' + err.message, 'error');
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
  const text = document.getElementById('cloud-status-text');
  const badge = document.getElementById('cloud-latency-badge');

  if (isOnline) {
    pill.classList.remove('border-red-800/80', 'bg-red-950/20');
    pill.classList.add('border-slate-800', 'bg-slate-900');
    pill.querySelector('span').className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 live-pulse';
    text.textContent = 'Cloud RTDB Connected';
    badge.textContent = latency ? `${latency} ms` : 'Online';
    badge.className = 'text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 font-mono';
  } else {
    pill.classList.add('border-red-800/80', 'bg-red-950/20');
    pill.querySelector('span').className = 'w-2.5 h-2.5 rounded-full bg-red-500';
    text.textContent = 'Disconnected / Offline';
    badge.textContent = 'Retry';
    badge.className = 'text-[10px] px-1.5 py-0.2 rounded bg-red-900 text-red-300 font-mono';
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
      switchTab(target);
    });
  });
}

function switchTab(tabId) {
  state.currentTab = tabId;
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.toggle('hidden', view.id !== `view-${tabId}`);
  });
  renderAllViews();
}

function setupEventListeners() {
  // Sync button
  document.getElementById('btn-sync-now').addEventListener('click', () => {
    syncFromCloud(true);
  });

  // Create Match Button
  document.getElementById('btn-create-match').addEventListener('click', () => {
    openModal('modal-create-match');
  });

  // Modal close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals();
    });
  });

  // Match filter buttons in Matches view
  document.querySelectorAll('.match-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.match-filter-btn').forEach(b => {
        b.className = 'match-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700';
      });
      btn.className = 'match-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-900/60 text-sky-300 border border-sky-700/60';
      state.matchFilter = btn.dataset.filter;
      renderMatchesView();
    });
  });

  // Search input in Matches view
  document.getElementById('matches-search').addEventListener('input', e => {
    renderMatchesView(e.target.value.toLowerCase());
  });

  // Search input in Users view
  document.getElementById('users-search').addEventListener('input', e => {
    renderUsersView(e.target.value.toLowerCase());
  });

  // Active match dropdown in Editor view
  document.getElementById('editor-match-select').addEventListener('change', e => {
    state.activeMatchId = e.target.value;
    renderEditorView();
  });

  // Push to Cloud Now button in Editor
  document.getElementById('btn-save-match-cloud').addEventListener('click', () => {
    pushMatchToCloud(state.activeMatchId);
  });

  // Auto Recalculate button in Editor
  document.getElementById('btn-recalculate-match').addEventListener('click', () => {
    recalculateActiveMatchStats();
  });

  // Swap Batters button
  document.getElementById('btn-swap-batters').addEventListener('click', () => {
    swapCreaseBatters();
  });

  // Live state input changes in Editor
  document.getElementById('editor-striker-input').addEventListener('change', e => {
    updateActiveMatchField('currentStriker', e.target.value);
  });
  document.getElementById('editor-nonstriker-input').addEventListener('change', e => {
    updateActiveMatchField('currentNonStriker', e.target.value);
  });
  document.getElementById('editor-bowler-input').addEventListener('change', e => {
    updateActiveMatchField('currentBowler', e.target.value);
  });
  document.getElementById('editor-thisover-input').addEventListener('change', e => {
    const raw = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    updateActiveMatchField('liveThisOver', raw);
  });
  document.getElementById('editor-innings-select').addEventListener('change', e => {
    updateActiveMatchField('currentInnings', Number(e.target.value));
  });
  document.getElementById('editor-status-select').addEventListener('change', e => {
    updateActiveMatchField('status', e.target.value);
  });
  document.getElementById('editor-target-input').addEventListener('change', e => {
    updateActiveMatchField('targetRuns', Number(e.target.value));
  });

  // Subtabs in Editor
  document.getElementById('subtab-btn-balls').addEventListener('click', () => setEditorSubTab('balls'));
  document.getElementById('subtab-btn-scorecard').addEventListener('click', () => setEditorSubTab('scorecard'));
  document.getElementById('subtab-btn-extras').addEventListener('click', () => setEditorSubTab('extras'));

  // Edit Ball Form submission
  document.getElementById('form-edit-ball').addEventListener('submit', handleSaveBallForm);

  // Runs choices in Edit Ball Modal
  document.querySelectorAll('#ball-runs-selector .btn-run-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#ball-runs-selector .btn-run-choice').forEach(b => {
        b.classList.remove('ring-2', 'ring-sky-400');
      });
      btn.classList.add('ring-2', 'ring-sky-400');
      const rVal = btn.dataset.runs;
      const customInput = document.getElementById('edit-ball-runs-custom');
      if (rVal === 'custom') {
        customInput.classList.remove('hidden');
        customInput.focus();
      } else {
        customInput.classList.add('hidden');
        customInput.value = rVal;
      }
    });
  });

  // Wicket checkbox in Edit Ball Modal
  document.getElementById('edit-ball-is-wkt').addEventListener('change', e => {
    document.getElementById('wkt-fields-group').classList.toggle('hidden', !e.target.checked);
  });

  // Delete ball button
  document.getElementById('btn-delete-ball').addEventListener('click', handleDeleteBall);

  // Insert missed ball prompt
  document.getElementById('btn-insert-ball-prompt').addEventListener('click', handleInsertMissedBall);

  // Create Match form
  document.getElementById('form-create-match').addEventListener('submit', handleCreateMatchForm);

  // Add Batter / Bowler buttons
  document.getElementById('btn-add-batter-row').addEventListener('click', promptAddBatter);
  document.getElementById('btn-add-bowler-row').addEventListener('click', promptAddBowler);

  // Settings: Latency test
  document.getElementById('btn-test-db-connection').addEventListener('click', async () => {
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

  // Settings: Export Full DB
  document.getElementById('btn-export-full-db').addEventListener('click', () => {
    const jsonStr = JSON.stringify(state.matchesDb, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cricketadda_matches_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Database exported successfully', 'success');
  });

  // Settings: Emergency wipe
  document.getElementById('btn-emergency-wipe-matches').addEventListener('click', async () => {
    const confirmPrompt = prompt('Type "WIPE" to confirm deleting all matches from cloud:');
    if (confirmPrompt === 'WIPE') {
      try {
        await fetch(`${CONFIG.FIREBASE_URL}/matches_db.json`, { method: 'DELETE' });
        await fetch(`${CONFIG.FIREBASE_URL}/matches.json`, { method: 'DELETE' });
        state.matchesDb = {};
        state.activeMatchId = null;
        renderAllViews();
        showToast('Matches wiped from cloud. User profiles were preserved.', 'warning');
      } catch (e) {
        showToast('Wipe failed: ' + e.message, 'error');
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
// VIEW RENDERERS
// ============================================================================

function renderAllViews() {
  renderDashboardView();
  renderMatchesView();
  renderEditorView();
  renderTeamsView();
  renderUsersView();
  renderSettingsView();

  // Tab count
  const countSpan = document.getElementById('matches-tab-count');
  if (countSpan) countSpan.textContent = Object.keys(state.matchesDb).length;

  if (window.lucide) window.lucide.createIcons();
}

// 1. DASHBOARD VIEW
function renderDashboardView() {
  const matches = Object.values(state.matchesDb || {});
  const liveMatches = matches.filter(m => m.status === 'in_progress' || m.status === 'live');

  document.getElementById('stat-live-matches').textContent = liveMatches.length;
  document.getElementById('stat-total-matches').textContent = matches.length;
  document.getElementById('stat-registered-players').textContent = state.users.length;
  document.getElementById('stat-registered-teams').textContent = state.teams.length;

  // Live spotlight cards
  const spotlightContainer = document.getElementById('live-spotlight-cards');
  if (liveMatches.length === 0) {
    spotlightContainer.innerHTML = `
      <div class="col-span-2 glass-panel p-6 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
        ⚡ No live matches actively scoring right now. When a scorer scores on mobile, it will appear here in real-time.
      </div>
    `;
  } else {
    spotlightContainer.innerHTML = liveMatches.map(m => {
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

  // Recent Matches list in dashboard
  const recentContainer = document.getElementById('dashboard-recent-matches');
  if (matches.length === 0) {
    recentContainer.innerHTML = '<p class="text-xs text-slate-400 py-4 text-center">No matches recorded yet.</p>';
  } else {
    const sorted = [...matches].sort((a, b) => (b.lastUpdatedAt || 0) - (a.lastUpdatedAt || 0)).slice(0, 5);
    recentContainer.innerHTML = sorted.map(m => {
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
}

// 2. MATCHES DIRECTORY VIEW
function renderMatchesView(query = '') {
  const container = document.getElementById('matches-container');
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
  if (query) {
    list = list.filter(m => {
      return (
        m.teamA?.toLowerCase().includes(query) ||
        m.teamB?.toLowerCase().includes(query) ||
        m.tournament?.toLowerCase().includes(query) ||
        m.venue?.toLowerCase().includes(query) ||
        m.id?.toLowerCase().includes(query)
      );
    });
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="col-span-3 glass-panel p-8 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
        No matches match the selected filter. Click "New Match" above to start a match.
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(m => {
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
    document.getElementById('editor-scoreboard-card').innerHTML = `
      <div class="p-8 text-center text-slate-400 text-sm">
        Select or create a match to open the editor.
      </div>
    `;
    return;
  }

  // Populate Inputs
  document.getElementById('editor-striker-input').value = match.currentStriker || '';
  document.getElementById('editor-nonstriker-input').value = match.currentNonStriker || '';
  document.getElementById('editor-bowler-input').value = match.currentBowler || '';
  document.getElementById('editor-thisover-input').value = Array.isArray(match.liveThisOver) ? match.liveThisOver.join(', ') : '';
  document.getElementById('editor-innings-select').value = String(match.currentInnings || 1);
  document.getElementById('editor-status-select').value = match.status || 'in_progress';
  document.getElementById('editor-target-input').value = match.targetRuns || '';

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

  card.innerHTML = `
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
}

function renderBallTimeline(match) {
  const container = document.getElementById('editor-timeline-container');
  const countBadge = document.getElementById('balls-total-count');

  const history = match.liveState?.scoringHistory || [];
  countBadge.textContent = history.length;

  if (history.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400 text-xs">
        No delivery history recorded in this match yet. As scorer records balls, they appear here. You can also click "Insert Missed Ball".
      </div>
    `;
    return;
  }

  // Reverse chronological (newest first)
  const reversed = [...history].map((ball, idx) => ({ ...ball, originalIndex: idx })).reverse();

  container.innerHTML = reversed.map(ball => {
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

function renderEditorScorecardTables(match) {
  const innNum = match.currentInnings || 1;
  const inn = innNum === 2 ? match.innings2 : match.innings1;

  // Batting Table
  const battingTbody = document.getElementById('editor-batting-table-body');
  const batters = inn?.batting || [];
  if (batters.length === 0) {
    battingTbody.innerHTML = '<tr><td colspan="8" class="text-center text-slate-400 py-3">No batters in scorecard yet.</td></tr>';
  } else {
    battingTbody.innerHTML = batters.map((b, idx) => {
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

  // Bowling Table
  const bowlingTbody = document.getElementById('editor-bowling-table-body');
  const bowlers = inn?.bowling || [];
  if (bowlers.length === 0) {
    bowlingTbody.innerHTML = '<tr><td colspan="9" class="text-center text-slate-400 py-3">No bowlers in scorecard yet.</td></tr>';
  } else {
    bowlingTbody.innerHTML = bowlers.map((bw, idx) => {
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
}

function renderEditorExtras(match) {
  const innNum = match.currentInnings || 1;
  const inn = innNum === 2 ? match.innings2 : match.innings1;
  const extras = inn?.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 };

  document.getElementById('override-extras-wides').value = extras.wides ?? 0;
  document.getElementById('override-extras-noballs').value = extras.noBalls ?? 0;
  document.getElementById('override-extras-byes').value = extras.byes ?? 0;
  document.getElementById('override-extras-legbyes').value = extras.legByes ?? 0;
  document.getElementById('override-extras-penalty').value = extras.penalty ?? 0;

  // FOW list
  const fowList = document.getElementById('editor-fow-list');
  const fow = inn?.fallOfWickets || [];
  if (fow.length === 0) {
    fowList.innerHTML = '<p class="text-xs text-slate-400 py-2">No fall of wickets recorded.</p>';
  } else {
    fowList.innerHTML = fow.map((item, idx) => `
      <div class="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs">
        <span>Wkt ${item.wkt || idx + 1}: <strong class="text-white">${item.score ?? 0} runs</strong> (${item.player || 'Batter'}, ov ${item.over || '0.0'})</span>
        <button onclick="removeFowRow(${idx})" class="text-slate-400 hover:text-red-400"><i data-lucide="trash" class="w-3 h-3"></i></button>
      </div>
    `).join('');
  }
}

// 4. TEAMS & SQUADS VIEW
function renderTeamsView() {
  const container = document.getElementById('teams-grid');
  if (state.teams.length === 0) {
    container.innerHTML = `
      <div class="col-span-3 glass-panel p-8 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
        No teams registered in the cloud database.
      </div>
    `;
    return;
  }

  container.innerHTML = state.teams.map(t => {
    const squad = Array.isArray(t.squad) ? t.squad : [];
    return `
      <div class="glass-panel p-4 rounded-xl border border-slate-800 space-y-3 card-hover">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shadow-inner">
            ${t.flag || t.logo || '🏏'}
          </div>
          <div>
            <h4 class="font-extrabold text-sm text-white">${t.name}</h4>
            <p class="text-xs text-slate-400">${squad.length} Players in Squad</p>
          </div>
        </div>

        <div class="border-t border-slate-800/80 pt-2 space-y-1">
          <p class="text-[11px] text-slate-400 font-semibold uppercase">Roster Sample:</p>
          <div class="flex flex-wrap gap-1">
            ${squad.slice(0, 6).map(p => `<span class="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">${typeof p === 'string' ? p : p.name}</span>`).join('')}
            ${squad.length > 6 ? `<span class="text-[10px] text-slate-400">+${squad.length - 6} more</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 5. USERS DIRECTORY VIEW
function renderUsersView(query = '') {
  const tbody = document.getElementById('users-table-body');
  let list = [...state.users];

  if (query) {
    list = list.filter(u => {
      const p = u.profile || u;
      return (
        p.name?.toLowerCase().includes(query) ||
        p.phone?.includes(query) ||
        u.email?.toLowerCase().includes(query)
      );
    });
  }

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-slate-400 py-6">No players registered.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(u => {
    const p = u.profile || u;
    const stats = u.careerStats?.matchOverview || {};
    return `
      <tr>
        <td class="font-bold text-white flex items-center gap-2">
          <span>${p.jersey || ''}</span>
          <span>${p.name || 'Unnamed Player'}</span>
        </td>
        <td class="font-mono text-slate-300">${p.phone || '-'}</td>
        <td class="text-slate-400">${u.email || '-'}</td>
        <td><span class="px-2 py-0.5 rounded bg-slate-800 text-sky-400 text-[11px]">${p.role || 'Player'}</span></td>
        <td class="text-slate-400 text-[11px]">${p.battingStyle || '-'} • ${p.bowlingStyle || '-'}</td>
        <td class="text-right font-mono font-bold text-emerald-400">${stats.matchesPlayed ?? 0}</td>
      </tr>
    `;
  }).join('');
}

// 6. SETTINGS VIEW
function renderSettingsView() {
  const jsonEditor = document.getElementById('raw-json-editor');
  if (state.activeMatchId && state.matchesDb[state.activeMatchId]) {
    jsonEditor.value = JSON.stringify(state.matchesDb[state.activeMatchId], null, 2);
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

// Create New Match Handler
async function handleCreateMatchForm(e) {
  e.preventDefault();

  const id = 'match_' + Date.now();
  const teamA = document.getElementById('new-match-team-a').value;
  const flagA = document.getElementById('new-match-flag-a').value || '🏏';
  const teamB = document.getElementById('new-match-team-b').value;
  const flagB = document.getElementById('new-match-flag-b').value || '🏏';
  const tournament = document.getElementById('new-match-tournament').value;
  const venue = document.getElementById('new-match-venue').value;
  const maxOvers = Number(document.getElementById('new-match-overs').value) || 20;
  const tossWinner = document.getElementById('new-match-toss-winner').value;
  const tossDecision = document.getElementById('new-match-toss-decision').value;

  const tossText = `${tossWinner === 'teamA' ? teamA : teamB} won toss & elected to ${tossDecision}`;

  const newMatch = {
    ...EMPTY_MATCH,
    id,
    teamA,
    flagA,
    teamB,
    flagB,
    tournament,
    venue,
    toss: tossText,
    innings1: {
      team: tossWinner === 'teamA' && tossDecision === 'bat' ? teamA : teamB,
      flag: tossWinner === 'teamA' && tossDecision === 'bat' ? flagA : flagB,
      runs: 0,
      wickets: 0,
      overs: '0.0',
      maxOvers,
      crr: '0.00',
      batting: [],
      bowling: [],
      fallOfWickets: [],
      extras: { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
    },
    innings2: {
      team: tossWinner === 'teamA' && tossDecision === 'bat' ? teamB : teamA,
      flag: tossWinner === 'teamA' && tossDecision === 'bat' ? flagB : flagA,
      runs: 0,
      wickets: 0,
      overs: '0.0',
      maxOvers,
      crr: '0.00',
      batting: [],
      bowling: [],
      fallOfWickets: [],
      extras: { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
    },
    currentStriker: 'Batter 1',
    currentNonStriker: 'Batter 2',
    currentBowler: 'Bowler 1',
    status: 'in_progress',
    createdAt: Date.now(),
  };

  state.matchesDb[id] = newMatch;
  state.activeMatchId = id;

  closeAllModals();
  await pushMatchToCloud(id, newMatch);
  switchTab('editor');
  showToast(`Created & launched ${teamA} vs ${teamB}!`, 'success');
}

function openMatchInEditor(matchId) {
  state.activeMatchId = matchId;
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
