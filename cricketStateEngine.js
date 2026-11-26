/**
 * CRICKET STATE ENGINE (Single Source of Truth)
 * ============================================================================
 * Pure, deterministic derivation engine.
 * Never stores separate totals that can drift. Every stat (runs, wickets, overs,
 * batter records, bowler records, extras, crr, rrr, this-over) is DERIVED from
 * the immutable sequential delivery events (scoringHistory).
 * ============================================================================
 */

export const KNOWN_PLAYER_ALIASES = {
  'usr_9780425527': ['amandeep', 'amanlevo', 'aman', 'usr_amandeep', 'usr_1792728393426', 'amanlevo@gmail.com', '9780425527'],
  'usr_1793432528758': ['wpardeepkaur', 'wpardeep', 'usr_wpardeep', 'wpardeepkaur@gmail.com'],
};

export const KNOWN_PLAYER_CANONICAL_NAMES = {
  'usr_9780425527': 'Amandeep',
  'usr_1793432528758': 'Wpardeepkaur',
};

/**
 * Resolves any raw player name or legacy alias to its permanent canonical display name.
 * e.g. 'Amanlevo' -> 'Amandeep'
 */
export function resolveCanonicalPlayerName(rawName, pId) {
  if (!rawName) return '';
  const clean = String(rawName).replace(/\s*\([^)]*\)/g, '').trim();
  const lower = clean.toLowerCase();

  // 1. Direct Known Alias check (Amanlevo / Aman -> Amandeep)
  if (lower === 'amanlevo' || lower === 'aman') {
    return 'Amandeep';
  }

  // 2. Normalize through KNOWN_PLAYER_ALIASES / KNOWN_PLAYER_CANONICAL_NAMES
  const normId = normalizePlayerId(pId, clean);
  if (normId && KNOWN_PLAYER_CANONICAL_NAMES[normId]) {
    return KNOWN_PLAYER_CANONICAL_NAMES[normId];
  }

  return clean;
}

export function normalizePlayerId(id, name, phone, email) {
  const cleanId = String(id || '').trim();
  const cleanName = String(name || '').replace(/\s*\([^)]*\)/g, '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const cleanPhone = String(phone || '').replace(/[^0-9]/g, '').slice(-10);
  const cleanEmail = String(email || '').toLowerCase().trim();

  for (const [canonicalId, aliases] of Object.entries(KNOWN_PLAYER_ALIASES)) {
    if (cleanId === canonicalId) return canonicalId;
    for (const alias of aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (
        (cleanId && cleanId.toLowerCase() === cleanAlias) ||
        (cleanName && (cleanName === cleanAlias || cleanName.startsWith(cleanAlias) || cleanAlias.startsWith(cleanName))) ||
        (cleanPhone && cleanPhone === cleanAlias) ||
        (cleanEmail && cleanEmail === cleanAlias)
      ) {
        return canonicalId;
      }
    }
  }

  if (cleanId && cleanId.length > 2 && cleanId !== 'undefined' && cleanId !== 'null') {
    return cleanId;
  }
  if (cleanPhone && cleanPhone.length === 10) {
    return `usr_${cleanPhone}`;
  }
  return null;
}

export function isSamePlayerOrAlias(p1, p2) {
  if (!p1 || !p2) return false;
  const id1 = typeof p1 === 'object' ? (p1.id || p1.playerId) : null;
  const name1 = typeof p1 === 'object' ? (p1.name || p1.playerName || p1.striker || p1.bowler) : p1;
  const phone1 = typeof p1 === 'object' ? p1.phone : null;
  const email1 = typeof p1 === 'object' ? p1.email : null;

  const id2 = typeof p2 === 'object' ? (p2.id || p2.playerId) : null;
  const name2 = typeof p2 === 'object' ? (p2.name || p2.playerName || p2.striker || p2.bowler) : p2;
  const phone2 = typeof p2 === 'object' ? p2.phone : null;
  const email2 = typeof p2 === 'object' ? p2.email : null;

  const normId1 = normalizePlayerId(id1, name1, phone1, email1);
  const normId2 = normalizePlayerId(id2, name2, phone2, email2);

  if (normId1 && normId2 && normId1 === normId2) return true;

  const sName1 = String(name1 || '').replace(/\s*\([^)]*\)/g, '').toLowerCase().trim();
  const sName2 = String(name2 || '').replace(/\s*\([^)]*\)/g, '').toLowerCase().trim();
  if (sName1 && sName2 && sName1 === sName2) return true;

  return false;
}

export function parseBallSymbol(sym) {
  if (!sym) return { runs: 0, isLegal: true, isWkt: false, extraType: 'none' };
  const s = String(sym).trim();
  const isWkt = s.includes('W') && !s.startsWith('Wd');
  const isWide = s.startsWith('Wd');
  const isNoBall = s.startsWith('Nb');
  const isBye = s.endsWith('B') && !isNoBall;
  const isLegBye = s.endsWith('Lb') && !isNoBall;
  const isPenalty = s.endsWith('Pen');

  let runs = 0;
  const cleanDigits = s.replace(/[^0-9]/g, '');
  if (cleanDigits.length > 0) {
    runs = parseInt(cleanDigits, 10) || 0;
  } else if (isWide || isNoBall) {
    runs = 1;
  }

  const isLegal = !isWide && !isNoBall && !isPenalty;
  let extraType = 'none';
  if (isWide) extraType = 'wide';
  else if (isNoBall) extraType = 'noBall';
  else if (isBye) extraType = 'bye';
  else if (isLegBye) extraType = 'legBye';
  else if (isPenalty) extraType = 'penalty';

  return { runs, isLegal, isWkt, extraType };
}

/**
 * Pure function: derive comprehensive innings state from delivery event log.
 */
export function deriveInningsStateFromDeliveries(deliveries = [], inningsNum = 1, matchMeta = {}) {
  const toSafeArray = val => {
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object') return Object.values(val);
    return [];
  };

  // 1. Filter deliveries belonging strictly to this innings
  const rawDeliveries = toSafeArray(deliveries);
  const inningsDeliveries = rawDeliveries.filter(d => {
    if (!d) return false;
    const inn = d.innings !== undefined ? Number(d.innings) : 1;
    return inn === Number(inningsNum);
  });

  let totalRuns = 0;
  let legalBalls = 0;
  let totalWickets = 0;

  const extrasBreakdown = {
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    penalty: 0,
    total: 0,
  };

  const battersMap = {};
  const bowlersMap = {};
  const fowList = [];
  const bowlerOversTracker = {}; // bowler -> array of overs: [ { legalBalls: 0, runsConceded: 0 } ]

  // Pre-populate initial squad if provided (guaranteed safe even if an object or liveBatters was passed)
  const initialBatters = toSafeArray(matchMeta.battingSquad);
  initialBatters.forEach(p => {
    if (!p) return;
    const name = typeof p === 'object' ? (p.name || p.playerName) : p;
    const pId = typeof p === 'object' ? (p.id || p.playerId || null) : null;
    if (name && typeof name === 'string' && name.trim()) {
      const cleanName = name.trim();
      const normId = normalizePlayerId(pId, cleanName, typeof p === 'object' ? p.phone : null, typeof p === 'object' ? p.email : null);
      battersMap[cleanName] = {
        id: normId || pId,
        name: cleanName,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        dots: 0,
        singles: 0,
        doubles: 0,
        triples: 0,
        isNotOut: true,
        dismissal: 'yet to bat',
        strikeRate: '0.0',
        battingOrder: Object.keys(battersMap).length + 1,
      };
    }
  });

  const initialBowlers = toSafeArray(matchMeta.bowlingSquad);
  initialBowlers.forEach(p => {
    if (!p) return;
    const name = typeof p === 'object' ? (p.name || p.bowlerName) : p;
    const pId = typeof p === 'object' ? (p.id || p.playerId || null) : null;
    if (name && typeof name === 'string' && name.trim()) {
      const cleanName = name.trim();
      const normId = normalizePlayerId(pId, cleanName, typeof p === 'object' ? p.phone : null, typeof p === 'object' ? p.email : null);
      bowlersMap[cleanName] = {
        id: normId || pId,
        name: cleanName,
        balls: 0,
        overs: '0.0',
        maidens: 0,
        runs: 0,
        wickets: 0,
        econ: '0.0',
        dots: 0,
        foursConceded: 0,
        sixesConceded: 0,
        style: (typeof p === 'object' && p.role === 'BOWL') ? 'Right-arm Fast' : 'Right-arm Medium',
      };
    }
  });

  // Dynamic entity finders resolving player aliases & unique IDs
  const findBatterEntry = (name, pId) => {
    if (!name && !pId) return null;
    if (name && battersMap[name]) return battersMap[name];
    for (const key of Object.keys(battersMap)) {
      const b = battersMap[key];
      if (isSamePlayerOrAlias(b, { id: pId, name })) {
        return b;
      }
    }
    return null;
  };

  const getOrCreateBatter = (rawName, pId) => {
    const cleanName = (rawName || 'Batter').trim();
    const existing = findBatterEntry(cleanName, pId);
    if (existing) {
      if (pId && !existing.id) {
        existing.id = normalizePlayerId(pId, cleanName) || pId;
      }
      return existing;
    }
    const normId = normalizePlayerId(pId, cleanName);
    const resolvedName = (matchMeta && matchMeta.canonicalPlayerNames && normId && matchMeta.canonicalPlayerNames[normId]) ||
      (normId && KNOWN_PLAYER_CANONICAL_NAMES[normId]) ||
      cleanName;
    const newEntry = {
      id: normId || pId || null,
      name: resolvedName,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      dots: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      isNotOut: true,
      dismissal: 'batting *',
      strikeRate: '0.0',
      battingOrder: Object.keys(battersMap).length + 1,
    };
    battersMap[resolvedName] = newEntry;
    return newEntry;
  };

  const findBowlerEntry = (name, pId) => {
    if (!name && !pId) return null;
    if (name && bowlersMap[name]) return bowlersMap[name];
    for (const key of Object.keys(bowlersMap)) {
      const bw = bowlersMap[key];
      if (isSamePlayerOrAlias(bw, { id: pId, name })) {
        return bw;
      }
    }
    return null;
  };

  const getOrCreateBowler = (rawName, pId) => {
    const cleanName = (rawName || 'Bowler').trim();
    const existing = findBowlerEntry(cleanName, pId);
    if (existing) {
      if (pId && !existing.id) {
        existing.id = normalizePlayerId(pId, cleanName) || pId;
      }
      return existing;
    }
    const normId = normalizePlayerId(pId, cleanName);
    const resolvedName = (matchMeta && matchMeta.canonicalPlayerNames && normId && matchMeta.canonicalPlayerNames[normId]) ||
      (normId && KNOWN_PLAYER_CANONICAL_NAMES[normId]) ||
      cleanName;
    const newEntry = {
      id: normId || pId || null,
      name: resolvedName,
      balls: 0,
      overs: '0.0',
      maidens: 0,
      runs: 0,
      wickets: 0,
      econ: '0.0',
      dots: 0,
      foursConceded: 0,
      sixesConceded: 0,
      style: 'Right-arm Medium',
    };
    bowlersMap[resolvedName] = newEntry;
    return newEntry;
  };

  // Track crease
  let currentStriker = matchMeta.openingStriker || matchMeta.currentStriker || null;
  let currentNonStriker = matchMeta.openingNonStriker || matchMeta.currentNonStriker || null;
  let currentBowler = matchMeta.openingBowler || matchMeta.currentBowler || null;
  let lastOverBowler = null;

  // Set opening batters to 'batting *'
  if (currentStriker) {
    const sB = findBatterEntry(currentStriker);
    if (sB) sB.dismissal = 'batting *';
  }
  if (currentNonStriker) {
    const nsB = findBatterEntry(currentNonStriker);
    if (nsB) nsB.dismissal = 'batting *';
  }

  // 2. Replay all delivery events sequentially
  let curReplayOverIdx = 0;
  let legalBallsInCurReplayOver = 0;
  inningsDeliveries.forEach((d, idx) => {
    const addedRuns = Number(d.addedRuns !== undefined ? d.addedRuns : (d.runs !== undefined ? d.runs : 0)) || 0;
    const overthrowRuns = Number(d.overthrowRuns || 0);
    const extraType = d.extraType || 'none';
    const isLegal = d.isLegalDelivery !== false && extraType !== 'wide' && extraType !== 'noBall' && extraType !== 'penalty';
    const isWkt = Boolean(d.isWkt);

    d._overIdx = curReplayOverIdx;

    totalRuns += addedRuns;
    if (isLegal) {
      legalBalls += 1;
      legalBallsInCurReplayOver += 1;
      if (legalBallsInCurReplayOver === 6) {
        curReplayOverIdx += 1;
        legalBallsInCurReplayOver = 0;
      }
    }
    if (isWkt) totalWickets += 1;

    // --- Extras Accounting ---
    if (extraType === 'wide') {
      const penalty = Number(d.extraPenalty || 1);
      extrasBreakdown.wides += (penalty + addedRuns - penalty);
      extrasBreakdown.total += addedRuns;
    } else if (extraType === 'noBall') {
      const penalty = Number(d.extraPenalty || 1);
      extrasBreakdown.noBalls += penalty;
      extrasBreakdown.total += penalty;
      if (d.nbRunType === 'bye') {
        extrasBreakdown.byes += (addedRuns - penalty);
        extrasBreakdown.total += (addedRuns - penalty);
      } else if (d.nbRunType === 'legBye') {
        extrasBreakdown.legByes += (addedRuns - penalty);
        extrasBreakdown.total += (addedRuns - penalty);
      }
    } else if (extraType === 'bye') {
      extrasBreakdown.byes += addedRuns;
      extrasBreakdown.total += addedRuns;
    } else if (extraType === 'legBye') {
      extrasBreakdown.legByes += addedRuns;
      extrasBreakdown.total += addedRuns;
    } else if (extraType === 'penalty') {
      const pen = Number(d.extraPenalty !== undefined ? d.extraPenalty : (addedRuns - Number(d.runsOffBat || 0)));
      extrasBreakdown.penalty += pen;
      extrasBreakdown.total += pen;
    }

    // --- Batter Accounting ---
    const strikerName = d.striker || currentStriker || 'Batter';
    const strikerBatter = getOrCreateBatter(strikerName, d.strikerId);
    currentStriker = strikerBatter.name;
    if (d.nonStriker) {
      const nonStrikerBatter = getOrCreateBatter(d.nonStriker, d.nonStrikerId);
      currentNonStriker = nonStrikerBatter.name;
    }

    // Batter ball faced: counts on all deliveries EXCEPT wides and dead-ball penalty
    if (extraType !== 'wide' && (extraType !== 'penalty' || d.isLegalDelivery === true)) {
      strikerBatter.balls += 1;
    }

    // Runs off bat
    let runsOffBat = 0;
    if (d.runsOffBat !== undefined) {
      runsOffBat = Number(d.runsOffBat) || 0;
    } else if (extraType === 'none') {
      runsOffBat = addedRuns;
    } else if (extraType === 'noBall') {
      if (d.nbRunType === 'bat' || !d.nbRunType) {
        const pen = Number(d.extraPenalty || 1);
        runsOffBat = Math.max(0, addedRuns - pen);
      }
    }

    strikerBatter.runs += runsOffBat;
    if (runsOffBat === 0 && extraType !== 'wide' && extraType !== 'penalty') strikerBatter.dots += 1;
    else if (runsOffBat === 1) strikerBatter.singles += 1;
    else if (runsOffBat === 2) strikerBatter.doubles += 1;
    else if (runsOffBat === 3) strikerBatter.triples += 1;
    else if (runsOffBat === 4) strikerBatter.fours += 1;
    else if (runsOffBat === 6) strikerBatter.sixes += 1;

    const bCount = strikerBatter.balls;
    strikerBatter.strikeRate = bCount > 0 ? ((strikerBatter.runs / bCount) * 100).toFixed(1) : '0.0';

    // Wicket handling on batter
    if (isWkt) {
      const dismissed = d.dismissedPlayerName || d.dismissedPlayer || strikerName;
      const dismissedBatter = getOrCreateBatter(dismissed, d.dismissedPlayerId || (isSamePlayerOrAlias(dismissed, strikerName) ? d.strikerId : null));
      dismissedBatter.isNotOut = false;
      dismissedBatter.dismissal = d.dismissalDesc || d.dismissalType || 'out';

      const ovText = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
      fowList.push({
        wktNum: totalWickets,
        score: totalRuns,
        overs: ovText,
        player: dismissedBatter.name,
        dismissal: dismissedBatter.dismissal,
      });

      if (d.incomingBatter) {
        const inc = typeof d.incomingBatter === 'string'
          ? d.incomingBatter.trim()
          : (d.incomingBatter?.name ? String(d.incomingBatter.name).trim() : '');
        if (inc) {
          getOrCreateBatter(inc, d.incomingBatterId || (typeof d.incomingBatter === 'object' ? d.incomingBatter.id : null));
        }
      }
    }

    // --- Bowler Accounting ---
    const bowlerName = d.bowler || currentBowler || 'Bowler';
    const bowlerObj = getOrCreateBowler(bowlerName, d.bowlerId);
    currentBowler = bowlerObj.name;

    if (isLegal) {
      bowlerObj.balls += 1;
    }

    // Runs conceded by bowler: all added runs EXCEPT byes, leg-byes, and penalties!
    let runsConceded = 0;
    if (extraType !== 'bye' && extraType !== 'legBye' && extraType !== 'penalty') {
      runsConceded = addedRuns;
    }
    bowlerObj.runs += runsConceded;

    if (runsConceded === 0 && isLegal) {
      bowlerObj.dots += 1;
    }
    if (runsOffBat === 4 || (runsConceded === 4 && runsOffBat === 0)) {
      bowlerObj.foursConceded += 1;
    }
    if (runsOffBat === 6 || (runsConceded === 6 && runsOffBat === 0)) {
      bowlerObj.sixesConceded += 1;
    }

    // Bowler wickets: only credited for bowler dismissals (NOT run out, obstructing, retired)
    const isBowlerWkt = isWkt && d.dismissalType !== 'run_out' && d.dismissalType !== 'retired' && d.dismissalType !== 'obstructing';
    if (isBowlerWkt) {
      bowlerObj.wickets += 1;
    }

    const bwBalls = bowlerObj.balls;
    bowlerObj.overs = `${Math.floor(bwBalls / 6)}.${bwBalls % 6}`;
    bowlerObj.econ = bwBalls > 0 ? ((bowlerObj.runs / bwBalls) * 6).toFixed(1) : '0.0';

    // Track maidens
    const bTrackerKey = bowlerObj.name;
    if (!bowlerOversTracker[bTrackerKey]) bowlerOversTracker[bTrackerKey] = [];
    let curBwOver = bowlerOversTracker[bTrackerKey][bowlerOversTracker[bTrackerKey].length - 1];
    if (!curBwOver || curBwOver.isFinished) {
      curBwOver = { legalBalls: 0, runsConceded: 0, isFinished: false };
      bowlerOversTracker[bTrackerKey].push(curBwOver);
    }
    curBwOver.runsConceded += runsConceded;
    if (isLegal) {
      curBwOver.legalBalls += 1;
      if (curBwOver.legalBalls === 6) {
        curBwOver.isFinished = true;
      }
    }

    // --- Strike Rotation ---
    const isOddRuns = (runsOffBat + overthrowRuns) % 2 === 1;
    const isOverEnd = Boolean(isLegal && legalBalls > 0 && legalBalls % 6 === 0);

    if (isWkt) {
      const outBatter = typeof d.dismissedPlayerName === 'string'
        ? d.dismissedPlayerName.trim()
        : (d.dismissedPlayerName?.name || (typeof d.dismissedPlayer === 'string' ? d.dismissedPlayer.trim() : (d.dismissedPlayer?.name || strikerName)));
      const incoming = d.incomingBatter
        ? (typeof d.incomingBatter === 'string' ? (d.incomingBatter.trim() || null) : (d.incomingBatter?.name ? String(d.incomingBatter.name).trim() : null))
        : null;
      if (isSamePlayerOrAlias(outBatter, currentStriker)) {
        currentStriker = incoming || currentNonStriker;
      } else {
        currentNonStriker = incoming || currentStriker;
      }
      if (isOverEnd && matchMeta.swapBattersOnOverEnd !== false) {
        const tmp = currentStriker;
        currentStriker = currentNonStriker;
        currentNonStriker = tmp;
      }
    } else {
      if (isOddRuns && !isOverEnd) {
        const tmp = currentStriker;
        currentStriker = currentNonStriker;
        currentNonStriker = tmp;
      } else if (!isOddRuns && isOverEnd && matchMeta.swapBattersOnOverEnd !== false) {
        const tmp = currentStriker;
        currentStriker = currentNonStriker;
        currentNonStriker = tmp;
      }
    }

    if (isOverEnd) {
      lastOverBowler = bowlerObj.name;
    }
  });

  // Calculate maidens
  Object.keys(bowlersMap).forEach(bName => {
    const oversList = bowlerOversTracker[bName] || [];
    const completedMaidens = oversList.filter(o => o.legalBalls === 6 && o.runsConceded === 0).length;
    bowlersMap[bName].maidens = completedMaidens;
  });

  // Extract current over deliveries
  // Standard Cricket Broadcast Rule: When an over finishes (6 legal balls), retain the full completed over
  // until the new over's first delivery is bowled. Once new deliveries occur, start fresh with the new over.
  const thisOverSymbols = [];
  if (inningsDeliveries.length > 0) {
    const hasCurrentOverDeliveries = inningsDeliveries.some(d => d && d._overIdx === curReplayOverIdx);
    const targetOverIdx = hasCurrentOverDeliveries ? curReplayOverIdx : Math.max(0, curReplayOverIdx - 1);

    for (let i = 0; i < inningsDeliveries.length; i++) {
      const d = inningsDeliveries[i];
      if (d && d._overIdx === targetOverIdx) {
        let sym = d.ballSymbol;
        if (!sym) {
          if (d.isWkt) sym = 'W';
          else if (d.extraType === 'wide') sym = (d.addedRuns || 1) > 1 ? `Wd+${(d.addedRuns || 1) - 1}` : 'Wd';
          else if (d.extraType === 'noBall') sym = (d.addedRuns || 1) > 1 ? `Nb+${(d.addedRuns || 1) - 1}` : 'Nb';
          else if (d.extraType === 'bye') sym = `${d.addedRuns || 1}B`;
          else if (d.extraType === 'legBye') sym = `${d.addedRuns || 1}LB`;
          else sym = String(d.runsOffBat !== undefined ? d.runsOffBat : (d.addedRuns || 0));
        }
        if (sym) thisOverSymbols.push(sym);
      }
    }
  }

  const oversStr = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
  const crr = legalBalls > 0 ? ((totalRuns / legalBalls) * 6).toFixed(2) : '0.00';
  const extrasString = `${extrasBreakdown.total} (b ${extrasBreakdown.byes}, lb ${extrasBreakdown.legByes}, w ${extrasBreakdown.wides}, nb ${extrasBreakdown.noBalls}${extrasBreakdown.penalty > 0 ? `, pen ${extrasBreakdown.penalty}` : ''})`;

  const battingList = Object.values(battersMap).sort((a, b) => a.battingOrder - b.battingOrder);
  const bowlingList = Object.values(bowlersMap).filter(bw => {
    const balls = Number(bw.balls) || 0;
    const overs = String(bw.overs || '0.0');
    const runs = Number(bw.runs) || 0;
    const wickets = Number(bw.wickets) || 0;
    return balls > 0 || (overs !== '0.0' && overs !== '0') || runs > 0 || wickets > 0;
  });

  const isOverEnd = legalBalls > 0 && legalBalls % 6 === 0;

  return {
    runs: totalRuns,
    wickets: totalWickets,
    balls: legalBalls,
    overs: oversStr,
    oversStr,
    crr,
    extras: extrasString,
    extrasBreakdown,
    batting: battingList,
    bowling: bowlingList,
    battersMap,
    bowlersMap,
    fallOfWickets: fowList,
    thisOver: thisOverSymbols,
    currentStriker,
    currentNonStriker,
    currentBowler,
    lastOverBowler,
    isOverEnd,
    deliveriesCount: inningsDeliveries.length,
  };
}

/**
 * Pure function: derive entire match state across both innings from delivery events.
 */
export function deriveMatchStateFromDeliveries(deliveries = [], matchMeta = {}) {
  const currentInnings = Number(matchMeta.currentInnings || 1);
  const toSafeSquad = squad => {
    if (Array.isArray(squad)) return squad;
    if (squad && typeof squad === 'object') return Object.values(squad);
    return [];
  };

  const inn1Meta = {
    ...matchMeta,
    battingSquad: toSafeSquad(matchMeta.team1Squad || matchMeta.battingSquad || matchMeta.innings1?.batting),
    bowlingSquad: toSafeSquad(matchMeta.team2Squad || matchMeta.bowlingSquad || matchMeta.innings1?.bowling),
    openingStriker: matchMeta.innings1OpeningStriker || matchMeta.openingStriker,
    openingNonStriker: matchMeta.innings1OpeningNonStriker || matchMeta.openingNonStriker,
    openingBowler: matchMeta.innings1OpeningBowler || matchMeta.openingBowler,
  };

  const inn2Meta = {
    ...matchMeta,
    battingSquad: toSafeSquad(matchMeta.team2Squad || matchMeta.innings2?.batting),
    bowlingSquad: toSafeSquad(matchMeta.team1Squad || matchMeta.innings2?.bowling),
    openingStriker: matchMeta.innings2OpeningStriker,
    openingNonStriker: matchMeta.innings2OpeningNonStriker,
    openingBowler: matchMeta.innings2OpeningBowler,
  };

  const inn1 = deriveInningsStateFromDeliveries(deliveries, 1, inn1Meta);
  const inn2 = deriveInningsStateFromDeliveries(deliveries, 2, inn2Meta);

  const activeInn = currentInnings === 2 ? inn2 : inn1;
  const maxOvers = Number(matchMeta.totalOvers || matchMeta.maxOvers || 20);
  const maxBalls = maxOvers * 6;

  let target = 0;
  let rrr = '0.00';
  let requiredRuns = 0;
  let ballsRemaining = maxBalls;
  let matchResult = '';

  if (currentInnings === 2) {
    target = inn1.runs + 1;
    requiredRuns = Math.max(0, target - inn2.runs);
    ballsRemaining = Math.max(0, maxBalls - inn2.balls);
    rrr = ballsRemaining > 0 ? ((requiredRuns / ballsRemaining) * 6).toFixed(2) : '0.00';

    if (inn2.runs >= target) {
      const wktsLeft = 10 - inn2.wickets;
      matchResult = `${matchMeta.team2Name || 'Team 2'} won by ${wktsLeft} wicket${wktsLeft === 1 ? '' : 's'}`;
    } else if (inn2.balls >= maxBalls || inn2.wickets >= 10) {
      if (inn2.runs === inn1.runs) {
        matchResult = 'Match Tied';
      } else {
        const runDiff = inn1.runs - inn2.runs;
        matchResult = `${matchMeta.team1Name || 'Team 1'} won by ${runDiff} run${runDiff === 1 ? '' : 's'}`;
      }
    }
  }

  return {
    currentInnings,
    activeScore: {
      runs: activeInn.runs,
      wickets: activeInn.wickets,
      balls: activeInn.balls,
      oversStr: activeInn.oversStr,
      crr: activeInn.crr,
      thisOver: activeInn.thisOver,
      currentStriker: activeInn.currentStriker,
      currentNonStriker: activeInn.currentNonStriker,
      currentBowler: activeInn.currentBowler,
      lastOverBowler: activeInn.lastOverBowler,
      isOverEnd: activeInn.isOverEnd,
      liveBatters: activeInn.battersMap,
      liveBowlerStats: activeInn.bowlersMap,
    },
    innings1: {
      ...inn1,
      maxOvers,
      team: matchMeta.team1Name || matchMeta.innings1?.team || 'Team 1',
      flag: matchMeta.team1Flag || matchMeta.innings1?.flag || '🦁',
      logoUri: matchMeta.team1Logo || matchMeta.innings1?.logoUri || null,
    },
    innings2: {
      ...inn2,
      maxOvers,
      target,
      requiredRuns,
      ballsRemaining,
      rrr,
      result: matchResult,
      team: matchMeta.team2Name || matchMeta.innings2?.team || 'Team 2',
      flag: matchMeta.team2Flag || matchMeta.innings2?.flag || '⚔️',
      logoUri: matchMeta.team2Logo || matchMeta.innings2?.logoUri || null,
    },
    matchResult,
    totalDeliveries: (deliveries || []).length,
  };
}

/**
 * Diagnostic integrity auditor to flag and log any mismatch.
 */
export function auditStateIntegrity(derived, cached = {}, label = 'DEFAULT') {
  if (!derived || !cached) return;
  const dRuns = derived.runs !== undefined ? derived.runs : derived.activeScore?.runs;
  const dBalls = derived.balls !== undefined ? derived.balls : derived.activeScore?.balls;
  const cRuns = cached.liveRuns !== undefined ? cached.liveRuns : cached.runs;
  const cBalls = cached.liveBalls !== undefined ? cached.liveBalls : cached.balls;

  if (dRuns !== undefined && cRuns !== undefined && dRuns !== cRuns) {
    console.warn(`[STATE_AUDIT_MISMATCH ⚠️] [${label}] RUNS DISCREPANCY:`, {
      derivedRuns: dRuns,
      cachedRuns: cRuns,
      deliveriesCount: derived.deliveriesCount || derived.totalDeliveries,
    });
  }

  if (dBalls !== undefined && cBalls !== undefined && dBalls !== cBalls) {
    console.warn(`[STATE_AUDIT_MISMATCH ⚠️] [${label}] BALLS DISCREPANCY:`, {
      derivedBalls: dBalls,
      cachedBalls: cBalls,
      deliveriesCount: derived.deliveriesCount || derived.totalDeliveries,
    });
  }
}
