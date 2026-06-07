export type WorkoutSet = { reps: number; kg: number }
export type Exercise = { name: string; sets: WorkoutSet[] }
export type WorkoutSession = { id: string; date: string; name: string; exercises: Exercise[] }
export type BodyEntry = {
  id: string
  date: string
  weight: number
  waist?: number
  chest?: number
  hip?: number
  bicepL?: number
  bicepR?: number
  thighL?: number
  thighR?: number
  notes?: string
}
