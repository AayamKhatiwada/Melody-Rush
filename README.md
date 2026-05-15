# Melody Rush - Software Requirements Specification & Implementation Plan

## 1. Project Overview
**Project Name**: Melody Rush
**Project Type**: Mobile Rhythm Game
**Platform**: Android, iOS
**Framework**: React Native with Expo
**Objective**: Develop a smooth and responsive rhythm-based mobile game where players tap falling tiles in sync with music. The game should focus on fast gameplay, smooth animations, accurate touch response, and addictive replayability. Optimized for mobile devices and maintain stable performance at 60 FPS.

## 2. Technology Stack
- **Frontend**: React Native
- **Framework**: Expo
- **Audio**: Expo AV
- **Local Storage**: AsyncStorage
- **State Management**: Zustand
- **Animations**: React Native Reanimated
- **Gesture Handling**: React Native Gesture Handler
- **Language**: TypeScript

## 3. Application Goals
- Provide smooth rhythm gameplay
- Synchronize tiles with music timing
- Maintain low touch latency
- Save progress locally
- Provide addictive endless gameplay
- Work fully offline
- Support future expansion

## 4. Core Gameplay
The player taps falling tiles before they reach the bottom of the screen.
- **Screen contains**: 4 vertical lanes, falling black tiles, score and combo indicators.
- **Player actions**: Tap valid tiles only, avoid missing tiles, avoid tapping empty spaces.
- **Game over conditions**: A tile is missed, the player taps the wrong area.

## 5. Gameplay Modes
### 5.1 Endless Mode (MVP)
Tiles continuously fall with increasing speed. Features infinite gameplay, increasing difficulty, high score tracking, and a combo system.
### 5.2 Classic Mode (Future)
Complete a fixed number of tiles as fast as possible.
### 5.3 Zen Mode (Future)
Tap as many tiles as possible within a fixed time (15s, 30s, 60s).

## 6. Tile System
- **Normal Tile**: Standard tap tile, increases score.
- **Long Tile** (Future): Requires holding touch.
- **Bomb Tile** (Future): Causes instant game over if tapped.
- **Golden Tile** (Future): Provides bonus score.

## 7. Lane System
- 4 equal-width lanes.
- Tiles spawn randomly in lanes.
- Rules: Only one tile row at a time, prevent impossible patterns, ensure fair gameplay.

## 8. State Management (Zustand)
Store handles:
- `score`, `combo`, `maxCombo`
- `gameState`: 'splash', 'idle', 'playing', 'paused', 'gameover'
- `settings`: musicEnabled, soundEnabled, volume, vibration
- `stats`: highScore, bestCombo

## 9. Next Steps / Future Roadmap
- Replace placeholder audio files with actual sound assets.
- Refine animations using `react-native-reanimated`.
- Add advanced modes (Classic, Zen).
- Implement multiplayer and online leaderboards.
