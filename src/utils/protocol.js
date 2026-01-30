// WalkingPad Bluetooth Protocol
// Based on reverse-engineered protocol from QWalkingPad

// Service and Characteristic UUIDs
export const WALKING_PAD_SERVICE_UUID = 0xfe00;
export const WALKING_PAD_READ_CHAR_UUID = 0xfe01;
export const WALKING_PAD_WRITE_CHAR_UUID = 0xfe02;

// Mode constants
export const MODE_AUTO = 0;
export const MODE_MANUAL = 1;
export const MODE_SLEEP = 2;

// Sensitivity constants
export const SENSITIVITY_HIGH = 1;
export const SENSITIVITY_MEDIUM = 2;
export const SENSITIVITY_LOW = 3;

// Unit constants
export const UNIT_METRIC = 0;
export const UNIT_IMPERIAL = 1;

// Display flags
export const DISPLAY_TIME = 0b1;
export const DISPLAY_SPEED = 0b10;
export const DISPLAY_DISTANCE = 0b100;
export const DISPLAY_CALORIE = 0b1000;
export const DISPLAY_STEP = 0b10000;

// Belt state constants
export const STATE_STANDBY = 0;
export const STATE_RUNNING = 1;
export const STATE_PAUSED = 2;

/**
 * Create a byte message with checksum
 */
function messageByte(k, v) {
  const checksum = (0xa2 + k + v) & 0xff;
  return new Uint8Array([0xf7, 0xa2, k, v, checksum, 0xfd]);
}

/**
 * Create an int message with checksum
 */
function messageInt(k, v) {
  const data = new Uint8Array([
    0xf7, 0xa6, k, 0,
    (v >> 16) & 0xff,
    (v >> 8) & 0xff,
    v & 0xff,
    0, 0xfd
  ]);
  
  // Calculate checksum
  let checksum = 0;
  for (let i = 1; i < 7; i++) {
    checksum += data[i];
  }
  data[7] = checksum & 0xff;
  
  return data;
}

/**
 * Create sync record message
 */
function syncRecordMessage(n) {
  const checksum = (0xa7 + 0xaa + n) & 0xff;
  return new Uint8Array([0xf7, 0xa7, 0xaa, n, checksum, 0xfd]);
}

// Protocol commands
export const commands = {
  query: () => messageByte(0, 0),
  queryParams: () => messageInt(0, 0),
  setSpeed: (speed) => messageByte(1, speed),
  setStartSpeed: (speed) => messageInt(4, speed),
  setMode: (mode) => messageByte(2, mode),
  start: () => messageByte(4, 1),
  syncRecord: (n = 255) => syncRecordMessage(n),
  setCali: (enable) => messageInt(2, enable),
  setMaxSpeed: (speed) => messageInt(3, speed),
  setAutoStart: (enable) => messageInt(5, enable),
  setSensitivity: (sensitivity) => messageInt(6, sensitivity),
  setUnit: (unit) => messageInt(8, unit),
  setLock: (enable) => messageInt(9, enable),
  setDisplayInfo: (info) => messageInt(7, info),
};

/**
 * Parse 3-byte big-endian integer
 */
function parseInt3(data, offset) {
  return (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
}

/**
 * Parse message from WalkingPad
 */
export function parseMessage(data) {
  const bytes = new Uint8Array(data);
  
  if (bytes.length < 2) {
    return { type: 'unknown', raw: bytes };
  }
  
  const messageType = bytes[1];
  
  // Info message (status response)
  if (messageType === 0xa2 && bytes.length >= 15) {
    return {
      type: 'info',
      state: bytes[2],
      speed: bytes[3], // Speed in 0.1 km/h
      mode: bytes[4],
      time: parseInt3(bytes, 5), // Time in seconds
      distance: parseInt3(bytes, 8), // Distance in 10m units
      steps: parseInt3(bytes, 11),
      isRunning: bytes[2] === 1,
    };
  }
  
  // Params message
  if (messageType === 0xa6 && bytes.length >= 14) {
    return {
      type: 'params',
      goalType: bytes[2],
      goal: parseInt3(bytes, 3),
      regulate: bytes[6],
      maxSpeed: bytes[7],
      startSpeed: bytes[8],
      startMode: bytes[9],
      sensitivity: bytes[10],
      display: bytes[11],
      lock: bytes[12],
      unit: bytes[13],
    };
  }
  
  // Record message
  if (messageType === 0xa7 && bytes.length >= 18) {
    return {
      type: 'record',
      onTime: parseInt3(bytes, 2),
      startTime: parseInt3(bytes, 5),
      duration: parseInt3(bytes, 8),
      distance: parseInt3(bytes, 11),
      steps: parseInt3(bytes, 14),
      remainingRecords: bytes[17],
    };
  }
  
  return { type: 'unknown', raw: bytes };
}

/**
 * Format time in seconds to MM:SS or HH:MM:SS
 */
export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format distance from 10m units to km
 */
export function formatDistance(distance10m) {
  const km = distance10m / 100;
  return km.toFixed(2);
}

/**
 * Format speed from 0.1 km/h units to km/h
 */
export function formatSpeed(speed10) {
  return (speed10 / 10).toFixed(1);
}

/**
 * Get mode name
 */
export function getModeName(mode) {
  switch (mode) {
    case MODE_AUTO: return 'Auto';
    case MODE_MANUAL: return 'Manual';
    case MODE_SLEEP: return 'Sleep';
    default: return 'Unknown';
  }
}

/**
 * Get state name
 */
export function getStateName(state) {
  switch (state) {
    case 0: return 'Standby';
    case 1: return 'Running';
    case 5: return 'Starting';
    default: return 'Unknown';
  }
}
