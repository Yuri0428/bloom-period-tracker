import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { PeriodEntry, CycleInfo, CyclePhase } from '../types';
import { useAuth } from './AuthContext';
import { format, addDays, subDays, parseISO, differenceInDays, isWithinInterval } from 'date-fns';

interface DataContextType {
  entries: PeriodEntry[];
  addEntry: (entry: Omit<PeriodEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  updateEntry: (id: string, updates: Partial<PeriodEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntry: (date: string) => PeriodEntry | undefined;
  getCycleInfo: (date: string) => CycleInfo;
  getMonthEntries: (year: number, month: number) => PeriodEntry[];
  lastPeriodStart: string | null;
  nextPeriodPrediction: string | null;
  nextOvulation: string | null;
  currentCycleDay: number;
  currentPhase: CyclePhase;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

const ENTRIES_KEY = 'luna_entries';

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PeriodEntry[]>([]);

  useEffect(() => {
    if (!user) { setEntries([]); return; }
    const all: PeriodEntry[] = JSON.parse(localStorage.getItem(ENTRIES_KEY) || '[]');
    setEntries(all.filter(e => e.userId === user.id));
  }, [user]);

  const save = (updated: PeriodEntry[]) => {
    const all: PeriodEntry[] = JSON.parse(localStorage.getItem(ENTRIES_KEY) || '[]');
    const others = all.filter(e => e.userId !== user?.id);
    localStorage.setItem(ENTRIES_KEY, JSON.stringify([...others, ...updated]));
    setEntries(updated);
  };

  const addEntry = (entry: Omit<PeriodEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const existing = entries.findIndex(e => e.date === entry.date);
    if (existing !== -1) {
      const updated = [...entries];
      updated[existing] = { ...updated[existing], ...entry, updatedAt: new Date().toISOString() };
      save(updated);
      return;
    }
    const newEntry: PeriodEntry = {
      ...entry,
      id: crypto.randomUUID(),
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    save([...entries, newEntry]);
  };

  const updateEntry = (id: string, updates: Partial<PeriodEntry>) => {
    const updated = entries.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e);
    save(updated);
  };

  const deleteEntry = (id: string) => {
    save(entries.filter(e => e.id !== id));
  };

  const getEntry = (date: string) => entries.find(e => e.date === date);

  // Calculate period start dates from entries
  const getPeriodStartDates = useCallback((): string[] => {
    const periodDates = entries
      .filter(e => e.flow && e.flow !== undefined)
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
    
    // Find the most recent period start before or on this date
    let relevantStart: string | null = null;
    for (const start of starts) {
      if (parseISO(start) <= targetDate) relevantStart = start;
    }

    // Check if it's a logged period day
    const entry = getEntry(date);
    const isPeriod = !!(entry?.flow);

    // Check if it's predicted period
    let isPredicted = false;
    let dayOfCycle = 0;
    
    if (relevantStart) {
      dayOfCycle = differenceInDays(targetDate, parseISO(relevantStart)) + 1;
    } else if (nextPeriodPrediction) {
      // Check if within predicted period range
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
      ? isWithinInterval(targetDate, { start: subDays(ovDate, 5), end: addDays(ovDate, 1) })
      : false;

    return { date, phase, dayOfCycle, isPeriod, isPredicted, isOvulation, isFertile };
  };

  const getMonthEntries = (year: number, month: number) => {
    return entries.filter(e => {
      const d = parseISO(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  };

  return (
    <DataContext.Provider value={{
      entries, addEntry, updateEntry, deleteEntry, getEntry,
      getCycleInfo, getMonthEntries,
      lastPeriodStart, nextPeriodPrediction, nextOvulation,
      currentCycleDay, currentPhase,
    }}>
      {children}
    </DataContext.Provider>
  );
};
