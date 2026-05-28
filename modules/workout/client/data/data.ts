// enclave-workout — mock data
// Realistic 6-week training history + 10 body weight measurements

export type WorkoutSet = { reps: number; kg: number };
export type Exercise = { name: string; sets: WorkoutSet[] };
export type WorkoutEntry = { id: string; date: string; name: string; exercises: Exercise[] };
export type BodyEntry = {
  date: string;
  weight: number;
  waist?: number;
  notes?: string;
  measurements?: {
    chest?: number;
    waist?: number;
    hip?: number;
    bicepL?: number;
    bicepR?: number;
    thighL?: number;
    thighR?: number;
  };
};

export const WORKOUTS: WorkoutEntry[] = [
  {
    id: "w8",
    date: "2026-05-23",
    name: "Push A",
    exercises: [
      { name: "Bench Press", sets: [{ reps: 5, kg: 92.5 }, { reps: 5, kg: 92.5 }, { reps: 5, kg: 92.5 }, { reps: 4, kg: 95 }] },
      { name: "Overhead Press", sets: [{ reps: 6, kg: 55 }, { reps: 6, kg: 55 }, { reps: 5, kg: 57.5 }] },
      { name: "Incline Dumbbell Press", sets: [{ reps: 8, kg: 30 }, { reps: 8, kg: 30 }, { reps: 7, kg: 32 }] },
      { name: "Weighted Dips", sets: [{ reps: 8, kg: 20 }, { reps: 7, kg: 20 }, { reps: 6, kg: 20 }] },
      { name: "Cable Triceps Extension", sets: [{ reps: 12, kg: 27.5 }, { reps: 12, kg: 27.5 }, { reps: 10, kg: 30 }] },
    ],
  },
  {
    id: "w7",
    date: "2026-05-21",
    name: "Pull B",
    exercises: [
      { name: "Weighted Pull-ups", sets: [{ reps: 6, kg: 15 }, { reps: 5, kg: 15 }, { reps: 5, kg: 15 }, { reps: 4, kg: 15 }] },
      { name: "Barbell Row", sets: [{ reps: 8, kg: 80 }, { reps: 8, kg: 80 }, { reps: 7, kg: 82.5 }] },
      { name: "Dumbbell Row", sets: [{ reps: 10, kg: 36 }, { reps: 10, kg: 36 }, { reps: 9, kg: 38 }] },
      { name: "Barbell Curl", sets: [{ reps: 10, kg: 35 }, { reps: 9, kg: 35 }, { reps: 8, kg: 37.5 }] },
      { name: "Face pulls", sets: [{ reps: 15, kg: 22.5 }, { reps: 15, kg: 22.5 }, { reps: 15, kg: 22.5 }] },
    ],
  },
  {
    id: "w6",
    date: "2026-05-19",
    name: "Legs",
    exercises: [
      { name: "Squat", sets: [{ reps: 5, kg: 120 }, { reps: 5, kg: 120 }, { reps: 5, kg: 120 }, { reps: 4, kg: 125 }] },
      { name: "Romanian Deadlift", sets: [{ reps: 8, kg: 110 }, { reps: 8, kg: 110 }, { reps: 7, kg: 115 }] },
      { name: "Hip Thrust", sets: [{ reps: 10, kg: 100 }, { reps: 10, kg: 100 }, { reps: 8, kg: 110 }] },
      { name: "Leg Curl", sets: [{ reps: 12, kg: 45 }, { reps: 12, kg: 45 }, { reps: 10, kg: 50 }] },
      { name: "Standing Calf Raise", sets: [{ reps: 15, kg: 80 }, { reps: 15, kg: 80 }, { reps: 12, kg: 90 }] },
    ],
  },
  {
    id: "w5",
    date: "2026-05-16",
    name: "Push B",
    exercises: [
      { name: "Overhead Press", sets: [{ reps: 5, kg: 60 }, { reps: 5, kg: 60 }, { reps: 4, kg: 60 }, { reps: 3, kg: 62.5 }] },
      { name: "Incline Bench Press", sets: [{ reps: 6, kg: 80 }, { reps: 6, kg: 80 }, { reps: 5, kg: 82.5 }] },
      { name: "Dumbbell Fly", sets: [{ reps: 12, kg: 18 }, { reps: 12, kg: 18 }, { reps: 10, kg: 20 }] },
      { name: "Lateral Raise", sets: [{ reps: 15, kg: 12 }, { reps: 15, kg: 12 }, { reps: 12, kg: 14 }] },
      { name: "Skull Crusher", sets: [{ reps: 10, kg: 30 }, { reps: 10, kg: 30 }, { reps: 9, kg: 32 }] },
    ],
  },
  {
    id: "w4",
    date: "2026-05-12",
    name: "Pull A",
    exercises: [
      { name: "Deadlift", sets: [{ reps: 3, kg: 150 }, { reps: 3, kg: 150 }, { reps: 3, kg: 150 }] },
      { name: "Weighted Pull-ups", sets: [{ reps: 6, kg: 12.5 }, { reps: 6, kg: 12.5 }, { reps: 5, kg: 12.5 }] },
      { name: "Lat Pulldown", sets: [{ reps: 10, kg: 65 }, { reps: 10, kg: 65 }, { reps: 9, kg: 70 }] },
      { name: "Dumbbell Curl", sets: [{ reps: 10, kg: 16 }, { reps: 10, kg: 16 }, { reps: 9, kg: 18 }] },
    ],
  },
  {
    id: "w3",
    date: "2026-05-09",
    name: "Legs",
    exercises: [
      { name: "Front Squat", sets: [{ reps: 6, kg: 90 }, { reps: 6, kg: 90 }, { reps: 5, kg: 95 }] },
      { name: "Leg Press", sets: [{ reps: 10, kg: 180 }, { reps: 10, kg: 180 }, { reps: 8, kg: 200 }] },
      { name: "Romanian Deadlift", sets: [{ reps: 8, kg: 105 }, { reps: 8, kg: 105 }, { reps: 7, kg: 110 }] },
      { name: "Lunges", sets: [{ reps: 12, kg: 24 }, { reps: 12, kg: 24 }, { reps: 10, kg: 26 }] },
    ],
  },
  {
    id: "w2",
    date: "2026-05-05",
    name: "Push A",
    exercises: [
      { name: "Bench Press", sets: [{ reps: 5, kg: 90 }, { reps: 5, kg: 90 }, { reps: 5, kg: 90 }, { reps: 4, kg: 92.5 }] },
      { name: "Overhead Press", sets: [{ reps: 6, kg: 52.5 }, { reps: 6, kg: 52.5 }, { reps: 5, kg: 55 }] },
      { name: "Dips", sets: [{ reps: 10, kg: 15 }, { reps: 8, kg: 15 }, { reps: 7, kg: 15 }] },
      { name: "Cable Triceps Extension", sets: [{ reps: 12, kg: 25 }, { reps: 12, kg: 25 }, { reps: 10, kg: 27.5 }] },
    ],
  },
  {
    id: "w1",
    date: "2026-04-28",
    name: "Pull B",
    exercises: [
      { name: "Barbell Row", sets: [{ reps: 8, kg: 77.5 }, { reps: 8, kg: 77.5 }, { reps: 7, kg: 80 }] },
      { name: "Pull-ups", sets: [{ reps: 8, kg: 0 }, { reps: 7, kg: 0 }, { reps: 6, kg: 0 }] },
      { name: "Dumbbell Row", sets: [{ reps: 10, kg: 34 }, { reps: 10, kg: 34 }, { reps: 9, kg: 36 }] },
      { name: "Alternating Curl", sets: [{ reps: 10, kg: 14 }, { reps: 10, kg: 14 }, { reps: 9, kg: 16 }] },
    ],
  },
];

export const BODY_LOG: BodyEntry[] = [
  { date: "2026-03-15", weight: 83.2, waist: 86.5, notes: "Light bulk, end of phase" },
  { date: "2026-03-22", weight: 83.0, waist: 86.2, notes: "" },
  { date: "2026-03-30", weight: 82.6, waist: 85.8, notes: "Starting mild deficit" },
  { date: "2026-04-06", weight: 82.3, waist: 85.4, notes: "" },
  { date: "2026-04-14", weight: 81.9, waist: 84.8, notes: "Good cardio week" },
  { date: "2026-04-21", weight: 81.5, waist: 84.5, notes: "" },
  { date: "2026-04-28", weight: 81.2, waist: 84.0, notes: "Diet on point" },
  { date: "2026-05-05", weight: 80.8, waist: 83.6, notes: "" },
  { date: "2026-05-14", weight: 80.4, waist: 83.2, notes: "Refeed Saturday" },
  {
    date: "2026-05-22",
    weight: 80.1,
    waist: 82.8,
    notes: "Full measurements",
    measurements: {
      chest: 102.5,
      waist: 82.8,
      hip: 98.0,
      bicepL: 38.2,
      bicepR: 38.5,
      thighL: 58.4,
      thighR: 58.6,
    },
  },
];

export const EXERCISE_LIBRARY: string[] = [
  "Bench Press", "Overhead Press", "Incline Dumbbell Press", "Incline Bench Press",
  "Pull-ups", "Weighted Pull-ups", "Barbell Row", "Dumbbell Row", "Lat Pulldown",
  "Squat", "Front Squat", "Deadlift", "Romanian Deadlift", "Leg Press", "Hip Thrust",
  "Barbell Curl", "Dumbbell Curl", "Alternating Curl", "Skull Crusher", "Cable Triceps Extension",
  "Dips", "Weighted Dips", "Dumbbell Fly", "Lateral Raise",
  "Face Pulls", "Leg Curl", "Standing Calf Raise", "Lunges",
];

// Helpers ---------------------------------------------------------------

export function workoutVolume(w: WorkoutEntry): number {
  let total = 0;
  for (const ex of w.exercises) {
    for (const s of ex.sets) total += (s.reps || 0) * (s.kg || 0);
  }
  return Math.round(total);
}

export function formatDate(iso: string, opts: { short?: boolean } = {}): string {
  const d = new Date(iso + "T00:00:00");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (opts.short) return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]}`;
  return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function dayOfWeek(iso: string): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[new Date(iso + "T00:00:00").getDay()];
}

export function currentStreak(workouts: WorkoutEntry[]): number {
  const weeks = new Set(workouts.map(w => {
    const d = new Date(w.date + "T00:00:00");
    const year = d.getFullYear();
    const first = new Date(year, 0, 1);
    const week = Math.ceil(((d.getTime() - first.getTime()) / 86400000 + first.getDay() + 1) / 7);
    return `${year}-${week}`;
  }));
  return weeks.size;
}

export function sessionsThisMonth(workouts: WorkoutEntry[]): number {
  const now = new Date();
  return workouts.filter(w => {
    const d = new Date(w.date + "T00:00:00");
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
}

export function volumeThisWeek(workouts: WorkoutEntry[]): number {
  const now = new Date("2026-05-24");
  const weekStart = new Date(now);
  const dow = now.getDay() === 0 ? 7 : now.getDay();
  weekStart.setDate(now.getDate() - dow + 1);
  weekStart.setHours(0, 0, 0, 0);
  return workouts
    .filter(w => new Date(w.date + "T00:00:00") >= weekStart)
    .reduce((sum, w) => sum + workoutVolume(w), 0);
}
