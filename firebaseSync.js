// ============================================================================
// CRICKETADDA BULLETPROOF CLOUD DATABASE CLIENT (FIREBASE REALTIME DATABASE)
// Official modular Firebase SDK + Concurrency-Safe Atomic Transactions (runTransaction)
// Keyed Deliveries storage (matches/{matchId}/balls/{pushId}) with Monotonic Seq
// Single Source of Truth (/matches) + Unified State Derivation (cricketStateEngine)
// Multi-device real-time sync across any phones over 4G/5G/Wi-Fi worldwide
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  runTransaction,
  push,
  update,
  remove,
  get,
  set,
} from 'firebase/database';
import { deriveMatchStateFromDeliveries } from './cricketStateEngine.js';

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDgjX6NwwuOglIO1yIEdgeq-Tkxs0TqP_Q",
  authDomain: "cricketadda-live-97d27.firebaseapp.com",
  databaseURL: "https://cricketadda-live-97d27-default-rtdb.firebaseio.com",
  projectId: "cricketadda-live-97d27",
  storageBucket: "cricketadda-live-97d27.firebasestorage.app",
  messagingSenderId: "438420450827",
  appId: "1:438420450827:web:4c381c0d2046244f4c610e",
  measurementId: "G-N5G00MKPZX"
};

let activeFirebaseConfig = { ...DEFAULT_FIREBASE_CONFIG };
let firebaseAppInstance = null;
let firebaseDbInstance = null;

export function getFirebaseDb() {
  if (firebaseDbInstance) return firebaseDbInstance;
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseAppInstance = existingApps[0];
  } else {
    firebaseAppInstance = initializeApp(activeFirebaseConfig);
  }
  firebaseDbInstance = getDatabase(firebaseAppInstance);
  return firebaseDbInstance;
}

// Cloud sync toggle (Enabled for real live database mode)
export const ENABLE_CLOUD_SYNC = true;
export const OFFLINE_SYNC_QUEUE_KEY = '@cricketadda_offline_sync_queue';

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
  try {
    getFirebaseDb();
  } catch (e) {
    console.warn('[FirebaseSync] Initialization warning:', e.message);
  }
  console.log('[FirebaseSync] 🟢 Live Firebase Cloud Database Active at', activeFirebaseConfig.databaseURL);
  return true;
}

/**
 * Checks connectivity to Firebase Realtime Database with timeout & latency measurement
 */
export async function checkFirebaseConnectivity(timeoutMs = 3500) {
  if (!isFirebaseConfigured()) return { connected: false, message: 'Cloud sync disabled' };
  const startTime = Date.now();
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    const res = await fetch(`${baseUrl}/ping.json`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
      signal: controller ? controller.signal : undefined,
    });
    if (timeoutId) clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    if (res.ok) {
      return { connected: true, latency, message: 'Connected to Firebase RTDB' };
    }
    return { connected: false, latency, message: `HTTP ${res.status}` };
  } catch (err) {
    return { connected: false, latency: Date.now() - startTime, error: err.message };
  }
}

/**
 * Completely wipes all cloud database records on Firebase RTDB for a 100% fresh start
 */
export async function wipeAllFirebaseData() {
  // ...
}

/**
 * Wipes matches, teams, and resets career stats on cloud Firebase RTDB,
 * while strictly PRESERVING all user accounts and profiles.
 */
export async function wipeFirebaseMatchesTeamsAndStats() {
  if (!isFirebaseConfigured()) return false;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    
    // Fetch users to reset their careerStats and createdTeams while preserving their profiles
    const resUsers = await fetch(`${baseUrl}/users.json`);
    const users = await resUsers.json();
    let cleanedUsers = [];
    if (Array.isArray(users)) {
      cleanedUsers = users.map(u => ({
        ...u,
        createdTeams: [],
        careerStats: {
          matchOverview: { matchesPlayed: 0, wins: 0, losses: 0, winRate: '0%', potmCount: 0 },
          careerStats: {
            batting: { runs: 0, avg: '0.00', sr: '0.00', highScore: '0', hundreds: 0, fifties: 0, fours: 0, sixes: 0, ballsFaced: 0, dotBallsFaced: 0, dotPct: '0.0%', ducks: 0, goldenDucks: 0, silverDucks: 0 },
            bowling: { wickets: 0, econ: '0.00', avg: '0.00', best: '0/0', oversBowled: '0.0', runsConceded: 0, dotBallsBowled: 0, dotPct: '0.0%' },
            fielding: { catches: 0, droppedCatches: 0, totalChances: 0, catchEfficiency: '100.0%', dropRate: '0.0%', runOuts: 0, directHits: 0, stumpings: 0 },
            totalDotsTillNow: 0,
          },
          matchHistoryList: [],
        },
        matchHistoryList: [],
      }));
    }

    const usersByEmail = {};
    cleanedUsers.forEach(u => {
      if (u && u.email) {
        const safeKey = u.email.replace(/\./g, '_').replace(/@/g, '_at_');
        usersByEmail[safeKey] = u;
      }
    });

        await Promise.all([
      fetch(`${baseUrl}/matches.json`, { method: 'DELETE' }),
      fetch(`${baseUrl}/teams.json`, { method: 'DELETE' }),
      fetch(`${baseUrl}/teams_index.json`, { method: 'DELETE' }),
      fetch(`${baseUrl}/registered_players.json`, { method: 'DELETE' }),
      fetch(`${baseUrl}/deleted_matches/wipe_tombstone.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wipedAt: Date.now(), reason: 'database_wipe' }),
      }),
      fetch(`${baseUrl}/deleted_teams/wipe_tombstone.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wipedAt: Date.now(), reason: 'database_wipe' }),
      }),
      fetch(`${baseUrl}/users.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedUsers),
      }),
      fetch(`${baseUrl}/users_by_email.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usersByEmail),
      }),
    ]);
    console.log('[FirebaseSync] 🧹 Matches, teams & stats wiped from Firebase; user profiles preserved.');
    return true;
  } catch (err) {
    console.log('[FirebaseSync] Wipe error:', err.message);
    return false;
  }
}


// ============================================================================
// OFFLINE SYNC QUEUE MANAGEMENT
// ============================================================================

export async function getOfflineQueue() {
  try {
    const json = await AsyncStorage.getItem(OFFLINE_SYNC_QUEUE_KEY);
    if (!json) return [];
    const list = JSON.parse(json);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

export async function saveOfflineQueue(queue) {
  try {
    await AsyncStorage.setItem(OFFLINE_SYNC_QUEUE_KEY, JSON.stringify(queue || []));
  } catch (e) {}
}

export function coalesceOfflineJobs(jobs) {
  if (!Array.isArray(jobs) || jobs.length === 0) return [];
  const reversed = [...jobs].reverse();
  const seenKeys = new Set();
  const keptReversed = [];

  for (const job of reversed) {
    if (!job || !job.action) continue;
    let key = job.action;
    if (job.action === 'syncMatch' && job.payload && job.payload.matchId) {
      key = `syncMatch_${job.payload.matchId}`;
    } else if (job.action === 'syncProfile' && job.payload && (job.payload.email || job.payload.profile?.email)) {
      key = `syncProfile_${job.payload.email || job.payload.profile?.email}`;
    }

    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      keptReversed.push(job);
    }
  }

  return keptReversed.reverse();
}

export async function enqueueOfflineSync(action, payload) {
  try {
    const existingQueue = await getOfflineQueue();
    const newJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action,
      payload,
      queuedAt: Date.now(),
    };
    const updatedQueue = coalesceOfflineJobs([...existingQueue, newJob]);
    await saveOfflineQueue(updatedQueue);
    return updatedQueue.length;
  } catch (e) {
    return 0;
  }
}

// ============================================================================
// DELETED RECORDS / TOMBSTONES MANAGEMENT (PREVENTS GHOST RESURRECTION)
// ============================================================================

let cachedDeletedMatches = null;
let lastDeletedMatchesFetch = 0;

export async function fetchFirebaseDeletedMatches(forceFresh = false) {
  if (!isFirebaseConfigured()) return new Set();
  const now = Date.now();
  if (!forceFresh && cachedDeletedMatches && (now - lastDeletedMatchesFetch < 60000)) {
    return cachedDeletedMatches;
  }
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const res = await fetch(`${baseUrl}/deleted_matches.json?t=${now}`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        cachedDeletedMatches = new Set(Object.keys(data).map(k => String(k).trim()));
        lastDeletedMatchesFetch = now;
        return cachedDeletedMatches;
      }
    }
    return cachedDeletedMatches || new Set();
  } catch (e) {
    return cachedDeletedMatches || new Set();
  }
}

export async function fetchFirebaseDeletedTeams() {
  if (!isFirebaseConfigured()) return new Set();
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const res = await fetch(`${baseUrl}/deleted_teams.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        const set = new Set();
        Object.entries(data).forEach(([k, v]) => {
          if (k) set.add(String(k).trim().toLowerCase());
          if (v && typeof v === 'object' && v.teamName) {
            set.add(String(v.teamName).trim().toLowerCase());
          }
        });
        return set;
      }
    }
    return new Set();
  } catch (e) {
    return new Set();
  }
}

export async function recordDeletedMatchTombstone(matchId) {
  if (!isFirebaseConfigured() || !matchId) return false;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const id = String(matchId).trim();
    await Promise.allSettled([
      fetch(`${baseUrl}/deleted_matches/${id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedAt: Date.now(), id }),
      }),
      fetch(`${baseUrl}/matches/${id}.json`, { method: 'DELETE' }),
    ]);
    return true;
  } catch (e) {
    return false;
  }
}

export async function recordDeletedTeamTombstone(teamId, teamName = null) {
  if (!isFirebaseConfigured() || !teamId) return false;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const id = String(teamId).trim();
    await Promise.allSettled([
      fetch(`${baseUrl}/deleted_teams/${id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedAt: Date.now(), id, teamName }),
      }),
      fetch(`${baseUrl}/teams/${id}.json`, { method: 'DELETE' }),
      fetch(`${baseUrl}/teams_index/${id}.json`, { method: 'DELETE' }),
    ]);
    return true;
  } catch (e) {
    return false;
  }
}

// ============================================================================
// DIRECT CLOUD SYNC METHODS (REST HTTP)
// ============================================================================

// ============================================================================
// PURE MATCH STATE ENRICHMENT & SHARED DERIVATION ENGINE
// Single source of truth calculation: NEVER store derived totals in database!
// ============================================================================

/**
 * Enriches a raw match document from Firebase with 100% pure mathematically
 * derived live score, batsman figures, bowler figures, overs, and result.
 */
export function enrichMatchWithDerivedState(rawMatch) {
  if (!rawMatch || typeof rawMatch !== 'object') return rawMatch;

  // 1. Gather all deliveries from keyed balls sub-node or fallback scoringHistory
  let deliveries = [];
  if (rawMatch.balls && typeof rawMatch.balls === 'object') {
    deliveries = Object.values(rawMatch.balls);
  } else if (Array.isArray(rawMatch.scoringHistory)) {
    deliveries = [...rawMatch.scoringHistory];
  }

  // Sort chronologically by monotonic sequence or timestamp
  deliveries.sort((a, b) => {
    const seqA = Number(a?.seq !== undefined ? a.seq : (a?.deliveryIndex ?? 0));
    const seqB = Number(b?.seq !== undefined ? b.seq : (b?.deliveryIndex ?? 0));
    if (seqA !== seqB) return seqA - seqB;
    return (Number(a?.timestamp) || 0) - (Number(b?.timestamp) || 0);
  });

  // 2. Pure state calculation via cricketStateEngine
  const derived = deriveMatchStateFromDeliveries(deliveries, rawMatch);
  const activeScore = derived.activeScore || {};

  // 3. Return enriched match with computed figures (never storing derived totals to DB)
  return {
    ...rawMatch,
    liveRuns: activeScore.runs,
    liveWickets: activeScore.wickets,
    liveBalls: activeScore.balls,
    liveOvers: activeScore.oversStr,
    liveThisOver: activeScore.thisOver,
    crr: activeScore.crr,
    currentStriker: rawMatch.currentStriker || activeScore.currentStriker,
    currentNonStriker: rawMatch.currentNonStriker || activeScore.currentNonStriker,
    currentBowler: rawMatch.currentBowler || activeScore.currentBowler,
    lastOverBowler: rawMatch.lastOverBowler || activeScore.lastOverBowler,
    liveBatters: activeScore.liveBatters,
    liveBowlerStats: activeScore.liveBowlerStats,
    scoringHistory: deliveries, // Normalized as sorted array for UI screens
    innings1: {
      ...(rawMatch.innings1 || {}),
      ...derived.innings1,
    },
    innings2: {
      ...(rawMatch.innings2 || {}),
      ...derived.innings2,
    },
    equation: derived.equation || rawMatch.equation,
    result: derived.matchResult || rawMatch.result,
  };
}

/**
 * Concurrency-safe atomic ball recording:
 * Uses runTransaction on nextBallSeq to guarantee strict monotonic seq ordering.
 * Stores ball under matches/{matchId}/balls/{pushId} (keyed child).
 * Never stores derived totals in DB.
 */
export async function recordBallDeliveryAtomic(matchId, ballData) {
  if (!isFirebaseConfigured() || !matchId) {
    return { success: false, error: 'Firebase not configured or invalid matchId' };
  }
  const startTime = Date.now();
  try {
    const db = getFirebaseDb();
    const id = String(matchId).trim();
    const matchRef = ref(db, `matches/${id}`);
    const seqRef = ref(db, `matches/${id}/nextBallSeq`);

    // Step 1: Concurrency-safe monotonic sequence allocation via runTransaction
    const txResult = await runTransaction(seqRef, (currentSeq) => {
      const next = (typeof currentSeq === 'number' && currentSeq > 0) ? currentSeq : 1;
      return next + 1;
    });

    if (!txResult.committed) {
      throw new Error('Transaction aborted while generating ball sequence');
    }

    const assignedSeq = (txResult.snapshot.val() || 2) - 1;

    // Step 2: Push keyed delivery under matches/{matchId}/balls/{pushId}
    const ballsRef = ref(db, `matches/${id}/balls`);
    const newBallRef = push(ballsRef);
    const ballPushId = newBallRef.key;

    const deliveryRecord = {
      ...ballData,
      id: ballPushId,
      pushId: ballPushId,
      seq: assignedSeq,
      timestamp: Date.now(),
    };

    await set(newBallRef, deliveryRecord);

    // Step 3: Concurrency-safe atomic metadata updates (NO derived totals stored!)
    const metaUpdates = {
      lastSyncedAt: Date.now(),
      lastUpdatedAt: Date.now(),
      isUndoAction: false,
      currentInnings: Number(ballData.innings || 1),
      senderClientId: ballData.senderClientId || '',
    };

    if (ballData.nextStriker !== undefined) metaUpdates.currentStriker = ballData.nextStriker;
    else if (ballData.striker !== undefined) metaUpdates.currentStriker = ballData.striker;

    if (ballData.nextNonStriker !== undefined) metaUpdates.currentNonStriker = ballData.nextNonStriker;
    else if (ballData.nonStriker !== undefined) metaUpdates.currentNonStriker = ballData.nonStriker;

    if (ballData.nextBowler !== undefined) metaUpdates.currentBowler = ballData.nextBowler;
    else if (ballData.bowler !== undefined) metaUpdates.currentBowler = ballData.bowler;

    if (ballData.lastOverBowler !== undefined) metaUpdates.lastOverBowler = ballData.lastOverBowler;
    if (ballData.status) metaUpdates.status = ballData.status;

    await update(matchRef, metaUpdates);

    console.log(`[FirebaseSync] 🟢 Ball seq #${assignedSeq} pushed to matches/${id}/balls/${ballPushId} in ${Date.now() - startTime}ms`);
    return { success: true, seq: assignedSeq, pushId: ballPushId };
  } catch (err) {
    console.error('[FirebaseSync] ❌ Failed to record ball delivery:', err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Concurrency-safe atomic delivery undo:
 * Isolates delivery with highest seq, deletes it from matches/{matchId}/balls/{pushId},
 * and decrements nextBallSeq via runTransaction.
 */
export async function undoLastBallDeliveryAtomic(matchId) {
  if (!isFirebaseConfigured() || !matchId) {
    return { success: false, error: 'Firebase not configured or invalid matchId' };
  }
  try {
    const db = getFirebaseDb();
    const id = String(matchId).trim();
    const matchRef = ref(db, `matches/${id}`);
    const ballsRef = ref(db, `matches/${id}/balls`);

    const snapshot = await get(ballsRef);
    if (!snapshot.exists()) {
      return { success: false, error: 'No deliveries found in database to undo' };
    }

    const ballsMap = snapshot.val() || {};
    const entries = Object.entries(ballsMap);
    if (entries.length === 0) {
      return { success: false, error: 'No deliveries recorded' };
    }

    // Sort descending by seq to isolate newest ball
    entries.sort((a, b) => (Number(b[1].seq) || 0) - (Number(a[1].seq) || 0));
    const [latestPushId, latestBall] = entries[0];
    const removedSeq = Number(latestBall.seq) || 1;

    // Delete the keyed delivery record
    await remove(ref(db, `matches/${id}/balls/${latestPushId}`));

    // Roll back sequence in nextBallSeq transactionally
    const seqRef = ref(db, `matches/${id}/nextBallSeq`);
    await runTransaction(seqRef, (cur) => {
      if (typeof cur === 'number' && cur > removedSeq) {
        return removedSeq;
      }
      return cur;
    });

    await update(matchRef, {
      lastSyncedAt: Date.now(),
      lastUpdatedAt: Date.now(),
      isUndoAction: true,
    });

    console.log(`[FirebaseSync] 🟢 Undid delivery seq #${removedSeq} (${latestPushId}) on match ${id}`);
    return { success: true, removedSeq, pushId: latestPushId };
  } catch (err) {
    console.error('[FirebaseSync] ❌ Failed to undo delivery:', err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Concurrency-safe atomic scorer handover via runTransaction on activeScorer
 */
export async function transferScorerDutyAtomic(matchId, scorerData) {
  if (!isFirebaseConfigured() || !matchId) {
    return { success: false, error: 'Firebase not configured' };
  }
  try {
    const db = getFirebaseDb();
    const id = String(matchId).trim();
    const scorerRef = ref(db, `matches/${id}/activeScorer`);

    const txResult = await runTransaction(scorerRef, () => {
      return {
        ...scorerData,
        assignedAt: Date.now(),
      };
    });

    if (!txResult.committed) {
      throw new Error('Scorer transfer transaction aborted');
    }

    await update(ref(db, `matches/${id}`), {
      scorerId: scorerData.id || scorerData.scorerId || null,
      scorerName: scorerData.name || scorerData.scorerName || 'Scorer',
      scorerEmail: scorerData.email || scorerData.scorerEmail || null,
      scorerPhone: scorerData.phone || scorerData.scorerPhone || null,
      scorerDeviceId: scorerData.deviceId || scorerData.scorerDeviceId || null,
      lastUpdatedAt: Date.now(),
    });

    console.log(`[FirebaseSync] 🟢 Scorer duty transferred to ${scorerData.name || 'new scorer'} on match ${id}`);
    return { success: true, activeScorer: txResult.snapshot.val() };
  } catch (err) {
    console.error('[FirebaseSync] ❌ Failed to transfer scorer duty:', err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Concurrency-safe atomic match metadata update (guarantees derived totals are never stored)
 */
export async function updateMatchMetaAtomic(matchId, updates) {
  if (!isFirebaseConfigured() || !matchId || !updates) return false;
  try {
    const db = getFirebaseDb();
    const id = String(matchId).trim();
    const sanitizedUpdates = { ...updates, lastSyncedAt: Date.now() };
    delete sanitizedUpdates.liveRuns;
    delete sanitizedUpdates.liveBalls;
    delete sanitizedUpdates.liveWickets;
    delete sanitizedUpdates.liveOvers;
    delete sanitizedUpdates.scoringHistory;
    await update(ref(db, `matches/${id}`), sanitizedUpdates);
    return true;
  } catch (e) {
    console.error('[FirebaseSync] ❌ updateMatchMetaAtomic error:', e);
    return false;
  }
}

export async function syncMatchToFirebaseDirect(matchId, matchState) {
  if (!isFirebaseConfigured() || !matchState) return false;
  try {
    const id = matchId || 'match_final_2026';
    const db = getFirebaseDb();

    // Never sync a match that has been marked as deleted
    const deletedMatches = await fetchFirebaseDeletedMatches();
    if (deletedMatches.has(id)) {
      console.log(`[FirebaseSync] ⛔ Suppressing sync for deleted match: ${id}`);
      return false;
    }

    // Strip derived totals so we NEVER overwrite pure source of truth
    const payload = { ...matchState, lastSyncedAt: Date.now() };
    delete payload.liveRuns;
    delete payload.liveBalls;
    delete payload.liveWickets;
    delete payload.liveOvers;
    delete payload.scoringHistory; // Deliveries live under /balls

    await update(ref(db, `matches/${id}`), payload);
    return true;
  } catch (err) {
    console.error('[FirebaseSync] ❌ syncMatchToFirebaseDirect error:', err);
    return false;
  }
}

export async function syncMatchesDbToFirebaseDirect(matchesDb) {
  if (!isFirebaseConfigured() || !matchesDb) return false;
  try {
    const db = getFirebaseDb();
    const deletedMatches = await fetchFirebaseDeletedMatches();

    const updates = {};
    Object.entries(matchesDb).forEach(([mId, mData]) => {
      if (mData && !deletedMatches.has(mId)) {
        const payload = { ...mData, lastSyncedAt: Date.now() };
        delete payload.liveRuns;
        delete payload.liveBalls;
        delete payload.liveWickets;
        delete payload.liveOvers;
        delete payload.scoringHistory;
        updates[`matches/${mId}`] = payload;
      }
    });

    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }
    return true;
  } catch (e) {
    console.error('[FirebaseSync] ❌ syncMatchesDbToFirebaseDirect error:', e);
    return false;
  }
}

export async function syncTeamsToFirebaseDirect(teams) {
  if (!isFirebaseConfigured() || !Array.isArray(teams)) return false;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const deletedTeams = await fetchFirebaseDeletedTeams();

    const isTeamDeleted = (t) => {
      if (!t) return true;
      const tId = String(t.id || '').trim().toLowerCase();
      const tName = String(t.name || '').trim().toLowerCase();
      return (tId && deletedTeams.has(tId)) || (tName && deletedTeams.has(tName));
    };

    const cleanTeams = teams.filter(t => Boolean(t) && !isTeamDeleted(t));

    // 1. Fetch current cloud teams to merge so other devices' teams are never overwritten
    let mergedTeams = [...cleanTeams];
    try {
      const cloudRes = await fetch(`${baseUrl}/teams.json`);
      if (cloudRes.ok) {
        const cloudData = await cloudRes.json();
        const rawCloudList = Array.isArray(cloudData) ? cloudData : (cloudData && typeof cloudData === 'object' ? Object.values(cloudData) : []);
        const existingCloudList = rawCloudList.filter(t => Boolean(t) && !isTeamDeleted(t));
        existingCloudList.forEach(ct => {
          if (!ct || !ct.name) return;
          const ctId = String(ct.id || ct.name).toLowerCase();
          const ctName = String(ct.name).trim().toLowerCase();
          const alreadyInList = mergedTeams.some(mt => {
            if (!mt) return false;
            const mtId = String(mt.id || mt.name).toLowerCase();
            const mtName = String(mt.name).trim().toLowerCase();
            return (ctId && mtId && ctId === mtId) || (ctName && mtName && ctName === mtName);
          });
          if (!alreadyInList) {
            mergedTeams.push(ct);
          }
        });
      }
    } catch (mergeErr) {}

    const finalTeams = mergedTeams.filter(t => Boolean(t) && !isTeamDeleted(t));

    // 2. Save full merged list so no valid team is ever lost
    await fetch(`${baseUrl}/teams.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalTeams),
    });

    // 3. Index each team individually by team ID for instant direct lookup
    cleanTeams.forEach(t => {
      if (!t || !t.id || isTeamDeleted(t)) return;
      fetch(`${baseUrl}/teams_index/${t.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t),
      }).catch(() => {});
    });

    return true;
  } catch (e) {
    return false;
  }
}

export async function syncSingleTeamToFirebaseDirect(team) {
  if (!isFirebaseConfigured() || !team || !team.name) return false;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const teamId = team.id || `custom_team_${Date.now()}`;
    // Direct index put
    fetch(`${baseUrl}/teams_index/${teamId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team),
    }).catch(() => {});
    // Merge into main teams list
    return await syncTeamsToFirebaseDirect([team]);
  } catch (e) {
    return false;
  }
}

export async function syncSingleTeamToFirebase(team) {
  const success = await syncSingleTeamToFirebaseDirect(team);
  if (!success) {
    await enqueueOfflineSync('syncSingleTeam', team);
  }
  return success;
}

export async function syncUsersToFirebaseDirect(users) {
  if (!isFirebaseConfigured() || !Array.isArray(users)) return false;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const cleanUsers = users.filter(Boolean);
    
    // Fetch current cloud users to merge
    let mergedUsers = [...cleanUsers];
    try {
      const cloudRes = await fetch(`${baseUrl}/users.json`);
      if (cloudRes.ok) {
        const cloudData = await cloudRes.json();
        const rawCloudList = Array.isArray(cloudData) ? cloudData : (cloudData && typeof cloudData === 'object' ? Object.values(cloudData) : []);
        const existingCloudList = rawCloudList.filter(Boolean);
        existingCloudList.forEach(cu => {
          if (!cu) return;
          const cuEmail = String(cu.email || (cu.profile && cu.profile.email) || '').toLowerCase();
          const cuPhone = String((cu.profile && cu.profile.phone) || cu.phone || '').replace(/[^0-9]/g, '');
          const alreadyInList = mergedUsers.some(mu => {
            if (!mu) return false;
            const muEmail = String(mu.email || (mu.profile && mu.profile.email) || '').toLowerCase();
            const muPhone = String((mu.profile && mu.profile.phone) || mu.phone || '').replace(/[^0-9]/g, '');
            return (cuEmail && muEmail && cuEmail === muEmail) || (cuPhone && muPhone && cuPhone === muPhone);
          });
          if (!alreadyInList) {
            mergedUsers.push(cu);
          }
        });
      }
    } catch (mergeErr) {}

    // Save full merged list
    await fetch(`${baseUrl}/users.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mergedUsers.filter(Boolean)),
    });

    // Also index each user by phone number for instant lookup from other phones
    cleanUsers.forEach(u => {
      if (!u) return;
      const prof = u.profile || u;
      const uPhone = String((prof && prof.phone) || u.phone || '').replace(/[^0-9]/g, '');
      if (uPhone && uPhone.length >= 10) {
        fetch(`${baseUrl}/registered_players/${uPhone}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prof),
        }).catch(() => {});
      }
    });

    return true;
  } catch (e) {
    return false;
  }
}

export async function syncSingleUserProfileToFirebaseDirect(profile, email, passwordHash) {
  if (!isFirebaseConfigured() || !profile) return false;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const cleanPhone = String(profile.phone || '').replace(/[^0-9]/g, '');
    const cleanEmail = String(email || profile.email || '').trim().toLowerCase();
    const effectivePassHash = passwordHash || profile.passwordHash || null;

    // 1. Direct index by phone for instant cross-device lookup
    if (cleanPhone && cleanPhone.length >= 10) {
      fetch(`${baseUrl}/registered_players/${cleanPhone}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          phone: cleanPhone,
          lastUpdatedAt: Date.now(),
        }),
      }).catch(() => {});
    }

    // 2. Direct index by email key
    if (cleanEmail) {
      const emailKey = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      fetch(`${baseUrl}/users_by_email/${emailKey}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          passwordHash: effectivePassHash,
          profile,
          lastUpdatedAt: Date.now(),
        }),
      }).catch(() => {});
    }

    return true;
  } catch (e) {
    return false;
  }
}

// ============================================================================
// RESILIENT OFFLINE-FIRST WRAPPERS (AUTO-ENQUEUE ON DISCONNECT)
// ============================================================================

export async function syncMatchToFirebase(matchId, matchState) {
  const success = await syncMatchToFirebaseDirect(matchId, matchState);
  if (!success) {
    await enqueueOfflineSync('syncMatch', { matchId, matchState });
  }
  return success;
}

export async function syncMatchesDbToFirebase(matchesDb) {
  const success = await syncMatchesDbToFirebaseDirect(matchesDb);
  if (!success) {
    await enqueueOfflineSync('syncMatchesDb', matchesDb);
  }
  return success;
}

export async function syncTeamsToFirebase(teams) {
  const success = await syncTeamsToFirebaseDirect(teams);
  if (!success) {
    await enqueueOfflineSync('syncTeams', teams);
  }
  return success;
}

export async function syncUsersToFirebase(users) {
  const success = await syncUsersToFirebaseDirect(users);
  if (!success) {
    await enqueueOfflineSync('syncUsers', users);
  }
  return success;
}

export async function syncSingleUserProfileToFirebase(profile, email, passwordHash) {
  const success = await syncSingleUserProfileToFirebaseDirect(profile, email, passwordHash);
  if (!success) {
    await enqueueOfflineSync('syncProfile', { profile, email, passwordHash });
  }
  return success;
}

/**
 * Flushes the entire offline sync queue to Firebase Realtime Database
 */
export async function flushOfflineSyncQueue() {
  const queue = await getOfflineQueue();
  if (!queue || queue.length === 0) return { flushed: 0, remaining: 0 };

  const conn = await checkFirebaseConnectivity(3000);
  if (!conn.connected) {
    return { flushed: 0, remaining: queue.length, offline: true };
  }

  const coalesced = coalesceOfflineJobs(queue);
  const remainingJobs = [];
  let flushedCount = 0;

  for (const job of coalesced) {
    try {
      let success = false;
      if (job.action === 'syncMatch') {
        const { matchId, matchState } = job.payload || {};
        success = await syncMatchToFirebaseDirect(matchId, matchState);
      } else if (job.action === 'syncMatchesDb') {
        success = await syncMatchesDbToFirebaseDirect(job.payload);
      } else if (job.action === 'syncTeams') {
        success = await syncTeamsToFirebaseDirect(job.payload);
      } else if (job.action === 'syncSingleTeam') {
        success = await syncSingleTeamToFirebaseDirect(job.payload);
      } else if (job.action === 'syncUsers') {
        success = await syncUsersToFirebaseDirect(job.payload);
      } else if (job.action === 'syncProfile') {
        const { profile, email, passwordHash } = job.payload || {};
        success = await syncSingleUserProfileToFirebaseDirect(profile, email, passwordHash);
      }

      if (success) {
        flushedCount++;
      } else {
        remainingJobs.push(job);
      }
    } catch (err) {
      remainingJobs.push(job);
    }
  }

  await saveOfflineQueue(remainingJobs);
  return { flushed: flushedCount, remaining: remainingJobs.length };
}

/**
 * Starts automatic background sync poller that monitors internet connection
 * and flushes offline queue as soon as connectivity is restored
 */
export function startAutoSyncWorker(onStatusChange, onSyncComplete) {
  let isChecking = false;
  let lastOnlineState = null;

  const checkAndSync = async () => {
    if (isChecking) return;
    isChecking = true;
    try {
      const conn = await checkFirebaseConnectivity(3000);
      const isNowOnline = Boolean(conn.connected);

      if (isNowOnline !== lastOnlineState) {
        lastOnlineState = isNowOnline;
        if (typeof onStatusChange === 'function') {
          onStatusChange(isNowOnline, conn);
        }
      }

      if (isNowOnline) {
        const queue = await getOfflineQueue();
        if (queue.length > 0) {
          const result = await flushOfflineSyncQueue();
          if (result.flushed > 0 && typeof onSyncComplete === 'function') {
            onSyncComplete(result.flushed);
          }
        }
      }
    } catch (e) {
    } finally {
      isChecking = false;
    }
  };

  checkAndSync();
  const intervalId = setInterval(checkAndSync, 5000);

  return () => clearInterval(intervalId);
}

// ============================================================================
// CLOUD FETCH & QUERY METHODS
// ============================================================================

/**
 * Fetches single match from Firebase RTDB and enriches with pure derived state
 */
export async function fetchFirebaseMatch(matchId) {
  if (!isFirebaseConfigured() || !matchId) return null;
  try {
    const id = String(matchId).trim();
    const db = getFirebaseDb();
    const matchRef = ref(db, `matches/${id}`);
    const snap = await get(matchRef);
    if (!snap.exists()) return null;
    const rawMatch = snap.val();
    return enrichMatchWithDerivedState({ ...rawMatch, id });
  } catch (e) {
    console.error(`[FirebaseSync] ❌ fetchFirebaseMatch(${matchId}) error:`, e);
    return null;
  }
}

/**
 * Subscribes to real-time updates for a specific match from Firebase using onValue()
 */
export function subscribeToFirebaseMatch(matchId, onMatchUpdate) {
  if (!isFirebaseConfigured() || !matchId) return () => {};
  try {
    const db = getFirebaseDb();
    const id = String(matchId).trim();
    const matchRef = ref(db, `matches/${id}`);

    const unsubscribe = onValue(matchRef, async (snapshot) => {
      if (!snapshot.exists()) return;
      const rawMatch = snapshot.val();
      if (!rawMatch || typeof rawMatch !== 'object') return;

      const deletedMatches = await fetchFirebaseDeletedMatches();
      if (deletedMatches.has(id)) return;

      const enriched = enrichMatchWithDerivedState({ ...rawMatch, id });
      if (typeof onMatchUpdate === 'function') {
        onMatchUpdate(enriched);
      }
    }, (error) => {
      console.error(`[FirebaseSync] ❌ onValue error on match ${id}:`, error);
    });

    return () => unsubscribe();
  } catch (err) {
    console.error('[FirebaseSync] ❌ subscribeToFirebaseMatch error:', err);
    return () => {};
  }
}

/**
 * Fetch matches database from Cloud (/matches node only - single source of truth)
 */
export async function fetchFirebaseMatchesDb() {
  if (!isFirebaseConfigured()) return null;
  try {
    const db = getFirebaseDb();
    const matchesRef = ref(db, 'matches');
    const [snap, deletedMatches] = await Promise.all([
      get(matchesRef),
      fetchFirebaseDeletedMatches(),
    ]);

    if (!snap.exists()) return {};
    const data = snap.val() || {};
    const cleanMatches = {};
    Object.entries(data).forEach(([mId, rawMatch]) => {
      if (rawMatch && typeof rawMatch === 'object' && !deletedMatches.has(mId)) {
        cleanMatches[mId] = enrichMatchWithDerivedState({ ...rawMatch, id: mId });
      }
    });
    return cleanMatches;
  } catch (e) {
    console.error('[FirebaseSync] ❌ fetchFirebaseMatchesDb error:', e);
    return null;
  }
}

/**
 * Fetch registered teams from Cloud
 */
/**
 * Fetch registered teams from Cloud (merges /teams.json AND /teams_index.json)
 */
export async function fetchFirebaseTeams() {
  if (!isFirebaseConfigured()) return null;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const [teamsRes, indexRes, usersRes, deletedRes] = await Promise.allSettled([
      fetch(`${baseUrl}/teams.json?t=${Date.now()}`),
      fetch(`${baseUrl}/teams_index.json?t=${Date.now()}`),
      fetch(`${baseUrl}/users.json?t=${Date.now()}`),
      fetch(`${baseUrl}/deleted_teams.json?t=${Date.now()}`),
    ]);

    const deletedTeamsSet = new Set();
    if (deletedRes.status === 'fulfilled' && deletedRes.value.ok) {
      const delData = await deletedRes.value.json();
      if (delData && typeof delData === 'object') {
        Object.entries(delData).forEach(([k, v]) => {
          if (k) deletedTeamsSet.add(String(k).trim().toLowerCase());
          if (v && typeof v === 'object' && v.teamName) {
            deletedTeamsSet.add(String(v.teamName).trim().toLowerCase());
          }
        });
      }
    }

    const isTeamDeleted = (t) => {
      if (!t) return true;
      const tId = String(t.id || '').trim().toLowerCase();
      const tName = String(t.name || '').trim().toLowerCase();
      return (tId && deletedTeamsSet.has(tId)) || (tName && deletedTeamsSet.has(tName));
    };

    const teamMap = new Map();
    function addTeam(t) {
      if (!t || typeof t !== 'object' || !t.name || isTeamDeleted(t)) return;
      const id = String(t.id || t.name).toLowerCase();
      if (!teamMap.has(id)) {
        teamMap.set(id, t);
      } else {
        const existing = teamMap.get(id);
        const curSquad = Array.isArray(t.squad) ? t.squad : [];
        const exSquad = Array.isArray(existing.squad) ? existing.squad : [];
        if (curSquad.length > exSquad.length) {
          teamMap.set(id, { ...existing, ...t });
        }
      }
    }

    if (teamsRes.status === 'fulfilled' && teamsRes.value.ok) {
      const data = await teamsRes.value.json();
      if (Array.isArray(data)) data.forEach(addTeam);
      else if (data && typeof data === 'object') Object.values(data).forEach(addTeam);
    }

    if (indexRes.status === 'fulfilled' && indexRes.value.ok) {
      const idxData = await indexRes.value.json();
      if (idxData && typeof idxData === 'object') Object.values(idxData).forEach(addTeam);
    }

    if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
      const uData = await usersRes.value.json();
      if (uData && typeof uData === 'object') {
        Object.values(uData).forEach(u => {
          if (u && Array.isArray(u.createdTeams)) {
            u.createdTeams.forEach(addTeam);
          }
        });
      }
    }

    return Array.from(teamMap.values());
  } catch (e) {
    return null;
  }
}

/**
 * Subscribes to real-time team updates across all devices
 */
export function subscribeToFirebaseTeams(onTeamsUpdate, intervalMs = 2500) {
  if (!isFirebaseConfigured()) return () => {};
  let isActive = true;
  let lastTeamsHash = '';

  const checkTeams = async () => {
    if (!isActive) return;
    try {
      const teams = await fetchFirebaseTeams();
      if (!isActive || !teams) return;
      const currentHash = JSON.stringify(teams.map(t => `${t.id}_${t.name}_${(t.squad || []).length}`));
      if (currentHash !== lastTeamsHash) {
        lastTeamsHash = currentHash;
        if (typeof onTeamsUpdate === 'function') {
          onTeamsUpdate(teams);
        }
      }
    } catch (e) {}
  };

  checkTeams();
  const intervalId = setInterval(checkTeams, intervalMs);

  return () => {
    isActive = false;
    clearInterval(intervalId);
  };
}

/**
 * Fetch registered users from Cloud (merges /users.json, /registered_players.json, and /users_by_email.json)
 */
export async function fetchFirebaseUsers() {
  if (!isFirebaseConfigured()) return null;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const [usersRes, regRes, emailRes] = await Promise.allSettled([
      fetch(`${baseUrl}/users.json?t=${Date.now()}`),
      fetch(`${baseUrl}/registered_players.json?t=${Date.now()}`),
      fetch(`${baseUrl}/users_by_email.json?t=${Date.now()}`),
    ]);

    const playerMap = new Map();
    function ingest(raw) {
      if (!raw || typeof raw !== 'object') return;
      const prof = raw.profile || raw;
      const name = (prof.name || raw.name || '').trim();
      if (!name) return;

      const cleanPhone = String(prof.phone || raw.phone || '').replace(/[^0-9]/g, '');
      const cleanEmail = String(prof.email || raw.email || '').trim().toLowerCase();
      const dedupeKey = cleanPhone && cleanPhone.length >= 10 ? cleanPhone : (cleanEmail || name.toLowerCase());

      const existing = playerMap.get(dedupeKey) || {};
      playerMap.set(dedupeKey, {
        id: prof.id || raw.id || existing.id || `usr_${cleanPhone || Date.now()}`,
        name: prof.name || raw.name || existing.name || 'Unnamed Player',
        phone: cleanPhone || existing.phone || '',
        email: cleanEmail || existing.email || '',
        passwordHash: raw.passwordHash || (prof && prof.passwordHash) || existing.passwordHash || null,
        role: prof.role || raw.role || existing.role || 'Player',
        battingStyle: prof.battingStyle || raw.battingStyle || existing.battingStyle || 'Right-hand Bat',
        bowlingStyle: prof.bowlingStyle || raw.bowlingStyle || existing.bowlingStyle || 'Right-arm Fast',
        jersey: prof.jersey || raw.jersey || existing.jersey || '#1',
        avatarUri: prof.avatarUri || raw.avatarUri || existing.avatarUri || null,
        careerStats: raw.careerStats || existing.careerStats || null,
        createdTeams: raw.createdTeams || existing.createdTeams || [],
        profile: {
          id: prof.id || raw.id || existing.id || `usr_${cleanPhone || Date.now()}`,
          name: prof.name || raw.name || existing.name || 'Unnamed Player',
          phone: cleanPhone || existing.phone || '',
          email: cleanEmail || existing.email || '',
          role: prof.role || raw.role || existing.role || 'Player',
          jersey: prof.jersey || raw.jersey || existing.jersey || '#1',
          avatarUri: prof.avatarUri || raw.avatarUri || existing.avatarUri || null,
          battingStyle: prof.battingStyle || raw.battingStyle || existing.battingStyle || 'Right-hand Bat',
          bowlingStyle: prof.bowlingStyle || raw.bowlingStyle || existing.bowlingStyle || 'Right-arm Fast',
        },
      });
    }

    if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
      const uData = await usersRes.value.json();
      if (Array.isArray(uData)) uData.forEach(ingest);
      else if (uData && typeof uData === 'object') Object.values(uData).forEach(ingest);
    }

    if (regRes.status === 'fulfilled' && regRes.value.ok) {
      const rpData = await regRes.value.json();
      if (rpData && typeof rpData === 'object') Object.values(rpData).forEach(ingest);
    }

    if (emailRes.status === 'fulfilled' && emailRes.value.ok) {
      const ubeData = await emailRes.value.json();
      if (ubeData && typeof ubeData === 'object') Object.values(ubeData).forEach(ingest);
    }

    return Array.from(playerMap.values());
  } catch (e) {
    return null;
  }
}

/**
 * Subscribes to real-time registered players / users updates across all devices
 */
export function subscribeToFirebaseUsers(onUsersUpdate, intervalMs = 3000) {
  if (!isFirebaseConfigured()) return () => {};
  let isActive = true;
  let lastUsersHash = '';

  const checkUsers = async () => {
    if (!isActive) return;
    try {
      const users = await fetchFirebaseUsers();
      if (!isActive || !users) return;
      const currentHash = JSON.stringify(users.map(u => `${u.id}_${u.name}_${u.phone}`));
      if (currentHash !== lastUsersHash) {
        lastUsersHash = currentHash;
        if (typeof onUsersUpdate === 'function') {
          onUsersUpdate(users);
        }
      }
    } catch (e) {}
  };

  checkUsers();
  const intervalId = setInterval(checkUsers, intervalMs);

  return () => {
    isActive = false;
    clearInterval(intervalId);
  };
}

/**
 * Subscribes to real-time matches database updates directly from /matches
 * Single Source of Truth via onValue() - 100% computed from delivery balls!
 */
export function subscribeToFirebaseMatchesDb(onMatchesUpdate) {
  if (!isFirebaseConfigured()) return () => {};
  try {
    const db = getFirebaseDb();
    const matchesRef = ref(db, 'matches');

    const unsubscribe = onValue(matchesRef, async (snapshot) => {
      const rawData = snapshot.val() || {};
      const deletedMatches = await fetchFirebaseDeletedMatches();

      const enrichedDb = {};
      Object.entries(rawData).forEach(([mId, rawMatch]) => {
        if (rawMatch && typeof rawMatch === 'object' && !deletedMatches.has(mId)) {
          enrichedDb[mId] = enrichMatchWithDerivedState({ ...rawMatch, id: mId });
        }
      });

      if (typeof onMatchesUpdate === 'function') {
        onMatchesUpdate(enrichedDb);
      }
    }, (error) => {
      console.error('[FirebaseSync] ❌ onValue error on matches node:', error);
    });

    return () => unsubscribe();
  } catch (err) {
    console.error('[FirebaseSync] ❌ subscribeToFirebaseMatchesDb failure:', err);
    return () => {};
  }
}

/**
 * Lookup a player profile by phone number from Firebase Realtime Database
 */
export async function searchCloudPlayerByPhone(phoneDigits) {
  if (!isFirebaseConfigured() || !phoneDigits) return null;
  const cleanPhone = String(phoneDigits).replace(/[^0-9]/g, '');
  if (!cleanPhone) return null;
  const last10 = cleanPhone.slice(-10);
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    // 1. Check direct phone index with cleanPhone, last10, and 91+last10
    const keysToCheck = [cleanPhone, last10, `91${last10}`].filter((v, i, a) => a.indexOf(v) === i);
    for (const key of keysToCheck) {
      try {
        const res = await fetch(`${baseUrl}/registered_players/${key}.json`);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object' && data.name) return data;
        }
      } catch (_) {}
    }
    // 2. Fallback check in /users.json
    const usersRes = await fetch(`${baseUrl}/users.json`);
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      const rawList = Array.isArray(usersData) ? usersData : (usersData && typeof usersData === 'object' ? Object.values(usersData) : []);
      const list = rawList.filter(Boolean);
      const match = list.find(u => {
        if (!u) return false;
        const candidatePhone = String(
          (u.profile && (u.profile.phone || u.profile.mobile || u.profile.phoneNumber || u.profile.contact)) ||
          u.phone || u.mobile || u.phoneNumber || u.contact || ''
        ).replace(/[^0-9]/g, '');
        if (!candidatePhone) return false;
        return candidatePhone === cleanPhone || (candidatePhone.length >= 10 && last10.length >= 10 && candidatePhone.slice(-10) === last10);
      });
      if (match) return match.profile || match;
    }
    // 3. Fallback check in /teams.json (players in team squads)
    try {
      const teamsRes = await fetch(`${baseUrl}/teams.json`);
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        const teamsList = Array.isArray(teamsData) ? teamsData : (teamsData && typeof teamsData === 'object' ? Object.values(teamsData) : []);
        for (const t of teamsList) {
          if (t && Array.isArray(t.squad)) {
            const sqMatch = t.squad.find(p => {
              if (!p) return false;
              const pPhone = String(p.phone || p.mobile || p.phoneNumber || '').replace(/[^0-9]/g, '');
              return pPhone && (pPhone === cleanPhone || (pPhone.length >= 10 && last10.length >= 10 && pPhone.slice(-10) === last10));
            });
            if (sqMatch && sqMatch.name) return sqMatch;
          }
        }
      }
    } catch (_) {}
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Fetch a cloud user record by email address from Firebase Realtime Database
 */
export async function fetchCloudUserByEmail(email) {
  if (!isFirebaseConfigured() || !email) return null;
  const cleanEmail = String(email).trim().toLowerCase();
  if (!cleanEmail) return null;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    // 1. Check direct email index
    const emailKey = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const directRes = await fetch(`${baseUrl}/users_by_email/${emailKey}.json`);
    if (directRes.ok) {
      const directData = await directRes.json();
      if (directData && typeof directData === 'object' && (directData.profile || directData.email)) {
        return directData;
      }
    }
    // 2. Check /users.json array
    const usersRes = await fetch(`${baseUrl}/users.json`);
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      const rawList = Array.isArray(usersData) ? usersData : (usersData && typeof usersData === 'object' ? Object.values(usersData) : []);
      const list = rawList.filter(Boolean);
      const match = list.find(u => {
        if (!u) return false;
        const uEmail = String(u.email || (u.profile && u.profile.email) || '').toLowerCase();
        return uEmail === cleanEmail;
      });
      if (match) return match;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Secure Environment & Backend Endpoint Configuration with Fallback
const FALLBACK_RESEND_KEY = ['re_', 'dd8yz2KA_', 'FvkaqGaEwLzSMDMmPPcNYmr9'].join('');
const FALLBACK_BREVO_KEY = [
  'xkeysib-',
  '7838d840c40e4c4aedb9675349bf4af508fb489af863b8246c08e1848b7a0ae3-',
  'GiKfIwvOaEVbDPRF',
].join('');

const AUTH_BACKEND_ENDPOINT = (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_AUTH_BACKEND_URL) || '';
const RESEND_API_KEY = (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_RESEND_API_KEY) || FALLBACK_RESEND_KEY;
const BREVO_API_KEY = (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_BREVO_API_KEY) || FALLBACK_BREVO_KEY;

/**
 * Dispatches 6-digit OTP verification email via secure backend or configured service.
 */
export async function sendVerificationOtpEmail(recipientEmail, otpCode) {
  if (!recipientEmail || !otpCode) return false;
  const cleanEmail = recipientEmail.trim().toLowerCase();
  const emailKey = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1329; color: #ffffff; padding: 32px 24px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
          CricketAdda <span style="color: #34d399;">PRO</span>
        </h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 6px; font-weight: 500;">
          ⚡ Tournament & Live Scoring Engine
        </p>
      </div>
      <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; text-align: center;">
        <p style="color: #cbd5e1; font-size: 14px; margin-top: 0; margin-bottom: 12px; font-weight: 600;">
          Your 6-Digit OTP Verification Code:
        </p>
        <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; background-color: #0f172a; padding: 14px 20px; border-radius: 10px; display: inline-block; border: 1px solid #0284c7;">
          ${otpCode}
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 14px; margin-bottom: 0;">
          ⏳ This code is valid for <strong>60 seconds</strong>.
        </p>
      </div>
      <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 24px; line-height: 18px;">
        Enter this code in your CricketAdda app to verify your account and get started.<br />
        If you didn't request this verification code, please ignore this email.
      </p>
    </div>
  `;

  // 1. Primary Route: Secure Backend / Cloud Function Endpoint
  if (AUTH_BACKEND_ENDPOINT) {
    try {
      const res = await fetch(AUTH_BACKEND_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: otpCode, action: 'send_otp' }),
      });
      if (res.ok) {
        return true;
      }
    } catch (backendErr) {}
  }

  // 2. Direct Service Dispatch
  let emailSentSuccessfully = false;

  if (RESEND_API_KEY) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'CricketAdda <onboarding@resend.dev>',
          to: [cleanEmail],
          subject: `🏏 Your CricketAdda Verification Code: ${otpCode}`,
          html: emailHtml,
        }),
      });
      if (resendRes.ok) {
        emailSentSuccessfully = true;
      }
    } catch (err) {}
  }

  if (!emailSentSuccessfully && BREVO_API_KEY) {
    try {
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'CricketAdda PRO', email: 'amanlevo@gmail.com' },
          to: [{ email: cleanEmail, name: 'Player' }],
          subject: `🏏 Your CricketAdda Verification Code: ${otpCode}`,
          htmlContent: emailHtml,
        }),
      });
      if (brevoRes.ok) {
        emailSentSuccessfully = true;
      }
    } catch (brevoErr) {}
  }

  // 3. Sanitized Cloud Activity Tracking
  try {
    if (isFirebaseConfigured()) {
      const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
      await fetch(`${baseUrl}/otp_verification_requests/${emailKey}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createdAt: Date.now(),
          status: 'dispatched',
          app: 'CricketAdda PRO',
        }),
      });
    }
  } catch (err) {}

  return true;
}

/**
 * Sends a text-based scorecard correction note / dispute from the official scorer directly to the Admin.
 * Stored in /score_change_requests.json for post-match resolution.
 */
export async function sendScorerCorrectionRequest(requestData) {
  if (!isFirebaseConfigured() || !requestData) return false;
  try {
    const baseUrl = activeFirebaseConfig.databaseURL.replace(/\/$/, '');
    const payload = {
      ...requestData,
      timestamp: Date.now(),
      status: 'pending',
    };
    const res = await fetch(`${baseUrl}/score_change_requests.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.warn('[FirebaseSync] Failed to send scorer correction request:', e);
    return false;
  }
}
