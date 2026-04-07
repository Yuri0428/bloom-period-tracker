import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Search, Trash2, Edit2, Filter, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { PeriodEntry } from '../types';
import LogModal from '../components/LogModal';
import toast from 'react-hot-toast';

const flowColors: Record<string, string> = {
  spotting: '#fbb6ce',
  light: '#f9a8d4',
  medium: '#f472b6',
  heavy: '#ec4899',
  very_heavy: '#be185d',
};

const moodEmojis: Record<string, string> = {
  happy: '😊', sad: '😢', anxious: '😰', irritable: '😤',
  calm: '😌', energetic: '⚡', exhausted: '😩', emotional: '🥺',
};

const PAIN_COLORS = [
  '#22c55e', '#4ade80', '#86efac', '#fde68a', '#fcd34d',
  '#fbbf24', '#fb923c', '#f87171', '#ef4444', '#dc2626', '#991b1b'
];

export default function ListView() {
  const { entries, deleteEntry } = useData();
  const [search, setSearch] = useState('');
  const [filterFlow, setFilterFlow] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [logDate, setLogDate] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  const filtered = [...entries]
    .filter(e => {
      const matchSearch = search === '' ||
        e.date.includes(search) ||
        e.symptoms.some(s => s.includes(search.toLowerCase())) ||
        e.notes.toLowerCase().includes(search.toLowerCase()) ||
        (e.flow && e.flow.includes(search.toLowerCase()));
      const matchFlow = filterFlow === '' || e.flow === filterFlow || (filterFlow === 'none' && !e.flow);
      return matchSearch && matchFlow;
    })
    .sort((a, b) => {
      const diff = a.date.localeCompare(b.date);
      return sortDesc ? -diff : diff;
    });

  const handleDelete = (id: string) => {
    if (confirm('Delete this entry?')) {
      deleteEntry(id);
      toast.success('Entry deleted');
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">📋 List View</h1>
        <button onClick={() => setLogDate(today)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44de3)' }}>
          <Plus size={16} /> Log Today
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by date, symptoms, notes..."
            className="w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-gray-500 text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
        <div className="flex gap-2">
          <select value={filterFlow} onChange={e => setFilterFlow(e.target.value)}
            className="px-4 py-3 rounded-xl text-sm text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <option value="">All Flow</option>
            <option value="none">No Flow</option>
            <option value="spotting">Spotting</option>
            <option value="light">Light</option>
            <option value="medium">Medium</option>
            <option value="heavy">Heavy</option>
            <option value="very_heavy">Very Heavy</option>
          </select>
          <button onClick={() => setSortDesc(!sortDesc)}
            className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm text-gray-400 hover:text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            title="Toggle sort order">
            <Filter size={16} />
            {sortDesc ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-4 mb-4 text-sm text-gray-400">
        <span>{filtered.length} entries</span>
        {search && <span>· Searching "{search}"</span>}
      </div>

      {/* Entry List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🌸</p>
          <p className="text-gray-400 text-lg font-medium">No entries found</p>
          <p className="text-gray-600 text-sm mt-1">
            {entries.length === 0 ? 'Start tracking by logging your first entry' : 'Try adjusting your search or filters'}
          </p>
          {entries.length === 0 && (
            <button onClick={() => setLogDate(today)}
              className="mt-4 px-6 py-3 rounded-xl font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44de3)' }}>
              Log First Entry
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              expanded={expandedId === entry.id}
              onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              onEdit={() => setLogDate(entry.date)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
      )}

      {logDate && <LogModal date={logDate} onClose={() => setLogDate(null)} />}
    </div>
  );
}

function EntryCard({ entry, expanded, onToggle, onEdit, onDelete }: {
  entry: PeriodEntry;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Summary Row */}
      <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/3" onClick={onToggle}>
        {/* Date */}
        <div className="text-center w-14 flex-shrink-0">
          <div className="text-xs text-gray-500 uppercase">{format(parseISO(entry.date), 'MMM')}</div>
          <div className="text-2xl font-bold text-white leading-none">{format(parseISO(entry.date), 'd')}</div>
          <div className="text-xs text-gray-500">{format(parseISO(entry.date), 'EEE')}</div>
        </div>

        {/* Flow pill */}
        <div className="flex-shrink-0">
          {entry.flow ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
              style={{ background: `${flowColors[entry.flow]}25`, color: flowColors[entry.flow], border: `1px solid ${flowColors[entry.flow]}50` }}>
              🩸 {entry.flow.replace('_', ' ')}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-gray-600"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              No flow
            </span>
          )}
        </div>

        {/* Pain bar */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {entry.painLevel > 0 ? (
            <>
              <span className="text-xs text-gray-500 flex-shrink-0">Pain</span>
              <div className="h-1.5 flex-1 rounded-full max-w-20" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full transition-all" style={{
                  width: `${entry.painLevel * 10}%`,
                  background: PAIN_COLORS[entry.painLevel]
                }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: PAIN_COLORS[entry.painLevel] }}>{entry.painLevel}</span>
            </>
          ) : (
            <span className="text-xs text-gray-600">No pain</span>
          )}
        </div>

        {/* Moods */}
        <div className="flex gap-0.5 flex-shrink-0">
          {entry.moods.slice(0, 3).map(m => (
            <span key={m} className="text-base">{moodEmojis[m]}</span>
          ))}
        </div>

        {/* Symptoms count */}
        {entry.symptoms.length > 0 && (
          <span className="text-xs text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full flex-shrink-0">
            {entry.symptoms.length} symptoms
          </span>
        )}

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0 ml-auto" onClick={e => e.stopPropagation()}>
          <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
            <Edit2 size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <Trash2 size={14} />
          </button>
        </div>

        <span className="text-gray-600 text-xs flex-shrink-0">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {entry.temperature && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">🌡️ Temp:</span>
                <span className="text-white">{entry.temperature}°F</span>
              </div>
            )}
            {entry.weight && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">⚖️ Weight:</span>
                <span className="text-white">{entry.weight} lbs</span>
              </div>
            )}
            {entry.sexualActivity && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">❤️</span>
                <span className="text-pink-300">Sexual activity logged</span>
              </div>
            )}
          </div>

          {entry.symptoms.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Symptoms</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.symptoms.map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full text-purple-200"
                    style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.2)' }}>
                    {s.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {entry.moods.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Moods</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.moods.map(m => (
                  <span key={m} className="text-xs px-2.5 py-1 rounded-full text-blue-200 flex items-center gap-1"
                    style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.2)' }}>
                    {moodEmojis[m]} {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {entry.notes && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Notes</p>
              <p className="text-gray-300 text-sm italic leading-relaxed">"{entry.notes}"</p>
            </div>
          )}

          <p className="text-xs text-gray-700">
            Logged {format(parseISO(entry.createdAt), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
      )}
    </div>
  );
}
