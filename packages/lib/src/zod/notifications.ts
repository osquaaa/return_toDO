import { z } from 'zod';

export const eventTypeSchema = z.enum([
  'morning_digest',
  'task_deadline',
  'workout_streak_warn',
  'weekly_recap',
  'custom_reminder',
]);

export const setNotificationPrefSchema = z.object({
  eventType: eventTypeSchema,
  enabled: z.boolean(),
  timeOfDay: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional()
    .nullable(),
  minutesBefore: z.number().int().min(0).max(10_080).optional().nullable(),
});

export type EventType = z.infer<typeof eventTypeSchema>;
export type SetNotificationPrefInput = z.infer<typeof setNotificationPrefSchema>;
