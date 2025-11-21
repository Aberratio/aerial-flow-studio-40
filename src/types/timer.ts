export interface TimerConfig {
  // Basic settings
  workDuration: number;           // seconds
  restDuration: number;           // seconds
  rounds: number;                 // number of rounds
  sets: number;                   // number of sets
  restBetweenSets: number;        // seconds
  prepareTime: number;            // seconds
  
  // Audio settings
  enableSound: boolean;
  countdownBeeps: number;         // seconds before end to beep (e.g., 3)
  voiceAnnouncements: boolean;    // "Work", "Rest", "Round X"
  beepVolume: number;             // 0-100
  
  // Display
  showExerciseName: boolean;
  exerciseName?: string;
  
  // Metadata
  presetName?: string;            // e.g., "Tabata", "My Custom"
  lastUsed: Date;
}

export interface TimerState {
  phase: 'prepare' | 'work' | 'rest' | 'set-rest' | 'finished';
  currentRound: number;
  currentSet: number;
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
}

export const DEFAULT_CONFIG: TimerConfig = {
  workDuration: 45,
  restDuration: 15,
  rounds: 8,
  sets: 1,
  restBetweenSets: 60,
  prepareTime: 10,
  enableSound: true,
  countdownBeeps: 3,
  voiceAnnouncements: false,
  beepVolume: 70,
  showExerciseName: false,
  lastUsed: new Date(),
};

export const DEFAULT_PRESETS: Partial<TimerConfig>[] = [
  {
    presetName: "Tabata",
    workDuration: 20,
    restDuration: 10,
    rounds: 8,
    sets: 1,
    prepareTime: 10,
  },
  {
    presetName: "HIIT Classic",
    workDuration: 40,
    restDuration: 20,
    rounds: 10,
    sets: 1,
    prepareTime: 10,
  },
  {
    presetName: "EMOM",
    workDuration: 60,
    restDuration: 0,
    rounds: 20,
    sets: 1,
    prepareTime: 5,
  },
  {
    presetName: "Circuit",
    workDuration: 30,
    restDuration: 15,
    rounds: 12,
    sets: 3,
    restBetweenSets: 90,
    prepareTime: 10,
  },
];
