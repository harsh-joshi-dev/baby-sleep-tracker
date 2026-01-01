# Sleep Pattern Learner

## Setup & Run

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (installed globally or via npx)

### Installation

```bash
npm install
```

### Running the App

#### Using Expo Go (Recommended for Development)

1. Install Expo Go on your iOS/Android device from the App Store or Google Play Store
2. Start the development server:
   ```bash
   npm start
   ```
3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

#### Using Simulator/Emulator

**iOS Simulator (macOS only):**
```bash
npm run ios
```

**Android Emulator:**
1. Start Android Emulator first
2. Run:
   ```bash
   npm run android
   ```

### Development Commands

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
npm test           # Run Jest tests
npm run typecheck  # TypeScript type checking
npm run lint       # ESLint code linting
npm run format     # Format code with Prettier
```

## Architecture Overview

### High-Level Architecture

The app follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      React Native UI Layer                   │
│  (SleepLog, Timeline, Chart, Schedule, Coach, Profile)      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Zustand State Store                       │
│  (Global state management, session CRUD, timer state)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌────▼──────┐
│   Storage    │ │  Learner   │ │ Schedule  │
│   (Async)    │ │  Pipeline  │ │ Generator │
└──────────────┘ └────────────┘ └───────────┘
        │              │              │
        │      ┌───────▼──────────────┘
        │      │
┌───────▼──────▼──────┐
│   Notification      │
│   Scheduler         │
└─────────────────────┘
```

### Core Pipelines

#### 1. Learner Pipeline (`src/models/learner.ts`)

**Purpose**: Personalizes wake window and nap length predictions based on historical sleep data.

**Flow**:
1. Loads historical sleep sessions (filters deleted, validates timestamps)
2. Extracts nap lengths and wake windows from session pairs
3. Applies EWMA (Exponentially Weighted Moving Average) to smooth predictions
4. Clamps values to age-based safe ranges (from baseline table)
5. Calculates confidence score based on:
   - Number of sessions (more data = higher confidence)
   - Data recency (decay after 7 days)
   - Variance in patterns (high variance = lower confidence)

**Key Functions**:
- `updateLearner()`: Main entry point, processes all sessions and returns updated state
- `calculateEWMA()`: Applies exponential smoothing
- `calculateConfidence()`: Computes model confidence (0.0 - 1.0)

**Output**: `LearnerState` with `ewmaWakeWindowMin`, `ewmaNapLengthMin`, `confidence`, `lastUpdatedISO`

#### 2. Schedule Generator (`src/models/schedule.ts`)

**Purpose**: Generates personalized sleep schedule blocks (naps, wind-down, bedtime) for today and tomorrow.

**Flow**:
1. Takes current learner state and sleep history
2. Generates schedule starting from current time (or custom start)
3. For each day:
   - Finds last sleep session end time
   - Calculates next nap time based on wake window
   - Generates wind-down period (30 min before bedtime)
   - Sets bedtime target (default 7 PM)
   - Limits to max 4 naps per day
4. Applies "What-if" adjustment slider (±30 minutes to wake windows)
5. Assigns confidence scores to each block based on learner confidence

**Key Functions**:
- `generateSchedule()`: Generates base schedule
- `generateScheduleWithAdjustment()`: Applies user-adjustable wake window offset
- `generateNapBlock()`, `generateWindDownBlock()`, `generateBedtimeBlock()`: Block generators

**Output**: Array of `ScheduleBlock[]` with `kind`, `startISO`, `endISO`, `confidence`, `rationale`

#### 3. Notification Scheduler (`src/utils/notifications.ts`)

**Purpose**: Schedules local notifications for upcoming sleep schedule blocks.

**Flow**:
1. Requests notification permissions (first launch)
2. Cancels all existing scheduled notifications
3. Filters schedule blocks to upcoming only (future start time)
4. Limits to 10 notifications (iOS/Android limit)
5. Schedules notifications 0-7 days ahead
6. Creates notification log entries for in-app viewing
7. Handles notification cancellation and status updates

**Key Functions**:
- `requestPermissions()`: Requests user permission for notifications
- `scheduleBlockNotifications()`: Schedules notifications for schedule blocks
- `cancelAllNotifications()`: Cancels all pending notifications
- `getAllScheduledNotifications()`: Gets list of scheduled notification IDs

**Notification Types**:
- **Wind Down**: 30 minutes before bedtime/nap
- **Nap Time**: At nap start time
- **Bedtime**: At bedtime start time

## Baseline Table & EWMA Parameters

### Age-Based Wake Window Baseline (`src/utils/ageBaseline.ts`)

**Source**: Based on pediatric sleep research and common sleep training guidelines. The baseline table provides age-appropriate ranges for wake windows and typical nap lengths.

**Baseline Table**:

| Age Range | Min Wake Window | Max Wake Window | Typical Wake Window | Typical Nap Length |
|-----------|----------------|-----------------|---------------------|-------------------|
| 0-3 months | 30 min | 90 min | 60 min | 120 min |
| 4-6 months | 90 min | 150 min | 120 min | 90 min |
| 7-9 months | 120 min | 180 min | 150 min | 60 min |
| 10-12 months | 150 min | 240 min | 180 min | 60 min |
| 13-18 months | 180 min | 300 min | 240 min | 60 min |
| 19+ months | 240 min | 360 min | 300 min | 60 min |

**Usage**: 
- Initial values when no historical data exists
- Safe bounds for EWMA clamping (prevents unrealistic predictions)
- Fallback when confidence is low

### EWMA Parameters

**Alpha (α) = 0.3**

**Rationale**:
- **0.3 alpha** means the model weights recent data at 30% and historical average at 70%
- This provides a good balance between:
  - **Responsiveness**: Adapts to recent changes (new sleep patterns)
  - **Stability**: Prevents overreacting to single anomalies
- Lower alpha (e.g., 0.1) would be too slow to adapt
- Higher alpha (e.g., 0.5+) would be too volatile with noisy baby sleep data

**Formula**:
```
newEWMA = α × newValue + (1 - α) × currentEWMA
```

**Confidence Calculation Parameters**:
- `MIN_SESSIONS_FOR_CONFIDENCE = 5`: Minimum sessions to reach base confidence
- `CONFIDENCE_DECAY_DAYS = 7`: Days until confidence starts decaying
- Confidence factors:
  - Base: `min(1.0, sessionCount / 10)`
  - Recency: Decays linearly over 7 days
  - Variance: Penalty for high variance in patterns (max 0.3 penalty)

## Coach Rules & Thresholds

The Coach component (`src/models/coach.ts`) analyzes sleep patterns and generates contextual tips.

### Rule 1: Short Nap Streak Detection

**Threshold**: 3+ naps under 30 minutes in the last 7 days

**Detection Logic**:
- Filters sessions to naps (duration < 360 min, start hour 6-18)
- Counts naps under `SHORT_NAP_THRESHOLD_MIN = 30` minutes
- Triggers if count ≥ 3

**Severity**: `warning`

**Message**: "Multiple short naps detected (X naps under 30 minutes)."

**Rationale**: Short naps indicate overtiredness or schedule misalignment.

---

### Rule 2: Long Wake Window Detection

**Threshold**: Wake window exceeds 120% of learned target

**Detection Logic**:
- Compares wake windows between consecutive sessions to learned `ewmaWakeWindowMin`
- Triggers if wake window > `target × LONG_WAKE_WINDOW_THRESHOLD_PCT (1.2)`
- Excludes unrealistic gaps (> 600 min)

**Severity**: `warning`

**Message**: "Wake window of X minutes detected (target: Y minutes)."

**Rationale**: Extended wake windows lead to overtiredness and difficulty falling asleep.

---

### Rule 3: Bedtime Shift Detection

**Threshold**: Average bedtime shifted by 30+ minutes

**Detection Logic**:
- Compares average bedtime of last 5 nights vs previous 5 nights
- Calculates shift in minutes
- Triggers if `|shift| > BEDTIME_SHIFT_THRESHOLD_MIN (30)`

**Severity**: `info`

**Message**: "Bedtime has shifted [earlier/later] by X minutes."

**Rationale**: Bedtime shifts may indicate schedule adjustments or natural development.

---

### Rule 4: Split Night Detection

**Threshold**: Night sleep > 12 hours with 3+ hour wake period in middle

**Detection Logic**:
- Identifies night sleep sessions > 12 hours
- Checks for overlapping sessions in the middle 4-hour window
- Calculates wake period gap
- Triggers if wake period > `SPLIT_NIGHT_THRESHOLD_HOURS (3)`

**Severity**: `warning`

**Message**: "Extended wake period detected during night sleep."

**Rationale**: Split nights indicate schedule issues (overtiredness, undertiredness, or developmental changes).

---

### Summary of Thresholds

| Rule | Threshold Constant | Value |
|------|-------------------|-------|
| Short Nap Streak | `SHORT_NAP_THRESHOLD_MIN` | 30 minutes |
| Long Wake Window | `LONG_WAKE_WINDOW_THRESHOLD_PCT` | 120% of target |
| Bedtime Shift | `BEDTIME_SHIFT_THRESHOLD_MIN` | 30 minutes |
| Split Night | `SPLIT_NIGHT_THRESHOLD_HOURS` | 3 hours |

## Known Trade-offs & Future Improvements

### Current Trade-offs

1. **Simplified EWMA Model**
   - **Trade-off**: Single alpha for both nap length and wake windows
   - **Rationale**: Keeps model simple and interpretable
   - **Future**: Separate alphas for different patterns, or adaptive alpha based on variance

2. **Age Baseline Source**
   - **Trade-off**: Static table based on general pediatric guidelines
   - **Rationale**: Provides reasonable defaults without external API dependencies
   - **Future**: Link to research sources, allow user customization, or use ML-based age predictions

3. **Local-Only Notifications**
   - **Trade-off**: No push notifications, 10 notification limit per platform
   - **Rationale**: Works offline, no server costs, simpler architecture
   - **Future**: Background sync service, web push notifications, notification grouping

4. **Single Baby Profile**
   - **Trade-off**: One profile per app installation
   - **Rationale**: Simplifies UI and data model
   - **Future**: Multi-profile support, family sharing, caregiver accounts

5. **In-Memory Schedule Generation**
   - **Trade-off**: Schedule recalculated on every session update
   - **Rationale**: Always fresh, no stale data
   - **Future**: Cached schedules with smart invalidation, incremental updates

6. **No Cloud Sync**
   - **Trade-off**: Data stored locally only (AsyncStorage)
   - **Rationale**: Privacy-first, works offline, no backend costs
   - **Future**: Optional iCloud/Google Drive sync, export/import, family sharing

7. **Basic Chart Visualization**
   - **Trade-off**: Simple line chart for trends, basic timeline view
   - **Rationale**: Fast to implement, works well for core use cases
   - **Future**: Interactive charts, heatmaps, correlation analysis, advanced analytics

8. **Coach Rule Heuristics**
   - **Trade-off**: Rule-based system with fixed thresholds
   - **Rationale**: Interpretable, predictable, easy to debug
   - **Future**: ML-based pattern detection, personalized thresholds, anomaly detection

### Planned Future Improvements

1. **Enhanced Learning**
   - Separate EWMA models for different nap types (morning, afternoon, cat naps)
   - Context-aware predictions (time of day, day of week patterns)
   - Seasonality detection (summer vs winter schedules)

2. **Advanced Scheduling**
   - Multi-day schedule optimization
   - Sleep debt tracking and recovery recommendations
   - Timezone-aware scheduling for travel

3. **Better Notifications**
   - Smart notification grouping
   - Customizable notification timing
   - Quiet hours support
   - Notification categories (nap vs bedtime)

4. **Data Export & Sharing**
   - CSV/JSON export
   - PDF reports for pediatricians
   - Family member access (read-only)
   - Integration with health apps (Apple Health, Google Fit)

5. **UI/UX Enhancements**
   - Dark mode support
   - Customizable themes
   - Widgets for quick logging
   - Apple Watch / Wear OS companion app

6. **Testing & Reliability**
   - E2E tests with Detox
   - Performance benchmarking
   - Crash reporting (Sentry)
   - Analytics (privacy-respecting)

7. **Accessibility**
   - Screen reader optimization
   - High contrast mode
   - Larger text support
   - Voice input for logging

## Project Structure

```
sleep-pattern-learner/
├── src/
│   ├── components/       # UI components
│   │   ├── Chart.tsx
│   │   ├── Coach.tsx
│   │   ├── SleepLog.tsx
│   │   ├── Schedule.tsx
│   │   └── Timeline.tsx
│   ├── models/          # Business logic
│   │   ├── learner.ts   # EWMA learning algorithm
│   │   ├── schedule.ts  # Schedule generation
│   │   └── coach.ts     # Pattern analysis & tips
│   ├── screens/         # Screen components
│   │   └── ProfileScreen.tsx
│   ├── store/           # Zustand state management
│   │   └── useStore.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   └── utils/           # Utilities
│       ├── ageBaseline.ts
│       ├── notifications.ts
│       ├── storage.ts
│       └── timeUtils.ts
├── App.tsx              # App entry point
├── app.json             # Expo configuration
└── package.json
```
