export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  cycleLength: number;
  periodLength: number;
  createdAt: string;
}

export type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy';
export type PainLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type MoodType = 'happy' | 'sad' | 'anxious' | 'irritable' | 'calm' | 'energetic' | 'exhausted' | 'emotional';
export type SymptomType =
  | 'cramps' | 'bloating' | 'headache' | 'backache' | 'breast_tenderness'
  | 'nausea' | 'fatigue' | 'acne' | 'insomnia' | 'hot_flashes'
  | 'discharge' | 'spotting' | 'cravings' | 'mood_swings' | 'dizziness'
  | 'constipation' | 'diarrhea' | 'appetite_change';

export interface PeriodEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  flow?: FlowLevel;
  painLevel: PainLevel;
  symptoms: SymptomType[];
  moods: MoodType[];
  notes: string;
  temperature?: number;
  weight?: number;
  sexualActivity: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown';

export interface CycleInfo {
  date: string;
  phase: CyclePhase;
  dayOfCycle: number;
  isPeriod: boolean;
  isPredicted: boolean;
  isOvulation: boolean;
  isFertile: boolean;
}
