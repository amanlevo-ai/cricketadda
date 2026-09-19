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
  activePlayerId: null,
  scorerRequests: {},
  activeScorerRequestId: null,
  lastSeenRequestCount: 0,
  teams: [],
  users: [],
  currentTab: 'dashboard',
  editorSubTab: 'balls',
  playerProfileTab: 'batting',
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

function parseOversToBalls(o) {
  if (!o) return 0;
  const p = String(o).trim().split('.');
  return (parseInt(p[0], 10) || 0) * 6 + (parseInt(p[1], 10) || 0);
}

function getMatchScoringHistory(match) {
  if (!match) return [];
  if (Array.isArray(match.scoringHistory) && match.scoringHistory.length > 0) return match.scoringHistory;
  if (Array.isArray(match.liveState?.scoringHistory) && match.liveState.scoringHistory.length > 0) return match.liveState.scoringHistory;
  return [];
}

function generateCommentaryFromHistory(history, match) {
  const commList = [];
  let cumRuns = 0;
  let cumWkts = 0;
  let legalCount = 0;

  (history || []).forEach((ball, idx) => {
    const isLegal = ball.isLegalDelivery !== false && ball.extraType !== 'wide' && ball.extraType !== 'noBall';
    if (isLegal) legalCount++;

    const runs = Number(ball.addedRuns) || 0;
    cumRuns += runs;
    if (ball.isWkt) cumWkts++;

    const overNum = Math.floor(Math.max(0, legalCount - (isLegal ? 1 : 0)) / 6);
    const ballInOver = isLegal ? ((legalCount - 1) % 6) + 1 : (legalCount % 6);
    const ovStr = `${overNum}.${ballInOver}`;

    const striker = (ball.striker || 'Batter').trim();
    const bowler = (ball.bowler || 'Bowler').trim();
    const isWkt = Boolean(ball.isWkt);
    const extraType = ball.extraType || 'none';

    let ballSym = ball.ballSymbol;
    if (!ballSym) {
      if (isWkt) ballSym = 'W';
      else if (extraType === 'wide') ballSym = runs > 1 ? `${runs}Wd` : 'Wd';
      else if (extraType === 'noBall') ballSym = runs > 0 ? `Nb+${runs}` : 'Nb';
      else if (extraType === 'bye') ballSym = `${runs}B`;
      else if (extraType === 'legBye') ballSym = `${runs}Lb`;
      else ballSym = String(runs);
    }

    let badgeType = 'dot';
    if (isWkt) badgeType = 'wkt';
    else if (runs === 4 && extraType === 'none') badgeType = 'four';
    else if (runs === 6 && extraType === 'none') badgeType = 'six';
    else if (extraType === 'wide') badgeType = 'wide';
    else if (extraType === 'noBall') badgeType = 'noball';
    else if (runs > 0) badgeType = 'run';

    let text = ball.dismissalDesc;
    if (!text || text.trim() === '') {
      if (isWkt) {
        text = `OUT! ${ball.dismissedPlayerName || striker} is dismissed by ${bowler} (${ball.dismissalType || 'bowled'})!`;
      } else if (extraType === 'wide') {
        text = `Wide delivery from ${bowler}. Extra run conceded.`;
      } else if (extraType === 'noBall') {
        text = `No ball called! ${bowler} oversteps. Free hit awarded!`;
      } else if (runs === 4) {
        text = `FOUR! Cracked away by ${striker} off ${bowler}, racing past the boundary rope!`;
      } else if (runs === 6) {
        text = `SIX! High and handsome! ${striker} dispatches ${bowler} deep into the stands!`;
      } else if (runs === 0) {
        text = `Tapped gently towards the fielder by ${striker} off ${bowler}. No run.`;
      } else {
        text = `${runs} run${runs === 1 ? '' : 's'} taken by ${striker} and running between wickets off ${bowler}.`;
      }
    }

    commList.unshift({
      id: ball.id ? `comm_${ball.id}` : `comm_ball_${idx}_${Date.now()}`,
      overs: ovStr,
      batter: striker,
      bowler: bowler,
      ballSymbol: ballSym,
      badgeType,
      runs,
      text,
      timestamp: 'Just now',
    });

    if (isLegal && legalCount % 6 === 0) {
      const crr = ((cumRuns / legalCount) * 6).toFixed(2);
      commList.unshift({
        id: `comm_over_end_${legalCount / 6}`,
        isOverEnd: true,
        overNum: legalCount / 6,
        overSummary: `End of Over ${legalCount / 6} • Match Score: ${cumRuns}/${cumWkts} (CRR: ${crr})`,
      });
    }
  });

  const innNum = match.currentInnings || 1;
  const battingTeam = innNum === 2 ? (match.innings2?.team || match.teamB) : (match.innings1?.team || match.teamA);
  commList.push({
    id: `comm_inn_start_${match.id || 'curr'}`,
    isMatchStart: true,
    isOverEnd: true,
    overNum: 0,
    headerTitle: `${innNum === 2 ? '2ND' : '1ST'} INNINGS COMMENCES`,
    overSummary: `🏏 ${battingTeam || 'Batting Team'} innings underway.`,
  });

  return commList;
}

async function syncFromCloud(showNotification = false) {
  const startTime = performance.now();
  try {
    const [matchesDbRes, matchesLiveRes, teamsRes, teamsIndexRes, usersRes, regPlayersRes, usersByEmailRes, scorerRequestsRes, deletedMatchesRes, deletedTeamsRes] = await Promise.allSettled([
      fetch(`${CONFIG.FIREBASE_URL}/matches_db.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/matches.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/teams.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/teams_index.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/users.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/registered_players.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/users_by_email.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/score_change_requests.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/deleted_matches.json?t=${Date.now()}`),
      fetch(`${CONFIG.FIREBASE_URL}/deleted_teams.json?t=${Date.now()}`),
    ]);

    const latency = Math.round(performance.now() - startTime);
    state.lastLatencyMs = latency;
    state.isOnline = true;
    updateCloudStatusPill(true, latency);

    // Process Tombstones
    const deletedMatchesSet = new Set();
    if (deletedMatchesRes.status === 'fulfilled' && deletedMatchesRes.value.ok) {
      const delMData = await deletedMatchesRes.value.json();
      if (delMData && typeof delMData === 'object') {
        Object.keys(delMData).forEach(k => deletedMatchesSet.add(String(k).trim()));
      }
    }

    const deletedTeamsSet = new Set();
    if (deletedTeamsRes.status === 'fulfilled' && deletedTeamsRes.value.ok) {
      const delTData = await deletedTeamsRes.value.json();
      if (delTData && typeof delTData === 'object') {
        Object.entries(delTData).forEach(([k, v]) => {
          if (k) deletedTeamsSet.add(String(k).trim().toLowerCase());
          if (v && typeof v === 'object' && v.teamName) {
            deletedTeamsSet.add(String(v.teamName).trim().toLowerCase());
          }
        });
      }
    }

    // 1. Process Matches DB
    if (matchesDbRes.status === 'fulfilled' && matchesDbRes.value.ok) {
      const data = await matchesDbRes.value.json();
      const rawDb = data && typeof data === 'object' ? data : {};
      const cleanDb = {};
      Object.entries(rawDb).forEach(([mId, m]) => {
        if (m && !deletedMatchesSet.has(mId)) {
          cleanDb[mId] = m;
        }
      });
      state.matchesDb = cleanDb;
    }

    // 2. Process Live In-Flight Matches (/matches)
    if (matchesLiveRes.status === 'fulfilled' && matchesLiveRes.value.ok) {
      const liveData = await matchesLiveRes.value.json();
      if (liveData && typeof liveData === 'object') {
        Object.entries(liveData).forEach(([mId, lMatch]) => {
          if (lMatch && typeof lMatch === 'object' && !deletedMatchesSet.has(mId)) {
            if (!state.matchesDb[mId]) {
              state.matchesDb[mId] = lMatch.match || lMatch;
            } else {
              // Merge in-flight live state without overwriting recent admin edits
              const existing = state.matchesDb[mId];
              const isRecentlyAdminEdited = existing.adminEditedAt && (Date.now() - existing.adminEditedAt < 6000);
              const finalHist = lMatch.scoringHistory || lMatch.liveState?.scoringHistory || existing.scoringHistory || existing.liveState?.scoringHistory || [];
              
              state.matchesDb[mId] = {
                ...existing,
                ...(lMatch.match || {}),
                liveRuns: isRecentlyAdminEdited ? existing.liveRuns : (lMatch.liveRuns ?? existing.liveRuns),
                liveWickets: isRecentlyAdminEdited ? existing.liveWickets : (lMatch.liveWickets ?? existing.liveWickets),
                liveBalls: isRecentlyAdminEdited ? existing.liveBalls : (lMatch.liveBalls ?? existing.liveBalls),
                liveOvers: isRecentlyAdminEdited ? existing.liveOvers : (lMatch.liveOvers ?? existing.liveOvers),
                liveThisOver: isRecentlyAdminEdited ? existing.liveThisOver : (lMatch.liveThisOver ?? existing.liveThisOver),
                activeScorer: lMatch.activeScorer ?? existing.activeScorer,
                currentInnings: lMatch.currentInnings ?? existing.currentInnings,
                firstInningsSummary: isRecentlyAdminEdited ? existing.firstInningsSummary : (lMatch.firstInningsSummary ?? existing.firstInningsSummary),
                innings1: isRecentlyAdminEdited ? existing.innings1 : (lMatch.innings1 || existing.innings1),
                innings2: isRecentlyAdminEdited ? existing.innings2 : (lMatch.innings2 || existing.innings2),
                liveBatters: isRecentlyAdminEdited ? existing.liveBatters : (lMatch.liveBatters || existing.liveBatters),
                liveBowlerStats: isRecentlyAdminEdited ? existing.liveBowlerStats : (lMatch.liveBowlerStats || existing.liveBowlerStats),
                scoringHistory: finalHist,
                liveCommentaryList: isRecentlyAdminEdited ? (existing.liveCommentaryList || existing.liveState?.liveCommentaryList) : (lMatch.liveCommentaryList || existing.liveCommentaryList || existing.liveState?.liveCommentaryList || []),
                liveState: {
                  ...(existing.liveState || {}),
                  ...(lMatch.liveState || {}),
                  scoringHistory: finalHist,
                  liveCommentaryList: isRecentlyAdminEdited ? (existing.liveCommentaryList || existing.liveState?.liveCommentaryList) : (lMatch.liveCommentaryList || existing.liveCommentaryList || existing.liveState?.liveCommentaryList || []),
                  liveBatters: isRecentlyAdminEdited ? existing.liveBatters : (lMatch.liveBatters || existing.liveBatters),
                  liveBowlerStats: isRecentlyAdminEdited ? existing.liveBowlerStats : (lMatch.liveBowlerStats || existing.liveBowlerStats),
                  liveRuns: isRecentlyAdminEdited ? existing.liveRuns : (lMatch.liveRuns ?? existing.liveRuns),
                  liveBalls: isRecentlyAdminEdited ? existing.liveBalls : (lMatch.liveBalls ?? existing.liveBalls),
                  liveWickets: isRecentlyAdminEdited ? existing.liveWickets : (lMatch.liveWickets ?? existing.liveWickets),
                }
              };
            }
          }
        });
      }
    }

    // 3. Process Teams & Squads (Merge /teams.json AND /teams_index.json)
    const isTeamDeleted = (t) => {
      if (!t) return true;
      const tId = String(t.id || '').trim().toLowerCase();
      const tName = String(t.name || '').trim().toLowerCase();
      return (tId && deletedTeamsSet.has(tId)) || (tName && deletedTeamsSet.has(tName));
    };

    const teamMap = new Map();
    function addTeam(t) {
      if (!t || typeof t !== 'object' || isTeamDeleted(t)) return;
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

    // 4. Process Scorer Change & Mistake Requests (/score_change_requests)
    if (scorerRequestsRes.status === 'fulfilled' && scorerRequestsRes.value.ok) {
      const sData = await scorerRequestsRes.value.json();
      state.scorerRequests = sData && typeof sData === 'object' ? sData : {};
      renderScorerAlerts();
    }

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

  const resolvedBalls = currentMatch.liveBalls !== undefined ? Number(currentMatch.liveBalls) : (currentMatch.liveState?.liveBalls || 0);
  const resolvedOvers = currentMatch.liveOvers || `${Math.floor(resolvedBalls / 6)}.${resolvedBalls % 6}`;

  const updatedMatch = {
    ...currentMatch,
    liveOvers: resolvedOvers,
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
    const liveHistory = getMatchScoringHistory(updatedMatch);
    const liveBatters = updatedMatch.liveBatters || buildBattersMap(updatedMatch);
    const liveBowlers = updatedMatch.liveBowlerStats || buildBowlersMap(updatedMatch);
    const liveComm = updatedMatch.liveCommentaryList || updatedMatch.liveState?.liveCommentaryList || [];
    const liveBalls = updatedMatch.liveBalls !== undefined ? Number(updatedMatch.liveBalls) : (updatedMatch.liveState?.liveBalls || 0);
    const liveRuns = updatedMatch.liveRuns !== undefined ? Number(updatedMatch.liveRuns) : (updatedMatch.liveState?.liveRuns || 0);
    const liveWkts = updatedMatch.liveWickets !== undefined ? Number(updatedMatch.liveWickets) : (updatedMatch.liveState?.liveWickets || 0);
    const liveOvers = updatedMatch.liveOvers || `${Math.floor(liveBalls / 6)}.${liveBalls % 6}`;

    const livePayload = {
      senderClientId: `admin_portal_${Date.now()}`,
      activeMatchId: mId,
      battingTeamName: getActiveBattingTeam(updatedMatch),
      bowlingTeamName: getActiveBowlingTeam(updatedMatch),
      liveRuns,
      liveWickets: liveWkts,
      liveBalls,
      liveOvers,
      liveThisOver: updatedMatch.liveThisOver || updatedMatch.liveState?.liveThisOver || [],
      currentInnings: updatedMatch.currentInnings || 1,
      currentStriker: updatedMatch.currentStriker || updatedMatch.liveState?.currentStriker || '',
      currentNonStriker: updatedMatch.currentNonStriker || updatedMatch.liveState?.currentNonStriker || '',
      currentBowler: updatedMatch.currentBowler || updatedMatch.liveState?.currentBowler || '',
      scoringHistory: liveHistory,
      liveBatters,
      liveBowlerStats: liveBowlers,
      liveCommentaryList: liveComm,
      firstInningsSummary: updatedMatch.firstInningsSummary || updatedMatch.liveState?.firstInningsSummary || null,
      innings1: updatedMatch.innings1 || null,
      innings2: updatedMatch.innings2 || null,
      match: updatedMatch,
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
  let playerId = null;

  if (hash) {
    const parts = hash.split('?');
    tabId = parts[0];
    if (parts[1]) {
      const params = new URLSearchParams(parts[1]);
      matchId = params.get('match');
      playerId = params.get('id') || params.get('player');
    }
  } else {
    try {
      const storedTab = localStorage.getItem('cricketadda_admin_active_tab');
      if (storedTab) tabId = storedTab;
      const storedMatch = localStorage.getItem('cricketadda_admin_active_match');
      if (storedMatch) matchId = storedMatch;
      const storedPlayer = localStorage.getItem('cricketadda_admin_active_player');
      if (storedPlayer) playerId = storedPlayer;
    } catch (e) {}
  }

  const validTabs = ['dashboard', 'matches', 'editor', 'teams', 'users', 'player', 'settings'];
  if (!validTabs.includes(tabId)) tabId = 'dashboard';

  if (matchId) {
    state.activeMatchId = matchId;
  }
  if (playerId) {
    state.activePlayerId = playerId;
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
  const validTabs = ['dashboard', 'matches', 'editor', 'teams', 'users', 'player', 'settings'];
  if (!validTabs.includes(tabId)) tabId = 'dashboard';

  state.currentTab = tabId;
  try {
    localStorage.setItem('cricketadda_admin_active_tab', tabId);
  } catch (e) {}

  if (updateHistory) {
    let newHash = '#' + tabId;
    if (tabId === 'editor' && state.activeMatchId) {
      newHash += `?match=${encodeURIComponent(state.activeMatchId)}`;
    } else if (tabId === 'player' && state.activePlayerId) {
      newHash += `?id=${encodeURIComponent(state.activePlayerId)}`;
    }
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', newHash);
    }
  }

  document.querySelectorAll('.nav-tab').forEach(t => {
    // Highlight users tab when viewing player profile to preserve intuitive hierarchy
    const isActive = t.dataset.tab === tabId || (tabId === 'player' && t.dataset.tab === 'users');
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

  if (state.currentTab === 'player' && state.activePlayerId) {
    renderPlayerFullPageView(state.activePlayerId);
  }

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
            onclick="openPlayerProfile('${encodeURIComponent(userKey)}')" 
            title="Click to view ${u.name || 'player'}'s complete full-page career dossier & statistics">
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

  const history = getMatchScoringHistory(match);
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

  // Batting & Bowling Squad Resolution for Dropdowns
  const innNum = ball.innings || match.currentInnings || 1;
  const battingTeamName = innNum === 2 ? (match.innings2?.team || match.teamB) : (match.innings1?.team || match.teamA);
  const bowlingTeamName = innNum === 2 ? (match.innings1?.team || match.teamA) : (match.innings2?.team || match.teamB);

  // Batting squad players
  const battingSquadSet = new Set();
  const targetInn = innNum === 2 ? match.innings2 : match.innings1;
  (targetInn?.batting || []).forEach(b => { if (b?.name) battingSquadSet.add(b.name.trim()); });
  (match.innings1?.batting || []).forEach(b => { if (b?.name) battingSquadSet.add(b.name.trim()); });
  (match.innings2?.batting || []).forEach(b => { if (b?.name) battingSquadSet.add(b.name.trim()); });
  (match.battingSquad || []).forEach(p => { const n = typeof p === 'string' ? p : p?.name; if (n) battingSquadSet.add(n.trim()); });
  const regBatTeam = (state.teams || []).find(t => t.name?.toLowerCase().trim() === (battingTeamName || '').toLowerCase().trim());
  (regBatTeam?.squad || []).forEach(p => { const n = typeof p === 'string' ? p : p?.name; if (n) battingSquadSet.add(n.trim()); });
  const battingPlayers = Array.from(battingSquadSet);

  // Bowling & Fielding squad players
  const fieldingSquadSet = new Set();
  (match.fieldingSquad || []).forEach(p => { const n = typeof p === 'string' ? p : p?.name; if (n) fieldingSquadSet.add(n.trim()); });
  (targetInn?.bowling || []).forEach(b => { if (b?.name) fieldingSquadSet.add(b.name.trim()); });
  (match.innings1?.bowling || []).forEach(b => { if (b?.name) fieldingSquadSet.add(b.name.trim()); });
  (match.innings2?.bowling || []).forEach(b => { if (b?.name) fieldingSquadSet.add(b.name.trim()); });
  const regBowlTeam = (state.teams || []).find(t => t.name?.toLowerCase().trim() === (bowlingTeamName || '').toLowerCase().trim());
  (regBowlTeam?.squad || []).forEach(p => { const n = typeof p === 'string' ? p : p?.name; if (n) fieldingSquadSet.add(n.trim()); });
  const fieldingPlayers = Array.from(fieldingSquadSet);

  // Helper to populate a <select> dropdown
  const populateSelectDropdown = (id, items, defaultLabel, selectedValue) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<option value="">${escapeHtml(defaultLabel)}</option>`;
    const normSelected = String(selectedValue || '').trim().toLowerCase();
    let found = false;

    (items || []).forEach(item => {
      if (!item) return;
      const clean = String(item).trim();
      const isSel = clean.toLowerCase() === normSelected;
      if (isSel) found = true;
      const opt = document.createElement('option');
      opt.value = clean;
      opt.textContent = clean;
      if (isSel) opt.selected = true;
      el.appendChild(opt);
    });

    // If a custom/previous value exists that wasn't in the list, keep it as an option
    if (selectedValue && !found) {
      const opt = document.createElement('option');
      opt.value = selectedValue;
      opt.textContent = selectedValue;
      opt.selected = true;
      el.appendChild(opt);
    }
  };

  // Wickets
  const isWkt = Boolean(ball.isWkt);
  const wktCheckbox = document.getElementById('edit-ball-is-wkt');
  wktCheckbox.checked = isWkt;
  document.getElementById('wkt-fields-group').classList.toggle('hidden', !isWkt);
  document.getElementById('edit-ball-wkt-type').value = ball.dismissalType || 'bowled';

  // Resolved values
  const strikerVal = ball.striker || match.currentStriker || '';
  const bowlerVal = ball.bowler || match.currentBowler || '';
  const dismissedBatterVal = ball.dismissedPlayerName || ball.dismissedPlayer || (isWkt ? strikerVal : '');
  const fielderVal = ball.finalFielder || '';

  // Incoming Batter Resolution:
  // 1. If ball already has incomingBatter saved
  // 2. Or if scorer selected incoming batter on the next ball in history
  // 3. Or check subsequent deliveries in this innings
  let resolvedIncoming = ball.incomingBatter || ball.incomingBatterName || '';
  if (!resolvedIncoming && ballIndex < history.length - 1) {
    const nextBall = history[ballIndex + 1];
    if (nextBall && (!nextBall.innings || nextBall.innings === innNum)) {
      const activeCrease = [ball.striker, ball.nonStriker].filter(Boolean);
      if (nextBall.striker && !activeCrease.includes(nextBall.striker)) {
        resolvedIncoming = nextBall.striker;
      } else if (nextBall.nonStriker && !activeCrease.includes(nextBall.nonStriker)) {
        resolvedIncoming = nextBall.nonStriker;
      }
    }
  }
  // 4. If still empty and it's a wicket, find first unbatted player from squad
  if (!resolvedIncoming && isWkt) {
    const battedNames = new Set();
    history.forEach(h => {
      if (!h.innings || h.innings === innNum) {
        if (h.striker) battedNames.add(h.striker.trim().toLowerCase());
        if (h.nonStriker) battedNames.add(h.nonStriker.trim().toLowerCase());
      }
    });
    const unbatted = battingPlayers.find(p => !battedNames.has(p.toLowerCase()));
    if (unbatted) resolvedIncoming = unbatted;
  }

  // Populate all 5 select dropdowns
  populateSelectDropdown('edit-ball-striker', battingPlayers, '-- Select Striker --', strikerVal);
  populateSelectDropdown('edit-ball-bowler', fieldingPlayers, '-- Select Bowler --', bowlerVal);
  populateSelectDropdown('edit-ball-dismissed-player', battingPlayers, '-- Select Dismissed Batter --', dismissedBatterVal);
  populateSelectDropdown('edit-ball-fielder', fieldingPlayers, '-- None / Select Fielder --', fielderVal);
  populateSelectDropdown('edit-ball-incoming-player', battingPlayers, '-- Select Incoming Batter --', resolvedIncoming);

  document.getElementById('edit-ball-commentary').value = ball.dismissalDesc || '';

  // Auto-fill Dismissed Batter when Striker changes or Wicket is checked
  const strikerSelect = document.getElementById('edit-ball-striker');
  const dismissedSelect = document.getElementById('edit-ball-dismissed-player');

  // Resolve partner / non-striker at crease for this ball
  let partnerVal = ball.nonStriker || '';
  if (!partnerVal) {
    if (match.currentNonStriker && match.currentNonStriker.toLowerCase() !== strikerVal.toLowerCase()) {
      partnerVal = match.currentNonStriker;
    } else {
      for (let i = ballIndex - 1; i >= 0; i--) {
        const h = history[i];
        if (h && (!h.innings || h.innings === innNum)) {
          if (h.striker && h.striker.toLowerCase() !== strikerVal.toLowerCase()) {
            partnerVal = h.striker;
            break;
          }
          if (h.nonStriker && h.nonStriker.toLowerCase() !== strikerVal.toLowerCase()) {
            partnerVal = h.nonStriker;
            break;
          }
        }
      }
    }
  }

  // Update Next Strike dropdown labels & options
  const nextStrikeSelect = document.getElementById('edit-ball-next-striker');
  const updateNextStrikeLabels = () => {
    if (!nextStrikeSelect) return;
    const incomingName = (document.getElementById('edit-ball-incoming-player').value || resolvedIncoming || 'Incoming Batter').trim();
    const dismissed = (dismissedSelect.value || dismissedBatterVal || '').trim();
    const survivingPartner = (dismissed && partnerVal && dismissed.toLowerCase() === partnerVal.toLowerCase()) ? (strikerSelect.value || strikerVal) : (partnerVal || strikerSelect.value || strikerVal || 'Partner');

    if (nextStrikeSelect.options.length >= 2) {
      nextStrikeSelect.options[0].textContent = `${incomingName} (Incoming Batter on strike)`;
      nextStrikeSelect.options[1].textContent = `${survivingPartner} (Non-Striker / Partner on strike)`;
    }
  };

  let selectedNextStrike = ball.nextOnStrike || 'incoming';
  if (!ball.nextOnStrike && ballIndex < history.length - 1) {
    const nextBall = history[ballIndex + 1];
    const dismissed = (dismissedBatterVal || '').trim();
    const survivingPartner = (dismissed && partnerVal && dismissed.toLowerCase() === partnerVal.toLowerCase()) ? strikerVal : (partnerVal || strikerVal);
    if (nextBall && survivingPartner && nextBall.striker && nextBall.striker.toLowerCase() === survivingPartner.toLowerCase()) {
      selectedNextStrike = 'non_striker';
    }
  }
  if (nextStrikeSelect) {
    nextStrikeSelect.value = selectedNextStrike;
    updateNextStrikeLabels();
  }

  document.getElementById('edit-ball-incoming-player').onchange = updateNextStrikeLabels;
  dismissedSelect.onchange = updateNextStrikeLabels;

  wktCheckbox.onchange = () => {
    const checked = wktCheckbox.checked;
    document.getElementById('wkt-fields-group').classList.toggle('hidden', !checked);
    if (checked) {
      if (!dismissedSelect.value) {
        dismissedSelect.value = strikerSelect.value || match.currentStriker || '';
      }
      // Auto-populate incoming batter if empty
      const incomingSelect = document.getElementById('edit-ball-incoming-player');
      if (!incomingSelect.value) {
        const battedNames = new Set();
        history.forEach(h => {
          if (!h.innings || h.innings === innNum) {
            if (h.striker) battedNames.add(h.striker.trim().toLowerCase());
            if (h.nonStriker) battedNames.add(h.nonStriker.trim().toLowerCase());
          }
        });
        const unbatted = battingPlayers.find(p => !battedNames.has(p.toLowerCase()));
        if (unbatted) incomingSelect.value = unbatted;
      }
      // Reset runs to 0 on wicket (unless run out)
      const runsInput = document.getElementById('edit-ball-runs-custom');
      const wktType = document.getElementById('edit-ball-wkt-type').value || 'bowled';
      if (wktType !== 'run_out') {
        runsInput.value = '0';
      }
      // Auto-set commentary
      const commInput = document.getElementById('edit-ball-commentary');
      const outName = dismissedSelect.value || strikerSelect.value || 'Batter';
      const bwlName = document.getElementById('edit-ball-bowler').value || 'Bowler';
      commInput.value = `OUT! ${outName} is dismissed (${wktType}) b ${bwlName}!`;
    }
    updateNextStrikeLabels();
  };

  document.getElementById('edit-ball-wkt-type').onchange = () => {
    const wktType = document.getElementById('edit-ball-wkt-type').value || 'bowled';
    const runsInput = document.getElementById('edit-ball-runs-custom');
    if (wktType !== 'run_out') {
      runsInput.value = '0';
    }
    const commInput = document.getElementById('edit-ball-commentary');
    const outName = dismissedSelect.value || strikerSelect.value || 'Batter';
    const bwlName = document.getElementById('edit-ball-bowler').value || 'Bowler';
    commInput.value = `OUT! ${outName} is dismissed (${wktType}) b ${bwlName}!`;
  };

  strikerSelect.onchange = () => {
    if (wktCheckbox.checked && !dismissedSelect.value) {
      dismissedSelect.value = strikerSelect.value;
    }
    updateNextStrikeLabels();
  };

  openModal('modal-edit-ball');
  if (window.lucide) window.lucide.createIcons();
}

function handleSaveBallForm(e) {
  e.preventDefault();
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  const idx = state.editingBallIndex;
  if (idx == null) return;

  const history = [...getMatchScoringHistory(match)];
  const oldBall = history[idx] || {};

  const isWkt = document.getElementById('edit-ball-is-wkt').checked;
  const dismissalType = isWkt ? document.getElementById('edit-ball-wkt-type').value : null;
  const isRunOut = isWkt && dismissalType === 'run_out';

  const rawRuns = Number(document.getElementById('edit-ball-runs-custom').value) || 0;
  const runs = (isWkt && !isRunOut) ? 0 : rawRuns;
  const extraType = document.getElementById('edit-ball-extra-type').value;
  const overthrowRuns = (isWkt && !isRunOut) ? 0 : (Number(document.getElementById('edit-ball-overthrow').value) || 0);

  let ballSymbol = String(runs);
  if (isWkt) ballSymbol = 'W';
  else if (extraType === 'wide') ballSymbol = runs > 1 ? `${runs}Wd` : 'Wd';
  else if (extraType === 'noBall') ballSymbol = runs > 0 ? `Nb+${runs}` : 'Nb';
  else if (extraType === 'bye') ballSymbol = `${runs}B`;
  else if (extraType === 'legBye') ballSymbol = `${runs}Lb`;

  const runsOffBat = (isWkt && !isRunOut) ? 0 : (extraType === 'none' || !extraType ? runs : 0);
  const nextOnStrike = isWkt ? (document.getElementById('edit-ball-next-striker')?.value || 'incoming') : null;

  let comm = document.getElementById('edit-ball-commentary').value;
  const striker = document.getElementById('edit-ball-striker').value;
  const bowler = document.getElementById('edit-ball-bowler').value;
  const dismissedPlayerName = isWkt ? document.getElementById('edit-ball-dismissed-player').value : null;

  if (isWkt && (!comm || comm.includes('FOUR') || comm.includes('SIX') || comm.includes('run'))) {
    comm = `OUT! ${dismissedPlayerName || striker} is dismissed (${dismissalType || 'bowled'}) b ${bowler}!`;
  }

  const updatedBall = {
    ...oldBall,
    addedRuns: runs + overthrowRuns,
    runsOffBat,
    isLegalDelivery: extraType !== 'wide' && extraType !== 'noBall',
    ballSymbol,
    extraType,
    overthrowRuns,
    isWkt,
    dismissalType,
    customDismissalType: dismissalType,
    dismissedPlayerName,
    finalFielder: isWkt ? document.getElementById('edit-ball-fielder').value : null,
    incomingBatter: isWkt ? document.getElementById('edit-ball-incoming-player').value : null,
    nextOnStrike,
    striker,
    bowler,
    dismissalDesc: comm,
    adminEdited: true,
  };

  history[idx] = updatedBall;

  if (isWkt) {
    const incoming = (updatedBall.incomingBatter || '').trim();
    const dismissed = (updatedBall.dismissedPlayerName || striker).trim();
    const normDismissed = dismissed.toLowerCase();
    const normStriker = striker.toLowerCase();

    // Resolve partner
    let partner = (oldBall.nonStriker || '').trim();
    if (!partner) {
      if (match.currentNonStriker && match.currentNonStriker.toLowerCase() !== normStriker) {
        partner = match.currentNonStriker;
      } else {
        for (let i = idx - 1; i >= 0; i--) {
          const h = history[i];
          if (h && (!h.innings || h.innings === match.currentInnings)) {
            if (h.striker && h.striker.toLowerCase() !== normStriker) {
              partner = h.striker;
              break;
            }
            if (h.nonStriker && h.nonStriker.toLowerCase() !== normStriker) {
              partner = h.nonStriker;
              break;
            }
          }
        }
      }
    }
    const surviving = (dismissed && partner && normDismissed === partner.toLowerCase()) ? striker : (partner || striker);

    const whoOnStrike = (nextOnStrike === 'non_striker') ? surviving : incoming;
    const whoAtNonStrike = (nextOnStrike === 'non_striker') ? incoming : surviving;

    // If latest ball in match, update live active crease
    if (idx === history.length - 1) {
      if (whoOnStrike) {
        match.currentStriker = whoOnStrike;
        if (!match.liveState) match.liveState = {};
        match.liveState.currentStriker = whoOnStrike;
      }
      if (whoAtNonStrike) {
        match.currentNonStriker = whoAtNonStrike;
        if (!match.liveState) match.liveState = {};
        match.liveState.currentNonStriker = whoAtNonStrike;
      }
    }

    // Cascade replacement across all subsequent deliveries in this innings!
    // A dismissed batter CANNOT face any more balls or be at the crease!
    for (let i = idx + 1; i < history.length; i++) {
      const nextBall = history[i];
      if (!nextBall || (nextBall.innings && nextBall.innings !== match.currentInnings)) continue;

      if (i === idx + 1) {
        if (whoOnStrike) nextBall.striker = whoOnStrike;
        if (whoAtNonStrike) nextBall.nonStriker = whoAtNonStrike;
      } else {
        if (dismissed && nextBall.striker && nextBall.striker.toLowerCase() === normDismissed) {
          nextBall.striker = incoming || surviving;
        }
        if (dismissed && nextBall.nonStriker && nextBall.nonStriker.toLowerCase() === normDismissed) {
          nextBall.nonStriker = incoming || surviving;
        }
      }
    }
  }

  match.scoringHistory = history;
  if (!match.liveState) match.liveState = {};
  match.liveState.scoringHistory = history;

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
  const history = [...getMatchScoringHistory(match)];
  history.splice(idx, 1);

  match.scoringHistory = history;
  if (!match.liveState) match.liveState = {};
  match.liveState.scoringHistory = history;

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

  const history = [...getMatchScoringHistory(match)];
  history.push(newBall);

  match.scoringHistory = history;
  if (!match.liveState) match.liveState = {};
  match.liveState.scoringHistory = history;

  recalculateActiveMatchStats();
  showToast('Missed ball inserted and stats updated!', 'success');
}

// Master Automated Scorecard Recalculation Engine
function recalculateActiveMatchStats() {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  const innNum = match.currentInnings || 1;
  const history = getMatchScoringHistory(match);
  match.scoringHistory = history;
  if (!match.liveState) match.liveState = {};
  match.liveState.scoringHistory = history;

  let totalRuns = 0;
  let totalWickets = 0;
  let legalBalls = 0;
  const thisOver = [];

  const battersMap = {};
  const bowlersMap = {};
  const extras = { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 };
  const fow = [];

  // Track bowler overs for maiden calculation: bowler -> overIndex -> runsConceded
  const bowlerOverRuns = {};
  let currentOverIndex = 0;
  let ballsInCurrentOver = 0;

  // Pass 1: History Sanitization & Out Batter Tracking
  // - Enforce 0 runs on non-runout wickets (bowled, caught, lbw, stumped, hit wicket)
  // - Clean up any subsequent balls where an already-dismissed batter was recorded
  const dismissedBatters = new Map();
  history.forEach((ball, bIdx) => {
    if (!ball || (ball.innings && ball.innings !== innNum)) return;
    const isWkt = Boolean(ball.isWkt);
    const dType = ball.dismissalType || ball.customDismissalType || (isWkt ? 'bowled' : null);
    const isRunOut = isWkt && dType === 'run_out';

    if (isWkt && !isRunOut) {
      ball.addedRuns = 0;
      ball.runsOffBat = 0;
      ball.overthrowRuns = 0;
      ball.ballSymbol = 'W';
    }

    if (isWkt) {
      const outName = (ball.dismissedPlayerName || ball.striker || '').trim();
      const incName = (ball.incomingBatter || '').trim();
      if (outName) {
        dismissedBatters.set(outName.toLowerCase(), {
          replacement: incName,
          dismissedOn: bIdx,
        });
      }
    }

    // Replace dismissed batter on any subsequent balls
    const curStriker = (ball.striker || '').trim();
    if (curStriker && dismissedBatters.has(curStriker.toLowerCase())) {
      const disInfo = dismissedBatters.get(curStriker.toLowerCase());
      if (bIdx > disInfo.dismissedOn && disInfo.replacement) {
        ball.striker = disInfo.replacement;
      }
    }
    const curNonStriker = (ball.nonStriker || '').trim();
    if (curNonStriker && dismissedBatters.has(curNonStriker.toLowerCase())) {
      const disInfo = dismissedBatters.get(curNonStriker.toLowerCase());
      if (bIdx > disInfo.dismissedOn && disInfo.replacement) {
        ball.nonStriker = disInfo.replacement;
      }
    }
  });

  history.forEach((ball, bIdx) => {
    const isWkt = Boolean(ball.isWkt);
    const dType = ball.dismissalType || ball.customDismissalType || (isWkt ? 'bowled' : null);
    const isRunOut = isWkt && dType === 'run_out';
    const runs = (isWkt && !isRunOut) ? 0 : (Number(ball.addedRuns) || 0);
    const overthrow = (isWkt && !isRunOut) ? 0 : (Number(ball.overthrowRuns) || 0);
    totalRuns += runs;

    const isLegal = ball.isLegalDelivery !== false && ball.extraType !== 'wide' && ball.extraType !== 'noBall';
    if (isLegal) {
      legalBalls++;
      ballsInCurrentOver++;
    }

    if (ball.ballSymbol) {
      thisOver.push(ball.ballSymbol);
    }

    // Extras
    if (ball.extraType === 'wide') extras.wides += (runs || 1);
    else if (ball.extraType === 'noBall') extras.noBalls += 1;
    else if (ball.extraType === 'bye') extras.byes += runs;
    else if (ball.extraType === 'legBye') extras.legByes += runs;
    else if (ball.extraType === 'penalty') extras.penalty += runs;

    // Batter stats
    const striker = (ball.striker || 'Batter').trim();
    if (!battersMap[striker]) {
      battersMap[striker] = {
        name: striker,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        dots: 0,
        singles: 0,
        doubles: 0,
        triples: 0,
        sr: '0.00',
        dismissal: 'not out',
        isNotOut: true
      };
    }
    if (ball.extraType !== 'wide') {
      battersMap[striker].balls += 1;
      const offBatRuns = (ball.extraType === 'none' || !ball.extraType) ? Math.max(0, runs - overthrow) : 0;
      battersMap[striker].runs += offBatRuns;
      if (offBatRuns === 0) battersMap[striker].dots += 1;
      else if (offBatRuns === 1) battersMap[striker].singles += 1;
      else if (offBatRuns === 2) battersMap[striker].doubles += 1;
      else if (offBatRuns === 3) battersMap[striker].triples += 1;
      else if (offBatRuns === 4) battersMap[striker].fours += 1;
      else if (offBatRuns === 6) battersMap[striker].sixes += 1;
    }

    // Bowler stats
    const bowler = (ball.bowler || 'Bowler').trim();
    if (!bowlersMap[bowler]) {
      bowlersMap[bowler] = {
        name: bowler,
        balls: 0,
        overs: '0.0',
        runs: 0,
        wickets: 0,
        maidens: 0,
        wides: 0,
        noBalls: 0,
        econ: '0.00',
        style: 'Right-arm Fast Medium'
      };
    }

    const runsConceded = (ball.extraType === 'bye' || ball.extraType === 'legBye') ? 0 : runs;
    bowlersMap[bowler].runs += runsConceded;

    if (isLegal) {
      bowlersMap[bowler].balls += 1;
      bowlersMap[bowler].overs = `${Math.floor(bowlersMap[bowler].balls / 6)}.${bowlersMap[bowler].balls % 6}`;
    }

    if (ball.extraType === 'wide') bowlersMap[bowler].wides += (runs || 1);
    if (ball.extraType === 'noBall') bowlersMap[bowler].noBalls += 1;

    // Track runs in this over for maiden calculation
    if (!bowlerOverRuns[bowler]) bowlerOverRuns[bowler] = {};
    if (!bowlerOverRuns[bowler][currentOverIndex]) bowlerOverRuns[bowler][currentOverIndex] = { balls: 0, runs: 0 };
    if (isLegal) bowlerOverRuns[bowler][currentOverIndex].balls += 1;
    bowlerOverRuns[bowler][currentOverIndex].runs += runsConceded;

    if (isLegal && ballsInCurrentOver === 6) {
      currentOverIndex++;
      ballsInCurrentOver = 0;
    }

    // Wickets
    if (ball.isWkt) {
      totalWickets++;
      const isBowlerWkt = ball.dismissalType !== 'run_out' && ball.dismissalType !== 'retired' && ball.dismissalType !== 'obstructing';
      if (isBowlerWkt) {
        bowlersMap[bowler].wickets += 1;
      }
      const outPlayer = (ball.dismissedPlayerName || striker).trim();
      if (battersMap[outPlayer]) {
        battersMap[outPlayer].dismissal = ball.dismissalDesc || `${ball.dismissalType || 'bowled'} b ${bowler}`;
        battersMap[outPlayer].isNotOut = false;
      }
      fow.push({
        wkt: totalWickets,
        score: totalRuns,
        player: outPlayer,
        over: `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`,
      });
    }
  });

  // Calculate maidens: complete overs of 6 balls with 0 runs
  Object.keys(bowlerOverRuns).forEach(bName => {
    let maidens = 0;
    Object.values(bowlerOverRuns[bName]).forEach(ovData => {
      if (ovData.balls >= 6 && ovData.runs === 0) maidens++;
    });
    if (bowlersMap[bName]) {
      bowlersMap[bName].maidens = maidens;
    }
  });

  // Calculate bowler economy and batter strike rates
  Object.values(bowlersMap).forEach(b => {
    b.econ = b.balls > 0 ? ((b.runs / b.balls) * 6).toFixed(2) : '0.00';
  });
  Object.values(battersMap).forEach(b => {
    b.sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(2) : '0.00';
  });

  extras.total = extras.wides + extras.noBalls + extras.byes + extras.legByes + extras.penalty;
  const oversFormatted = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;

  // Keep this over display cleanly sliced
  const ballsInLastOver = legalBalls % 6;
  match.liveThisOver = thisOver.slice(-(ballsInLastOver === 0 && legalBalls > 0 ? 6 : Math.max(ballsInLastOver, 1)));

  // Generate updated commentary from history
  const updatedCommentary = generateCommentaryFromHistory(history, match);
  match.liveCommentaryList = updatedCommentary;
  if (!match.liveState) match.liveState = {};
  match.liveState.liveCommentaryList = updatedCommentary;

  // Build liveBatters and liveBowlerStats maps
  const liveBatters = {};
  Object.values(battersMap).forEach(b => { liveBatters[b.name] = b; });
  const liveBowlerStats = {};
  Object.values(bowlersMap).forEach(b => { liveBowlerStats[b.name] = b; });

  // Update in-flight counters
  match.liveRuns = totalRuns;
  match.liveWickets = totalWickets;
  match.liveBalls = legalBalls;
  match.liveOvers = oversFormatted;
  match.liveBatters = liveBatters;
  match.liveBowlerStats = liveBowlerStats;

  match.liveState.liveRuns = totalRuns;
  match.liveState.liveWickets = totalWickets;
  match.liveState.liveBalls = legalBalls;
  match.liveState.liveOvers = oversFormatted;
  match.liveState.liveThisOver = match.liveThisOver;
  match.liveState.liveBatters = liveBatters;
  match.liveState.liveBowlerStats = liveBowlerStats;

  // Update innings object
  const targetInn = innNum === 2 ? 'innings2' : 'innings1';
  match[targetInn] = {
    ...(match[targetInn] || {}),
    runs: totalRuns,
    wickets: totalWickets,
    overs: oversFormatted,
    balls: legalBalls,
    crr: legalBalls > 0 ? ((totalRuns / legalBalls) * 6).toFixed(2) : '0.00',
    batting: Object.values(battersMap),
    bowling: Object.values(bowlersMap),
    extras,
    fallOfWickets: fow,
  };

  if (innNum === 1) {
    match.firstInningsSummary = {
      runs: totalRuns,
      wickets: totalWickets,
      overs: oversFormatted,
      balls: legalBalls,
      crr: legalBalls > 0 ? ((totalRuns / legalBalls) * 6).toFixed(2) : '0.00',
      batting: Object.values(battersMap),
      bowling: Object.values(bowlersMap),
    };
    match.liveState.firstInningsSummary = match.firstInningsSummary;
  }

  // Resolve active crease from latest delivery of this innings
  const latestDelivery = history[history.length - 1];
  if (latestDelivery) {
    let st = latestDelivery.striker || match.currentStriker;
    let nst = latestDelivery.nonStriker || match.currentNonStriker;

    // If a wicket fell on latest delivery:
    if (latestDelivery.isWkt) {
      const out = (latestDelivery.dismissedPlayerName || st || '').trim().toLowerCase();
      const inc = (latestDelivery.incomingBatter || '').trim();
      const surviving = (out === (nst || '').trim().toLowerCase()) ? st : nst;
      if (latestDelivery.nextOnStrike === 'non_striker') {
        st = surviving;
        nst = inc;
      } else {
        st = inc;
        nst = surviving;
      }
    }

    // Hard guarantee: replace any out batter with valid incoming/surviving player
    if (st && dismissedBatters.has(st.toLowerCase())) {
      const rep = dismissedBatters.get(st.toLowerCase()).replacement;
      if (rep) st = rep;
    }
    if (nst && dismissedBatters.has(nst.toLowerCase())) {
      const rep = dismissedBatters.get(nst.toLowerCase()).replacement;
      if (rep) nst = rep;
    }

    if (st) match.currentStriker = st;
    if (nst) match.currentNonStriker = nst;
    if (latestDelivery.bowler) match.currentBowler = latestDelivery.bowler;
  }

  // Ensure active crease batters are not marked OUT
  if (match.currentStriker && battersMap[match.currentStriker] && !battersMap[match.currentStriker].isNotOut) {
    if (dismissedBatters.has(match.currentStriker.toLowerCase())) {
      const rep = dismissedBatters.get(match.currentStriker.toLowerCase()).replacement;
      if (rep) match.currentStriker = rep;
    }
  }
  if (match.currentNonStriker && battersMap[match.currentNonStriker] && !battersMap[match.currentNonStriker].isNotOut) {
    if (dismissedBatters.has(match.currentNonStriker.toLowerCase())) {
      const rep = dismissedBatters.get(match.currentNonStriker.toLowerCase()).replacement;
      if (rep) match.currentNonStriker = rep;
    }
  }
  if (!match.liveState) match.liveState = {};
  match.liveState.currentStriker = match.currentStriker;
  match.liveState.currentNonStriker = match.currentNonStriker;

  // Push directly to cloud
  pushMatchToCloud(state.activeMatchId, match);
}

function swapCreaseBatters() {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  const temp = match.currentStriker;
  match.currentStriker = match.currentNonStriker;
  match.currentNonStriker = temp;

  if (!match.liveState) match.liveState = {};
  match.liveState.currentStriker = match.currentStriker;
  match.liveState.currentNonStriker = match.currentNonStriker;

  pushMatchToCloud(state.activeMatchId, match);
  showToast(`Swapped crease: ${match.currentStriker} is now Striker`, 'success');
}

function updateActiveMatchField(field, value) {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  match[field] = value;
  if (!match.liveState) match.liveState = {};
  match.liveState[field] = value;

  // When admin edits "This Over" (e.g. 4, 4, 4), synchronize the actual deliveries in scoringHistory
  if (field === 'liveThisOver' && Array.isArray(value)) {
    const history = [...getMatchScoringHistory(match)];
    const innNum = match.currentInnings || 1;
    const curInnIndices = [];
    history.forEach((h, idx) => {
      if (!h.innings || h.innings === innNum) curInnIndices.push(idx);
    });

    // The current over balls are the last N deliveries matching value.length
    const startIdx = curInnIndices.length - value.length;
    if (startIdx >= 0) {
      value.forEach((sym, i) => {
        const histIdx = curInnIndices[startIdx + i];
        if (histIdx !== undefined && history[histIdx]) {
          const s = String(sym).trim();
          const isWkt = s.toUpperCase() === 'W';
          const isWide = s.toLowerCase().includes('wd');
          const isNoBall = s.toLowerCase().includes('nb');
          const isBye = s.toLowerCase().includes('b') && !isWide && !isNoBall;
          const isLegBye = s.toLowerCase().includes('lb');
          const runsVal = parseInt(s.replace(/[^0-9]/g, ''), 10) || (isWide || isNoBall ? 1 : 0);

          history[histIdx] = {
            ...history[histIdx],
            ballSymbol: s,
            addedRuns: runsVal,
            runsOffBat: (isWide || isNoBall || isBye || isLegBye) ? 0 : runsVal,
            isLegalDelivery: !isWide && !isNoBall,
            extraType: isWide ? 'wide' : isNoBall ? 'noBall' : isBye ? 'bye' : isLegBye ? 'legBye' : 'none',
            isWkt,
            adminEdited: true,
          };
        }
      });

      match.scoringHistory = history;
      match.liveState.scoringHistory = history;
      recalculateActiveMatchStats();
      return;
    }
  }

  pushMatchToCloud(state.activeMatchId, match);
}

function updateBatterField(batterIdx, field, value) {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  const innKey = match.currentInnings === 2 ? 'innings2' : 'innings1';
  if (!match[innKey]?.batting?.[batterIdx]) return;

  match[innKey].batting[batterIdx][field] = value;
  const b = match[innKey].batting[batterIdx];
  const bBalls = Number(b.balls) || 0;
  const bRuns = Number(b.runs) || 0;
  b.sr = bBalls > 0 ? ((bRuns / bBalls) * 100).toFixed(2) : '-';

  // Reconcile total runs
  const totalBatterRuns = (match[innKey].batting || []).reduce((acc, item) => acc + (Number(item.runs) || 0), 0);
  const extraTotal = match[innKey].extras?.total || 0;
  match[innKey].runs = totalBatterRuns + extraTotal;

  if (match.currentInnings === (innKey === 'innings2' ? 2 : 1)) {
    match.liveRuns = match[innKey].runs;
    if (!match.liveState) match.liveState = {};
    match.liveState.liveRuns = match.liveRuns;
  }

  match.liveBatters = buildBattersMap(match);
  if (!match.liveState) match.liveState = {};
  match.liveState.liveBatters = match.liveBatters;

  if (innKey === 'innings1') {
    match.firstInningsSummary = { ...(match.firstInningsSummary || {}), ...match.innings1 };
    match.liveState.firstInningsSummary = match.firstInningsSummary;
  }

  pushMatchToCloud(state.activeMatchId, match);
}

function updateBowlerField(bowlerIdx, field, value) {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;

  const innKey = match.currentInnings === 2 ? 'innings2' : 'innings1';
  if (!match[innKey]?.bowling?.[bowlerIdx]) return;

  const bw = match[innKey].bowling[bowlerIdx];
  bw[field] = value;

  if (field === 'overs') {
    bw.balls = parseOversToBalls(value);
  } else if (field === 'balls') {
    bw.overs = `${Math.floor(Number(value) / 6)}.${Number(value) % 6}`;
  } else if (!bw.balls && bw.overs) {
    bw.balls = parseOversToBalls(bw.overs);
  }

  const bwBalls = Number(bw.balls) || 0;
  const bwRuns = Number(bw.runs) || 0;
  bw.econ = bwBalls > 0 ? ((bwRuns / bwBalls) * 6).toFixed(2) : '0.00';

  // Reconcile total bowler balls, runs, and wickets
  const totalBowlerBalls = (match[innKey].bowling || []).reduce((acc, item) => acc + (Number(item.balls) || parseOversToBalls(item.overs || '0.0')), 0);
  const totalBowlerRuns = (match[innKey].bowling || []).reduce((acc, item) => acc + (Number(item.runs) || 0), 0);
  const totalBowlerWickets = (match[innKey].bowling || []).reduce((acc, item) => acc + (Number(item.wickets) || 0), 0);

  const extraTotal = match[innKey].extras?.total || 0;
  match[innKey].runs = totalBowlerRuns + extraTotal;
  match[innKey].balls = totalBowlerBalls;
  match[innKey].overs = `${Math.floor(totalBowlerBalls / 6)}.${totalBowlerBalls % 6}`;
  match[innKey].wickets = totalBowlerWickets;
  match[innKey].crr = totalBowlerBalls > 0 ? ((match[innKey].runs / totalBowlerBalls) * 6).toFixed(2) : '0.00';

  if (match.currentInnings === (innKey === 'innings2' ? 2 : 1)) {
    match.liveRuns = match[innKey].runs;
    match.liveBalls = totalBowlerBalls;
    match.liveOvers = match[innKey].overs;
    match.liveWickets = totalBowlerWickets;
    if (!match.liveState) match.liveState = {};
    match.liveState.liveRuns = match.liveRuns;
    match.liveState.liveBalls = match.liveBalls;
    match.liveState.liveOvers = match.liveOvers;
    match.liveState.liveWickets = match.liveWickets;
  }

  match.liveBowlerStats = buildBowlersMap(match);
  if (!match.liveState) match.liveState = {};
  match.liveState.liveBowlerStats = match.liveBowlerStats;

  if (innKey === 'innings1') {
    match.firstInningsSummary = { ...(match.firstInningsSummary || {}), ...match.innings1 };
    match.liveState.firstInningsSummary = match.firstInningsSummary;
  }

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

  match.liveBatters = buildBattersMap(match);
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
    balls: 0,
    maidens: 0,
    runs: 0,
    wickets: 0,
    econ: '0.00',
    wides: 0,
    noBalls: 0,
    style: 'Right-arm Fast Medium',
  });

  match.liveBowlerStats = buildBowlersMap(match);
  pushMatchToCloud(state.activeMatchId, match);
  showToast(`Added ${name} to bowling card`, 'success');
}

function removeBatterRow(idx) {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;
  const innKey = match.currentInnings === 2 ? 'innings2' : 'innings1';
  match[innKey]?.batting?.splice(idx, 1);
  match.liveBatters = buildBattersMap(match);
  pushMatchToCloud(state.activeMatchId, match);
}

function removeBowlerRow(idx) {
  const match = state.matchesDb[state.activeMatchId];
  if (!match) return;
  const innKey = match.currentInnings === 2 ? 'innings2' : 'innings1';
  match[innKey]?.bowling?.splice(idx, 1);
  match.liveBowlerStats = buildBowlersMap(match);
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
  const id = String(matchId).trim();
  fetch(`${CONFIG.FIREBASE_URL}/matches_db/${id}.json`, { method: 'DELETE' });
  fetch(`${CONFIG.FIREBASE_URL}/matches/${id}.json`, { method: 'DELETE' });
  fetch(`${CONFIG.FIREBASE_URL}/deleted_matches/${id}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deletedAt: Date.now(), id, deletedBy: 'admin' }),
  });
  renderAllViews();
  showToast('Match deleted.', 'warning');
}

// ============================================================================
// HELPERS
// ============================================================================

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
    if (b && b.name) {
      const runs = Number(b.runs || 0);
      const balls = Number(b.balls || 0);
      const sr = balls > 0 ? ((runs / balls) * 100).toFixed(1) : (b.sr || '0.0');
      map[b.name] = {
        name: b.name,
        runs,
        balls,
        fours: Number(b.fours || 0),
        sixes: Number(b.sixes || 0),
        sr,
        isNotOut: b.isNotOut !== false,
        dismissal: b.dismissal || (b.isNotOut === false ? 'Out' : 'not out')
      };
    }
  });
  return map;
}

function buildBowlersMap(match) {
  const inn = match.currentInnings === 2 ? match.innings2 : match.innings1;
  const map = {};
  (inn?.bowling || []).forEach(b => {
    if (b && b.name) {
      const bBalls = b.balls !== undefined ? Number(b.balls) : parseOversToBalls(b.overs || '0.0');
      const overs = b.overs || `${Math.floor(bBalls / 6)}.${bBalls % 6}`;
      const runs = Number(b.runs !== undefined ? b.runs : (b.runsConceded || 0));
      const wickets = Number(b.wickets || 0);
      const maidens = Number(b.maidens || 0);
      const econ = bBalls > 0 ? ((runs / (bBalls / 6))).toFixed(2) : (b.econ || '0.00');
      map[b.name] = {
        name: b.name,
        overs,
        balls: bBalls,
        maidens,
        runs,
        runsConceded: runs,
        wickets,
        econ
      };
    }
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
// FULL-PAGE PLAYER CAREER DOSSIER & PROFILE VIEW ENGINE
// ============================================================================

function findUserByKey(userKeyRaw) {
  if (!userKeyRaw) return null;
  const userKey = decodeURIComponent(userKeyRaw);
  const cleanKey = String(userKey).replace(/[^0-9]/g, '');

  return state.users.find(u => {
    const uPhone = String(u.phone || (u.profile && u.profile.phone) || '').replace(/[^0-9]/g, '');
    const uEmail = String(u.email || (u.profile && u.profile.email) || '').toLowerCase();
    const uId = String(u.id || (u.profile && u.profile.id) || '');
    const uName = String(u.name || (u.profile && u.profile.name) || '');
    return (cleanKey && uPhone === cleanKey) ||
           (uEmail && uEmail === userKey.toLowerCase()) ||
           (uId && uId === userKey) ||
           (uName && uName.toLowerCase() === userKey.toLowerCase());
  }) || null;
}

function openPlayerProfile(userKeyRaw) {
  if (!userKeyRaw) return;
  const userKey = decodeURIComponent(userKeyRaw);
  state.activePlayerId = userKey;
  try {
    localStorage.setItem('cricketadda_admin_active_player', userKey);
  } catch (e) {}

  switchTab('player');
}

function switchPlayerProfileTab(tabId) {
  state.playerProfileTab = tabId;

  document.querySelectorAll('.player-profile-tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    if (isActive) {
      btn.className = 'player-profile-tab-btn px-4 py-2.5 border-b-2 border-sky-400 text-sky-400 font-bold transition flex items-center gap-2 whitespace-nowrap bg-sky-950/30';
    } else {
      btn.className = 'player-profile-tab-btn px-4 py-2.5 border-b-2 border-transparent text-slate-400 hover:text-white transition flex items-center gap-2 whitespace-nowrap';
    }
  });

  document.querySelectorAll('.player-profile-panel').forEach(panel => {
    panel.classList.toggle('hidden', panel.dataset.panel !== tabId);
  });

  if (window.lucide) {
    lucide.createIcons();
  }
}

function copyPlayerProfileText(text, label = 'Copied') {
  if (!text) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied to clipboard! 📋`, 'info');
    }).catch(() => {});
  }
}

function sharePlayerProfile() {
  if (!state.activePlayerId) return;
  const url = `${window.location.origin}${window.location.pathname}#player?id=${encodeURIComponent(state.activePlayerId)}`;
  copyPlayerProfileText(url, 'Player profile link');
}

function printPlayerDossier() {
  window.print();
}

function renderPlayerFullPageView(userKeyRaw) {
  const container = document.getElementById('player-full-page-container');
  const breadcrumbEl = document.getElementById('player-view-breadcrumb');
  if (!container) return;

  const user = findUserByKey(userKeyRaw);

  if (!user) {
    if (breadcrumbEl) breadcrumbEl.textContent = 'Player Profile Not Found';
    container.innerHTML = `
      <div class="glass-panel p-10 rounded-2xl border border-slate-800 text-center space-y-4">
        <div class="w-14 h-14 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <i data-lucide="user-x" class="w-7 h-7"></i>
        </div>
        <h3 class="text-base font-bold text-white">Player Profile Not Found</h3>
        <p class="text-xs text-slate-400 max-w-md mx-auto">
          The requested player key "${userKeyRaw || ''}" does not match any verified athlete in the current database.
        </p>
        <div>
          <button type="button" onclick="switchTab('users')" class="btn-primary text-xs px-4 py-2">
            Return to Players Directory
          </button>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const playerName = user.name || 'Unnamed Player';
  const jerseyNumber = user.jersey || '';
  if (breadcrumbEl) {
    breadcrumbEl.textContent = jerseyNumber ? `${playerName} (#${jerseyNumber})` : playerName;
  }

  const avatarSrc = resolveUserAvatar(user);
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=0284c7&color=fff&bold=true&size=160&rounded=true`;

  const teams = getPlayerTeams(user);
  const rawData = user.raw || {};
  const careerStats = rawData.careerStats?.careerStats || user.careerStats?.careerStats || rawData.careerStats || user.careerStats || {};
  const matchOverview = rawData.careerStats?.matchOverview || user.careerStats?.matchOverview || {};

  const batting = careerStats.batting || {};
  const bowling = careerStats.bowling || {};
  const fielding = careerStats.fielding || {};

  // Matches involving this player
  const cleanName = playerName.trim().toLowerCase();
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
        tournament: m.tournament || 'CricketAdda Championship',
        status: m.status || 'completed',
        summary: m.toss || 'Official Match',
        score1: inn1.team ? `${inn1.team}: ${inn1.runs || 0}/${inn1.wickets || 0} (${inn1.overs || 0} ov)` : '',
        score2: inn2.team ? `${inn2.team}: ${inn2.runs || 0}/${inn2.wickets || 0} (${inn2.overs || 0} ov)` : '',
      });
    }
  });

  const matchesCount = matchOverview.matchesPlayed ?? user.matchesPlayed ?? (playerMatches.length || 0);
  const winsCount = matchOverview.wins ?? 0;
  const lossesCount = matchOverview.losses ?? 0;
  const winRate = matchOverview.winRate || (matchesCount > 0 ? `${Math.round((winsCount / matchesCount) * 100)}%` : '0%');
  const potmCount = matchOverview.potmCount ?? 0;

  const battingRuns = batting.runs ?? 0;
  const battingAvg = batting.avg || '0.00';
  const battingSr = batting.sr || '0.00';
  const bowlingWkts = bowling.wickets ?? 0;
  const bowlingEcon = bowling.econ || '0.00';
  const bowlingAvg = bowling.avg || '0.00';
  const catchesCount = fielding.catches ?? 0;

  const roleText = user.role || 'Player';
  const battingStyle = user.battingStyle || (user.profile && user.profile.battingStyle) || 'Right-hand Bat';
  const bowlingStyle = user.bowlingStyle || (user.profile && user.profile.bowlingStyle) || 'Right-arm Fast';

  let teamsBadgeList = '';
  if (teams.length > 0) {
    teamsBadgeList = teams.map(t => `
      <span class="px-3 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm">
        <span>${t.flag || '🏏'}</span>
        <span>${t.name}</span>
      </span>
    `).join(' ');
  } else {
    teamsBadgeList = `
      <span class="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium inline-flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-slate-500"></span>
        <span>No Team Yet (Free Agent)</span>
      </span>
    `;
  }

  const activeTab = state.playerProfileTab || 'batting';

  container.innerHTML = `
    <!-- 1. FULL PAGE HERO SECTION -->
    <div class="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/95 to-sky-950/30 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-xl">
      <!-- Player Avatar -->
      <div class="relative shrink-0">
        <img src="${avatarSrc}" alt="${playerName}" 
             class="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-sky-400 shadow-2xl bg-slate-800" 
             onerror="this.onerror=null; this.src='${fallbackUrl}';">
        ${jerseyNumber ? `
          <span class="absolute -bottom-2.5 -right-2.5 px-3 py-1 rounded-lg bg-sky-500 text-white font-mono font-black text-sm shadow-lg border border-sky-300/40">
            #${jerseyNumber}
          </span>
        ` : ''}
      </div>

      <!-- Player Identity & Metadata -->
      <div class="flex-1 text-center md:text-left space-y-3 min-w-0">
        <div class="flex flex-wrap items-center justify-center md:justify-start gap-3">
          <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">${playerName}</h2>
          <span class="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
            <i data-lucide="shield-check" class="w-4 h-4"></i>
            <span>Verified Athlete</span>
          </span>
          <span class="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold flex items-center gap-1">
            <i data-lucide="cloud" class="w-3.5 h-3.5"></i>
            <span>Firebase Synced</span>
          </span>
        </div>

        <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs">
          <span class="px-3.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">${roleText}</span>
          ${battingStyle ? `<span class="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-medium">🏏 ${battingStyle}</span>` : ''}
          ${bowlingStyle && bowlingStyle !== 'None' ? `<span class="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-medium">⚡ ${bowlingStyle}</span>` : ''}
        </div>

        <div class="pt-0.5 flex flex-wrap items-center justify-center md:justify-start gap-2">
          <span class="text-xs text-slate-400 font-semibold">Affiliation:</span>
          ${teamsBadgeList}
        </div>

        <!-- Contact & Developer Info -->
        <div class="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-mono text-slate-300">
          ${user.phone ? `
            <button type="button" onclick="copyPlayerProfileText('${user.phone}', 'Phone number')" 
                    class="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-2 transition" title="Click to copy phone">
              <i data-lucide="phone" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span>+91 ${user.phone.replace(/^91/, '')}</span>
              <i data-lucide="copy" class="w-3 h-3 text-slate-400"></i>
            </button>
          ` : ''}
          ${user.email ? `
            <button type="button" onclick="copyPlayerProfileText('${user.email}', 'Email address')" 
                    class="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-2 transition" title="Click to copy email">
              <i data-lucide="mail" class="w-3.5 h-3.5 text-sky-400"></i>
              <span>${user.email}</span>
              <i data-lucide="copy" class="w-3 h-3 text-slate-400"></i>
            </button>
          ` : ''}
          ${user.id ? `
            <button type="button" onclick="copyPlayerProfileText('${user.id}', 'User UID')" 
                    class="px-2.5 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/60 text-slate-400 flex items-center gap-1.5 transition text-[11px]" title="Click to copy UID">
              <span>UID: ${user.id}</span>
            </button>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- 2. FULL-WIDTH CAREER KPI PERFORMANCE METRICS -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      <!-- KPI 1: Matches -->
      <div class="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>Matches</span>
          <i data-lucide="calendar" class="w-4 h-4 text-sky-400"></i>
        </div>
        <div class="mt-2">
          <p class="text-2xl sm:text-3xl font-black text-white font-mono">${matchesCount}</p>
          <p class="text-[11px] text-slate-400 mt-0.5">${winsCount}W • ${lossesCount}L</p>
        </div>
      </div>

      <!-- KPI 2: Win Rate -->
      <div class="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>Win Rate</span>
          <i data-lucide="trending-up" class="w-4 h-4 text-emerald-400"></i>
        </div>
        <div class="mt-2">
          <p class="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">${winRate}</p>
          <p class="text-[11px] text-slate-400 mt-0.5">Match success</p>
        </div>
      </div>

      <!-- KPI 3: Career Runs -->
      <div class="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>Runs Scored</span>
          <i data-lucide="zap" class="w-4 h-4 text-amber-400"></i>
        </div>
        <div class="mt-2">
          <p class="text-2xl sm:text-3xl font-black text-amber-300 font-mono">${battingRuns}</p>
          <p class="text-[11px] text-slate-400 mt-0.5">Avg: ${battingAvg}</p>
        </div>
      </div>

      <!-- KPI 4: Strike Rate -->
      <div class="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>Batting SR</span>
          <i data-lucide="gauge" class="w-4 h-4 text-sky-400"></i>
        </div>
        <div class="mt-2">
          <p class="text-2xl sm:text-3xl font-black text-sky-400 font-mono">${battingSr}</p>
          <p class="text-[11px] text-slate-400 mt-0.5">Strike index</p>
        </div>
      </div>

      <!-- KPI 5: Career Wickets -->
      <div class="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>Wickets</span>
          <i data-lucide="target" class="w-4 h-4 text-rose-400"></i>
        </div>
        <div class="mt-2">
          <p class="text-2xl sm:text-3xl font-black text-rose-400 font-mono">${bowlingWkts}</p>
          <p class="text-[11px] text-slate-400 mt-0.5">Econ: ${bowlingEcon}</p>
        </div>
      </div>

      <!-- KPI 6: Awards / Catches -->
      <div class="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
        <div class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>POTM / Catches</span>
          <i data-lucide="award" class="w-4 h-4 text-purple-400"></i>
        </div>
        <div class="mt-2">
          <p class="text-2xl sm:text-3xl font-black text-purple-400 font-mono">${potmCount}</p>
          <p class="text-[11px] text-slate-400 mt-0.5">${catchesCount} catches</p>
        </div>
      </div>
    </div>

    <!-- 3. FULL PAGE TABBED ANALYTICS NAVIGATION -->
    <div class="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
      <div class="flex border-b border-slate-800 bg-slate-900/80 overflow-x-auto no-scrollbar text-xs">
        <button type="button" onclick="switchPlayerProfileTab('batting')" data-tab="batting" 
                class="player-profile-tab-btn px-5 py-3 ${activeTab === 'batting' ? 'border-b-2 border-sky-400 text-sky-400 font-bold bg-sky-950/30' : 'border-b-2 border-transparent text-slate-400 hover:text-white'} transition flex items-center gap-2 whitespace-nowrap">
          <i data-lucide="zap" class="w-4 h-4"></i>
          <span>Batting Masterclass</span>
        </button>
        <button type="button" onclick="switchPlayerProfileTab('bowling')" data-tab="bowling" 
                class="player-profile-tab-btn px-5 py-3 ${activeTab === 'bowling' ? 'border-b-2 border-sky-400 text-sky-400 font-bold bg-sky-950/30' : 'border-b-2 border-transparent text-slate-400 hover:text-white'} transition flex items-center gap-2 whitespace-nowrap">
          <i data-lucide="crosshair" class="w-4 h-4"></i>
          <span>Bowling Arsenal</span>
        </button>
        <button type="button" onclick="switchPlayerProfileTab('fielding')" data-tab="fielding" 
                class="player-profile-tab-btn px-5 py-3 ${activeTab === 'fielding' ? 'border-b-2 border-sky-400 text-sky-400 font-bold bg-sky-950/30' : 'border-b-2 border-transparent text-slate-400 hover:text-white'} transition flex items-center gap-2 whitespace-nowrap">
          <i data-lucide="shield" class="w-4 h-4"></i>
          <span>Fielding & Keeping</span>
        </button>
        <button type="button" onclick="switchPlayerProfileTab('teams')" data-tab="teams" 
                class="player-profile-tab-btn px-5 py-3 ${activeTab === 'teams' ? 'border-b-2 border-sky-400 text-sky-400 font-bold bg-sky-950/30' : 'border-b-2 border-transparent text-slate-400 hover:text-white'} transition flex items-center gap-2 whitespace-nowrap">
          <i data-lucide="users" class="w-4 h-4"></i>
          <span>Franchise Teams (${teams.length})</span>
        </button>
        <button type="button" onclick="switchPlayerProfileTab('matches')" data-tab="matches" 
                class="player-profile-tab-btn px-5 py-3 ${activeTab === 'matches' ? 'border-b-2 border-sky-400 text-sky-400 font-bold bg-sky-950/30' : 'border-b-2 border-transparent text-slate-400 hover:text-white'} transition flex items-center gap-2 whitespace-nowrap">
          <i data-lucide="calendar-days" class="w-4 h-4"></i>
          <span>Match Appearances (${playerMatches.length})</span>
        </button>
        <button type="button" onclick="switchPlayerProfileTab('technical')" data-tab="technical" 
                class="player-profile-tab-btn px-5 py-3 ${activeTab === 'technical' ? 'border-b-2 border-sky-400 text-sky-400 font-bold bg-sky-950/30' : 'border-b-2 border-transparent text-slate-400 hover:text-white'} transition flex items-center gap-2 whitespace-nowrap">
          <i data-lucide="terminal" class="w-4 h-4"></i>
          <span>Developer & Raw Data</span>
        </button>
      </div>

      <div class="p-6">
        <!-- Tab 1: Batting Panel -->
        <div class="player-profile-panel space-y-6 ${activeTab === 'batting' ? '' : 'hidden'}" data-panel="batting">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="glass-panel p-4 rounded-xl border border-slate-800 text-center">
              <p class="text-[11px] text-slate-400 font-semibold uppercase">Total Runs</p>
              <p class="text-3xl font-black text-amber-300 font-mono mt-1">${battingRuns}</p>
            </div>
            <div class="glass-panel p-4 rounded-xl border border-slate-800 text-center">
              <p class="text-[11px] text-slate-400 font-semibold uppercase">Innings Batted</p>
              <p class="text-3xl font-black text-white font-mono mt-1">${batting.inningsBatted ?? batting.innings ?? 0}</p>
            </div>
            <div class="glass-panel p-4 rounded-xl border border-slate-800 text-center">
              <p class="text-[11px] text-slate-400 font-semibold uppercase">Batting Average</p>
              <p class="text-3xl font-black text-white font-mono mt-1">${battingAvg}</p>
            </div>
            <div class="glass-panel p-4 rounded-xl border border-slate-800 text-center">
              <p class="text-[11px] text-slate-400 font-semibold uppercase">Strike Rate</p>
              <p class="text-3xl font-black text-sky-400 font-mono mt-1">${battingSr}</p>
            </div>
          </div>

          <!-- Batting Breakdown Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
              <p class="text-[10px] text-slate-400 uppercase font-semibold">Highest Score</p>
              <p class="text-xl font-black text-emerald-400 font-mono mt-1">${batting.highScore ?? 0}${batting.isNotOutInHigh ? '*' : ''}</p>
            </div>
            <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
              <p class="text-[10px] text-slate-400 uppercase font-semibold">Balls Faced</p>
              <p class="text-xl font-black text-white font-mono mt-1">${batting.ballsFaced ?? batting.balls ?? 0}</p>
            </div>
            <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
              <p class="text-[10px] text-slate-400 uppercase font-semibold">Centuries (100s)</p>
              <p class="text-xl font-black text-purple-400 font-mono mt-1">${batting.hundreds ?? 0}</p>
            </div>
            <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
              <p class="text-[10px] text-slate-400 uppercase font-semibold">Fifties (50s)</p>
              <p class="text-xl font-black text-sky-300 font-mono mt-1">${batting.fifties ?? 0}</p>
            </div>
            <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
              <p class="text-[10px] text-slate-400 uppercase font-semibold">Fours (4s)</p>
              <p class="text-xl font-black text-emerald-300 font-mono mt-1">${batting.fours ?? 0}</p>
            </div>
            <div class="glass-panel p-3.5 rounded-xl border border-slate-800">
              <p class="text-[10px] text-slate-400 uppercase font-semibold">Sixes (6s)</p>
              <p class="text-xl font-black text-amber-400 font-mono mt-1">${batting.sixes ?? 0}</p>
            </div>
          </div>

          <!-- Advanced Cricketer Batting Insights -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="glass-panel p-4 rounded-xl border border-slate-800 space-y-2.5">
              <p class="text-xs font-bold text-white flex items-center gap-2">
                <i data-lucide="pie-chart" class="w-4 h-4 text-sky-400"></i>
                <span>Boundary & Dot Ball Analytics</span>
              </p>
              <div class="flex justify-between text-xs py-1.5 border-b border-slate-800">
                <span class="text-slate-400">Boundary Percentage (Runs in 4s & 6s):</span>
                <span class="font-mono font-bold text-amber-300">${batting.boundaryPct || '0.0%'}</span>
              </div>
              <div class="flex justify-between text-xs py-1.5 border-b border-slate-800">
                <span class="text-slate-400">Dot Ball Percentage:</span>
                <span class="font-mono font-bold text-white">${batting.dotPct || '0.0%'}</span>
              </div>
              <div class="flex justify-between text-xs pt-1">
                <span class="text-slate-400">Not Outs:</span>
                <span class="font-mono font-bold text-emerald-400">${batting.notOuts ?? 0}</span>
              </div>
            </div>

            <div class="glass-panel p-4 rounded-xl border border-slate-800 space-y-2.5">
              <p class="text-xs font-bold text-white flex items-center gap-2">
                <i data-lucide="alert-circle" class="w-4 h-4 text-rose-400"></i>
                <span>Dismissal Vulnerability</span>
              </p>
              <div class="flex justify-between text-xs py-1.5 border-b border-slate-800">
                <span class="text-slate-400">Total Ducks:</span>
                <span class="font-mono font-bold text-rose-400">${batting.ducks ?? 0}</span>
              </div>
              <div class="flex justify-between text-xs py-1.5 border-b border-slate-800">
                <span class="text-slate-400">Golden Ducks (1st Ball Out):</span>
                <span class="font-mono font-bold text-amber-400">${batting.goldenDucks ?? 0}</span>
              </div>
              <div class="flex justify-between text-xs pt-1">
                <span class="text-slate-400">Batting Frequency:</span>
                <span class="font-mono font-bold text-sky-300">${matchesCount > 0 ? (battingRuns / matchesCount).toFixed(1) + ' R/M' : '0.0'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Bowling Panel -->
        <div class="player-profile-panel space-y-6 ${activeTab === 'bowling' ? '' : 'hidden'}" data-panel="bowling">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="glass-panel p-4 rounded-xl border border-slate-800 text-center">
              <p class="text-[11px] text-slate-400 font-semibold uppercase">Wickets Taken</p>
              <p class="text-3xl font-black text-rose-400 font-mono mt-1">${bowlingWkts}</p>
            </div>
            <div class="glass-panel p-4 rounded-xl border border-slate-800 text-center">
              <p class="text-[11px] text-slate-400 font-semibold uppercase">Best Bowling (BBI)</p>
              <p class="text-3xl font-black text-emerald-400 font-mono mt-1">${bowling.bestBowling || bowling.bbi || '-'}</p>
            </div>
            <div class="glass-panel p-4 rounded-xl border border-slate-800 text-center">
              <p class="text-[11px] text-slate-400 font-semibold uppercase">Bowling Average</p>
              <p class="text-3xl font-black text-white font-mono mt-1">${bowlingAvg}</p>
            </div>
            <div class="glass-panel p-4 rounded-xl border border-slate-800 text-center">
              <p class="text-[11px] text-slate-400 font-semibold uppercase">Economy Rate</p>
              <p class="text-3xl font-black text-amber-300 font-mono mt-1">${bowlingEcon}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="glass-panel p-4 rounded-xl border border-slate-800 space-y-2.5">
              <p class="text-xs font-bold text-white flex items-center gap-2">
                <i data-lucide="timer" class="w-4 h-4 text-sky-400"></i>
                <span>Over Workload & Spell Control</span>
              </p>
              <div class="flex justify-between text-xs py-1.5 border-b border-slate-800">
                <span class="text-slate-400">Overs Bowled:</span>
                <span class="font-mono font-bold text-white">${bowling.oversBowled || bowling.overs || '0.0'}</span>
              </div>
              <div class="flex justify-between text-xs py-1.5 border-b border-slate-800">
                <span class="text-slate-400">Runs Conceded:</span>
                <span class="font-mono font-bold text-rose-400">${bowling.runsConceded ?? 0}</span>
              </div>
              <div class="flex justify-between text-xs pt-1">
                <span class="text-slate-400">Maidens Bowled:</span>
                <span class="font-mono font-bold text-emerald-400">${bowling.maidens ?? 0}</span>
              </div>
            </div>

            <div class="glass-panel p-4 rounded-xl border border-slate-800 space-y-2.5">
              <p class="text-xs font-bold text-white flex items-center gap-2">
                <i data-lucide="shield" class="w-4 h-4 text-emerald-400"></i>
                <span>Dot Ball Pressure & Extras</span>
              </p>
              <div class="flex justify-between text-xs py-1.5 border-b border-slate-800">
                <span class="text-slate-400">Dot Balls Bowled:</span>
                <span class="font-mono font-bold text-emerald-400">${bowling.dotBallsBowled ?? 0}</span>
              </div>
              <div class="flex justify-between text-xs py-1.5 border-b border-slate-800">
                <span class="text-slate-400">Dot Ball Percentage:</span>
                <span class="font-mono font-bold text-white">${bowling.dotPct || '0.0%'}</span>
              </div>
              <div class="flex justify-between text-xs pt-1">
                <span class="text-slate-400">5-Wicket Hauls (5W):</span>
                <span class="font-mono font-bold text-purple-400">${bowling.fiveWickets ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Fielding Panel -->
        <div class="player-profile-panel space-y-6 ${activeTab === 'fielding' ? '' : 'hidden'}" data-panel="fielding">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div class="glass-panel p-4 rounded-xl border border-slate-800">
              <p class="text-[11px] text-slate-400 font-semibold uppercase">Catches Taken</p>
              <p class="text-3xl font-black text-sky-400 font-mono mt-1">${catchesCount}</p>
            </div>
            <div class="glass-panel p-4 rounded-xl border border-slate-800">
              <p class="text-[11px] text-slate-400 font-semibold uppercase">Direct Hits</p>
              <p class="text-3xl font-black text-emerald-400 font-mono mt-1">${fielding.directHits ?? 0}</p>
            </div>
            <div class="glass-panel p-4 rounded-xl border border-slate-800">
              <p class="text-[11px] text-slate-400 font-semibold uppercase">Run-Outs</p>
              <p class="text-3xl font-black text-amber-300 font-mono mt-1">${fielding.runOuts ?? 0}</p>
            </div>
            <div class="glass-panel p-4 rounded-xl border border-slate-800">
              <p class="text-[11px] text-slate-400 font-semibold uppercase">Stumpings</p>
              <p class="text-3xl font-black text-purple-400 font-mono mt-1">${fielding.stumpings ?? 0}</p>
            </div>
          </div>

          <div class="glass-panel p-4 rounded-xl border border-slate-800 space-y-2.5">
            <p class="text-xs font-bold text-white flex items-center gap-2">
              <i data-lucide="check-check" class="w-4 h-4 text-emerald-400"></i>
              <span>Catching Efficiency & Safety Record</span>
            </p>
            <div class="flex justify-between text-xs py-1.5 border-b border-slate-800">
              <span class="text-slate-400">Catch Efficiency Rate:</span>
              <span class="font-mono font-bold text-emerald-400">${fielding.catchEfficiency || '100.0%'}</span>
            </div>
            <div class="flex justify-between text-xs py-1.5 border-b border-slate-800">
              <span class="text-slate-400">Total Chances Offered:</span>
              <span class="font-mono font-bold text-white">${fielding.totalChances ?? (catchesCount || 0)}</span>
            </div>
            <div class="flex justify-between text-xs pt-1">
              <span class="text-slate-400">Dropped Catches:</span>
              <span class="font-mono font-bold text-rose-400">${fielding.droppedCatches ?? 0}</span>
            </div>
          </div>
        </div>

        <!-- Tab 4: Franchise Teams Panel -->
        <div class="player-profile-panel space-y-4 ${activeTab === 'teams' ? '' : 'hidden'}" data-panel="teams">
          <div>
            <h3 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <i data-lucide="shield" class="w-4 h-4 text-sky-400"></i>
              <span>Drafted Team Franchises (${teams.length})</span>
            </h3>
            ${teams.length === 0 ? `
              <div class="glass-panel p-6 rounded-xl border border-slate-800 text-center space-y-2">
                <p class="text-slate-300 text-xs font-medium">This athlete is currently not drafted into any official franchise roster.</p>
                <p class="text-slate-500 text-[11px]">Available for tournament auctions and draft signings as a <strong>Free Agent</strong>.</p>
              </div>
            ` : `
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${teams.map(t => `
                  <div class="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between hover:border-sky-500/50 transition shadow-sm">
                    <div class="flex items-center gap-3">
                      <span class="text-3xl">${t.flag || '🏏'}</span>
                      <div>
                        <h4 class="font-bold text-white text-sm">${t.name}</h4>
                        <p class="text-[11px] text-slate-400">${t.squadCount ? t.squadCount + ' Squad Members' : 'Active Franchise'}</p>
                      </div>
                    </div>
                    <span class="px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold">Active Roster</span>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

        <!-- Tab 5: Match Appearances Panel -->
        <div class="player-profile-panel space-y-4 ${activeTab === 'matches' ? '' : 'hidden'}" data-panel="matches">
          <div>
            <h3 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <i data-lucide="activity" class="w-4 h-4 text-emerald-400"></i>
              <span>Match Appearances & Match Logs (${playerMatches.length})</span>
            </h3>
            ${playerMatches.length === 0 ? `
              <div class="glass-panel p-6 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
                No official match appearances recorded for this player in the active tournament database.
              </div>
            ` : `
              <div class="space-y-3">
                ${playerMatches.map(m => `
                  <div class="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-white text-sm">${m.title}</span>
                        <span class="px-2 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700 uppercase">${m.status}</span>
                      </div>
                      <p class="text-xs text-slate-400">${m.tournament} • ${m.summary}</p>
                    </div>
                    <div class="text-right font-mono text-xs text-sky-300 space-y-0.5">
                      ${m.score1 ? `<div>${m.score1}</div>` : ''}
                      ${m.score2 ? `<div class="text-emerald-300">${m.score2}</div>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

        <!-- Tab 6: Developer & Raw Technical Data Panel -->
        <div class="player-profile-panel space-y-4 ${activeTab === 'technical' ? '' : 'hidden'}" data-panel="technical">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i data-lucide="code" class="w-4 h-4 text-sky-400"></i>
              <span>Raw Realtime Database Object</span>
            </h3>
            <button type="button" onclick="copyPlayerProfileText(JSON.stringify(findUserByKey('${encodeURIComponent(userKeyRaw)}') || {}, null, 2), 'Raw JSON')" 
                    class="btn-secondary text-xs px-3 py-1 flex items-center gap-1.5">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
              <span>Copy JSON</span>
            </button>
          </div>
          <div class="glass-panel p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 bg-slate-950/70 overflow-x-auto max-h-96">
            <pre>${JSON.stringify(user, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) {
    lucide.createIcons();
  }
}

// // ============================================================================
// SCORER CHANGE REQUESTS & LIVE MISTAKE DISPUTE RESOLUTION ENGINE
// ============================================================================

function toggleScorerAlertsDropdown() {
  const dropdown = document.getElementById('dropdown-scorer-alerts');
  if (!dropdown) return;
  const isHidden = dropdown.classList.toggle('hidden');
  if (!isHidden && window.lucide) {
    lucide.createIcons();
  }
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('dropdown-scorer-alerts');
  const btn = document.getElementById('btn-scorer-alerts');
  if (!dropdown || !btn) return;
  if (!dropdown.classList.contains('hidden') && !dropdown.contains(e.target) && !btn.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Recently';
  const diffSec = Math.floor((Date.now() - Number(timestamp)) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function playScorerAlertChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

function renderScorerAlerts() {
  const badge = document.getElementById('badge-scorer-alerts');
  const countLabel = document.getElementById('dropdown-alerts-count');
  const listContainer = document.getElementById('scorer-alerts-list');
  if (!listContainer) return;

  const requests = Object.entries(state.scorerRequests || {});
  const pending = requests.filter(([id, r]) => r && r.status !== 'resolved');
  const pendingCount = pending.length;

  if (badge) {
    badge.textContent = pendingCount;
    badge.classList.toggle('hidden', pendingCount === 0);
  }
  if (countLabel) {
    countLabel.textContent = `${pendingCount} Pending`;
  }

  // Play alert audio and show notification if a new request has arrived
  if (pendingCount > state.lastSeenRequestCount) {
    playScorerAlertChime();
    const latest = pending[pending.length - 1][1];
    showToast(`🚨 Scorer Alert: ${latest.scorerName || 'Scorer'} reported an error on match! Click 🔔 to review.`, 'warning');
  }
  state.lastSeenRequestCount = pendingCount;

  if (pending.length === 0) {
    listContainer.innerHTML = '<p class="text-xs text-slate-400 text-center py-5">No pending scorer change requests.</p>';
    return;
  }

  // Sort newest first
  pending.sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));

  listContainer.innerHTML = pending.map(([reqId, req]) => {
    const match = state.matchesDb[req.matchId] || {};
    const matchTitle = req.matchTitle || match.title || `${match.teamA || 'Team A'} vs ${match.teamB || 'Team B'}`;
    const scorerName = req.scorerName || 'Official Scorer';
    const timeStr = formatTimeAgo(req.timestamp);
    const ballNote = req.ballIndex !== undefined ? `<span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">Ball #${Number(req.ballIndex) + 1}</span>` : '';

    return `
      <div class="glass-panel p-3 rounded-xl border border-slate-700/80 bg-slate-900/90 space-y-2 hover:border-amber-500/50 transition">
        <div class="flex items-start justify-between gap-2">
          <div>
            <span class="font-bold text-white text-xs block">${matchTitle}</span>
            <p class="text-[10px] text-slate-400 mt-0.5">By ${scorerName} • ${timeStr}</p>
          </div>
          ${ballNote}
        </div>
        <p class="text-xs text-amber-200 bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/20 font-medium">
          "${req.description || 'Scorer requested score review or ball adjustment'}"
        </p>
        <div class="flex items-center justify-between pt-1">
          <button type="button" onclick="handleFixScorerRequest('${reqId}')" 
                  class="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold transition flex items-center gap-1.5 shadow-sm">
            <i data-lucide="wrench" class="w-3.5 h-3.5"></i>
            <span>Fix in Match Editor</span>
          </button>
          <button type="button" onclick="quickResolveScorerRequest('${reqId}')" 
                  class="text-[11px] text-slate-400 hover:text-emerald-400 transition font-medium">
            Dismiss
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    lucide.createIcons();
  }
}

function handleFixScorerRequest(reqId) {
  const req = state.scorerRequests ? state.scorerRequests[reqId] : null;
  if (!req) return;

  // Close dropdown
  const dropdown = document.getElementById('dropdown-scorer-alerts');
  if (dropdown) dropdown.classList.add('hidden');

  state.activeMatchId = req.matchId;
  state.activeScorerRequestId = reqId;

  // Switch to editor
  switchTab('editor');

  // Populate Dispute Banner
  const banner = document.getElementById('editor-scorer-request-banner');
  const bannerDesc = document.getElementById('banner-request-desc');
  const bannerAuthor = document.getElementById('banner-request-author');
  const bannerTime = document.getElementById('banner-request-time');

  if (banner && bannerDesc && bannerAuthor && bannerTime) {
    bannerDesc.textContent = req.description || 'Scorer requested correction';
    bannerAuthor.textContent = `Submitted by: ${req.scorerName || 'Scorer'}${req.scorerPhone ? ' (' + req.scorerPhone + ')' : ''}`;
    bannerTime.textContent = formatTimeAgo(req.timestamp);
    banner.classList.remove('hidden');
  }

  showToast(`Loaded Match for Review: "${req.matchTitle || 'Active Match'}"`, 'info');

  // If specific ball was reported, highlight or open it
  if (req.ballIndex !== undefined) {
    setTimeout(() => {
      openEditBallModal(Number(req.ballIndex));
    }, 350);
  }
}

async function resolveCurrentScorerRequest() {
  const reqId = state.activeScorerRequestId;
  if (!reqId) return;

  try {
    await fetch(`${CONFIG.FIREBASE_URL}/score_change_requests/${reqId}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'resolved',
        resolvedAt: Date.now(),
        resolvedBy: 'Admin',
      }),
    });

    if (state.scorerRequests && state.scorerRequests[reqId]) {
      state.scorerRequests[reqId].status = 'resolved';
    }

    dismissRequestBanner();
    renderScorerAlerts();
    showToast('Scorer request marked as Resolved! ✅ Cloud updated.', 'success');
  } catch (err) {
    showToast('Failed to resolve request: ' + err.message, 'error');
  }
}

async function quickResolveScorerRequest(reqId) {
  if (!reqId) return;
  try {
    await fetch(`${CONFIG.FIREBASE_URL}/score_change_requests/${reqId}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'resolved',
        resolvedAt: Date.now(),
        resolvedBy: 'Admin (Dismissed)',
      }),
    });

    if (state.scorerRequests && state.scorerRequests[reqId]) {
      state.scorerRequests[reqId].status = 'resolved';
    }

    renderScorerAlerts();
    showToast('Request dismissed.', 'info');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

function dismissRequestBanner() {
  const banner = document.getElementById('editor-scorer-request-banner');
  if (banner) banner.classList.add('hidden');
  state.activeScorerRequestId = null;
}

async function createMockScorerAlert() {
  const matchKeys = Object.keys(state.matchesDb || {});
  const matchId = state.activeMatchId || matchKeys[0] || 'match_demo';
  const match = state.matchesDb[matchId] || {};
  const matchTitle = match.title || `${match.teamA || 'Team A'} vs ${match.teamB || 'Team B'}`;

  const mockPayload = {
    matchId: matchId,
    matchTitle: matchTitle,
    scorerName: 'Amandeep Singh (Mobile Scorer)',
    scorerPhone: '+91 9780425527',
    description: 'Accidental 4 runs recorded on Ball #12. It was actually a Wicket (Caught behind). Please adjust striker score and team total.',
    ballIndex: 11,
    timestamp: Date.now(),
    status: 'pending',
  };

  try {
    showToast('Simulating incoming scorer alert to Firebase...', 'info');
    const res = await fetch(`${CONFIG.FIREBASE_URL}/score_change_requests.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockPayload),
    });
    if (res.ok) {
      await syncFromCloud(false);
      showToast('New Scorer Alert received! Check 🔔 in the header.', 'warning');
    }
  } catch (e) {
    showToast('Simulation failed: ' + e.message, 'error');
  }
}

// Backward Compatibility Aliases
const openPlayerDossier = openPlayerProfile;
const switchDossierTab = switchPlayerProfileTab;
const copyDossierText = copyPlayerProfileText;

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
window.openPlayerProfile = openPlayerProfile;
window.openPlayerDossier = openPlayerProfile;
window.switchPlayerProfileTab = switchPlayerProfileTab;
window.switchDossierTab = switchPlayerProfileTab;
window.copyPlayerProfileText = copyPlayerProfileText;
window.copyDossierText = copyDossierText;
window.sharePlayerProfile = sharePlayerProfile;
window.printPlayerDossier = printPlayerDossier;
window.toggleScorerAlertsDropdown = toggleScorerAlertsDropdown;
window.handleFixScorerRequest = handleFixScorerRequest;
window.resolveCurrentScorerRequest = resolveCurrentScorerRequest;
window.quickResolveScorerRequest = quickResolveScorerRequest;
window.dismissRequestBanner = dismissRequestBanner;
window.createMockScorerAlert = createMockScorerAlert;
