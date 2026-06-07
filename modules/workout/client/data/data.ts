// Re-export barrel — content split into types/, lib/
export type { WorkoutSet, Exercise, WorkoutSession, BodyEntry } from '../types/workout'
export type { WorkoutSession as WorkoutEntry } from '../types/workout'
export { EXERCISE_LIBRARY } from '../lib/exercises'
export { SEED_SESSIONS as WORKOUTS, SEED_BODY_LOG as BODY_LOG } from '../lib/seed'
export { workoutVolume, formatDate, dayOfWeek, currentStreak, sessionsThisMonth, volumeThisWeek } from '../lib/workoutUtils'
