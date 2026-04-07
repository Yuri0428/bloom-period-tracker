import { useState } from 'react';
import { X, Thermometer, Weight, Heart } from 'lucide-react';
import { useData } from '../context/DataContext';
import { FlowLevel, PainLevel, SymptomType, MoodType } from '../types';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

interface Props {
  date: string;
  onClose: () => void;
}

const FLOW_OPTIONS: { value: FlowLevel; label: string; emoji: string; color: string }[] = [
  { value: 'spotting', label: 'Spotting', emoji: '💧', color: '#fbb6ce' },
  { value: 'light', label: 'Light', emoji: '🩸', color: '#f9a8d4' },
  { value: 'medium', label: 'Medium', emoji: '🩸', color: '#f472b6' },
  { value: 'heavy', label: 'Heavy', emoji: '🩸', color: '#ec4899' },
  { value: 'very_heavy', label: 'Very Heavy', emoji: '🩸', color: '#be185d' },
];

const SYMPTOMS: { value: SymptomType; label: string; emoji: string }[] = [
  { value: 'cramps', label: 'Cramps', emoji: '⚡' },
  { value: 'bloating', label: 'Bloating', emoji: '🎈' },
  { value: 'headache', label: 'Headache', emoji: '🤯' },
  { value: 'backache', label: 'Back Pain', emoji: '🔙' },
  { value: 'breast_tenderness', label: 'Breast Tenderness', emoji: '💗' },
  { value: 'nausea', label: 'Nausea', emoji: '🤢' },
  { value: 'fatigue', label: 'Fatigue', emoji: '😴' },
  { value: 'acne', label: 'Acne', emoji: '😤' },
  { value: 'insomnia', label: 'Insomnia', emoji: '👁️' },
  { value: 'hot_flashes', label: 'Hot Flashes', emoji: '🔥' },
  { value: 'discharge', label: 'Discharge', emoji: '💧' },
  { value: 'cravings', label: 'Cravings', emoji: '🍫' },
  { value: 'mood_swings', label: 'Mood Swings', emoji: '🎭' },
  { value: 'dizziness', label: 'Dizziness', emoji: '💫' },
  { value: 'constipation', label: 'Constipation', emoji: '😣' },
  { value: 'diarrhea', label: 'Diarrhea', emoji: '🚽' },
  { value: 'appetite_change', label: 'Appetite Change', emoji: '🍽️' },
];

const MOODS: { value: MoodType; label: string; emoji: string; color: string }[] = [
  { value: 'happy', label: 'Happy', emoji: '😊', color: '#fbbf24' },
  { value: 'sad', label: 'Sad', emoji: '😢', color: '#60a5fa' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', color: '#a78bfa' },
  { value: 'irritable', label: 'Irritable', emoji: '😤', color: '#f87171' },
  { value: 'calm', label: 'Calm', emoji: '😌', color: '#34d399' },
  { value: 'energetic', label: 'Energetic', emoji: '⚡', color: '#f59e0b' },
  { value: 'exhausted', label: 'Exhausted', emoji: '😩', color: '#94a3b8' },
  { value: 'emotional', label: 'Emotional', emoji: '🥺', color: '#f472b6' },
];

const PAIN_COLORS = [
  '#22c55e', '#4ade80', '#86efac', '#fde68a', '#fcd34d',
  '#fbbf24', '#fb923c', '#f87171', '#ef4444', '#dc2626', '#991b1b'
];

export default function LogModal({ date, onClose }: Props) {
  const { getEntry, addEntry } = useData();
  const existing = getEntry(date);

  const [flow, setFlow] = useState<FlowLevel | undefined>(existing?.flow);
  const [painLevel, setPainLevel] = useState<PainLevel>((existing?.painLevel ?? 0) as PainLevel);
  const [symptoms, setSymptoms] = useState<SymptomType[]>(existing?.symptoms || []);
  const [moods, setMoods] = useState<MoodType[]>(existing?.moods || []);
  const [notes, setNotes] = useState(existing?.notes || '');
  const [temperature, setTemperature] = useState<string>(existing?.temperature?.toString() || '');
  const [weight, setWeight] = useState<string>(existing?.weight?.toString() || '');
  const [sexualActivity, setSexualActivity] = useState(existing?.sexualActivity || false);
  const [tab, setTab] = useState<'flow' | 'symptoms' | 'mood' | 'extra'>('flow');

  const toggleSymptom = (s: SymptomType) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleMood = (m: MoodType) => {
    setMoods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const handleSave = async () => {
    try {
      await addEntry({
        date,
        flow,
        painLevel,
        symptoms,
        moods,
        notes,
        temperature: temperature ? parseFloat(temperature) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        sexualActivity,
      });
      toast.success('Entry saved! 🌸');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save entry');
    }
  };

  const tabs = [
    { id: 'flow', label: '🩸 Flow', },
    { id: 'symptoms', label: '⚡ Symptoms' },
    { id: 'mood', label: '😊 Mood' },
    { id: 'extra', label: '📝 More' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        style={{ background: 'linear-gradient(145deg, #1e0a3c, #2d1b4e)', border: '1px solid rgba(255,255,255,0.1)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <h2 className="text-white font-bold text-lg">Log Entry</h2>
            <p className="text-pink-300 text-sm">{format(parseISO(date), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${tab === t.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              style={tab === t.id ? { background: 'linear-gradient(135deg, rgba(255,107,157,0.3), rgba(196,77,227,0.3))', border: '1px solid rgba(255,107,157,0.4)' } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'flow' && (
            <div className="space-y-6">
              {/* Flow Level */}
              <div>
                <label className="text-pink-200 text-sm font-semibold uppercase tracking-wider mb-3 block">Flow Level</label>
                <div className="flex gap-2 flex-wrap">
                  {FLOW_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setFlow(flow === opt.value ? undefined : opt.value)}
                      className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all border ${flow === opt.value ? 'text-white scale-105' : 'text-gray-400 border-white/10 hover:border-white/20'}`}
                      style={flow === opt.value ? { background: `${opt.color}30`, borderColor: opt.color, color: opt.color } : {}}>
                      <span className="text-xl">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {!flow && (
                  <p className="text-yellow-400/70 text-xs mt-2">💡 No flow selected — this will log as symptom-only day</p>
                )}
              </div>

              {/* Pain Level */}
              <div>
                <label className="text-pink-200 text-sm font-semibold uppercase tracking-wider mb-3 block">
                  Pain Level — <span style={{ color: PAIN_COLORS[painLevel] }}>{painLevel}/10</span>
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: 11 }, (_, i) => i).map(i => (
                    <button key={i} onClick={() => setPainLevel(i as PainLevel)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all border ${painLevel === i ? 'scale-110 text-white border-transparent' : 'text-gray-400 border-white/10 hover:scale-105'}`}
                      style={painLevel === i ? { background: PAIN_COLORS[i], boxShadow: `0 4px 12px ${PAIN_COLORS[i]}60` } : {}}>
                      {i}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                  <span>No pain</span>
                  <span>Severe</span>
                </div>
              </div>
            </div>
          )}

          {tab === 'symptoms' && (
            <div>
              <label className="text-pink-200 text-sm font-semibold uppercase tracking-wider mb-3 block">
                Symptoms <span className="text-pink-400 font-normal">({symptoms.length} selected)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SYMPTOMS.map(s => (
                  <button key={s.value} onClick={() => toggleSymptom(s.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all border text-left ${symptoms.includes(s.value)
                      ? 'text-white border-pink-400/50'
                      : 'text-gray-400 border-white/10 hover:border-white/20 hover:text-gray-200'}`}
                    style={symptoms.includes(s.value) ? { background: 'rgba(255,107,157,0.15)' } : {}}>
                    <span className="text-lg flex-shrink-0">{s.emoji}</span>
                    <span className="text-xs font-medium leading-tight">{s.label}</span>
                    {symptoms.includes(s.value) && <span className="ml-auto text-pink-400 text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'mood' && (
            <div>
              <label className="text-pink-200 text-sm font-semibold uppercase tracking-wider mb-3 block">
                Mood <span className="text-pink-400 font-normal">({moods.length} selected)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {MOODS.map(m => (
                  <button key={m.value} onClick={() => toggleMood(m.value)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all border ${moods.includes(m.value) ? 'text-white' : 'text-gray-400 border-white/10 hover:text-gray-200'}`}
                    style={moods.includes(m.value) ? {
                      background: `${m.color}20`,
                      borderColor: `${m.color}60`,
                      color: m.color,
                      boxShadow: `0 4px 12px ${m.color}20`
                    } : {}}>
                    <span className="text-2xl">{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'extra' && (
            <div className="space-y-5">
              {/* Temperature */}
              <div>
                <label className="text-pink-200 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Thermometer size={14} /> Basal Body Temperature (°F)
                </label>
                <input type="number" step="0.1" min="96" max="100" value={temperature}
                  onChange={e => setTemperature(e.target.value)}
                  placeholder="e.g. 98.6"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }} />
              </div>

              {/* Weight */}
              <div>
                <label className="text-pink-200 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Weight size={14} /> Weight (lbs)
                </label>
                <input type="number" step="0.1" min="50" max="400" value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="e.g. 130"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }} />
              </div>

              {/* Sexual Activity */}
              <div>
                <label className="text-pink-200 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Heart size={14} /> Sexual Activity
                </label>
                <button onClick={() => setSexualActivity(!sexualActivity)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${sexualActivity ? 'text-pink-300 border-pink-400/40' : 'text-gray-500 border-white/10'}`}
                  style={sexualActivity ? { background: 'rgba(255,107,157,0.1)' } : {}}>
                  <span className="text-xl">{sexualActivity ? '❤️' : '🤍'}</span>
                  {sexualActivity ? 'Yes — logged' : 'Tap to log'}
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className="text-pink-200 text-sm font-semibold uppercase tracking-wider mb-2 block">📝 Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="How are you feeling today? Any observations..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none resize-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={handleSave}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44de3)', boxShadow: '0 8px 20px rgba(196,77,227,0.35)' }}>
            Save Entry 💾
          </button>
        </div>
      </div>
    </div>
  );
}