/**
 * Live Match Notification Service (CricketAdda)
 * Keeps a real-time, sticky live match scorecard in the phone's notification bar & lock screen.
 * Stays live until the match is concluded or dismissed by the user.
 */
import { Platform } from 'react-native';

let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  // Graceful fallback for environments where expo-notifications is unavailable
}

// Global notification handler for silent, in-place updates
if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (err) {}
}

const NOTIFICATION_ID = 'cricketadda_live_match_score';
const CHANNEL_ID = 'cricketadda_live_match_channel';

let isChannelInitialized = false;
let hasRequestedPermission = false;
let lastNotificationHash = '';

/**
 * Initialize Android notification channel for silent in-place score updates
 */
export async function initLiveNotificationChannel() {
  if (Platform.OS !== 'android' || !Notifications) return;
  if (isChannelInitialized) return;

  try {
    if (typeof Notifications.setNotificationChannelAsync === 'function') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Live Match Score',
        description: 'Displays persistent live scorecard while a match is in progress',
        importance: Notifications.AndroidImportance.LOW, // Silent: updates without sound or vibration
        vibrationPattern: [0],
        sound: null,
        showBadge: false,
        lightColor: '#0284c7',
        enableLights: false,
        enableVibrate: false,
      });
      isChannelInitialized = true;
    }
  } catch (err) {}
}

/**
 * Request notification permissions from user if not already granted
 */
export async function requestNotificationPermissionIfNeeded() {
  if (Platform.OS === 'web' || !Notifications || hasRequestedPermission) return true;
  hasRequestedPermission = true;

  try {
    if (typeof Notifications.getPermissionsAsync === 'function') {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus === 'granted') return true;
    }
    if (typeof Notifications.requestPermissionsAsync === 'function') {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }
  } catch (err) {
    return false;
  }
  return false;
}

/**
 * Listen for user tapping on the notification to bring them to the match
 */
export function setupNotificationTapListener(onTapMatch) {
  if (!Notifications || typeof Notifications.addNotificationResponseReceivedListener !== 'function') {
    return () => {};
  }
  try {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const matchId = response?.notification?.request?.content?.data?.matchId;
      if (matchId && typeof onTapMatch === 'function') {
        onTapMatch(matchId);
      }
    });
    return () => {
      try {
        if (sub && typeof sub.remove === 'function') sub.remove();
      } catch (e) {}
    };
  } catch (err) {
    return () => {};
  }
}

/**
 * Update the sticky live notification bar with real-time score.
 * Auto-dismisses if the match is completed, finished, or abandoned.
 */
export async function updateLiveMatchNotification(matchData) {
  if (!matchData) {
    await dismissLiveMatchNotification();
    return;
  }

  // 1. Auto-dismiss if match is finished, abandoned or completed
  const status = String(matchData.status || '').toLowerCase();
  if (status === 'completed' || status === 'abandoned' || status === 'finished') {
    await dismissLiveMatchNotification();
    return;
  }

  // 2. Validate teams
  const team1 = matchData.teamA || matchData.innings1?.team || '';
  const team2 = matchData.teamB || matchData.innings2?.team || '';
  if (!team1 || !team2) return;

  const currentInnings = Number(matchData.currentInnings || 1);
  const battingTeam = currentInnings === 1 ? team1 : team2;
  const bowlingTeam = currentInnings === 1 ? team2 : team1;

  // Extract score figures
  let runs = Number(matchData.liveRuns ?? matchData.runs ?? 0);
  let wickets = Number(matchData.liveWickets ?? matchData.wickets ?? 0);
  let overs = String(matchData.liveOvers ?? matchData.oversStr ?? matchData.overs ?? '0.0');

  // Canonical player name resolver (e.g. Amanlevo -> Amandeep)
  const formatCanonicalPlayer = name => {
    if (!name) return '';
    const clean = String(name).replace(/\s*\([^)]*\)/g, '').trim();
    if (clean.toLowerCase() === 'amanlevo' || clean.toLowerCase() === 'aman') {
      return 'Amandeep';
    }
    return clean;
  };

  // Extract active batters
  const rawStrikerName = matchData.currentStriker || matchData.striker || '';
  const rawNonStrikerName = matchData.currentNonStriker || matchData.nonStriker || '';
  const strikerName = formatCanonicalPlayer(rawStrikerName);
  const nonStrikerName = formatCanonicalPlayer(rawNonStrikerName);

  const findBatterStat = (resolved, raw) => {
    if (matchData.strikerStats && resolved === strikerName) return matchData.strikerStats;
    if (matchData.nonStrikerStats && resolved === nonStrikerName) return matchData.nonStrikerStats;
    const map = matchData.liveBatters || {};
    return map[resolved] || map[raw] || map[resolved?.toLowerCase()] || map[raw?.toLowerCase()] ||
      Object.entries(map).find(([k]) => {
        const kl = k.trim().toLowerCase();
        return kl === resolved?.toLowerCase() || kl === raw?.toLowerCase();
      })?.[1] || {};
  };

  const strikerStats = findBatterStat(strikerName, rawStrikerName);
  const nonStrikerStats = findBatterStat(nonStrikerName, rawNonStrikerName);

  const strikerRuns = strikerStats.runs ?? 0;
  const strikerBalls = strikerStats.balls ?? 0;
  const nonStrikerRuns = nonStrikerStats.runs ?? 0;
  const nonStrikerBalls = nonStrikerStats.balls ?? 0;

  // Extract active bowler
  const rawBowlerName = matchData.currentBowler || matchData.bowler || '';
  const bowlerName = formatCanonicalPlayer(rawBowlerName);
  const bowlerStats = matchData.bowlerStats ||
    matchData.liveBowlers?.[bowlerName] ||
    matchData.liveBowlers?.[rawBowlerName] ||
    matchData.liveBowlers?.[bowlerName?.toLowerCase()] ||
    matchData.liveBowlers?.[rawBowlerName?.toLowerCase()] ||
    Object.entries(matchData.liveBowlers || {}).find(([k]) => {
      const kl = k.trim().toLowerCase();
      return kl === bowlerName?.toLowerCase() || kl === rawBowlerName?.toLowerCase();
    })?.[1] ||
    {};

  const bowlerWickets = bowlerStats.wickets ?? 0;
  const bowlerRuns = bowlerStats.runs ?? 0;
  const bowlerOvers = bowlerStats.ovStr ?? bowlerStats.overs ?? '0.0';

  // Safeguard: Ensure total score is never 0/0 (0.0 ov) if deliveries/batters/bowlers have recorded runs
  if (runs === 0 && matchData.liveBatters && typeof matchData.liveBatters === 'object') {
    const batTotal = Object.values(matchData.liveBatters).reduce((sum, b) => sum + (Number(b?.runs) || 0), 0);
    if (batTotal > 0) runs = batTotal;
  }
  if ((overs === '0.0' || overs === '0') && bowlerOvers !== '0.0' && bowlerOvers !== '0') {
    overs = bowlerOvers;
  }

  // 1st Line (Title): Clean Teams Matchup (Never truncates on any screen)
  const title = `${team1} vs ${team2}`;

  // Dedicated Total Score Line (Guaranteed full visibility without ellipsis truncation)
  let totalScoreLine = '';
  if (currentInnings === 2 && matchData.target > 0) {
    const need = Math.max(0, Number(matchData.target) - runs);
    totalScoreLine = `${battingTeam}: ${runs}/${wickets} (${overs} ov)  •  Need ${need} (T: ${matchData.target})`;
  } else {
    const crrStr = matchData.crr ? `  •  CRR: ${matchData.crr}` : '';
    totalScoreLine = `${battingTeam}: ${runs}/${wickets} (${overs} ov)${crrStr}`;
  }

  // 2nd Line: Current Batters
  let batterLine = '';
  if (strikerName && nonStrikerName && nonStrikerName !== strikerName) {
    batterLine = `${strikerName} ${strikerRuns}* (${strikerBalls})  •  ${nonStrikerName} ${nonStrikerRuns}* (${nonStrikerBalls})`;
  } else if (strikerName) {
    batterLine = `${strikerName} ${strikerRuns}* (${strikerBalls})`;
  } else {
    batterLine = `Batting: ${battingTeam}`;
  }

  // 3rd Line: Current Bowler
  let bowlerLine = '';
  if (bowlerName) {
    bowlerLine = `Bowler: ${bowlerName} ${bowlerWickets}/${bowlerRuns} (${bowlerOvers} ov)`;
  } else {
    bowlerLine = `Bowling: ${bowlingTeam}`;
  }

  const body = `${totalScoreLine}\n${batterLine}\n${bowlerLine}`;

  const currentHash = `${matchData.id || ''}_${runs}_${wickets}_${overs}_${strikerName}_${strikerRuns}_${strikerBalls}_${nonStrikerName}_${nonStrikerRuns}_${nonStrikerBalls}_${bowlerName}_${bowlerWickets}_${bowlerRuns}_${bowlerOvers}_${matchData.target || 0}`;
  if (currentHash === lastNotificationHash) {
    return; // Avoid redundant identical updates
  }
  lastNotificationHash = currentHash;

  // 3. Web Notification Fallback
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, tag: NOTIFICATION_ID, silent: true });
      }
    } catch (e) {}
    return;
  }

  // 4. Native Android / iOS Persistent Notification
  if (!Notifications) return;

  try {
    await initLiveNotificationChannel();
    await requestNotificationPermissionIfNeeded();

    if (typeof Notifications.scheduleNotificationAsync === 'function') {
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: {
          title,
          subtitle: `${runs}/${wickets} (${overs} ov)`,
          body,
          data: {
            matchId: matchData.id || matchData.activeMatchId,
            action: 'view_live_match',
          },
          sound: null,
          sticky: true,
          autoDismiss: false, // Keep notification in bar even when user taps it!
          color: '#0284c7',
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
        trigger: null, // Display immediately
      });
    }
  } catch (err) {}
}

/**
 * Dismiss the live match notification when match ends or user exits
 */
export async function dismissLiveMatchNotification() {
  lastNotificationHash = '';
  if (Platform.OS === 'web') return;
  if (!Notifications) return;

  try {
    if (typeof Notifications.dismissNotificationAsync === 'function') {
      await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
    }
  } catch (err) {}
}
