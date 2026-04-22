=
# 🌸 Period Tracker — Backend API

Node.js + Express + MongoDB REST API for period tracking with symptom logging, pain tracking, and cycle predictions.

---

## 🚀 Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env
# Edit .env with your MongoDB URI and a strong JWT_SECRET

# 3. Start dev server
npm run dev

# 4. Start production server
npm start
```

---

## 📁 Project Structure

```
period-tracker-backend/
├── server.js               # App entry point
├── models/
│   ├── User.js             # User schema (auth + preferences)
│   └── Cycle.js            # Cycle + day log schema
├── routes/
│   ├── auth.js             # Auth endpoints
│   └── cycles.js           # Cycle & log endpoints
├── middleware/
│   └── auth.js             # JWT protect middleware
├── .env.example
└── package.json
```

---

## 🔐 Auth Endpoints

All auth routes are prefixed with `/api/auth`

### POST `/api/auth/signup`
Register a new user.

**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "cycleLength": 28,      // optional, default 28
  "periodLength": 5       // optional, default 5
}
```

**Response:** `201`
```json
{
  "message": "Account created successfully.",
  "token": "<jwt>",
  "user": { "_id": "...", "name": "Jane Doe", "email": "..." }
}
```

---

### POST `/api/auth/login`
Log in an existing user.

**Body:**
```json
{ "email": "jane@example.com", "password": "secret123" }
```

**Response:** `200`
```json
{
  "token": "<jwt>",
  "user": { ... }
}
```

---

### GET `/api/auth/me` 🔒
Get current logged-in user profile.

---

### PUT `/api/auth/me` 🔒
Update name or cycle preferences.

**Body (all optional):**
```json
{ "name": "Jane", "cycleLength": 30, "periodLength": 6 }
```

---

### PUT `/api/auth/change-`password 🔒
**Body:**
```json
{ "currentPassword": "old", "newPassword": "new123" }
```

---

## 🗓 Cycle Endpoints

All cycle routes are prefixed with `/api/cycles` and require `Authorization: Bearer <token>`

---

### GET `/api/cycles`
Get all cycles (list view), paginated.

**Query params:** `?page=1&limit=12`

---

### GET `/api/cycles/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD`
Get cycles within a date range for the calendar view.

---

### GET `/api/cycles/predictions`
Get next period prediction, ovulation date, and fertile window based on cycle history.

**Response:**
```json
{
  "predictions": {
    "nextPeriodStart": "2024-08-05T00:00:00.000Z",
    "nextPeriodEnd": "2024-08-09T00:00:00.000Z",
    "ovulationDate": "2024-07-22T00:00:00.000Z",
    "fertileWindowStart": "2024-07-17T00:00:00.000Z",
    "fertileWindowEnd": "2024-07-23T00:00:00.000Z",
    "avgCycleLength": 28,
    "daysUntilNextPeriod": 12,
    "currentCycleDay": 16,
    "basedOnCycles": 4
  }
}
```

---

### GET `/api/cycles/stats`
Get aggregated stats: average pain, top symptoms, top mood, avg period length.

---

### GET `/api/cycles/:id`
Get a single cycle with all its day logs.

---

### POST `/api/cycles`
Start a new period cycle.

**Body:**
```json
{
  "startDate": "2024-07-10",
  "notes": "Started on time"
}
```

---

### PUT `/api/cycles/:id`
Update a cycle (e.g. set end date when period ends).

**Body (all optional):**
```json
{
  "endDate": "2024-07-15",
  "notes": "Lighter than usual",
  "isPregnancy": false
}
```

---

### DELETE `/api/cycles/:id`
Delete a cycle and all its day logs.

---

## 📝 Day Log Endpoints

### POST `/api/cycles/:id/logs`
Add or update a daily log entry within a cycle. If a log for that date already exists, it will be updated.

**Body:**
```json
{
  "date": "2024-07-11",
  "flow": "medium",
  "painLevel": 6,
  "symptoms": ["cramps", "headache", "bloating"],
  "mood": "irritable",
  "notes": "Really bad cramps today",
  "sexualActivity": false,
  "contraceptiveUsed": false,
  "temperature": 36.7
}
```

**Flow options:** `none` | `spotting` | `light` | `medium` | `heavy` | `very_heavy`

**Mood options:** `happy` | `sad` | `anxious` | `irritable` | `calm` | `energetic` | `tired` | `neutral`

**Symptom options:**
- Physical: `cramps`, `headache`, `backache`, `bloating`, `breast_tenderness`, `fatigue`, `nausea`, `acne`, `hot_flashes`, `chills`, `dizziness`, `diarrhea`, `constipation`
- Emotional: `mood_swings`, `irritability`, `anxiety`, `depression`, `low_libido`, `high_libido`, `cravings`, `insomnia`, `brain_fog`
- Other: `ovulation_pain`, `spotting`, `discharge`

---

### DELETE `/api/cycles/:id/logs/:date`
Delete the log for a specific date (format: `YYYY-MM-DD`).

---

## 🔑 Using the JWT Token

Include in all protected requests:
```
Authorization: Bearer <your_token>
```

Tokens expire in **7 days** (configurable via `JWT_EXPIRES_IN` in `.env`).

---

## 🩺 Health Check

### GET `/api/health`
Returns `{ "status": "ok" }` — useful for uptime monitoring.
