import type { Task } from '@letget/db/schema';

import { getPref } from './prefs';
import { enqueueNotification, deleteNotificationsByPayloadKey } from './queue';

const TASK_DEADLINE = 'task_deadline' as const;

export async function scheduleTaskDeadlineNotification(task: Task) {
  await deleteNotificationsByPayloadKey(task.userId, TASK_DEADLINE, 'taskId', task.id);

  if (!task.deadline) return;
  const pref = await getPref(task.userId, TASK_DEADLINE);
  if (!pref || !pref.enabled) return;
  const minutesBefore = pref.minutesBefore ?? 30;
  const scheduledFor = new Date(task.deadline.getTime() - minutesBefore * 60_000);
  if (scheduledFor.getTime() < Date.now()) return;
  await enqueueNotification({
    userId: task.userId,
    eventType: TASK_DEADLINE,
    payload: { taskId: task.id, summary: task.contentText.slice(0, 200) },
    scheduledFor,
  });
}
