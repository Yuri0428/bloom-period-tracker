import {
  createContext, useContext, useState, useEffect,
  ReactNode, useCallback, useRef,
} from 'react';
import { PeriodEntry, CycleInfo, CyclePhase } from '../types';
import { useAuth } from './AuthContext';
import api from '../lib/api';
import {
  format, addDays, subDays, parseISO,
  differenceInDays, isWithinInterval,
} from 'date-fns';

interface DataContextType {
  entries: PeriodEntry[];
  isLoadingData: boolean;
  addEntry: (entry: Omit<PeriodEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<PeriodEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntry: (date: string) => PeriodEntry | undefined;
  getCycleInfo: (date: string) => CycleInfo;
  getMonthEntries: (year: number, month: number) => PeriodEntry[];
  lastPeriodStart: string | null;
  nextPeriodPrediction: string | null;
  nextOvulation: string | null;
  currentCycleDay: number;
  currentPhase: CyclePhase;
  refreshEntries: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

// ─── Shape converters ──────────────────────────────────────────────────────

/**
 * The backend stores cycles as documents with embedded dayLogs.
 * The UI works with flat PeriodEntry objects (one per calendar day).
 * We flatten them here, and keep a reverse map so we can find the
 * parent cycle when saving a log.
 */
function flattenCycles(cycles: any[], userId: string): PeriodEntry[] {
  const entries: PeriodEntry[] = [];
  for (const cycle of cycles) {
    for (const log of cycle.dayLogs ?? []) {
      const dateStr = format(parseISO(log.date), 'yyyy-MM-dd');
      entries.push({
        id: `${cycle._id}__${dateStr}`,   // composite id
        userId,
        date: dateStr,
        flow: log.flow === 'none' ? undefined : log.flow,
        painLevel: log.painLevel ?? 0,
        symptoms: log.symptoms ?? [],
        moods: log.mood && log.mood !== 'neutral' ? [log.mood] : [],
        notes: log.notes ?? '',
        temperature: log.temperature,
        weight: undefined,                 // not in backend model, ignored
        sexualActivity: log.sexualActivity ?? false,
        createdAt: cycle.createdAt,
        updatedAt: cycle.updatedAt,
      });
    }

    // If a cycle has NO day logs, still create a synthetic entry for startDate
    // so the calendar / predictions know a period happened.
    if ((cycle.dayLogs ?? []).length === 0) {
      const dateStr = format(parseISO(cycle.startDate), 'yyyy-MM-dd');
      entries.push({
        id: `${cycle._id}__${dateStr}`,
        userId,
        date: dateStr,
        flow: 'medium',
        painLevel: 0,
        symptoms: [],
        moods: [],
        notes: cycle.notes ?? '',
        sexualActivity: false,
        createdAt: cycle.createdAt,
        updatedAt: cycle.updatedAt,
      });
    }
  }
  return entries;
}

/** Given a date, find or build the best cycle to attach a log to. */
async function resolveCycleId(
  date: string,
  rawCycles: any[],
): Promise<string> {
  const target = parseISO(date);

  // Find a cycle whose range contains this date
  for (const c of rawCycles) {
    const start = parseISO(c.startDate);
    const end = c.endDate ? parseISO(c.endDate) : addDays(start, 10);
    if (target >= start && target <= end) return c._id;
  }

  // Find the most recent cycle that started before this date
  const before = rawCycles
    .filter(c => parseISO(c.startDate) <= target)
    .sort((a, b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime());

  if (before.length > 0) {
    const gap = differenceInDays(target, parseISO(before[0].startDate));
    if (gap <= 10) return before[0]._id;
  }

  // Create a new cycle starting on this date
  const { cycle } = await api.createCycle(date);
  return cycle._id;
}

// ─── Provider ──────────────────────────────────────────────────────────────

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PeriodEntry[]>([]);
  const [rawCycles, setRawCycles] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const loadedForUser = useRef<string | null>(null);

  const loadEntries = useCallback(async () => {
    if (!user) { setEntries([]); setRawCycles([]); return; }
    setIsLoadingData(true);
    try {
      const { cycles } = await api.getEntries();
      setRawCycles(cycles);
      setEntries(flattenCycles(cycles, user.id));
    } catch {
      // silently fail — UI still works, just empty
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) { setEntries([]); setRawCycles([]); loadedForUser.current = null; return; }
    if (loadedForUser.current === user.id) return;
    loadedForUser.current = user.id;
    loadEntries();
  }, [user, loadEntries]);

  // ── CRUD ────────────────────────────────────────────────────────────────

  const addEntry = async (
    entry: Omit<PeriodEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (!user) return;
    const cycleId = await resolveCycleId(entry.date, rawCycles);

    const logPayload = {
      date: entry.date,
      flow: entry.flow ?? 'none',
      painLevel: entry.painLevel,
      symptoms: entry.symptoms,
      mood: entry.moods?.[0] ?? 'neutral',   // backend stores single mood string
      notes: entry.notes,
      sexualActivity: entry.sexualActivity,
      temperature: entry.temperature,
    };

    await api.saveLog(cycleId, logPayload);
    await loadEntries();
  };

  const updateEntry = async (id: string, updates: Partial<PeriodEntry>) => {
    if (!user) return;
    // id is "cycleId__date"
    const [cycleId, date] = id.split('__');
    const existing = entries.find(e => e.id === id);
    if (!existing) return;
    const merged = { ...existing, ...updates };

    const logPayload = {
      date,
      flow: merged.flow ?? 'none',
      painLevel: merged.painLevel,
      symptoms: merged.symptoms,
      mood: merged.moods?.[0] ?? 'neutral',  // backend stores single mood string
      notes: merged.notes,
      sexualActivity: merged.sexualActivity,
      temperature: merged.temperature,
    };

    await api.saveLog(cycleId, logPayload);
    await loadEntries();
  };

  const deleteEntry = async (id: string) => {
    const [cycleId, date] = id.split('__');
    await api.deleteLog(cycleId, date);
    await loadEntries();
  };

  const refreshEntries = loadEntries;

  // ── Derived values ───────────────────────────────────────────────────────

  const getEntry = (date: string) => entries.find(e => e.date === date);

  const getPeriodStartDates = useCallback((): string[] => {
    const periodDates = entries
      .filter(e => e.flow)
      .map(e => e.date)
      .sort();

    const starts: string[] = [];
    let prevDate: string | null = null;

    for (const date of periodDates) {
      if (!prevDate || differenceInDays(parseISO(date), parseISO(prevDate)) > 2) {
        starts.push(date);
      }
      prevDate = date;
    }
    return starts;
  }, [entries]);

  const lastPeriodStart = getPeriodStartDates().slice(-1)[0] || null;
  const cycleLength = user?.cycleLength || 28;
  const periodLength = user?.periodLength || 5;

  const nextPeriodPrediction = lastPeriodStart
    ? format(addDays(parseISO(lastPeriodStart), cycleLength), 'yyyy-MM-dd')
    : null;

  const nextOvulation = lastPeriodStart
    ? format(addDays(parseISO(lastPeriodStart), cycleLength - 14), 'yyyy-MM-dd')
    : null;

  const currentCycleDay = lastPeriodStart
    ? differenceInDays(new Date(), parseISO(lastPeriodStart)) + 1
    : 0;

  const getPhase = (dayOfCycle: number): CyclePhase => {
    if (dayOfCycle <= 0) return 'unknown';
    if (dayOfCycle <= periodLength) return 'menstrual';
    if (dayOfCycle <= cycleLength - 15) return 'follicular';
    if (dayOfCycle <= cycleLength - 11) return 'ovulation';
    if (dayOfCycle <= cycleLength) return 'luteal';
    return 'unknown';
  };

  const currentPhase = getPhase(currentCycleDay);

  const getCycleInfo = (date: string): CycleInfo => {
    const starts = getPeriodStartDates();
    const targetDate = parseISO(date);

    let relevantStart: string | null = null;
    for (const start of starts) {
      if (parseISO(start) <= targetDate) relevantStart = start;
    }

    const entry = getEntry(date);
    const isPeriod = !!(entry?.flow);

    let isPredicted = false;
    let dayOfCycle = 0;

    if (relevantStart) {
      dayOfCycle = differenceInDays(targetDate, parseISO(relevantStart)) + 1;
    } else if (nextPeriodPrediction) {
      const predStart = parseISO(nextPeriodPrediction);
      const predEnd = addDays(predStart, periodLength - 1);
      if (isWithinInterval(targetDate, { start: predStart, end: predEnd })) {
        isPredicted = true;
        dayOfCycle = differenceInDays(targetDate, predStart) + 1;
      }
    }

    const phase = getPhase(dayOfCycle);
    const ovDate = nextOvulation ? parseISO(nextOvulation) : null;
    const isOvulation = ovDate ? format(ovDate, 'yyyy-MM-dd') === date : false;
    const isFertile = ovDate
      ? isWithinInterval(targetDate, {
          start: subDays(ovDate, 5),
          end: addDays(ovDate, 1),
        })
      : false;

    return { date, phase, dayOfCycle, isPeriod, isPredicted, isOvulation, isFertile };
  };

  const getMonthEntries = (year: number, month: number) =>
    entries.filter(e => {
      const d = parseISO(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

  return (
    <DataContext.Provider value={{
      entries, isLoadingData,
      addEntry, updateEntry, deleteEntry,
      getEntry, getCycleInfo, getMonthEntries,
      lastPeriodStart, nextPeriodPrediction, nextOvulation,
      currentCycleDay, currentPhase,
      refreshEntries,
    }}>
      {children}
    </DataContext.Provider>
  );
};