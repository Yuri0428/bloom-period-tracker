const express = require('express');
const Cycle = require('../models/Cycle');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All cycle routes are protected
router.use(protect);

// ─── CYCLE CRUD ──────────────────────────────────────────────────────────────

// @route   GET /api/cycles
// @desc    Get all cycles for the logged-in user (list view)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { limit = 12, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [cycles, total] = await Promise.all([
      Cycle.find({ user: req.user._id })
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Cycle.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      cycles,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/cycles/calendar
// @desc    Get cycles within a date range (for calendar view)
// @access  Private
router.get('/calendar', async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: 'from and to query params (ISO dates) are required.' });
    }

    const cycles = await Cycle.find({
      user: req.user._id,
      startDate: { $lte: new Date(to) },
      $or: [
        { endDate: { $gte: new Date(from) } },
        { endDate: null, startDate: { $gte: new Date(from) } },
      ],
    }).sort({ startDate: 1 });

    res.json({ cycles });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/cycles/predictions
// @desc    Predict next period, ovulation, and fertile window
// @access  Private
router.get('/predictions', async (req, res) => {
  try {
    // Get last 6 cycles to calculate average
    const recentCycles = await Cycle.find({ user: req.user._id })
      .sort({ startDate: -1 })
      .limit(6);

    if (recentCycles.length === 0) {
      return res.json({
        message: 'No cycles logged yet. Log your first period to get predictions.',
        predictions: null,
      });
    }

    // Calculate average cycle length from logged cycles
    let avgCycleLength = req.user.cycleLength; // default from preferences

    if (recentCycles.length >= 2) {
      const cycleLengths = [];
      for (let i = 0; i < recentCycles.length - 1; i++) {
        const diffDays = Math.round(
          (recentCycles[i].startDate - recentCycles[i + 1].startDate) / (1000 * 60 * 60 * 24)
        );
        if (diffDays > 0 && diffDays < 60) cycleLengths.push(diffDays);
      }
      if (cycleLengths.length > 0) {
        avgCycleLength = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
      }
    }

    const lastPeriodStart = new Date(recentCycles[0].startDate);

    // Next period
    const nextPeriodStart = new Date(lastPeriodStart);
    nextPeriodStart.setDate(nextPeriodStart.getDate() + avgCycleLength);

    const nextPeriodEnd = new Date(nextPeriodStart);
    nextPeriodEnd.setDate(nextPeriodEnd.getDate() + (req.user.periodLength || 5) - 1);

    // Ovulation: typically 14 days before next period
    const ovulationDate = new Date(nextPeriodStart);
    ovulationDate.setDate(ovulationDate.getDate() - 14);

    // Fertile window: 5 days before ovulation + ovulation day
    const fertileWindowStart = new Date(ovulationDate);
    fertileWindowStart.setDate(fertileWindowStart.getDate() - 5);
    const fertileWindowEnd = new Date(ovulationDate);
    fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 1);

    // Days until next period
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilNextPeriod = Math.round((nextPeriodStart - today) / (1000 * 60 * 60 * 24));

    // Current cycle day
    const currentCycleDay = Math.round((today - lastPeriodStart) / (1000 * 60 * 60 * 24)) + 1;

    res.json({
      predictions: {
        nextPeriodStart,
        nextPeriodEnd,
        ovulationDate,
        fertileWindowStart,
        fertileWindowEnd,
        avgCycleLength,
        daysUntilNextPeriod,
        currentCycleDay,
        lastPeriodStart,
        basedOnCycles: recentCycles.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/cycles/stats
// @desc    Get summary stats (avg pain, common symptoms, etc.)
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const cycles = await Cycle.find({ user: req.user._id }).sort({ startDate: -1 }).limit(12);

    if (cycles.length === 0) {
      return res.json({ message: 'No data yet.', stats: null });
    }

    // Aggregate all day logs
    const allDayLogs = cycles.flatMap((c) => c.dayLogs);

    // Average pain level
    const logsWithPain = allDayLogs.filter((d) => d.painLevel > 0);
    const avgPainLevel =
      logsWithPain.length > 0
        ? (logsWithPain.reduce((sum, d) => sum + d.painLevel, 0) / logsWithPain.length).toFixed(1)
        : 0;

    // Most common symptoms
    const symptomCount = {};
    allDayLogs.forEach((d) => {
      d.symptoms.forEach((s) => {
        symptomCount[s] = (symptomCount[s] || 0) + 1;
      });
    });
    const topSymptoms = Object.entries(symptomCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symptom, count]) => ({ symptom, count }));

    // Average period length
    const cyclesWithEnd = cycles.filter((c) => c.endDate);
    const avgPeriodLength =
      cyclesWithEnd.length > 0
        ? (cyclesWithEnd.reduce((sum, c) => sum + c.periodLength, 0) / cyclesWithEnd.length).toFixed(1)
        : null;

    // Most common mood
    const moodCount = {};
    allDayLogs.forEach((d) => {
      if (d.mood && d.mood !== 'neutral') {
        moodCount[d.mood] = (moodCount[d.mood] || 0) + 1;
      }
    });
    const topMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    res.json({
      stats: {
        totalCyclesLogged: cycles.length,
        avgPainLevel: parseFloat(avgPainLevel),
        avgPeriodLength: avgPeriodLength ? parseFloat(avgPeriodLength) : null,
        topSymptoms,
        topMood,
        totalDayLogs: allDayLogs.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/cycles/:id
// @desc    Get a single cycle by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const cycle = await Cycle.findOne({ _id: req.params.id, user: req.user._id });
    if (!cycle) return res.status(404).json({ message: 'Cycle not found.' });
    res.json({ cycle });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   POST /api/cycles
// @desc    Start a new period cycle
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { startDate, notes } = req.body;

    if (!startDate) {
      return res.status(400).json({ message: 'Start date is required.' });
    }

    // Check for overlapping cycles
    const existing = await Cycle.findOne({
      user: req.user._id,
      startDate: { $lte: new Date(startDate) },
      $or: [
        { endDate: { $gte: new Date(startDate) } },
        { endDate: null },
      ],
    });

    if (existing) {
      return res.status(409).json({
        message: 'A cycle already exists around this date. Please end it first or edit it.',
        conflictingCycleId: existing._id,
      });
    }

    const cycle = await Cycle.create({
      user: req.user._id,
      startDate: new Date(startDate),
      notes,
    });

    res.status(201).json({ message: 'Cycle started.', cycle });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   PUT /api/cycles/:id
// @desc    Update a cycle (set end date, notes, etc.)
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { startDate, endDate, notes, isPregnancy } = req.body;

    const cycle = await Cycle.findOne({ _id: req.params.id, user: req.user._id });
    if (!cycle) return res.status(404).json({ message: 'Cycle not found.' });

    if (startDate) cycle.startDate = new Date(startDate);
    if (endDate !== undefined) cycle.endDate = endDate ? new Date(endDate) : null;
    if (notes !== undefined) cycle.notes = notes;
    if (isPregnancy !== undefined) cycle.isPregnancy = isPregnancy;

    await cycle.save();
    res.json({ message: 'Cycle updated.', cycle });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   DELETE /api/cycles/:id
// @desc    Delete a cycle
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const cycle = await Cycle.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!cycle) return res.status(404).json({ message: 'Cycle not found.' });
    res.json({ message: 'Cycle deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── DAY LOGS ────────────────────────────────────────────────────────────────

// @route   POST /api/cycles/:id/logs
// @desc    Add or update a day log entry for a specific date
// @access  Private
router.post('/:id/logs', async (req, res) => {
  try {
    const cycle = await Cycle.findOne({ _id: req.params.id, user: req.user._id });
    if (!cycle) return res.status(404).json({ message: 'Cycle not found.' });

    const { date, flow, painLevel, symptoms, mood, notes, sexualActivity, contraceptiveUsed, temperature } = req.body;

    if (!date) return res.status(400).json({ message: 'Date is required for a day log.' });

    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);

    // Check if a log for this date already exists — update it
    const existingLogIndex = cycle.dayLogs.findIndex((log) => {
      const d = new Date(log.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === logDate.getTime();
    });

    const logData = {
      date: logDate,
      ...(flow !== undefined && { flow }),
      ...(painLevel !== undefined && { painLevel }),
      ...(symptoms !== undefined && { symptoms }),
      ...(mood !== undefined && { mood }),
      ...(notes !== undefined && { notes }),
      ...(sexualActivity !== undefined && { sexualActivity }),
      ...(contraceptiveUsed !== undefined && { contraceptiveUsed }),
      ...(temperature !== undefined && { temperature }),
    };

    if (existingLogIndex >= 0) {
      cycle.dayLogs[existingLogIndex] = { ...cycle.dayLogs[existingLogIndex].toObject(), ...logData };
    } else {
      cycle.dayLogs.push(logData);
    }

    // Sort logs by date
    cycle.dayLogs.sort((a, b) => new Date(a.date) - new Date(b.date));

    await cycle.save();
    res.json({ message: 'Day log saved.', cycle });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   DELETE /api/cycles/:id/logs/:date
// @desc    Delete a day log entry by date (YYYY-MM-DD)
// @access  Private
router.delete('/:id/logs/:date', async (req, res) => {
  try {
    const cycle = await Cycle.findOne({ _id: req.params.id, user: req.user._id });
    if (!cycle) return res.status(404).json({ message: 'Cycle not found.' });

    const targetDate = new Date(req.params.date);
    targetDate.setHours(0, 0, 0, 0);

    const originalLength = cycle.dayLogs.length;
    cycle.dayLogs = cycle.dayLogs.filter((log) => {
      const d = new Date(log.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() !== targetDate.getTime();
    });

    if (cycle.dayLogs.length === originalLength) {
      return res.status(404).json({ message: 'No log found for this date.' });
    }

    await cycle.save();
    res.json({ message: 'Day log deleted.', cycle });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
