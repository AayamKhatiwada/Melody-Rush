import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

export const LANES = 4;
export const LANE_WIDTH = SCREEN_WIDTH / LANES;

export const TILE_HEIGHT = 150; // Or whatever looks good

export const HIT_ZONE_HEIGHT = 120;
export const HIT_ZONE_Y = SCREEN_HEIGHT - HIT_ZONE_HEIGHT - 100; // Position at the bottom

export const BASE_SPEED = 300; // pixels per second
export const SPEED_MULTIPLIER = 1.05; // Increase speed every X seconds or tiles

export const SCORE_NORMAL = 10;
