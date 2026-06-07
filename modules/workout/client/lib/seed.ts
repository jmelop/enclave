import type { WorkoutSession, BodyEntry } from '../types/workout'

export const SEED_SESSIONS: WorkoutSession[] = [
  {
    id: 'w8',
    date: '2026-05-23',
    name: 'Push A',
    exercises: [
      { name: 'Bench Press',            sets: [{ reps: 5, kg: 92.5 }, { reps: 5, kg: 92.5 }, { reps: 5, kg: 92.5 }, { reps: 4, kg: 95 }] },
      { name: 'Overhead Press',         sets: [{ reps: 6, kg: 55 },   { reps: 6, kg: 55 },   { reps: 5, kg: 57.5 }] },
      { name: 'Incline Dumbbell Press', sets: [{ reps: 8, kg: 30 },   { reps: 8, kg: 30 },   { reps: 7, kg: 32 }] },
      { name: 'Weighted Dips',          sets: [{ reps: 8, kg: 20 },   { reps: 7, kg: 20 },   { reps: 6, kg: 20 }] },
      { name: 'Cable Triceps Extension',sets: [{ reps: 12, kg: 27.5 },{ reps: 12, kg: 27.5 },{ reps: 10, kg: 30 }] },
    ],
  },
  {
    id: 'w7',
    date: '2026-05-21',
    name: 'Pull B',
    exercises: [
      { name: 'Weighted Pull-ups', sets: [{ reps: 6, kg: 15 }, { reps: 5, kg: 15 }, { reps: 5, kg: 15 }, { reps: 4, kg: 15 }] },
      { name: 'Barbell Row',       sets: [{ reps: 8, kg: 80 }, { reps: 8, kg: 80 }, { reps: 7, kg: 82.5 }] },
      { name: 'Dumbbell Row',      sets: [{ reps: 10, kg: 36 },{ reps: 10, kg: 36 },{ reps: 9, kg: 38 }] },
      { name: 'Barbell Curl',      sets: [{ reps: 10, kg: 35 },{ reps: 9, kg: 35 }, { reps: 8, kg: 37.5 }] },
      { name: 'Face pulls',        sets: [{ reps: 15, kg: 22.5 },{ reps: 15, kg: 22.5 },{ reps: 15, kg: 22.5 }] },
    ],
  },
  {
    id: 'w6',
    date: '2026-05-19',
    name: 'Legs',
    exercises: [
      { name: 'Squat',              sets: [{ reps: 5, kg: 120 }, { reps: 5, kg: 120 }, { reps: 5, kg: 120 }, { reps: 4, kg: 125 }] },
      { name: 'Romanian Deadlift', sets: [{ reps: 8, kg: 110 }, { reps: 8, kg: 110 }, { reps: 7, kg: 115 }] },
      { name: 'Hip Thrust',        sets: [{ reps: 10, kg: 100 },{ reps: 10, kg: 100 },{ reps: 8, kg: 110 }] },
      { name: 'Leg Curl',          sets: [{ reps: 12, kg: 45 }, { reps: 12, kg: 45 }, { reps: 10, kg: 50 }] },
      { name: 'Standing Calf Raise',sets:[{ reps: 15, kg: 80 }, { reps: 15, kg: 80 }, { reps: 12, kg: 90 }] },
    ],
  },
  {
    id: 'w5',
    date: '2026-05-16',
    name: 'Push B',
    exercises: [
      { name: 'Overhead Press',    sets: [{ reps: 5, kg: 60 },  { reps: 5, kg: 60 },  { reps: 4, kg: 60 },  { reps: 3, kg: 62.5 }] },
      { name: 'Incline Bench Press',sets:[{ reps: 6, kg: 80 },  { reps: 6, kg: 80 },  { reps: 5, kg: 82.5 }] },
      { name: 'Dumbbell Fly',      sets: [{ reps: 12, kg: 18 }, { reps: 12, kg: 18 }, { reps: 10, kg: 20 }] },
      { name: 'Lateral Raise',     sets: [{ reps: 15, kg: 12 }, { reps: 15, kg: 12 }, { reps: 12, kg: 14 }] },
      { name: 'Skull Crusher',     sets: [{ reps: 10, kg: 30 }, { reps: 10, kg: 30 }, { reps: 9, kg: 32 }] },
    ],
  },
  {
    id: 'w4',
    date: '2026-05-12',
    name: 'Pull A',
    exercises: [
      { name: 'Deadlift',          sets: [{ reps: 3, kg: 150 }, { reps: 3, kg: 150 }, { reps: 3, kg: 150 }] },
      { name: 'Weighted Pull-ups', sets: [{ reps: 6, kg: 12.5 },{ reps: 6, kg: 12.5 },{ reps: 5, kg: 12.5 }] },
      { name: 'Lat Pulldown',      sets: [{ reps: 10, kg: 65 }, { reps: 10, kg: 65 }, { reps: 9, kg: 70 }] },
      { name: 'Dumbbell Curl',     sets: [{ reps: 10, kg: 16 }, { reps: 10, kg: 16 }, { reps: 9, kg: 18 }] },
    ],
  },
  {
    id: 'w3',
    date: '2026-05-09',
    name: 'Legs',
    exercises: [
      { name: 'Front Squat',       sets: [{ reps: 6, kg: 90 },  { reps: 6, kg: 90 },  { reps: 5, kg: 95 }] },
      { name: 'Leg Press',         sets: [{ reps: 10, kg: 180 },{ reps: 10, kg: 180 },{ reps: 8, kg: 200 }] },
      { name: 'Romanian Deadlift', sets: [{ reps: 8, kg: 105 }, { reps: 8, kg: 105 }, { reps: 7, kg: 110 }] },
      { name: 'Lunges',            sets: [{ reps: 12, kg: 24 }, { reps: 12, kg: 24 }, { reps: 10, kg: 26 }] },
    ],
  },
  {
    id: 'w2',
    date: '2026-05-05',
    name: 'Push A',
    exercises: [
      { name: 'Bench Press',            sets: [{ reps: 5, kg: 90 },   { reps: 5, kg: 90 },   { reps: 5, kg: 90 },   { reps: 4, kg: 92.5 }] },
      { name: 'Overhead Press',         sets: [{ reps: 6, kg: 52.5 }, { reps: 6, kg: 52.5 }, { reps: 5, kg: 55 }] },
      { name: 'Dips',                   sets: [{ reps: 10, kg: 15 },  { reps: 8, kg: 15 },   { reps: 7, kg: 15 }] },
      { name: 'Cable Triceps Extension',sets: [{ reps: 12, kg: 25 },  { reps: 12, kg: 25 },  { reps: 10, kg: 27.5 }] },
    ],
  },
  {
    id: 'w1',
    date: '2026-04-28',
    name: 'Pull B',
    exercises: [
      { name: 'Barbell Row',      sets: [{ reps: 8, kg: 77.5 }, { reps: 8, kg: 77.5 }, { reps: 7, kg: 80 }] },
      { name: 'Pull-ups',         sets: [{ reps: 8, kg: 0 },    { reps: 7, kg: 0 },    { reps: 6, kg: 0 }] },
      { name: 'Dumbbell Row',     sets: [{ reps: 10, kg: 34 },  { reps: 10, kg: 34 },  { reps: 9, kg: 36 }] },
      { name: 'Alternating Curl', sets: [{ reps: 10, kg: 14 },  { reps: 10, kg: 14 },  { reps: 9, kg: 16 }] },
    ],
  },
]

export const SEED_BODY_LOG: BodyEntry[] = [
  { id: 'b1',  date: '2026-03-15', weight: 83.2, waist: 86.5, notes: 'Light bulk, end of phase' },
  { id: 'b2',  date: '2026-03-22', weight: 83.0, waist: 86.2 },
  { id: 'b3',  date: '2026-03-30', weight: 82.6, waist: 85.8, notes: 'Starting mild deficit' },
  { id: 'b4',  date: '2026-04-06', weight: 82.3, waist: 85.4 },
  { id: 'b5',  date: '2026-04-14', weight: 81.9, waist: 84.8, notes: 'Good cardio week' },
  { id: 'b6',  date: '2026-04-21', weight: 81.5, waist: 84.5 },
  { id: 'b7',  date: '2026-04-28', weight: 81.2, waist: 84.0, notes: 'Diet on point' },
  { id: 'b8',  date: '2026-05-05', weight: 80.8, waist: 83.6 },
  { id: 'b9',  date: '2026-05-14', weight: 80.4, waist: 83.2, notes: 'Refeed Saturday' },
  {
    id: 'b10', date: '2026-05-22', weight: 80.1, waist: 82.8,
    chest: 102.5, hip: 98.0,
    bicepL: 38.2, bicepR: 38.5,
    thighL: 58.4, thighR: 58.6,
    notes: 'Full measurements',
  },
]
