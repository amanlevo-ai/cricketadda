/**
 * CRICKET STATE ENGINE (Single Source of Truth)
 * ============================================================================
 * Pure, deterministic derivation engine.
 * Never stores separate totals that can drift. Every stat (runs, wickets, overs,
 * batter records, bowler records, extras, crr, rrr, this-over) is DERIVED from
 * the immutable sequential delivery events (scoringHistory).
 * ============================================================================
 */

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
  // 1. Filter deliveries belonging strictly to this innings
  const inningsDeliveries = (deliveries || []).filter(d => {
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

  // Pre-populate initial squad if provided
  const initialBatters = matchMeta.battingSquad || [];
  initialBatters.forEach(p => {
    const name = typeof p === 'object' ? p.name : p;
    if (name) {
      battersMap[name] = {
        name,
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

  const initialBowlers = matchMeta.bowlingSquad || [];
  initialBowlers.forEach(p => {
    const name = typeof p === 'object' ? p.name : p;
    if (name) {
      bowlersMap[name] = {
        name,
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

  // Track crease
  let currentStriker = matchMeta.openingStriker || matchMeta.currentStriker || null;
  let currentNonStriker = matchMeta.openingNonStriker || matchMeta.currentNonStriker || null;
  let currentBowler = matchMeta.openingBowler || matchMeta.currentBowler || null;
  let lastOverBowler = null;

  // Set opening batters to 'batting *'
  if (currentStriker && battersMap[currentStriker]) {
    battersMap[currentStriker].dismissal = 'batting *';
  }
  if (currentNonStriker && battersMap[currentNonStriker]) {
    battersMap[currentNonStriker].dismissal = 'batting *';
  }

  // 2. Replay all delivery events sequentially
  inningsDeliveries.forEach((d, idx) => {
    const addedRuns = Number(d.addedRuns !== undefined ? d.addedRuns : (d.runs !== undefined ? d.runs : 0)) || 0;
    const overthrowRuns = Number(d.overthrowRuns || 0);
    const extraType = d.extraType || 'none';
    const isLegal = d.isLegalDelivery !== false && extraType !== 'wide' && extraType !== 'noBall' && extraType !== 'penalty';
    const isWkt = Boolean(d.isWkt);

    totalRuns += addedRuns;
    if (isLegal) legalBalls += 1;
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
      extrasBreakdown.penalty += addedRuns;
      extrasBreakdown.total += addedRuns;
    }

    // --- Batter Accounting ---
    const strikerName = d.striker || currentStriker || 'Batter';
    currentStriker = strikerName;
    if (d.nonStriker) currentNonStriker = d.nonStriker;

    if (!battersMap[strikerName]) {
      battersMap[strikerName] = {
        name: strikerName,
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
    }

    // Batter ball faced: counts on all deliveries EXCEPT wides and penalty
    if (extraType !== 'wide' && extraType !== 'penalty') {
      battersMap[strikerName].balls += 1;
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

    battersMap[strikerName].runs += runsOffBat;
    if (runsOffBat === 0 && extraType !== 'wide' && extraType !== 'penalty') battersMap[strikerName].dots += 1;
    else if (runsOffBat === 1) battersMap[strikerName].singles += 1;
    else if (runsOffBat === 2) battersMap[strikerName].doubles += 1;
    else if (runsOffBat === 3) battersMap[strikerName].triples += 1;
    else if (runsOffBat === 4) battersMap[strikerName].fours += 1;
    else if (runsOffBat === 6) battersMap[strikerName].sixes += 1;

    const bCount = battersMap[strikerName].balls;
    battersMap[strikerName].strikeRate = bCount > 0 ? ((battersMap[strikerName].runs / bCount) * 100).toFixed(1) : '0.0';

    // Wicket handling on batter
    if (isWkt) {
      const dismissed = d.dismissedPlayerName || d.dismissedPlayer || strikerName;
      if (!battersMap[dismissed]) {
        battersMap[dismissed] = {
          name: dismissed,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          dots: 0,
          singles: 0,
          doubles: 0,
          triples: 0,
          isNotOut: false,
          dismissal: 'out',
          strikeRate: '0.0',
          battingOrder: Object.keys(battersMap).length + 1,
        };
      }
      battersMap[dismissed].isNotOut = false;
      battersMap[dismissed].dismissal = d.dismissalDesc || d.dismissalType || 'out';

      const ovText = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
      fowList.push({
        wktNum: totalWickets,
        score: totalRuns,
        overs: ovText,
        player: dismissed,
        dismissal: battersMap[dismissed].dismissal,
      });

      if (d.incomingBatter) {
        const inc = d.incomingBatter.trim();
        if (inc && !battersMap[inc]) {
          battersMap[inc] = {
            name: inc,
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
        }
      }
    }

    // --- Bowler Accounting ---
    const bowlerName = d.bowler || currentBowler || 'Bowler';
    currentBowler = bowlerName;

    if (!bowlersMap[bowlerName]) {
      bowlersMap[bowlerName] = {
        name: bowlerName,
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
    }

    if (isLegal) {
      bowlersMap[bowlerName].balls += 1;
    }

    // Runs conceded by bowler: all added runs EXCEPT byes, leg-byes, and penalties!
    let runsConceded = 0;
    if (extraType !== 'bye' && extraType !== 'legBye' && extraType !== 'penalty') {
      runsConceded = addedRuns;
    }
    bowlersMap[bowlerName].runs += runsConceded;

    if (runsConceded === 0 && isLegal) {
      bowlersMap[bowlerName].dots += 1;
    }
    if (runsOffBat === 4 || (runsConceded === 4 && runsOffBat === 0)) {
      bowlersMap[bowlerName].foursConceded += 1;
    }
    if (runsOffBat === 6 || (runsConceded === 6 && runsOffBat === 0)) {
      bowlersMap[bowlerName].sixesConceded += 1;
    }

    // Bowler wickets: only credited for bowler dismissals (NOT run out, obstructing, retired)
    const isBowlerWkt = isWkt && d.dismissalType !== 'run_out' && d.dismissalType !== 'retired' && d.dismissalType !== 'obstructing';
    if (isBowlerWkt) {
      bowlersMap[bowlerName].wickets += 1;
    }

    const bwBalls = bowlersMap[bowlerName].balls;
    bowlersMap[bowlerName].overs = `${Math.floor(bwBalls / 6)}.${bwBalls % 6}`;
    bowlersMap[bowlerName].econ = bwBalls > 0 ? ((bowlersMap[bowlerName].runs / bwBalls) * 6).toFixed(1) : '0.0';

    // Track maidens
    if (!bowlerOversTracker[bowlerName]) bowlerOversTracker[bowlerName] = [];
    let curBwOver = bowlerOversTracker[bowlerName][bowlerOversTracker[bowlerName].length - 1];
    if (!curBwOver || curBwOver.isFinished) {
      curBwOver = { legalBalls: 0, runsConceded: 0, isFinished: false };
      bowlerOversTracker[bowlerName].push(curBwOver);
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
      const outBatter = d.dismissedPlayerName || strikerName;
      const incoming = d.incomingBatter ? d.incomingBatter.trim() : null;
      if (outBatter === currentStriker) {
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
      lastOverBowler = bowlerName;
    }
  });

  // Calculate maidens
  Object.keys(bowlersMap).forEach(bName => {
    const oversList = bowlerOversTracker[bName] || [];
    const completedMaidens = oversList.filter(o => o.legalBalls === 6 && o.runsConceded === 0).length;
    bowlersMap[bName].maidens = completedMaidens;
  });

  // Extract current over deliveries
  const legalInCurOver = legalBalls % 6;
  const thisOverSymbols = [];
  if (inningsDeliveries.length > 0) {
    let collectedLegal = 0;
    for (let i = inningsDeliveries.length - 1; i >= 0; i--) {
      const d = inningsDeliveries[i];
      if (!d) continue;
      const isLeg = d.isLegalDelivery !== false && d.extraType !== 'wide' && d.extraType !== 'noBall' && d.extraType !== 'penalty';
      if (legalInCurOver === 0 && legalBalls > 0) {
        // Over has just ended; if new bowler not yet confirmed, show empty for upcoming over
        // unless there were non-legal deliveries bowled in the new over
        if (isLeg) break;
        if (d.ballSymbol) thisOverSymbols.unshift(d.ballSymbol);
      } else {
        if (isLeg) {
          if (collectedLegal >= legalInCurOver) break;
          collectedLegal++;
        }
        if (d.ballSymbol) thisOverSymbols.unshift(d.ballSymbol);
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
  const inn1Meta = {
    ...matchMeta,
    battingSquad: matchMeta.team1Squad || matchMeta.innings1?.batting || [],
    bowlingSquad: matchMeta.team2Squad || matchMeta.innings1?.bowling || [],
    openingStriker: matchMeta.innings1OpeningStriker || matchMeta.openingStriker,
    openingNonStriker: matchMeta.innings1OpeningNonStriker || matchMeta.openingNonStriker,
    openingBowler: matchMeta.innings1OpeningBowler || matchMeta.openingBowler,
  };

  const inn2Meta = {
    ...matchMeta,
    battingSquad: matchMeta.team2Squad || matchMeta.innings2?.batting || [],
    bowlingSquad: matchMeta.team1Squad || matchMeta.innings2?.bowling || [],
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
