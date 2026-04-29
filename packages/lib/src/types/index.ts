export type Brand<T, B> = T & { __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type TaskId = Brand<string, 'TaskId'>;
export type TripId = Brand<string, 'TripId'>;
export type CodeSnippetId = Brand<string, 'CodeSnippetId'>;
export type ExerciseId = Brand<string, 'ExerciseId'>;
export type SetId = Brand<string, 'SetId'>;

export type EventType =
  | 'morning_digest'
  | 'task_deadline'
  | 'workout_streak_warn'
  | 'weekly_recap'
  | 'custom_reminder';

export type UserRole = 'user' | 'admin';
export type Theme = 'light' | 'dark' | 'system';
