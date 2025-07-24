import { setColorScheme, useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Button, Modal, ScrollView as RNScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { shuffleArray } from '../utils/shuffle';

// Add difficulty options
const DIFFICULTIES = [
  { label: 'Easy', value: 10, gridWidth: 200 },
  { label: 'Medium', value: 20, gridWidth: 320 },
  { label: 'Hard', value: 30, gridWidth: 380 },
];

const FUN_FACTS = [
  'Did you know? The fastest human reaction time is about 0.15 seconds!',
  'Tip: Try to scan the grid in rows or columns for speed.',
  'Quote: "Success is the sum of small efforts, repeated day in and day out."',
  'Fun Fact: Playing brain games can improve your cognitive speed!',
  'Tip: Use your dominant hand for faster tapping.',
  'Quote: "The only way to do great work is to love what you do." – Steve Jobs',
  'Did you know? Practice can help you break your own records!',
  'Tip: Stay relaxed for better accuracy and speed.',
  'Quote: "Winners are not people who never fail, but people who never quit."',
];

function getRandomFact() {
  return FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
}

export default function HomeScreen() {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1]); // Default to Medium
  const [highScore, setHighScore] = useState<number | null>(null);
  const [pressedNumber, setPressedNumber] = useState<number | null>(null);
  const scaleAnim = useRef<{ [key: number]: Animated.Value }>({}).current;
  const [leaderboard, setLeaderboard] = useState<number[]>([]);
  const router = useRouter();
  const [showSummary, setShowSummary] = useState(false);
  const [lastGameTime, setLastGameTime] = useState<number | null>(null);
  const intervalRef = useRef<any>(null); // Use any for React Native compatibility
  const [aborted, setAborted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const colorScheme = useColorScheme();
  const [badges, setBadges] = useState<string[]>([]);
  const [showBadges, setShowBadges] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isHighScore, setIsHighScore] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [buttonColor, setButtonColor] = useState<string | null>(null);
  const buttonColorOptions = ['#007AFF', '#4F8EF7', '#FF6F61', '#34C759', '#FFD700', '#A259FF', '#FF9500'];
  const [dailyStreak, setDailyStreak] = useState(0);
  const [lastDailyDate, setLastDailyDate] = useState<string | null>(null);
  const [showDaily, setShowDaily] = useState(false);
  const [dailyGoal, setDailyGoal] = useState<number>(15); // seconds
  const [dailyGrid, setDailyGrid] = useState<number>(20); // grid size
  const [isDaily, setIsDaily] = useState(false);
  const [nickname, setNickname] = useState('Player');
  const [nicknameInput, setNicknameInput] = useState('');
  const [funFact, setFunFact] = useState(getRandomFact());
  const [chaosMode, setChaosMode] = useState(false);

  // Show a new fun fact each time the summary modal opens
  useEffect(() => {
    if (showSummary) setFunFact(getRandomFact());
  }, [showSummary]);

  // Theme-aware colors
  const themeColors = {
    light: {
      background: '#f0f0f0',
      text: '#333',
      button: buttonColor || '#007AFF',
      buttonText: '#fff',
      clickedButton: '#d0d0d0',
      leaderboardTitle: '#333',
      leaderboardEntry: '#555',
      leaderboardEmpty: '#aaa',
      toggleBg: '#e0e0e0',
    },
    dark: {
      background: '#181A20',
      text: '#fff',
      button: buttonColor || '#4F8EF7',
      buttonText: '#fff',
      clickedButton: '#333',
      leaderboardTitle: '#fff',
      leaderboardEntry: '#bbb',
      leaderboardEmpty: '#666',
      toggleBg: '#333',
    },
  }[colorScheme || 'light'];

  // Sound refs
  const successSound = useRef<Audio.Sound | null>(null);
  const errorSound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 0.1);
      }, 100);
    } else {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerActive]);

  // Load high score for selected difficulty
  useEffect(() => {
    const loadHighScore = async () => {
      try {
        const key = `highscore_${difficulty.label}`;
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          setHighScore(parseFloat(value));
        } else {
          setHighScore(null);
        }
      } catch (e) {
        setHighScore(null);
      }
    };
    loadHighScore();
  }, [difficulty]);

  // Load leaderboard for selected difficulty
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const key = `leaderboard_${difficulty.label}`;
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          setLeaderboard(JSON.parse(value));
        } else {
          setLeaderboard([]);
        }
      } catch (e) {
        setLeaderboard([]);
      }
    };
    loadLeaderboard();
  }, [difficulty]);

  // Update leaderboard if new time is achieved
  const updateLeaderboard = async (newTime: number) => {
    try {
      const key = `leaderboard_${difficulty.label}`;
      let updated = [...leaderboard, newTime].sort((a, b) => a - b).slice(0, 5);
      setLeaderboard(updated);
      await AsyncStorage.setItem(key, JSON.stringify(updated));
    } catch { }
  };

  // Load sounds on mount
  useEffect(() => {
    let isMounted = true;
    const loadSounds = async () => {
      try {
        const { sound: loadedSuccess } = await Audio.Sound.createAsync(
          require('../assets/sounds/success.wav')
        );
        if (isMounted) successSound.current = loadedSuccess;
      } catch (e) {
        successSound.current = null;
      }
      try {
        const { sound: loadedError } = await Audio.Sound.createAsync(
          require('../assets/sounds/error.wav')
        );
        if (isMounted) errorSound.current = loadedError;
      } catch (e) {
        errorSound.current = null;
      }
    };
    loadSounds();
    return () => {
      isMounted = false;
      if (successSound.current) successSound.current.unloadAsync();
      if (errorSound.current) errorSound.current.unloadAsync();
    };
  }, []);

  // Initialize scale values for each number
  useEffect(() => {
    numbers.forEach(num => {
      if (!scaleAnim[num]) {
        scaleAnim[num] = new Animated.Value(1);
      }
    });
  }, [numbers]);

  // Countdown logic
  const startCountdown = () => {
    setCountdown(3);
    setIsCountingDown(true);
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(countdownInterval);
        setCountdown(null);
        setIsCountingDown(false);
        actuallyStartGame();
      }
    }, 1000);
  };

  // Actual game start logic
  const actuallyStartGame = () => {
    const nums = Array.from({ length: difficulty.value }, (_, i) => i + 1);
    setNumbers(shuffleArray(nums));
    setCurrentNumber(1);
    setElapsedTime(0);
    setTimerActive(true);
  };

  // Replace startGame with countdown
  const startGame = () => {
    startCountdown();
  };

  // Robust stopGame function (show summary with aborted message)
  const stopGame = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimerActive(false);
    setNumbers([]);
    setCurrentNumber(1);
    setElapsedTime(0);
    setAborted(true);
    setShowSummary(true);
    setLastGameTime(null);
  };

  // Play feedback helpers
  const playSuccessFeedback = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (successSound.current) {
      try {
        await successSound.current.replayAsync();
      } catch { }
    }
  };
  const playErrorFeedback = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    if (errorSound.current) {
      try {
        await errorSound.current.replayAsync();
      } catch { }
    }
  };

  const animateButton = (num: number) => {
    setPressedNumber(num);
    Animated.sequence([
      Animated.timing(scaleAnim[num], {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim[num], {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start(() => setPressedNumber(null));
  };

  // Load badges and games played from storage
  useEffect(() => {
    const loadBadges = async () => {
      try {
        const stored = await AsyncStorage.getItem('badges');
        if (stored) setBadges(JSON.parse(stored));
        const played = await AsyncStorage.getItem('gamesPlayed');
        if (played) setGamesPlayed(Number(played));
      } catch { }
    };
    loadBadges();
  }, []);

  // Save badges and games played
  const saveBadges = async (newBadges: string[], newGamesPlayed: number) => {
    setBadges(newBadges);
    setGamesPlayed(newGamesPlayed);
    await AsyncStorage.setItem('badges', JSON.stringify(newBadges));
    await AsyncStorage.setItem('gamesPlayed', String(newGamesPlayed));
  };

  // Check and unlock badges
  const checkBadges = async (time: number) => {
    let newBadges = [...badges];
    let newGamesPlayed = gamesPlayed + 1;
    let unlocked = false;
    if (!badges.includes('First Win')) {
      newBadges.push('First Win');
      unlocked = true;
    }
    if (time < 10 && !badges.includes('Under 10 Seconds')) {
      newBadges.push('Under 10 Seconds');
      unlocked = true;
    }
    if (newGamesPlayed >= 5 && !badges.includes('5 Games Played')) {
      newBadges.push('5 Games Played');
      unlocked = true;
    }
    if (unlocked) {
      await saveBadges(newBadges, newGamesPlayed);
    } else {
      await AsyncStorage.setItem('gamesPlayed', String(newGamesPlayed));
      setGamesPlayed(newGamesPlayed);
    }
  };

  // Generate today's challenge based on date
  const getTodayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };

  useEffect(() => {
    const loadDaily = async () => {
      const streak = await AsyncStorage.getItem('dailyStreak');
      if (streak) setDailyStreak(Number(streak));
      const last = await AsyncStorage.getItem('lastDailyDate');
      if (last) setLastDailyDate(last);
      // Generate today's challenge
      const todayKey = getTodayKey();
      // Deterministic pseudo-random for daily challenge
      let hash = 0;
      for (let i = 0; i < todayKey.length; i++) hash = (hash * 31 + todayKey.charCodeAt(i)) % 100000;
      setDailyGoal(12 + (hash % 9)); // 12-20 seconds
      setDailyGrid(15 + (hash % 16)); // 15-30 grid size
    };
    loadDaily();
  }, []);

  // Save streak and last played date
  const saveDaily = async (date: string, streak: number) => {
    setLastDailyDate(date);
    setDailyStreak(streak);
    await AsyncStorage.setItem('lastDailyDate', date);
    await AsyncStorage.setItem('dailyStreak', String(streak));
  };

  // Start daily challenge
  const startDailyChallenge = () => {
    setIsDaily(true);
    setDifficulty({ label: 'Daily', value: dailyGrid, gridWidth: 320 + (dailyGrid - 20) * 10 });
    startCountdown();
  };

  // On win, check if daily challenge was played today
  const handleNumberPress = async (num: number) => {
    if (!timerActive) return;
    animateButton(num);
    if (num === currentNumber) {
      await playSuccessFeedback();
      if (currentNumber === difficulty.value) {
        setTimerActive(false);
        setLastGameTime(elapsedTime);
        setShowSummary(true);
        setAborted(false);
        let newHighScore = false;
        // Check and update high score
        if (highScore === null || elapsedTime < highScore) {
          try {
            const key = `highscore_${difficulty.label}`;
            await AsyncStorage.setItem(key, elapsedTime.toFixed(1));
            setHighScore(elapsedTime);
            newHighScore = true;
          } catch (e) { }
        }
        // Update leaderboard
        await updateLeaderboard(elapsedTime);
        // Check and unlock badges
        await checkBadges(elapsedTime);
        // Show confetti for win or high score
        setIsHighScore(newHighScore);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3500);
        // Daily challenge streak logic
        if (isDaily) {
          const todayKey = getTodayKey();
          if (lastDailyDate !== todayKey) {
            let newStreak = dailyStreak;
            if (lastDailyDate) {
              const lastDate = new Date(lastDailyDate);
              const today = new Date(todayKey);
              const diff = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
              newStreak = diff === 1 ? dailyStreak + 1 : 1;
            } else {
              newStreak = 1;
            }
            await saveDaily(todayKey, newStreak);
          }
        }
      }
      setCurrentNumber(prev => prev + 1);
    } else {
      await playErrorFeedback();
    }
  };

  // Load button color from storage
  useEffect(() => {
    const loadButtonColor = async () => {
      const stored = await AsyncStorage.getItem('buttonColor');
      if (stored) setButtonColor(stored);
    };
    loadButtonColor();
  }, []);

  // Save button color
  const saveButtonColor = async (color: string) => {
    setButtonColor(color);
    await AsyncStorage.setItem('buttonColor', color);
  };

  // Load nickname from storage
  useEffect(() => {
    const loadNickname = async () => {
      const stored = await AsyncStorage.getItem('nickname');
      if (stored) {
        setNickname(stored);
        setNicknameInput(stored);
      }
    };
    loadNickname();
  }, []);

  // Save nickname
  const saveNickname = async (name: string) => {
    setNickname(name);
    setNicknameInput(name);
    await AsyncStorage.setItem('nickname', name);
  };

  // Load chaos mode from storage
  useEffect(() => {
    const loadChaos = async () => {
      const stored = await AsyncStorage.getItem('chaosMode');
      if (stored === 'true') setChaosMode(true);
    };
    loadChaos();
  }, []);

  // Save chaos mode
  const saveChaosMode = async (val: boolean) => {
    setChaosMode(val);
    await AsyncStorage.setItem('chaosMode', val ? 'true' : 'false');
  };

  // Share/copy logic
  const shareScore = async () => {
    const text = `I played Number Click Challenge! Difficulty: ${difficulty.label}, Time: ${lastGameTime !== null ? lastGameTime.toFixed(1) : '--'}s${isDaily ? ` (Daily Challenge)` : ''}`;
    if (await Sharing.isAvailableAsync()) {
      // Write to a temp file
      const fileUri = FileSystem.cacheDirectory + 'score.txt';
      await FileSystem.writeAsStringAsync(fileUri, text);
      await Sharing.shareAsync(fileUri, { dialogTitle: 'Share your score' });
    } else {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied!', 'Score copied to clipboard.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Gradient Background */}
      <LinearGradient
        colors={colorScheme === 'dark'
          ? ['#232526', '#414345']
          : ['#43cea2', '#185a9d', '#f7971e']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Subtle grid effect */}
      <View pointerEvents="none" style={styles.gridBgOverlay} />
      {/* Confetti Animation */}
      {showConfetti && (
        <ConfettiCannon
          count={isHighScore ? 120 : 60}
          origin={{ x: 200, y: 0 }}
          fadeOut
          explosionSpeed={350}
          fallSpeed={2500}
        />
      )}
      {/* Clean Modern Navbar */}
      <View style={styles.navBarContainer}>
        {/* Main Navigation Bar */}
        <LinearGradient
          colors={colorScheme === 'dark'
            ? ['rgba(30, 30, 40, 1)', 'rgba(40, 40, 55, 0.98)']
            : ['rgba(255, 255, 255, 1)', 'rgba(240, 245, 255, 0.98)']}
          style={styles.navBarGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Game Logo and Title */}
          <View style={styles.navBarLeftSection}>
            <LinearGradient
              colors={colorScheme === 'dark'
                ? ['#A259FF', '#7C4DFF']
                : ['#007AFF', '#5AC8FA']}
              style={styles.gameLogoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="grid" size={24} color="#fff" />
            </LinearGradient>

            <LinearGradient
              colors={colorScheme === 'dark'
                ? ['#A259FF', '#7C4DFF']
                : ['#007AFF', '#5AC8FA']}
              style={styles.titleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.gameTitleText}>NUMBER CLICK</Text>
            </LinearGradient>
          </View>

          {/* Settings Button */}
          <TouchableOpacity
            style={[styles.settingsButton, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(60, 60, 75, 0.8)' : 'rgba(240, 245, 255, 0.8)',
              borderColor: colorScheme === 'dark' ? 'rgba(162, 89, 255, 0.3)' : 'rgba(0, 122, 255, 0.3)'
            }]}
            onPress={() => setShowSettings(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color={colorScheme === 'dark' ? '#A259FF' : '#007AFF'}
            />
          </TouchableOpacity>
        </LinearGradient>

        {/* Challenge Bar */}
        <View style={styles.challengeBar}>
          {/* Daily Challenge Button */}
          <TouchableOpacity
            style={styles.dailyButton}
            onPress={startDailyChallenge}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#4CD964', '#34C759', '#2EB84C']}
              style={styles.dailyButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="trophy" size={22} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.dailyButtonText}>Daily Challenge</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Theme Toggle Button */}
          <TouchableOpacity
            style={[styles.themeToggleBtn, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(60, 60, 75, 0.8)' : 'rgba(240, 245, 255, 0.8)',
              borderColor: colorScheme === 'dark' ? 'rgba(255, 149, 0, 0.3)' : 'rgba(255, 149, 0, 0.3)'
            }]}
            onPress={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={colorScheme === 'dark' ? 'moon' : 'sunny'}
              size={20}
              color={colorScheme === 'dark' ? '#A259FF' : '#FF9500'}
            />
          </TouchableOpacity>
        </View>
      </View>
      {/* Countdown Overlay */}
      {isCountingDown && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}
      <RNScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: 32,
          paddingTop: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Fun Fact/Tip/Quote on Home Screen */}
        <View style={styles.funFactContainer}>
          <Text style={styles.funFactText}>{funFact}</Text>
        </View>
        {/* In grid rendering, apply chaos mode and improved layout */}
        <View style={[styles.grid, { width: Math.max(240, Math.ceil(Math.sqrt(difficulty.value)) * 72) }]}> {/* Responsive grid width */}
          {numbers.map((num, idx) => {
            // Chaos mode: random shape/size
            let shape = 'rounded';
            let size = 60;
            if (chaosMode) {
              const rand = (num * 31) % 3;
              shape = rand === 0 ? 'circle' : rand === 1 ? 'square' : 'rounded';
              size = 48 + ((num * 13) % 32); // 48-80px
            }
            // Calculate columns for best fit
            const columns = Math.ceil(Math.sqrt(difficulty.value));
            const basis = 100 / columns;
            return (
              <Animated.View
                key={num}
                style={{
                  transform: [{ scale: scaleAnim[num] || 1 }],
                  flexBasis: `${basis}%`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxWidth: 80,
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.numberButton,
                    { backgroundColor: themeColors.button, borderRadius: shape === 'circle' ? 32 : shape === 'square' ? 8 : 18, width: size, height: size },
                    num < currentNumber && { backgroundColor: themeColors.clickedButton },
                  ]}
                  onPress={() => !isCountingDown && handleNumberPress(num)}
                  activeOpacity={0.85}
                  disabled={isCountingDown}
                  accessibilityLabel={`Number ${num}`}
                >
                  <Text style={[styles.numberText, { color: themeColors.buttonText, fontFamily: 'SpaceMono', fontWeight: 'bold', fontSize: 24 }]}>{num}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
        {/* High Score Display */}
        <Text style={[styles.highScore, { color: themeColors.button }]}>High Score: {highScore !== null ? `${highScore.toFixed(1)}s` : '--'}</Text>
        <Text style={[styles.timer, { color: themeColors.text }]}>Time: {elapsedTime.toFixed(1)}s</Text>
        {/* Stop/Abort Button - moved above the grid */}
        {timerActive && (
          <View style={{ marginVertical: 12 }}>
            <TouchableOpacity style={styles.stopButton} onPress={stopGame} activeOpacity={0.85}>
              <Ionicons name="close-circle" size={22} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.stopButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Start/Restart Button */}
        {!timerActive && (
          <TouchableOpacity style={styles.startButton} onPress={startGame} activeOpacity={0.85}>
            <Ionicons name="play" size={22} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.startButtonText}>{elapsedTime === 0 ? 'Start Game' : 'Restart Game'}</Text>
          </TouchableOpacity>
        )}
      </RNScrollView>
      {/* Summary Modal */}
      <Modal
        visible={showSummary}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSummary(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(220,220,255,0.8)']}
            style={styles.glassModal}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.summaryCloseButton}
              onPress={() => setShowSummary(false)}
              accessibilityLabel="Close summary"
            >
              <Ionicons name="close" size={28} color="#A259FF" />
            </TouchableOpacity>
            <RNScrollView
              contentContainerStyle={{ alignItems: 'center', paddingBottom: 20, paddingHorizontal: 10 }}
              style={{ width: '100%' }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.summaryTitle}>Game Summary</Text>
              {/* Fun Fact/Tip/Quote in Summary */}
              <Text style={styles.funFactText}>{funFact}</Text>
              <View style={styles.summarySection}>
                <Text style={styles.summaryLabel}>Player:</Text>
                <Text style={styles.summaryValue}>{nickname}</Text>
              </View>
              {isDaily && (
                <View style={styles.summarySectionRow}>
                  <Ionicons name="trophy" size={20} color="#34C759" style={{ marginRight: 6 }} />
                  <Text style={[styles.summaryValue, { color: '#34C759', fontWeight: 'bold' }]}>Daily Challenge!</Text>
                </View>
              )}
              {aborted ? (
                <Text style={[styles.summaryValue, { color: '#d9534f', fontWeight: 'bold', marginBottom: 8 }]}>You aborted the game.</Text>
              ) : null}
              <View style={styles.summarySectionRow}>
                <Text style={styles.summaryLabel}>Difficulty:</Text>
                <Text style={styles.summaryValue}>{difficulty.label}</Text>
              </View>
              <View style={styles.summarySectionRow}>
                <Ionicons name="timer" size={20} color="#A259FF" style={{ marginRight: 6 }} />
                <Text style={styles.summaryLabel}>Your Time:</Text>
                <Text style={styles.summaryValue}>{lastGameTime !== null ? `${lastGameTime.toFixed(1)}s` : '--'}</Text>
              </View>
              {isDaily && (
                <View style={styles.summarySectionRow}>
                  <Text style={styles.summaryLabel}>Today's Goal:</Text>
                  <Text style={styles.summaryValue}>{dailyGrid} numbers in under {dailyGoal}s</Text>
                </View>
              )}
              {isDaily && (
                <View style={styles.summarySectionRow}>
                  <Ionicons name="flame" size={20} color="#34C759" style={{ marginRight: 6 }} />
                  <Text style={styles.summaryLabel}>Streak:</Text>
                  <Text style={styles.summaryValue}>{dailyStreak} {dailyStreak === 1 ? 'day' : 'days'}</Text>
                </View>
              )}
              <View style={styles.summarySectionRow}>
                <Ionicons name="star" size={20} color="#FFD700" style={{ marginRight: 6 }} />
                <Text style={styles.summaryLabel}>High Score:</Text>
                <Text style={styles.summaryValue}>{highScore !== null ? `${highScore.toFixed(1)}s` : '--'}</Text>
              </View>
              <View style={[styles.summarySection, { marginTop: 10 }]}>
                <Text style={[styles.summaryLabel, { fontWeight: 'bold', fontSize: 18 }]}>Leaderboard</Text>
                {leaderboard.length === 0 ? (
                  <Text style={[styles.leaderboardEmpty, { color: themeColors.leaderboardEmpty }]}>No scores yet.</Text>
                ) : (
                  leaderboard.map((score, idx) => (
                    <View key={idx} style={[styles.leaderboardCard, idx === 0 && styles.leaderboardCardTop]}>
                      <Ionicons name={idx === 0 ? 'star' : 'person'} size={18} color={idx === 0 ? '#FFD700' : '#A259FF'} style={{ marginRight: 4 }} />
                      <Text style={[styles.leaderboardEntry, { color: themeColors.leaderboardEntry }]}> {idx + 1}. {score.toFixed(1)}s {nickname}</Text>
                    </View>
                  ))
                )}
              </View>
              <View style={[styles.summarySection, { marginTop: 10 }]}>
                <Text style={[styles.summaryLabel, { fontWeight: 'bold', fontSize: 18 }]}>Badges Earned</Text>
                {badges.length === 0 ? (
                  <Text style={styles.leaderboardEmpty}>No badges yet.</Text>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginVertical: 4 }}>
                    {badges.map(badge => (
                      <View key={badge} style={styles.badgeBoxGlass}>
                        <Ionicons name="ribbon" size={16} color="#FFD700" style={{ marginRight: 4 }} />
                        <Text style={styles.badgeText}>{badge}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.summaryActionsRow}>
                <TouchableOpacity style={styles.summaryActionButton} onPress={shareScore} accessibilityLabel="Share your score">
                  <Ionicons name="share-social" size={20} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.summaryActionText}>Share Score</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.summaryActionButton} onPress={() => setShowBadges(true)} accessibilityLabel="View badges">
                  <Ionicons name="ribbon" size={20} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.summaryActionText}>View Badges</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.summaryActionButton} onPress={() => {
                  setShowSummary(false);
                  setAborted(false);
                  router.replace('/');
                }} accessibilityLabel="Go to home">
                  <Ionicons name="home" size={20} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.summaryActionText}>Home</Text>
                </TouchableOpacity>
              </View>
            </RNScrollView>
          </LinearGradient>
        </View>
      </Modal>
      {/* Badges Collection Modal */}
      <Modal
        visible={showBadges}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowBadges(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['rgba(255,255,255,0.85)', 'rgba(220,220,255,0.7)']}
            style={styles.glassModal}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.summaryTitle}>Your Badges</Text>
            {badges.length === 0 ? (
              <Text style={styles.leaderboardEmpty}>No badges earned yet.</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginVertical: 8 }}>
                {badges.map(badge => (
                  <View key={badge} style={styles.badgeBoxGlass}>
                    <Ionicons name="ribbon" size={16} color="#FFD700" style={{ marginRight: 4 }} />
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))}
              </View>
            )}
            <Button title="Close" onPress={() => setShowBadges(false)} />
          </LinearGradient>
        </View>
      </Modal>
      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['rgba(255,255,255,0.85)', 'rgba(220,220,255,0.7)']}
            style={styles.glassModal}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.summaryTitle}>Settings</Text>
            <Text style={[styles.summaryText, { marginBottom: 8 }]}>Pick Button Color:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {buttonColorOptions.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorCircle, { backgroundColor: color, borderWidth: buttonColor === color ? 3 : 1, borderColor: buttonColor === color ? '#333' : '#ccc' }]}
                  onPress={() => saveButtonColor(color)}
                />
              ))}
            </View>
            <Text style={[styles.summaryText, { marginTop: 16 }]}>Your Nickname:</Text>
            <TextInput
              style={styles.nicknameInput}
              value={nicknameInput}
              onChangeText={setNicknameInput}
              placeholder="Enter nickname"
              maxLength={16}
              autoCapitalize="words"
              textAlign="center"
            />
            <Button title="Save Nickname" onPress={() => saveNickname(nicknameInput.trim() || 'Player')} />
            {/* Chaos Mode Toggle */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 8 }}>
              <Ionicons name="flame" size={22} color={chaosMode ? '#FF6F61' : '#bbb'} style={{ marginRight: 8 }} />
              <Text style={[styles.summaryText, { flex: 1 }]}>Chaos Mode</Text>
              <TouchableOpacity
                style={{ backgroundColor: chaosMode ? '#FF6F61' : '#ccc', borderRadius: 16, padding: 6, paddingHorizontal: 18 }}
                onPress={() => saveChaosMode(!chaosMode)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{chaosMode ? 'ON' : 'OFF'}</Text>
              </TouchableOpacity>
            </View>
            <Button title="Close" onPress={() => setShowSettings(false)} />
          </LinearGradient>
        </View>
      </Modal>
      {/* Difficulty Selection */}
      {!timerActive && (
        <View style={styles.difficultyRow}>
          {DIFFICULTIES.map((diff) => (
            <TouchableOpacity
              key={diff.label}
              style={[
                styles.difficultyButton,
                difficulty.label === diff.label && styles.selectedDifficultyButton,
              ]}
              onPress={() => setDifficulty(diff)}
              disabled={timerActive}
              activeOpacity={0.85}
            >
              <Text style={styles.difficultyText}>{diff.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {/* Leaderboard Display */}
      <View style={styles.leaderboardContainer}>
        <Text style={[styles.leaderboardTitle, { color: themeColors.leaderboardTitle }]}>Leaderboard (Top 5)</Text>
        {leaderboard.length === 0 ? (
          <Text style={[styles.leaderboardEmpty, { color: themeColors.leaderboardEmpty }]}>No scores yet.</Text>
        ) : (
          leaderboard.map((score, idx) => (
            <View key={idx} style={[styles.leaderboardCard, idx === 0 && styles.leaderboardCardTop]}>
              <Ionicons name={idx === 0 ? 'star' : 'person'} size={18} color={idx === 0 ? '#FFD700' : '#A259FF'} style={{ marginRight: 4 }} />
              <Text style={[styles.leaderboardEntry, { color: themeColors.leaderboardEntry }]}> {idx + 1}. {score.toFixed(1)}s {nickname}</Text>
            </View>
          ))
        )}
      </View>
      {/* Settings Button - Removed duplicate */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridBgOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    backgroundColor: 'repeating-linear-gradient(135deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)',
    zIndex: 0,
  },
  glassModal: {
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 480,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  summaryModal: {
    // replaced by glassModal
    display: 'none',
  },
  summaryTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#A259FF',
    fontFamily: 'SpaceMono',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  summaryText: {
    fontSize: 18,
    marginBottom: 4,
    color: '#333',
    fontFamily: 'SpaceMono',
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  countdownText: {
    fontSize: 90,
    color: '#fff',
    fontWeight: 'bold',
    textShadowColor: '#A259FF',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 12,
    fontFamily: 'SpaceMono',
  },
  navBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  navBarGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  navBarLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    letterSpacing: 1,
    marginLeft: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  titleGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 12,
  },
  gameTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    letterSpacing: 1,
  },
  challengeBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(35, 35, 45, 0.95)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  challengeBarGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  streakText: {
    color: '#FF9500',
    fontSize: 14,
    fontFamily: 'SpaceMono',
    fontWeight: '500',
  },
  gameLogoContainer: {
    marginRight: 12,
  },
  gameLogoGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gameTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  gameTitleBackground: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  gameTitleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    letterSpacing: 1.5,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dailyChallengeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  themeToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  statsBadgeText: {
    color: '#FF9500',
    fontSize: 14,
    fontFamily: 'SpaceMono',
    fontWeight: '500',
  },
  /* Removed duplicate styles */
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dailyChallengeContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  dailyStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  dailyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  navBarGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  navBarSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  navBarControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeToggleContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 20,
    display: 'none', // Hide the old container
  },
  themeToggleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    shadowColor: '#A259FF',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  themeToggleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'SpaceMono',
  },
  badgeBox: {
    display: 'none',
  },
  badgeBoxGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    margin: 4,
    shadowColor: '#FFD700',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  badgeText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 15,
    fontFamily: 'SpaceMono',
  },
  settingsButtonContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 20,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    margin: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dailyButtonContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 8,
    display: 'none', // Hide the old container
  },
  dailyButton: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#34C759',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  dailyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  dailyInfoContainer: {
    paddingHorizontal: 4,
  },
  dailyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    fontFamily: 'SpaceMono',
    letterSpacing: 1.1,
  },
  dailyInfoText: {
    color: '#34C759',
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'SpaceMono',
    opacity: 0.9,
    textShadowColor: 'rgba(52, 199, 89, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  nicknameInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    fontFamily: 'SpaceMono',
  },
  funFactContainer: {
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  funFactText: {
    fontSize: 16,
    color: '#A259FF',
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: 'SpaceMono',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d9534f',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 24,
    elevation: 2,
    shadowColor: '#d9534f',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'SpaceMono',
    letterSpacing: 1.1,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A259FF',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 12,
    elevation: 3,
    shadowColor: '#A259FF',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  startButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    fontFamily: 'SpaceMono',
    letterSpacing: 1.1,
  },
  leaderboardContainer: {
    marginBottom: 8,
    alignItems: 'center',
    width: '100%',
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
    fontFamily: 'SpaceMono',
    letterSpacing: 1.1,
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginVertical: 5,
    marginHorizontal: 4,
    width: '90%',
    shadowColor: '#A259FF',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  leaderboardCardTop: {
    backgroundColor: 'rgba(255,215,0,0.18)',
    borderWidth: 1,
    borderColor: '#FFD700',
    paddingVertical: 12,
  },
  leaderboardEntry: {
    fontSize: 16,
    color: '#555',
    fontFamily: 'SpaceMono',
    fontWeight: 'bold',
  },
  leaderboardEmpty: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
    fontFamily: 'SpaceMono',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
    zIndex: 1,
  },
  numberButton: {
    width: 60,
    height: 60,
    margin: 6,
    backgroundColor: '#007AFF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  clickedButton: {
    backgroundColor: '#d0d0d0',
  },
  numberText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
  },
  highScore: {
    fontSize: 18,
    marginBottom: 8,
    color: '#007AFF',
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
  },
  timer: {
    fontSize: 28,
    marginBottom: 20,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
  },
  difficultyRow: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'center',
  },
  difficultyButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    backgroundColor: '#e0e0e0',
    borderRadius: 18,
    marginHorizontal: 6,
    marginBottom: 4,
    elevation: 2,
    shadowColor: '#A259FF',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  selectedDifficultyButton: {
    backgroundColor: '#A259FF',
  },
  difficultyText: {
    color: '#333',
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    fontSize: 16,
    letterSpacing: 1.1,
  },
  summaryCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: 'rgba(162,89,255,0.08)',
    borderRadius: 16,
    padding: 4,
  },
  summarySection: {
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  summarySectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#A259FF',
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    marginRight: 6,
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'SpaceMono',
  },
  summaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A259FF',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginHorizontal: 6,
    marginVertical: 4,
    elevation: 2,
    shadowColor: '#A259FF',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'SpaceMono',
    letterSpacing: 1.1,
  },
});
