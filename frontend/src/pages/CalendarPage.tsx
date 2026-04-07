import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, parseISO, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import LogModal from '../components/LogModal';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const flowColors: Record<string, string> = {
  spotting: '#fbb6ce',
  light: '#f9a8d4',
  medium: '#f472b6',
  heavy: '#ec4899',
  very_heavy: '#be185d',
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { getEntry, getCycleInfo, getMonthEntries } = useData();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);
  const entries = getMonthEntries(currentMonth.getFullYear(), currentMonth.getMonth());

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">📅 Calendar</h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-white font-semibold text-lg min-w-[160px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-5">
        {[
          { color: '#ff6b9d', label: 'Period' },
          { color: '#34d399', label: 'Ovulation' },
          { color: 'rgba(52,211,153,0.3)', label: 'Fertile Window', border: '#34d399' },
          { color: 'rgba(255,107,157,0.2)', label: 'Predicted Period', border: '#ff6b9d', dashed: true },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: l.color, border: l.border ? `1px ${l.dashed ? 'dashed' : 'solid'} ${l.border}` : 'none' }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {DAY_LABELS.map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {/* Padding cells */}
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square p-1" />
          ))}

          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const entry = getEntry(dateStr);
            const cycleInfo = getCycleInfo(dateStr);
            const isCurrentDay = isToday(day);
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className="aspect-square p-1 relative group transition-all hover:bg-white/5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                
                {/* Fertile window background */}
                {cycleInfo.isFertile && !cycleInfo.isPeriod && !entry?.flow && (
                  <div className="absolute inset-1 rounded-xl" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }} />
                )}

                {/* Predicted period */}
                {cycleInfo.isPredicted && (
                  <div className="absolute inset-1 rounded-xl" style={{ background: 'rgba(255,107,157,0.1)', border: '1px dashed rgba(255,107,157,0.4)' }} />
                )}

                {/* Selected */}
                {isSelected && (
                  <div className="absolute inset-1 rounded-xl" style={{ border: '2px solid rgba(255,107,157,0.8)' }} />
                )}

                {/* Today */}
                {isCurrentDay && !isSelected && (
                  <div className="absolute inset-1 rounded-xl" style={{ border: '2px solid rgba(255,255,255,0.3)' }} />
                )}

                {/* Period day */}
                {entry?.flow && (
                  <div className="absolute inset-1 rounded-xl" style={{ background: `${flowColors[entry.flow]}25`, border: `1px solid ${flowColors[entry.flow]}60` }} />
                )}

                {/* Ovulation marker */}
                {cycleInfo.isOvulation && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: '#34d399' }} />
                )}

                <div className="relative z-10 h-full flex flex-col items-center justify-start pt-1">
                  <span className={`text-xs font-semibold leading-none ${isCurrentDay ? 'text-white' : !isSameMonth(day, currentMonth) ? 'text-gray-700' : 'text-gray-300'}`}
                    style={entry?.flow ? { color: flowColors[entry.flow] } : isCurrentDay ? { color: 'white' } : {}}>
                    {format(day, 'd')}
                  </span>

                  {/* Dot indicators */}
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full">
                    {(entry?.painLevel ?? 0) > 0 && (
                      <div className="w-1 h-1 rounded-full bg-yellow-400" title={`Pain: ${entry?.painLevel}`} />
                    )}
                    {(entry?.symptoms?.length ?? 0) > 0 && (
                      <div className="w-1 h-1 rounded-full bg-purple-400" title="Symptoms" />
                    )}
                    {(entry?.moods?.length ?? 0) > 0 && (
                      <div className="w-1 h-1 rounded-full bg-blue-400" title="Mood" />
                    )}
                    {entry?.sexualActivity && (
                      <div className="w-1 h-1 rounded-full bg-red-300" title="Activity" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail */}
      {selectedDate && (
        <SelectedDayCard
          date={selectedDate}
          entry={getEntry(selectedDate)}
          cycleInfo={getCycleInfo(selectedDate)}
        />
      )}

      {/* Month summary */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <SummaryCard label="Period Days" value={entries.filter(e => e.flow).length.toString()} emoji="🩸" />
        <SummaryCard label="Entries" value={entries.length.toString()} emoji="📝" />
        <SummaryCard label="Avg Pain" value={entries.length ? (entries.reduce((s, e) => s + e.painLevel, 0) / entries.length).toFixed(1) : '—'} emoji="⚡" />
      </div>

      {selectedDate && (
        <LogModal date={selectedDate} onClose={() => setSelectedDate(null)} />
      )}
    </div>
  );
}

function SelectedDayCard({ date, entry, cycleInfo }: any) {
  const flowColors: Record<string, string> = {
    spotting: '#fbb6ce', light: '#f9a8d4', medium: '#f472b6', heavy: '#ec4899', very_heavy: '#be185d',
  };

  return (
    <div className="mt-4 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">{format(parseISO(date), 'EEEE, MMMM d')}</h3>
        <div className="flex gap-2">
          {cycleInfo.dayOfCycle > 0 && (
            <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full">Day {cycleInfo.dayOfCycle}</span>
          )}
          <span className="text-xs px-3 py-1 rounded-full capitalize"
            style={{ background: 'rgba(255,107,157,0.15)', color: '#ff6b9d' }}>
            {cycleInfo.phase}
          </span>
        </div>
      </div>

      {entry ? (
        <div className="space-y-3">
          {entry.flow && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Flow:</span>
              <span className="font-medium capitalize" style={{ color: flowColors[entry.flow] }}>{String(entry.flow).replace('_', ' ')}</span>
            </div>
          )}
          {(entry.painLevel ?? 0) > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Pain:</span>
              <span className="text-white font-medium">{entry.painLevel}/10</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/10 max-w-24">
                <div className="h-full rounded-full" style={{ width: `${(entry.painLevel ?? 0) * 10}%`, background: 'linear-gradient(90deg, #fbbf24, #ef4444)' }} />
              </div>
            </div>
          )}
          {(entry.symptoms ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(entry.symptoms ?? []).map((s: string) => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-full text-purple-300" style={{ background: 'rgba(167,139,250,0.15)' }}>
                  {s.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
          {(entry.moods ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(entry.moods ?? []).map((m: string) => (
                <span key={m} className="text-xs px-2.5 py-1 rounded-full text-blue-300" style={{ background: 'rgba(96,165,250,0.15)' }}>
                  {m}
                </span>
              ))}
            </div>
          )}
          {entry.notes && (
            <p className="text-gray-400 text-sm italic">"{entry.notes}"</p>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No entry logged for this day. Click to add one.</p>
      )}

      {cycleInfo.isFertile && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          {cycleInfo.isOvulation ? '🌸 Ovulation day' : '🌿 Fertile window'}
        </div>
      )}
      {cycleInfo.isPredicted && (
        <div className="mt-2 flex items-center gap-2 text-xs text-pink-400">
          <span className="w-2 h-2 rounded-full bg-pink-400" />
          📅 Predicted period day
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-white font-bold text-xl">{value}</div>
      <div className="text-gray-500 text-xs">{label}</div>
    </div>
  );
}
