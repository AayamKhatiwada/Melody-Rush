import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, Vibration } from 'react-native';
import { useGameStore } from '../../store';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../constants/theme';
import {
  LANES,
  LANE_WIDTH,
  SCREEN_HEIGHT,
  BASE_SPEED,
  SPEED_MULTIPLIER,
  HIT_ZONE_HEIGHT,
  SCORE_NORMAL,
} from '../../constants';
import { TileData } from '../../types';
import { audioManager } from '../../game/audio';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

type FeedbackType = 'perfect' | 'good' | 'miss' | null;

const FEEDBACK_COLORS: Record<string, string> = {
  perfect: COLORS.perfect,
  good: COLORS.good,
  miss: COLORS.miss,
};

export const GameScreen = () => {
  const { setGameState, setScore, setCombo, combo, score, stats, updateStats } = useGameStore();

  const [tiles, setTiles] = useState<TileData[]>([]);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [missFlash, setMissFlash] = useState(false);
  const [feverActive, setFeverActive] = useState(false);

  const tilesRef = useRef<TileData[]>([]);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const currentSpeedRef = useRef(BASE_SPEED);
  const timeElapsedRef = useRef(0);
  const spawnTimerRef = useRef(0);

  const feverActiveRef = useRef(false);
  const feverTimerRef = useRef(0);
  const lanePressedRef = useRef([false, false, false, false]);

  // Combo pop animation
  const comboScale = useRef(new Animated.Value(1)).current;
  const comboOpacity = useRef(new Animated.Value(0)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;

  const prevComboRef = useRef(0);

  useEffect(() => {
    if (combo > 0 && combo !== prevComboRef.current) {
      prevComboRef.current = combo;
      Animated.sequence([
        Animated.parallel([
          Animated.spring(comboScale, { toValue: 1.3, useNativeDriver: true, speed: 40, bounciness: 12 }),
          Animated.timing(comboOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]),
        Animated.spring(comboScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
      ]).start();
    } else if (combo === 0) {
      prevComboRef.current = 0;
      Animated.timing(comboOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [combo]);

  const showFeedback = (type: FeedbackType) => {
    setFeedback(type);
    feedbackOpacity.setValue(1);
    Animated.timing(feedbackOpacity, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start(() => setFeedback(null));
  };

  const startGameLoop = () => {
    lastTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(gameLoop);
    audioManager.playMusic();
  };

  const stopGameLoop = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const spawnTile = () => {
    const lane = Math.floor(Math.random() * LANES);
    
    // Choose tile type based on probability weights
    const rand = Math.random();
    let type: 'normal' | 'long' | 'bomb' | 'golden' = 'normal';
    let holdLength = undefined;

    if (rand < 0.70) {
      type = 'normal';
    } else if (rand < 0.85) {
      type = 'long';
      holdLength = 320; // 320 pixels tail length
    } else if (rand < 0.95) {
      type = 'bomb';
    } else {
      type = 'golden';
    }

    const newTile: TileData = {
      id: Math.random().toString(),
      lane,
      y: -180 - (holdLength || 0),
      speed: currentSpeedRef.current,
      type,
      isHit: false,
      holdLength,
      isHolding: false,
      holdProgress: 0,
      holdCompleted: false,
    };
    tilesRef.current = [...tilesRef.current, newTile];
    setTiles(tilesRef.current);
  };

  const gameOver = () => {
    stopGameLoop();
    audioManager.playGameOverSound();
    
    // Clean up fever mode
    feverActiveRef.current = false;
    setTimeout(() => setFeverActive(false), 0);

    const currentScore = useGameStore.getState().score;
    const maxCombo = useGameStore.getState().maxCombo;

    if (currentScore > stats.highScore) updateStats({ highScore: currentScore });
    if (maxCombo > stats.bestCombo) updateStats({ bestCombo: maxCombo });

    setGameState('gameover');
  };

  const gameLoop = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    // Fever timer update
    if (feverActiveRef.current) {
      feverTimerRef.current -= deltaTime;
      if (feverTimerRef.current <= 0) {
        feverTimerRef.current = 0;
        feverActiveRef.current = false;
        setTimeout(() => setFeverActive(false), 0);
      }
    }

    timeElapsedRef.current += deltaTime;
    if (timeElapsedRef.current > 10) {
      currentSpeedRef.current *= SPEED_MULTIPLIER;
      timeElapsedRef.current = 0;
    }

    spawnTimerRef.current += deltaTime;
    const spawnRate = 150 / currentSpeedRef.current;
    if (spawnTimerRef.current > spawnRate) {
      spawnTile();
      spawnTimerRef.current = 0;
    }

    let missed = false;
    tilesRef.current = tilesRef.current
      .map(tile => {
        if (tile.isHit) return tile;

        const newY = tile.y + tile.speed * deltaTime;

        // Passed bomb tile: clear quietly with no game over
        if (tile.type === 'bomb') {
          if (newY > SCREEN_HEIGHT) {
            return { ...tile, y: newY, isHit: true };
          }
          return { ...tile, y: newY };
        }

        // Long/hold tile logic
        if (tile.type === 'long') {
          if (tile.isHolding) {
            // Early release check
            if (!lanePressedRef.current[tile.lane]) {
              missed = true;
              return { ...tile, y: newY, isHolding: false };
            }

            // Award continuous score holding
            const pointsGained = Math.max(1, Math.floor(deltaTime * 120));
            const finalPoints = feverActiveRef.current ? pointsGained * 2 : pointsGained;
            setTimeout(() => {
              setScore(prev => prev + finalPoints);
            }, 0);

            // Completion check
            const tailY = newY - (tile.holdLength || 320);
            const hitZoneLineY = SCREEN_HEIGHT - 100;
            if (tailY >= hitZoneLineY) {
              setTimeout(() => {
                showFeedback('perfect');
                const bonus = 60;
                const finalBonus = feverActiveRef.current ? bonus * 2 : bonus;
                setScore(prev => prev + finalBonus);
                setCombo(prev => prev + 1);
                audioManager.playTapSound();
              }, 0);
              return { ...tile, y: newY, isHit: true, holdCompleted: true, isHolding: false };
            }

            return { ...tile, y: newY };
          } else {
            // Missed head of hold tile
            const hitZoneLineY = SCREEN_HEIGHT - 100;
            if (newY > hitZoneLineY + 20) {
              missed = true;
            }
            return { ...tile, y: newY };
          }
        }

        // Standard/Golden missed checks
        if (newY > SCREEN_HEIGHT && !tile.isHit) {
          missed = true;
        }

        return { ...tile, y: newY };
      })
      .filter(tile => tile.y < SCREEN_HEIGHT + 200 && !tile.isHit);

    setTiles(tilesRef.current);

    if (missed) {
      gameOver();
      return;
    }

    if (useGameStore.getState().gameState === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
  };

  useEffect(() => {
    startGameLoop();
    return () => stopGameLoop();
  }, []);

  const TILE_RENDER_HEIGHT = 130;

  const handleLaneTap = (laneIndex: number, tapY: number) => {
    let hitTileId: string | null = null;
    let hitTileY = -1000;
    let hitTileType: 'normal' | 'long' | 'bomb' | 'golden' = 'normal';

    for (const tile of tilesRef.current) {
      if (
        tile.lane === laneIndex &&
        !tile.isHit &&
        tapY >= tile.y &&
        tapY <= tile.y + TILE_RENDER_HEIGHT
      ) {
        if (tile.y > hitTileY) {
          hitTileY = tile.y;
          hitTileId = tile.id;
          hitTileType = tile.type;
        }
      }
    }

    if (hitTileId) {
      if (hitTileType === 'bomb') {
        // Boom! Instant game over with high vibration
        Vibration.vibrate(400);
        audioManager.playMissSound();
        gameOver();
        return;
      }

      if (hitTileType === 'long') {
        // Start holding
        tilesRef.current = tilesRef.current.map(t =>
          t.id === hitTileId ? { ...t, isHolding: true } : t
        );
        setTiles(tilesRef.current);
        audioManager.playTapSound();
        Vibration.vibrate(40);
        return;
      }

      // Normal or Golden tiles
      tilesRef.current = tilesRef.current.map(t =>
        t.id === hitTileId ? { ...t, isHit: true } : t
      );
      setTiles(tilesRef.current);

      if (hitTileType === 'golden') {
        feverActiveRef.current = true;
        feverTimerRef.current = 5.0; // 5-second Fever Mode
        setFeverActive(true);
        Vibration.vibrate([0, 80, 50, 80]);
      } else {
        Vibration.vibrate(30);
      }

      const currentCombo = useGameStore.getState().combo + 1;
      setCombo(currentCombo);
      
      const feverMult = feverActiveRef.current ? 2 : 1;
      const multiplier = 1 + Math.floor(currentCombo / 10) * 0.1;
      setScore(prev => prev + Math.floor(SCORE_NORMAL * multiplier * feverMult));

      const hitZoneTop = SCREEN_HEIGHT - HIT_ZONE_HEIGHT - 100;
      const dist = Math.abs(hitTileY - hitZoneTop);
      showFeedback(dist < 80 ? 'perfect' : 'good');

      audioManager.playTapSound();
    }
  };

  return (
    <View style={styles.container}>
      {/* Miss flash overlay */}
      {missFlash && <View style={styles.missOverlay} pointerEvents="none" />}

      {/* Fever mode dynamic border overlay */}
      {feverActive && <View style={styles.feverOverlay} pointerEvents="none" />}

      {/* HUD */}
      <View style={styles.hud} pointerEvents="none">
        <View style={styles.scoreWrapper}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreText}>{score.toLocaleString()}</Text>
        </View>

        {feverActive && (
          <View style={styles.feverBanner}>
            <Text style={styles.feverBannerText}>★ FEVER 2X ★</Text>
          </View>
        )}

        <Animated.View style={[styles.comboWrapper, { opacity: comboOpacity, transform: [{ scale: comboScale }] }]}>
          <Text style={styles.comboText}>{combo}x</Text>
          <Text style={styles.comboLabel}>COMBO</Text>
        </Animated.View>
      </View>

      {/* Feedback label */}
      {feedback && (
        <Animated.View style={[styles.feedbackContainer, { opacity: feedbackOpacity }]} pointerEvents="none">
          <Text style={[styles.feedbackText, { color: FEEDBACK_COLORS[feedback] }]}>
            {feedback.toUpperCase()}
          </Text>
        </Animated.View>
      )}

      {/* Game area */}
      <View style={styles.gameArea}>
        {/* Lane separators */}
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.laneDivider, { left: i * LANE_WIDTH }]} pointerEvents="none" />
        ))}

        {/* Lane tap zones with onPressIn & onPressOut hold-tracking */}
        {[0, 1, 2, 3].map(laneIndex => (
          <TouchableOpacity
            key={laneIndex}
            style={[styles.lane, { left: laneIndex * LANE_WIDTH }]}
            activeOpacity={1}
            onPressIn={e => {
              lanePressedRef.current[laneIndex] = true;
              handleLaneTap(laneIndex, e.nativeEvent.locationY);
            }}
            onPressOut={() => {
              lanePressedRef.current[laneIndex] = false;
            }}
          />
        ))}

        {/* Tiles */}
        {tiles.map(tile => {
          if (tile.isHit) return null;

          let tileStyle: any[] = [styles.tile];
          let child = null;

          if (tile.type === 'bomb') {
            tileStyle.push(styles.bombTile);
            child = (
              <View style={styles.bombCenter}>
                <Text style={styles.bombText}>💣</Text>
              </View>
            );
          } else if (tile.type === 'golden') {
            tileStyle.push(styles.goldenTile);
            child = (
              <View style={styles.goldenCenter}>
                <Text style={styles.goldenText}>⭐</Text>
              </View>
            );
          } else if (tile.type === 'long') {
            tileStyle.push(tile.isHolding ? styles.longTileActive : styles.longTile);
            child = (
              <View style={styles.longCenter}>
                <Text style={styles.longText}>⏸</Text>
              </View>
            );
          }

          return (
            <React.Fragment key={tile.id}>
              {tile.type === 'long' && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.holdTail,
                    {
                      left: tile.lane * LANE_WIDTH + 12,
                      top: tile.y - (tile.holdLength || 320) + 65,
                      width: LANE_WIDTH - 24,
                      height: tile.holdLength || 320,
                      backgroundColor: tile.isHolding ? 'rgba(50,255,126,0.35)' : 'rgba(50,255,126,0.15)',
                      borderColor: tile.isHolding ? '#32FF7E' : 'rgba(50,255,126,0.6)',
                    }
                  ]}
                />
              )}
              <View
                pointerEvents="none"
                style={[
                  tileStyle,
                  {
                    left: tile.lane * LANE_WIDTH + 3,
                    top: tile.y,
                    width: LANE_WIDTH - 6,
                  },
                ]}
              >
                {child}
              </View>
            </React.Fragment>
          );
        })}

        {/* Hit zone */}
        <View style={styles.hitZone} pointerEvents="none">
          <View style={styles.hitZoneLine} />
        </View>
      </View>

      <View style={{ position: 'absolute', bottom: 0, alignItems: 'center', width: '100%', zIndex: 100 }}>
        <BannerAd
          unitId={TestIds.BANNER}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  missOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,77,77,0.18)',
    zIndex: 50,
  },
  feverOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderColor: '#8B5CF6',
    borderWidth: 4,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(139,92,246,0.03)',
    zIndex: 15,
  },
  hud: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    zIndex: 20,
  },
  scoreWrapper: {
    alignItems: 'flex-start',
  },
  scoreLabel: {
    fontSize: FONT_SIZE.caption,
    color: COLORS.textMuted,
    letterSpacing: 2,
    fontWeight: FONT_WEIGHT.semibold,
  },
  scoreText: {
    fontSize: FONT_SIZE.h1,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    letterSpacing: 1,
  },
  feverBanner: {
    backgroundColor: '#8B5CF6',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    ...SHADOWS.neonPurple,
  },
  feverBannerText: {
    color: '#FFFFFF',
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.caption,
    letterSpacing: 2,
  },
  comboWrapper: {
    alignItems: 'center',
  },
  comboText: {
    fontSize: FONT_SIZE.displayLg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
    letterSpacing: 1,
    ...SHADOWS.neonBlue,
  },
  comboLabel: {
    fontSize: FONT_SIZE.caption,
    color: COLORS.primary,
    letterSpacing: 2,
    opacity: 0.7,
  },
  feedbackContainer: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  feedbackText: {
    fontSize: FONT_SIZE.h2,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 4,
  },
  gameArea: {
    flex: 1,
  },
  laneDivider: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: COLORS.laneSeperator,
    zIndex: 1,
  },
  lane: {
    position: 'absolute',
    width: LANE_WIDTH,
    height: '100%',
    zIndex: 5,
  },
  tile: {
    position: 'absolute',
    height: 130,
    backgroundColor: COLORS.tile,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    zIndex: 10,
    ...SHADOWS.neonBlue,
    overflow: 'hidden',
  },
  bombTile: {
    backgroundColor: '#1C0D0D',
    borderColor: '#FF4D4D',
    ...SHADOWS.neonRed,
  },
  bombCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bombText: {
    fontSize: 28,
  },
  goldenTile: {
    backgroundColor: '#1E1B0A',
    borderColor: '#FFD93D',
    ...SHADOWS.neonGold,
  },
  goldenCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldenText: {
    fontSize: 28,
    textShadowColor: '#FFD93D',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  longTile: {
    backgroundColor: '#0D1C13',
    borderColor: '#32FF7E',
    ...SHADOWS.neonGreen,
  },
  longTileActive: {
    backgroundColor: '#13351E',
    borderColor: '#32FF7E',
    ...SHADOWS.neonGreen,
    shadowRadius: 22,
  },
  longCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  longText: {
    fontSize: 26,
    color: '#32FF7E',
  },
  holdTail: {
    position: 'absolute',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: RADIUS.sm,
    zIndex: 4,
  },
  hitZone: {
    position: 'absolute',
    bottom: 100,
    width: '100%',
    height: HIT_ZONE_HEIGHT,
    backgroundColor: COLORS.hitZone,
    zIndex: 2,
    justifyContent: 'flex-start',
  },
  hitZoneLine: {
    width: '100%',
    height: 2,
    backgroundColor: COLORS.primary,
    opacity: 0.6,
    ...SHADOWS.neonBlue,
  },
});
