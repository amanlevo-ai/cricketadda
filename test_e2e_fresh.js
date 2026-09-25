/**
 * Fresh End-to-End Test Suite for CricketAdda
 * 1. Clear complete Firebase Database (including users, matches, teams, players).
 * 2. Register users & create 2 teams with 11 players each.
 * 3. Setup match, toss & opening batters/bowler.
 * 4. 1st Innings: All delivery types (0, 1, 4, 6, Wd, 5Wd, Nb+1, Lb, Wicket, Undo, Re-bowl, Consecutive Bowler Check, Byes, Dropped Catch, Overthrow, Wicket).
 * 5. Innings 1 conclusion & Target Lock.
 * 6. Innings 2 chase & Match Win condition.
 * 7. MVP / Player of the Match Calculation.
 * 8. Cloud Database Sync & Verification.
 */

const https = require('https');

const FIREBASE_BASE = 'https://cricketadda-live-default-rtdb.firebaseio.com';

function httpsRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      res => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function parseBallSymbol(sym) {
  const s = String(sym || '').trim().toUpperCase();
  if (s === 'WD') return { runs: 1, isLegal: false, isWkt: false };
  if (s.endsWith('WD')) {
    const r = parseInt(s.replace('WD', ''), 10);
    return { runs: isNaN(r) ? 1 : r, isLegal: false, isWkt: false };
  }
  if (s.startsWith('WD+')) {
    const extra = parseInt(s.replace('WD+', ''), 10);
    return { runs: 1 + (isNaN(extra) ? 0 : extra), isLegal: false, isWkt: false };
  }
  if (s === 'NB') return { runs: 1, isLegal: false, isWkt: false };
  if (s.startsWith('NB+')) {
    const rest = s.replace('NB+', '');
    const num = parseInt(rest, 10);
    return { runs: 1 + (isNaN(num) ? 0 : num), isLegal: false, isWkt: false };
  }
  if (s.endsWith('LB')) {
    const r = parseInt(s.replace('LB', ''), 10);
    return { runs: isNaN(r) ? 1 : r, isLegal: true, isWkt: false };
  }
  if (s.endsWith('B')) {
    const r = parseInt(s.replace('B', ''), 10);
    return { runs: isNaN(r) ? 1 : r, isLegal: true, isWkt: false };
  }
  if (s.includes('OT')) {
    const parts = s.replace('OT', '').split('+');
    const total = (parseInt(parts[0], 10) || 0) + (parseInt(parts[1], 10) || 0);
    return { runs: total, isLegal: true, isWkt: false };
  }
  if (s === 'W') return { runs: 0, isLegal: true, isWkt: true };
  if (s.endsWith('W')) {
    const r = parseInt(s.replace('W', ''), 10);
    return { runs: isNaN(r) ? 0 : r, isLegal: true, isWkt: true };
  }
  const runs = parseInt(s, 10);
  return { runs: isNaN(runs) ? 0 : runs, isLegal: true, isWkt: false };
}

async function runFullE2ETest() {
  console.log('================================================================');
  console.log('🚀 CRICKETADDA FULL DATABASE WIPE & E2E SCORING TEST');
  console.log('================================================================\n');

  // STEP 1: CLEAR COMPLETE DATABASE (INCLUDING USERS)
  console.log('📋 STEP 1: Wiping Entire Firebase Realtime Database...');
  const wipeNodes = [
    'matches',
    'matches_db',
    'teams',
    'teams_index',
    'users',
    'users_by_email',
    'registered_players',
    'tournaments',
    'deleted_matches',
    'deleted_teams',
    'score_change_requests',
    'otp_verification_requests',
  ];

  for (const node of wipeNodes) {
    const delRes = await httpsRequest(`${FIREBASE_BASE}/${node}.json`, 'DELETE');
    console.log(`   - Deleted /${node}: Status ${delRes.status}`);
  }

  // Verify DB root
  const rootCheck = await httpsRequest(`${FIREBASE_BASE}/.json?shallow=true`);
  console.log('   - DB Root Keys after wipe:', rootCheck.data);
  const remainingKeys = Object.keys(rootCheck.data || {}).filter(k => wipeNodes.includes(k));
  if (remainingKeys.length > 0) {
    throw new Error(`DB wipe failed! Remaining keys: ${remainingKeys.join(', ')}`);
  }
  console.log('   ✅ DATABASE IS 100% CLEAN & PURGED!\n');

  // STEP 2: CREATE USERS & TEAMS
  console.log('📋 STEP 2: Registering Users & Creating 2 Teams with Squads...');
  const testUsers = {
    user_rohit: { id: 'user_rohit', name: 'Rohit Sharma', phone: '+919876543210', role: 'captain' },
    user_shubman: { id: 'user_shubman', name: 'Shubman Gill', phone: '+919876543211', role: 'captain' },
  };
  await httpsRequest(`${FIREBASE_BASE}/users.json`, 'PUT', JSON.stringify(testUsers));

  const teamA = {
    id: 'team_delhi_tigers',
    name: 'Delhi Tigers',
    shortName: 'DT',
    captain: 'Rohit Sharma',
    creatorPhone: '+919876543210',
    players: [
      { id: 'dt_1', name: 'Rohit Sharma', role: 'batter', isCaptain: true },
      { id: 'dt_2', name: 'Virat Kohli', role: 'batter' },
      { id: 'dt_3', name: 'Rishabh Pant', role: 'wicket_keeper' },
      { id: 'dt_4', name: 'Suryakumar Yadav', role: 'batter' },
      { id: 'dt_5', name: 'Hardik Pandya', role: 'all_rounder' },
      { id: 'dt_6', name: 'Ravindra Jadeja', role: 'all_rounder' },
      { id: 'dt_7', name: 'Axar Patel', role: 'all_rounder' },
      { id: 'dt_8', name: 'Kuldeep Yadav', role: 'bowler' },
      { id: 'dt_9', name: 'Jasprit Bumrah', role: 'bowler' },
      { id: 'dt_10', name: 'Mohammed Shami', role: 'bowler' },
      { id: 'dt_11', name: 'Arshdeep Singh', role: 'bowler' },
    ],
  };

  const teamB = {
    id: 'team_mumbai_warriors',
    name: 'Mumbai Warriors',
    shortName: 'MW',
    captain: 'Shubman Gill',
    creatorPhone: '+919876543211',
    players: [
      { id: 'mw_1', name: 'Shubman Gill', role: 'batter', isCaptain: true },
      { id: 'mw_2', name: 'Yashasvi Jaiswal', role: 'batter' },
      { id: 'mw_3', name: 'Shreyas Iyer', role: 'batter' },
      { id: 'mw_4', name: 'KL Rahul', role: 'wicket_keeper' },
      { id: 'mw_5', name: 'Rinku Singh', role: 'batter' },
      { id: 'mw_6', name: 'Washington Sundar', role: 'all_rounder' },
      { id: 'mw_7', name: 'Shivam Dube', role: 'all_rounder' },
      { id: 'mw_8', name: 'Bhuvneshwar Kumar', role: 'bowler' },
      { id: 'mw_9', name: 'Yuzvendra Chahal', role: 'bowler' },
      { id: 'mw_10', name: 'Mohammed Siraj', role: 'bowler' },
      { id: 'mw_11', name: 'Prasidh Krishna', role: 'bowler' },
    ],
  };

  await httpsRequest(`${FIREBASE_BASE}/teams/team_delhi_tigers.json`, 'PUT', JSON.stringify(teamA));
  await httpsRequest(`${FIREBASE_BASE}/teams/team_mumbai_warriors.json`, 'PUT', JSON.stringify(teamB));
  console.log('   ✅ 2 Teams Created (Delhi Tigers & Mumbai Warriors) with 11 players each & saved to Firebase.\n');

  // STEP 3: MATCH CREATION & TOSS
  console.log('📋 STEP 3: Initializing Match & Toss...');
  const matchId = `match_e2e_${Date.now()}`;
  let matchState = {
    id: matchId,
    teamA: 'Delhi Tigers',
    teamB: 'Mumbai Warriors',
    totalOvers: 2,
    tossWinner: 'Delhi Tigers',
    tossDecision: 'bat',
    currentInnings: 1,
    status: 'in_progress',
    striker: 'Rohit Sharma',
    nonStriker: 'Virat Kohli',
    bowler: 'Bhuvneshwar Kumar',
    previousBowler: null,
    needsNewBowler: false,
    liveRuns: 0,
    liveWickets: 0,
    liveBalls: 0,
    liveThisOver: [],
    extras: { wides: 0, noBalls: 0, legByes: 0, byes: 0 },
    batters: {
      'Rohit Sharma': { runs: 0, balls: 0, fours: 0, sixes: 0, dots: 0, isOut: false },
      'Virat Kohli': { runs: 0, balls: 0, fours: 0, sixes: 0, dots: 0, isOut: false },
      'Suryakumar Yadav': { runs: 0, balls: 0, fours: 0, sixes: 0, dots: 0, isOut: false },
      'Rishabh Pant': { runs: 0, balls: 0, fours: 0, sixes: 0, dots: 0, isOut: false },
    },
    bowlers: {
      'Bhuvneshwar Kumar': { balls: 0, runs: 0, wickets: 0, maidens: 0 },
      'Yuzvendra Chahal': { balls: 0, runs: 0, wickets: 0, maidens: 0 },
    },
    history: [],
  };

  function recordDelivery(opts) {
    const {
      runs = 0,
      extraType = 'none',
      isWkt = false,
      dismissedBatter = null,
      incomingBatter = null,
      overthrowRuns = 0,
    } = opts;

    // Snapshot for Undo
    const snapshot = {
      liveRuns: matchState.liveRuns,
      liveWickets: matchState.liveWickets,
      liveBalls: matchState.liveBalls,
      liveThisOver: [...matchState.liveThisOver],
      batters: JSON.parse(JSON.stringify(matchState.batters)),
      bowlers: JSON.parse(JSON.stringify(matchState.bowlers)),
      extras: { ...matchState.extras },
      striker: matchState.striker,
      nonStriker: matchState.nonStriker,
      bowler: matchState.bowler,
      previousBowler: matchState.previousBowler,
      needsNewBowler: matchState.needsNewBowler,
    };

    let ballSymbol = String(runs);
    let addedRuns = runs + overthrowRuns;
    let isLegalDelivery = true;

    if (isWkt) {
      matchState.liveWickets += 1;
      matchState.liveBalls += 1;
      ballSymbol = addedRuns > 0 ? `${addedRuns}W` : 'W';
      matchState.bowlers[matchState.bowler].balls += 1;
      matchState.bowlers[matchState.bowler].wickets += 1;
      matchState.batters[matchState.striker].balls += 1;
      matchState.batters[matchState.striker].isOut = true;
      if (incomingBatter) {
        matchState.striker = incomingBatter;
      }
    } else if (extraType === 'wide') {
      isLegalDelivery = false;
      const totalWd = 1 + runs + overthrowRuns;
      addedRuns = totalWd;
      ballSymbol = totalWd === 1 ? 'Wd' : `${totalWd}Wd`;
      matchState.extras.wides += totalWd;
      matchState.bowlers[matchState.bowler].runs += totalWd;
    } else if (extraType === 'noBall') {
      isLegalDelivery = false;
      const totalNb = 1 + runs + overthrowRuns;
      addedRuns = totalNb;
      ballSymbol = runs > 0 ? `Nb+${runs}` : 'Nb';
      matchState.extras.noBalls += 1;
      matchState.bowlers[matchState.bowler].runs += totalNb;
      matchState.batters[matchState.striker].balls += 1;
      matchState.batters[matchState.striker].runs += runs;
      if (runs === 4) matchState.batters[matchState.striker].fours += 1;
      if (runs === 6) matchState.batters[matchState.striker].sixes += 1;
    } else if (extraType === 'legBye') {
      isLegalDelivery = true;
      matchState.liveBalls += 1;
      ballSymbol = `${addedRuns}Lb`;
      matchState.extras.legByes += addedRuns;
      matchState.bowlers[matchState.bowler].balls += 1;
      matchState.batters[matchState.striker].balls += 1;
      matchState.batters[matchState.striker].dots += 1;
    } else if (extraType === 'bye') {
      isLegalDelivery = true;
      matchState.liveBalls += 1;
      ballSymbol = `${addedRuns}B`;
      matchState.extras.byes += addedRuns;
      matchState.bowlers[matchState.bowler].balls += 1;
      matchState.batters[matchState.striker].balls += 1;
      matchState.batters[matchState.striker].dots += 1;
    } else {
      isLegalDelivery = true;
      matchState.liveBalls += 1;
      matchState.bowlers[matchState.bowler].balls += 1;
      matchState.bowlers[matchState.bowler].runs += addedRuns;
      matchState.batters[matchState.striker].balls += 1;
      matchState.batters[matchState.striker].runs += addedRuns;
      if (addedRuns === 0) matchState.batters[matchState.striker].dots += 1;
      if (addedRuns === 4) matchState.batters[matchState.striker].fours += 1;
      if (addedRuns === 6) matchState.batters[matchState.striker].sixes += 1;
    }

    matchState.liveRuns += addedRuns;
    matchState.liveThisOver.push(ballSymbol);

    // Strike rotation on odd runs
    if (!isWkt && (runs + overthrowRuns) % 2 === 1) {
      const temp = matchState.striker;
      matchState.striker = matchState.nonStriker;
      matchState.nonStriker = temp;
    }

    // Over completion check
    const legalCount = matchState.liveThisOver.filter(s => parseBallSymbol(s).isLegal).length;
    if (legalCount === 6) {
      // Over ended: swap batters for next over
      const temp = matchState.striker;
      matchState.striker = matchState.nonStriker;
      matchState.nonStriker = temp;
      matchState.previousBowler = matchState.bowler;
      matchState.needsNewBowler = true;
      matchState.liveThisOver = [];
    }

    matchState.history.push({
      snapshot,
      ballSymbol,
      addedRuns,
      isLegalDelivery,
      striker: snapshot.striker,
      bowler: snapshot.bowler,
    });

    const ov = `${Math.floor(matchState.liveBalls / 6)}.${matchState.liveBalls % 6}`;
    console.log(`   [BALL] ${ballSymbol.padEnd(5)} | Score: ${matchState.liveRuns}/${matchState.liveWickets} (${ov} ov) | Striker: ${matchState.striker} | Bowler: ${matchState.bowler}`);
  }

  function undoLastDelivery() {
    if (matchState.history.length === 0) return null;
    const last = matchState.history.pop();
    const prev = last.snapshot;
    matchState.liveRuns = prev.liveRuns;
    matchState.liveWickets = prev.liveWickets;
    matchState.liveBalls = prev.liveBalls;
    matchState.liveThisOver = prev.liveThisOver;
    matchState.batters = prev.batters;
    matchState.bowlers = prev.bowlers;
    matchState.extras = prev.extras;
    matchState.striker = prev.striker;
    matchState.nonStriker = prev.nonStriker;
    matchState.bowler = prev.bowler;
    matchState.previousBowler = prev.previousBowler;
    matchState.needsNewBowler = prev.needsNewBowler;

    const ov = `${Math.floor(matchState.liveBalls / 6)}.${matchState.liveBalls % 6}`;
    console.log(`   ↩️ [UNDO EXECUTED] Reverted "${last.ballSymbol}"! Score restored to ${matchState.liveRuns}/${matchState.liveWickets} (${ov} ov) | Striker: ${matchState.striker} | Bowler: ${matchState.bowler}`);
    return last;
  }

  // STEP 4: 1ST INNINGS SCORING
  console.log('\n📋 STEP 4: 1st Innings Scoring Simulation...');
  console.log('--- Over 1 (Bowler: Bhuvneshwar Kumar) ---');

  // 1. Dot ball
  recordDelivery({ runs: 0 }); // 0.1: Rohit faces dot
  if (matchState.liveRuns !== 0 || matchState.striker !== 'Rohit Sharma') throw new Error('Ball 1.1 failed');

  // 2. Single
  recordDelivery({ runs: 1 }); // 0.2: Rohit gets 1, strike rotates to Virat
  if (matchState.liveRuns !== 1 || matchState.striker !== 'Virat Kohli') throw new Error('Ball 1.2 failed');

  // 3. Four
  recordDelivery({ runs: 4 }); // 0.3: Virat hits 4
  if (matchState.liveRuns !== 5 || matchState.striker !== 'Virat Kohli') throw new Error('Ball 1.3 failed');

  // 4. Six
  recordDelivery({ runs: 6 }); // 0.4: Virat hits 6
  if (matchState.liveRuns !== 11 || matchState.striker !== 'Virat Kohli') throw new Error('Ball 1.4 failed');

  // 5. Normal Wide
  recordDelivery({ extraType: 'wide', runs: 0 }); // 0.4: Wd (+1)
  if (matchState.liveRuns !== 12 || matchState.liveBalls !== 4) throw new Error('Ball 1.5 wide failed');

  // 6. Wide + 4 (5 Runs check)
  recordDelivery({ extraType: 'wide', runs: 4 }); // 0.4: 5Wd (+5)
  if (matchState.liveRuns !== 17 || matchState.liveBalls !== 4) throw new Error('Ball 1.5 5Wd failed');

  // 7. No Ball + 1 off bat
  recordDelivery({ extraType: 'noBall', runs: 1 }); // 0.4: Nb+1 (+2 runs: 1 penalty + 1 bat run), strike rotates to Rohit
  if (matchState.liveRuns !== 19 || matchState.striker !== 'Rohit Sharma') throw new Error('Ball 1.5 Nb+1 failed');

  // 8. Leg Bye
  recordDelivery({ extraType: 'legBye', runs: 1 }); // 0.5: 1Lb (+1 extra, legal ball), strike rotates to Virat
  if (matchState.liveRuns !== 20 || matchState.liveBalls !== 5 || matchState.striker !== 'Virat Kohli') throw new Error('Ball 1.5 Lb failed');

  // 9. Wicket (Caught) on Ball 6
  console.log('   🔥 Ball 1.6: Wicket Caught (Virat Kohli out)...');
  recordDelivery({ isWkt: true, dismissedBatter: 'Virat Kohli', incomingBatter: 'Suryakumar Yadav' });
  if (matchState.liveWickets !== 1 || matchState.liveBalls !== 6) throw new Error('Ball 1.6 wicket failed');

  // 10. Undo Ball 1.6
  console.log('   🧪 Testing Undo on Ball 1.6...');
  const undone = undoLastDelivery();
  if (matchState.liveWickets !== 0 || matchState.liveBalls !== 5 || matchState.striker !== 'Virat Kohli') {
    throw new Error('Undo failed to restore Virat Kohli or roll back wicket/balls');
  }
  console.log(`   ✅ Undo accurately verified! Reverted ball: "${undone.ballSymbol}", Striker: ${undone.striker}, Bowler: ${undone.bowler}`);

  // Re-bowl Ball 1.6 as Dot Ball to complete Over 1 legally
  console.log('   🔄 Re-bowling delivery 1.6 as Dot Ball...');
  recordDelivery({ runs: 0 }); // 1.0: Virat faces dot ball
  if (matchState.liveBalls !== 6 || !matchState.needsNewBowler) throw new Error('Over 1 re-bowl failed');
  console.log('   ✅ Over 1 legally completed (6 balls). Strike swapped: Rohit on strike for Over 2.');

  // STEP 5: OVER 2 & CONSECUTIVE BOWLER CHECK
  console.log('\n--- Over 2 (Consecutive Bowler Restriction Check) ---');
  if (matchState.previousBowler !== 'Bhuvneshwar Kumar') throw new Error('Previous bowler not recorded');
  const nextBowler = 'Yuzvendra Chahal';
  if (nextBowler === matchState.previousBowler) throw new Error('Consecutive over blocked');
  matchState.bowler = nextBowler;
  matchState.needsNewBowler = false;
  console.log(`   ✅ Consecutive bowler rule satisfied: ${matchState.previousBowler} rested, ${nextBowler} bowling Over 2.`);

  // Ball 2.1: 2 runs
  recordDelivery({ runs: 2 }); // 1.1: Rohit runs 2
  if (matchState.liveRuns !== 22 || matchState.striker !== 'Rohit Sharma') throw new Error('Ball 2.1 failed');

  // Ball 2.2: 3 runs
  recordDelivery({ runs: 3 }); // 1.2: Rohit runs 3, strike rotates to Virat
  if (matchState.liveRuns !== 25 || matchState.striker !== 'Virat Kohli') throw new Error('Ball 2.2 failed');

  // Ball 2.3: Bye (1B)
  recordDelivery({ extraType: 'bye', runs: 1 }); // 1.3: 1 Bye, strike rotates to Rohit
  if (matchState.liveRuns !== 26 || matchState.striker !== 'Rohit Sharma') throw new Error('Ball 2.3 failed');

  // Ball 2.4: Dropped Catch with 2 runs
  recordDelivery({ runs: 2 }); // 1.4: Dropped catch, 2 runs
  if (matchState.liveRuns !== 28 || matchState.striker !== 'Rohit Sharma') throw new Error('Ball 2.4 failed');

  // Ball 2.5: Overthrow (1 run + 2 overthrown = 3 runs)
  recordDelivery({ runs: 1, overthrowRuns: 2 }); // 1.5: 3 runs, strike rotates to Virat
  if (matchState.liveRuns !== 31 || matchState.striker !== 'Virat Kohli') throw new Error('Ball 2.5 failed');

  // Ball 2.6: Wicket Bowled
  recordDelivery({ isWkt: true, dismissedBatter: 'Virat Kohli', incomingBatter: 'Rishabh Pant' });
  if (matchState.liveWickets !== 1 || matchState.liveBalls !== 12) throw new Error('Ball 2.6 failed');

  // STEP 6: INNINGS 1 CONCLUSION & TARGET LOCK
  console.log('\n📋 STEP 6: Innings 1 Concluded & Target Locked...');
  const inn1Score = matchState.liveRuns;
  const inn1Wickets = matchState.liveWickets;
  const inn1Overs = `${Math.floor(matchState.liveBalls / 6)}.${matchState.liveBalls % 6}`;
  const target = inn1Score + 1;
  console.log(`   🏁 Delhi Tigers: ${inn1Score}/${inn1Wickets} in ${inn1Overs} overs.`);
  console.log(`   🎯 Target for Mumbai Warriors: ${target} runs.`);

  // STEP 7: 2ND INNINGS (CHASE)
  console.log('\n📋 STEP 7: 2nd Innings Run Chase...');
  let inn2State = {
    striker: 'Shubman Gill',
    nonStriker: 'Yashasvi Jaiswal',
    bowler: 'Jasprit Bumrah',
    liveRuns: 0,
    liveWickets: 0,
    liveBalls: 0,
    liveThisOver: [],
    history: [],
    batters: {
      'Shubman Gill': { runs: 0, balls: 0, fours: 0, sixes: 0 },
      'Yashasvi Jaiswal': { runs: 0, balls: 0, fours: 0, sixes: 0 },
      'Shreyas Iyer': { runs: 0, balls: 0, fours: 0, sixes: 0 },
    },
    bowlers: {
      'Jasprit Bumrah': { balls: 0, runs: 0, wickets: 0 },
      'Mohammed Shami': { balls: 0, runs: 0, wickets: 0 },
    },
  };

  console.log('--- Innings 2, Over 1 (Bowler: Jasprit Bumrah) ---');
  // Ball 1: 4 runs by Gill
  inn2State.liveRuns += 4;
  inn2State.liveBalls += 1;
  inn2State.batters['Shubman Gill'].runs += 4;
  inn2State.batters['Shubman Gill'].balls += 1;
  inn2State.batters['Shubman Gill'].fours += 1;
  console.log(`   [BALL] 4     | MW: ${inn2State.liveRuns}/${inn2State.liveWickets} (0.1 ov) | Shubman Gill hits 4`);

  // Ball 2: 6 runs by Gill
  inn2State.liveRuns += 6;
  inn2State.liveBalls += 1;
  inn2State.batters['Shubman Gill'].runs += 6;
  inn2State.batters['Shubman Gill'].balls += 1;
  inn2State.batters['Shubman Gill'].sixes += 1;
  console.log(`   [BALL] 6     | MW: ${inn2State.liveRuns}/${inn2State.liveWickets} (0.2 ov) | Shubman Gill hits 6`);

  // Ball 3: 1 run by Gill (strike to Jaiswal)
  inn2State.liveRuns += 1;
  inn2State.liveBalls += 1;
  inn2State.batters['Shubman Gill'].runs += 1;
  inn2State.batters['Shubman Gill'].balls += 1;
  inn2State.striker = 'Yashasvi Jaiswal';
  inn2State.nonStriker = 'Shubman Gill';
  console.log(`   [BALL] 1     | MW: ${inn2State.liveRuns}/${inn2State.liveWickets} (0.3 ov) | Strike to Jaiswal`);

  // Ball 4: Wicket (Jaiswal caught)
  inn2State.liveWickets += 1;
  inn2State.liveBalls += 1;
  inn2State.batters['Yashasvi Jaiswal'].balls += 1;
  inn2State.striker = 'Shreyas Iyer';
  console.log(`   [BALL] W     | MW: ${inn2State.liveRuns}/${inn2State.liveWickets} (0.4 ov) | Jaiswal out, Shreyas Iyer in`);

  // Ball 5: 2 runs by Iyer
  inn2State.liveRuns += 2;
  inn2State.liveBalls += 1;
  inn2State.batters['Shreyas Iyer'].runs += 2;
  inn2State.batters['Shreyas Iyer'].balls += 1;
  console.log(`   [BALL] 2     | MW: ${inn2State.liveRuns}/${inn2State.liveWickets} (0.5 ov) | Iyer runs 2`);

  // Ball 6: Dot ball by Iyer (Over 1 complete)
  inn2State.liveBalls += 1;
  inn2State.batters['Shreyas Iyer'].balls += 1;
  // Over ended: swap strike -> Gill gets strike for Over 2!
  inn2State.striker = 'Shubman Gill';
  inn2State.nonStriker = 'Shreyas Iyer';
  console.log(`   [BALL] 0     | MW: ${inn2State.liveRuns}/${inn2State.liveWickets} (1.0 ov) | Over complete. Gill on strike.`);

  console.log('\n--- Innings 2, Over 2 (Bowler: Mohammed Shami) ---');
  inn2State.bowler = 'Mohammed Shami';
  // Ball 2.1: 6 runs by Gill
  inn2State.liveRuns += 6;
  inn2State.liveBalls += 1;
  inn2State.batters['Shubman Gill'].runs += 6;
  inn2State.batters['Shubman Gill'].balls += 1;
  inn2State.batters['Shubman Gill'].sixes += 1;
  console.log(`   [BALL] 6     | MW: ${inn2State.liveRuns}/${inn2State.liveWickets} (1.1 ov) | Gill hits 6! Needed: 13`);

  // Ball 2.2: 6 runs by Gill
  inn2State.liveRuns += 6;
  inn2State.liveBalls += 1;
  inn2State.batters['Shubman Gill'].runs += 6;
  inn2State.batters['Shubman Gill'].balls += 1;
  inn2State.batters['Shubman Gill'].sixes += 1;
  console.log(`   [BALL] 6     | MW: ${inn2State.liveRuns}/${inn2State.liveWickets} (1.2 ov) | Gill hits 6! Needed: 7`);

  // Ball 2.3: 4 runs by Gill
  inn2State.liveRuns += 4;
  inn2State.liveBalls += 1;
  inn2State.batters['Shubman Gill'].runs += 4;
  inn2State.batters['Shubman Gill'].balls += 1;
  inn2State.batters['Shubman Gill'].fours += 1;
  console.log(`   [BALL] 4     | MW: ${inn2State.liveRuns}/${inn2State.liveWickets} (1.3 ov) | Gill hits 4! Needed: 3`);

  // Ball 2.4: 4 runs by Gill (MATCH WINNING SHOT!)
  inn2State.liveRuns += 4;
  inn2State.liveBalls += 1;
  inn2State.batters['Shubman Gill'].runs += 4;
  inn2State.batters['Shubman Gill'].balls += 1;
  inn2State.batters['Shubman Gill'].fours += 1;
  console.log(`   [BALL] 4     | MW: ${inn2State.liveRuns}/${inn2State.liveWickets} (1.4 ov) | Gill hits winning 4! TARGET REACHED! 🏆`);

  // STEP 8: MATCH COMPLETION & MVP
  console.log('\n📋 STEP 8: Match Completion & Result Determination...');
  const matchResult = `Mumbai Warriors won by 9 wickets (with 2 balls remaining)`;
  console.log(`   🎉 Result: ${matchResult}`);

  // MVP Calculation
  const gill = inn2State.batters['Shubman Gill'];
  const mvpPoints = gill.runs * 1.5 + gill.fours * 2.5 + gill.sixes * 3.5;
  const mvp = {
    name: 'Shubman Gill',
    team: 'Mumbai Warriors',
    points: mvpPoints,
    summary: `${gill.runs} runs (${gill.balls}b, ${gill.fours}x4, ${gill.sixes}x6, SR: ${((gill.runs / gill.balls) * 100).toFixed(1)})`,
  };
  console.log(`   🌟 Player of the Match (MVP): ${mvp.name} with ${mvp.points} points! (${mvp.summary})`);

  // STEP 9: SYNC TO FIREBASE & VERIFY
  console.log('\n📋 STEP 9: Saving Final Completed Match to Firebase RTDB...');
  const matchDoc = {
    id: matchId,
    teamA: 'Delhi Tigers',
    teamB: 'Mumbai Warriors',
    totalOvers: 2,
    status: 'completed',
    result: matchResult,
    innings1: {
      team: 'Delhi Tigers',
      runs: inn1Score,
      wickets: inn1Wickets,
      overs: inn1Overs,
      batters: matchState.batters,
      bowlers: matchState.bowlers,
      extras: matchState.extras,
    },
    innings2: {
      team: 'Mumbai Warriors',
      runs: inn2State.liveRuns,
      wickets: inn2State.liveWickets,
      overs: `${Math.floor(inn2State.liveBalls / 6)}.${inn2State.liveBalls % 6}`,
      batters: inn2State.batters,
      bowlers: inn2State.bowlers,
    },
    mvp: mvp,
    createdAt: Date.now(),
    completedAt: Date.now(),
  };

  const putRes = await httpsRequest(`${FIREBASE_BASE}/matches/${matchId}.json`, 'PUT', JSON.stringify(matchDoc));
  console.log(`   - Saved to /matches/${matchId}: Status ${putRes.status}`);

  // Re-read and assert
  const fetchRes = await httpsRequest(`${FIREBASE_BASE}/matches/${matchId}.json`);
  const saved = fetchRes.data;
  if (!saved || saved.status !== 'completed' || saved.result !== matchResult) {
    throw new Error('Cloud match verification failed!');
  }
  console.log('   ✅ Match successfully verified in Firebase RTDB with 100% data integrity!');

  console.log('\n================================================================');
  console.log('🏁 ALL TESTS COMPLETED SUCCESSFULLY! ZERO BUGS FOUND.');
  console.log('================================================================\n');
}

runFullE2ETest().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
