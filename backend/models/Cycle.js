const mongoose = require('mongoose');

// Schema for a single day log entry within a cycle
const dayLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  flow: {
    type: String,
    enum: ['none', 'spotting', 'light', 'medium', 'heavy', 'very_heavy'],
    default: 'none',
  },
  painLevel: {
    type: Number,
    min: 0,
    max: 10,
    default: 0,
  },
  symptoms: [
    {
      type: String,
      enum: [
        // Physical
        'cramps',
        'headache',
        'backache',
        'bloating',
        'breast_tenderness',
        'fatigue',
        'nausea',
        'acne',
        'hot_flashes',
        'chills',
        'dizziness',
        'diarrhea',
        'constipation',
        // Emotional
        'mood_swings',
        'irritability',
        'anxiety',
        'depression',
        'low_libido',
        'high_libido',
        'cravings',
        'insomnia',
        'brain_fog',
        // Other
        'ovulation_pain',
        'spotting',
        'discharge',
      ],
    },
  ],
  mood: {
    type: String,
    enum: ['happy', 'sad', 'anxious', 'irritable', 'calm', 'energetic', 'tired', 'neutral'],
    default: 'neutral',
  },
  notes: {
    type: String,
    maxlength: 500,
  },
  sexualActivity: {
    type: Boolean,
    default: false,
  },
  contraceptiveUsed: {
    type: Boolean,
    default: false,
  },
  temperature: {
    // Basal body temperature in Celsius
    type: Number,
  },
});

const cycleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date, // null if period is still ongoing
    },
    periodLength: {
      type: Number, // calculated when endDate is set
    },
    cycleLength: {
      type: Number, // days until next period starts (calculated retroactively)
    },
    dayLogs: [dayLogSchema],
    notes: {
      type: String,
      maxlength: 1000,
    },
    isPregnancy: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
cycleSchema.index({ user: 1, startDate: -1 });

// Calculate period length when endDate is set
cycleSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.periodLength = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  next();
});

module.exports = mongoose.model('Cycle', cycleSchema);
