import cron from 'node-cron';
import type { Bot } from 'grammy';

import { logger } from './logger';
import { deliverNotification } from './services/push';
import {
  deleteLinkForUser,
  enqueueNotification,
  listUsersWithEnabledPref,
  markFailed,
  markSent,
  pickupDueNotifications,
} from './services/queue';

export function startCron(bot: Bot) {
  cron.schedule('* * * * *', async () => {
    try {
      const due = await pickupDueNotifications(50);
      for (const n of due) {
        const result = await deliverNotification(bot, {
          id: n.id,
          userId: n.userId,
          eventType: n.eventType,
          payload: n.payload as Record<string, unknown>,
        });
        if (result.ok) {
          await markSent(n.id);
          continue;
        }
        if (result.blockedByUser) {
          logger.warn({ userId: n.userId }, 'user blocked bot — removing telegram link');
          await deleteLinkForUser(n.userId);
          await markSent(n.id);
        } else {
          await markFailed(n.id, result.error);
        }
      }
    } catch (err) {
      logger.error({ err }, 'cron pickup failed');
    }
  });

  // Morning digest: 06:00 UTC = 09:00 Moscow. TZ-per-user refinement deferred.
  cron.schedule('0 6 * * *', async () => {
    try {
      const users = await listUsersWithEnabledPref('morning_digest');
      for (const u of users) {
        await enqueueNotification({
          userId: u.userId,
          eventType: 'morning_digest',
          payload: { text: 'Доброе утро ☀️ Открой LETget — задачи на сегодня ждут.' },
          scheduledFor: new Date(),
        });
      }
      logger.info({ count: users.length }, 'morning digests enqueued');
    } catch (err) {
      logger.error({ err }, 'morning digest cron failed');
    }
  });

  // Weekly recap: 17:00 UTC Sun = 20:00 Moscow Sun
  cron.schedule('0 17 * * 0', async () => {
    try {
      const users = await listUsersWithEnabledPref('weekly_recap');
      for (const u of users) {
        await enqueueNotification({
          userId: u.userId,
          eventType: 'weekly_recap',
          payload: { text: 'Еженедельный recap — итоги недели в LETget.' },
          scheduledFor: new Date(),
        });
      }
      logger.info({ count: users.length }, 'weekly recaps enqueued');
    } catch (err) {
      logger.error({ err }, 'weekly recap cron failed');
    }
  });

  logger.info('cron jobs registered');
}
