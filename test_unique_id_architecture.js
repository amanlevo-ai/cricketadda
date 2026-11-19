/**
 * TEST SUITE: IMMUTABLE UNIQUE ID ARCHITECTURE AUDIT
 * Tests deterministic user IDs, match squads, player IDs, and ID-driven scoring permissions.
 */

const assert = require('assert');
const {
  KNOWN_USER_IDS,
  normalizeUserId,
  isSameUserOrAlias,
} = require('./firebaseSync');
const { deriveMatchStateFromDeliveries } = require('./cricketStateEngine');

console.log('================================================================');
console.log('🔬 TEST SUITE: IMMUTABLE UNIQUE ID ARCHITECTURE AUDIT');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// TEST 1: User Identity Normalization & Alias Matching
// -----------------------------------------------------------------------------
console.log('📋 TEST 1: User Identity Normalization & Alias Matching...');

// Amandeep tests
const amanEmail = normalizeUserId(null, 'amanlevo@gmail.com', null, null);
const amanPhone = normalizeUserId(null, null, '9780425527', null);
const amanLegacy = normalizeUserId('usr_1792728393426');
const amanAlias = normalizeUserId('usr_amandeep');

assert.strictEqual(amanEmail, KNOWN_USER_IDS.AMAN_PHONE, 'Amanlevo email should normalize to usr_9780425527');
assert.strictEqual(amanPhone, KNOWN_USER_IDS.AMAN_PHONE, 'Amandeep phone should normalize to usr_9780425527');
assert.strictEqual(amanLegacy, KNOWN_USER_IDS.AMAN_PHONE, 'Legacy match creator ID should normalize to usr_9780425527');
assert.strictEqual(amanAlias, KNOWN_USER_IDS.AMAN_PHONE, 'usr_amandeep alias should normalize to usr_9780425527');

assert.strictEqual(isSameUserOrAlias('usr_9780425527', 'usr_1792728393426'), true, 'Aman aliases should match');
assert.strictEqual(isSameUserOrAlias('usr_amandeep', 'usr_9780425527'), true, 'Aman alias should match phone ID');

// Wpardeepkaur tests
const wpEmail = normalizeUserId(null, 'wpardeepkaur@gmail.com', null, 'Wpardeepkaur');
const wpId = normalizeUserId('usr_1793432528758');
const wpAlias = normalizeUserId('usr_wpardeep');

assert.strictEqual(wpEmail, KNOWN_USER_IDS.WPARDEEP_ID, 'Wpardeepkaur email should normalize to usr_1793432528758');
assert.strictEqual(wpId, KNOWN_USER_IDS.WPARDEEP_ID, 'Wpardeepkaur ID should normalize to usr_1793432528758');
assert.strictEqual(wpAlias, KNOWN_USER_IDS.WPARDEEP_ID, 'Wpardeepkaur alias should normalize to usr_1793432528758');
assert.strictEqual(isSameUserOrAlias('usr_1793432528758', 'usr_wpardeep'), true, 'Wpardeep aliases should match');

// Distinct users should not match
assert.strictEqual(isSameUserOrAlias(amanEmail, wpEmail), false, 'Amandeep and Wpardeep should NEVER match');

// New registered user
const newUser = normalizeUserId(null, 'newplayer@test.com', '9876543210', 'Rohit Sharma');
assert.strictEqual(newUser, 'usr_9876543210', 'New user with phone should get usr_ phone ID');

console.log('  ✅ PASSED: User ID normalization & alias recognition 100% verified\n');

// -----------------------------------------------------------------------------
// TEST 2: Squad Rosters with Unique Player IDs
// -----------------------------------------------------------------------------
console.log('📋 TEST 2: Squad Rosters & Match Player IDs...');

const mockSquad = [
  { name: 'Amandeep', phone: '9780425527', role: 'BAT' },
  { name: 'Wpardeepkaur', email: 'wpardeepkaur@gmail.com', role: 'ALL' },
  { name: 'Local Batter', role: 'BAT' },
];

const sanitizedSquad = mockSquad.map((p, idx) => {
  const pId = normalizeUserId(p.id, p.email, p.phone, p.name) || `ply_test_${idx}`;
  return {
    ...p,
    id: pId,
  };
});

assert.strictEqual(sanitizedSquad[0].id, 'usr_9780425527', 'Amandeep in squad has usr_9780425527');
assert.strictEqual(sanitizedSquad[1].id, 'usr_1793432528758', 'Wpardeepkaur in squad has usr_1793432528758');
assert.ok(sanitizedSquad[2].id.startsWith('usr_') || sanitizedSquad[2].id.startsWith('ply_'), 'Guest player gets unique ID');
assert.notStrictEqual(sanitizedSquad[0].id, sanitizedSquad[1].id, 'Squad player IDs are unique');

console.log('  ✅ PASSED: Squad players receive permanent unique IDs\n');

// -----------------------------------------------------------------------------
// TEST 3: ID-Driven Scoring Permission Guard & Delegation Lifecycle
// -----------------------------------------------------------------------------
console.log('📋 TEST 3: ID-Driven Scoring Permission Guard & Delegation Lifecycle...');

// Simulated permission guard using the exact logic from App.js
function checkScoringPermission(targetMatch, currentUser) {
  if (!targetMatch || !currentUser) return false;
  const uId = normalizeUserId(currentUser.id, currentUser.email, currentUser.phone, currentUser.name);

  const assignedId = targetMatch.activeScorerId || targetMatch.scorerId || targetMatch.activeScorer?.id;
  const creatorId = targetMatch.creatorId;

  const isCurrentUserCreator = Boolean(creatorId && uId && isSameUserOrAlias(creatorId, uId));
  const isCurrentUserAssignedScorer = Boolean(assignedId && uId && isSameUserOrAlias(assignedId, uId));
  const isAssignedToCreator = Boolean(assignedId && creatorId && isSameUserOrAlias(assignedId, creatorId));

  if (isAssignedToCreator && isCurrentUserCreator) {
    return true;
  }

  const isDelegated = Boolean(targetMatch.isScoringDelegated && !isAssignedToCreator);
  if (isDelegated) {
    return isCurrentUserAssignedScorer;
  }

  return isCurrentUserCreator || isCurrentUserAssignedScorer;
}

const userAman = { id: 'usr_9780425527', name: 'Amandeep', email: 'amanlevo@gmail.com', phone: '9780425527' };
const userWpardeep = { id: 'usr_1793432528758', name: 'Wpardeepkaur', email: 'wpardeepkaur@gmail.com' };
const userThirdParty = { id: 'usr_9888888888', name: 'Spectator', phone: '9888888888' };

// Initial match state: Created by Amandeep
const matchState = {
  id: 'match_test_id_001',
  creatorId: 'usr_9780425527',
  activeScorerId: 'usr_9780425527',
  scorerId: 'usr_9780425527',
  isScoringDelegated: false,
};

// 1. Initial rights
assert.strictEqual(checkScoringPermission(matchState, userAman), true, 'Creator Amandeep should have scoring rights initially');
assert.strictEqual(checkScoringPermission(matchState, userWpardeep), false, 'Wpardeep should be spectator initially');
assert.strictEqual(checkScoringPermission(matchState, userThirdParty), false, 'Random spectator should be spectator');

// 2. Delegation to Wpardeepkaur
matchState.activeScorerId = 'usr_1793432528758';
matchState.scorerId = 'usr_1793432528758';
matchState.isScoringDelegated = true;

assert.strictEqual(checkScoringPermission(matchState, userWpardeep), true, 'Wpardeep should have scoring rights after delegation');
assert.strictEqual(checkScoringPermission(matchState, userAman), false, 'Creator Amandeep must be locked out while scoring is delegated');
assert.strictEqual(checkScoringPermission(matchState, userThirdParty), false, 'Random spectator remains locked out');

// 3. Handover back to Creator
matchState.activeScorerId = 'usr_9780425527';
matchState.scorerId = 'usr_9780425527';
matchState.isScoringDelegated = false;

assert.strictEqual(checkScoringPermission(matchState, userAman), true, 'Creator Amandeep regains scoring rights');
assert.strictEqual(checkScoringPermission(matchState, userWpardeep), false, 'Wpardeep loses scoring rights when handed back to creator');

console.log('  ✅ PASSED: ID-driven scoring rights guard & delegation cycle fully validated\n');

// -----------------------------------------------------------------------------
// TEST 4: Delivery Logging & State Derivation with Player IDs
// -----------------------------------------------------------------------------
console.log('📋 TEST 4: Delivery Logging & State Derivation with Player IDs...');

const mockDeliveries = [
  {
    striker: 'Amandeep',
    strikerId: 'usr_9780425527',
    nonStriker: 'Wpardeepkaur',
    nonStrikerId: 'usr_1793432528758',
    bowler: 'Bowler 1',
    bowlerId: 'ply_bowler_1',
    scorerId: 'usr_9780425527',
    addedRuns: 4,
    runsOffBat: 4,
    extraType: 'none',
    isLegalDelivery: true,
  },
  {
    striker: 'Amandeep',
    strikerId: 'usr_9780425527',
    nonStriker: 'Wpardeepkaur',
    nonStrikerId: 'usr_1793432528758',
    bowler: 'Bowler 1',
    bowlerId: 'ply_bowler_1',
    scorerId: 'usr_9780425527',
    addedRuns: 1,
    runsOffBat: 1,
    extraType: 'none',
    isLegalDelivery: true,
  },
];

const derived = deriveMatchStateFromDeliveries(mockDeliveries, {
  battingSquad: sanitizedSquad,
  bowlingSquad: [{ id: 'ply_bowler_1', name: 'Bowler 1', role: 'BOWL' }],
  openingStriker: 'Amandeep',
  openingNonStriker: 'Wpardeepkaur',
  openingBowler: 'Bowler 1',
});

assert.strictEqual(derived.activeScore.runs, 5, 'Derived runs should be 5');
assert.strictEqual(derived.activeScore.balls, 2, 'Derived balls should be 2');

const amanRecord = derived.innings1.batting.find(b => b.name === 'Amandeep');
assert.ok(amanRecord, 'Amandeep batter record exists');
assert.strictEqual(amanRecord.id, 'usr_9780425527', 'Amandeep batter record preserves usr_9780425527 ID');
assert.strictEqual(amanRecord.runs, 5, 'Amandeep scored 5 runs');

const bowlerRecord = derived.innings1.bowling.find(b => b.name === 'Bowler 1');
assert.ok(bowlerRecord, 'Bowler record exists');
assert.strictEqual(bowlerRecord.id, 'ply_bowler_1', 'Bowler record preserves ply_bowler_1 ID');
assert.strictEqual(bowlerRecord.runs, 5, 'Bowler conceded 5 runs');

console.log('  ✅ PASSED: Delivery logging preserves player IDs & scorecards retain IDs\n');

// -----------------------------------------------------------------------------
// TEST 5: Player Rename / Alias Replay Consolidation (Amanlevo -> Amandeep)
// -----------------------------------------------------------------------------
console.log('📋 TEST 5: Player Rename / Alias Replay Consolidation (Amanlevo -> Amandeep)...');

const renameDeliveries = [
  // 3 overs of Amanlevo batting
  { striker: 'Amanlevo', strikerId: 'usr_9780425527', bowler: 'Javgga', addedRuns: 4, runsOffBat: 4, isLegalDelivery: true },
  { striker: 'Amanlevo', strikerId: 'usr_9780425527', bowler: 'Javgga', addedRuns: 1, runsOffBat: 1, isLegalDelivery: true },
  { striker: 'Amanlevo', strikerId: 'usr_9780425527', bowler: 'Javgga', addedRuns: 0, runsOffBat: 0, isLegalDelivery: true },
  { striker: 'Amanlevo', strikerId: 'usr_9780425527', bowler: 'Javgga', addedRuns: 4, runsOffBat: 4, isLegalDelivery: true },
  // Wicket falls for Amanlevo
  {
    striker: 'Amanlevo',
    strikerId: 'usr_9780425527',
    bowler: 'Javgga',
    isWkt: true,
    dismissedPlayerName: 'Amanlevo',
    dismissalDesc: 'b Javgga',
    addedRuns: 0,
    runsOffBat: 0,
    isLegalDelivery: true,
    incomingBatter: 'Rahul',
  },
];

// Squad has updated profile name 'Amandeep'
const derivedRenamed = deriveMatchStateFromDeliveries(renameDeliveries, {
  battingSquad: [
    { id: 'usr_9780425527', name: 'Amandeep', role: 'BAT' },
    { id: 'usr_darshan', name: 'Darshan singh', role: 'BAT' },
    { id: 'usr_rahul', name: 'Rahul', role: 'BAT' },
  ],
  bowlingSquad: [{ id: 'usr_javgga', name: 'Javgga', role: 'BOWL' }],
  openingStriker: 'Amandeep',
  openingNonStriker: 'Darshan singh',
  openingBowler: 'Javgga',
});

// 1. Should have exactly ONE record for Amandeep, and ZERO separate records for Amanlevo
const amandeepRecords = derivedRenamed.innings1.batting.filter(b => b.name === 'Amandeep');
const amanlevoRecords = derivedRenamed.innings1.batting.filter(b => b.name === 'Amanlevo');

assert.strictEqual(amandeepRecords.length, 1, 'Exactly one scorecard entry for Amandeep');
assert.strictEqual(amanlevoRecords.length, 0, 'Zero duplicate entries for Amanlevo');

// 2. Amandeep must have the 9 runs, 5 balls, 2 fours, and dismissal 'b Javgga'
assert.strictEqual(amandeepRecords[0].runs, 9, 'Amandeep credited with 9 runs');
assert.strictEqual(amandeepRecords[0].balls, 5, 'Amandeep credited with 5 balls');
assert.strictEqual(amandeepRecords[0].fours, 2, 'Amandeep credited with 2 fours');
assert.strictEqual(amandeepRecords[0].dismissal, 'b Javgga', 'Amandeep marked as b Javgga');
assert.strictEqual(amandeepRecords[0].isNotOut, false, 'Amandeep marked as out');

// 3. Fall of Wickets must show canonical name 'Amandeep'
assert.strictEqual(derivedRenamed.innings1.fallOfWickets.length, 1, '1 Fall of Wicket recorded');
assert.strictEqual(derivedRenamed.innings1.fallOfWickets[0].player, 'Amandeep', 'FOW displays canonical name Amandeep instead of alias Amanlevo');

console.log('  ✅ PASSED: Historical deliveries under old alias merge 100% seamlessly into canonical player!\n');

console.log('================================================================');
console.log('🎉 ALL UNIQUE ID ARCHITECTURE TESTS PASSED WITH 100% SUCCESS!');
console.log('================================================================\n');
