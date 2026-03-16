const ChitGroup = require('../models/ChitGroup');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const Admin = require('../models/Admin');
const NotificationService = require('./notificationService');

function buildReminderMessage(member, chitGroup, type) {
  const collectionDay = chitGroup.collectionDay;
  const amount = `₹${chitGroup.monthlyContribution.toLocaleString('en-IN')}`;

  if (type === 'before') {
    return (
      `Hello ${member.name},\n\n` +
      `📅 Reminder: Your chit collection for *${chitGroup.name}* is due on the *${collectionDay}th of this month*.\n\n` +
      `Amount: ${amount}\n\n` +
      `Please ensure payment is made on time. Thank you! 🙏`
    );
  }
  if (type === 'due') {
    return (
      `Hello ${member.name},\n\n` +
      `⚠️ *Today is collection day* for *${chitGroup.name}*.\n\n` +
      `Amount Due: ${amount}\n\n` +
      `Please make your payment today. Thank you! 🙏`
    );
  }
  if (type === 'overdue') {
    return (
      `Hello ${member.name},\n\n` +
      `❗ Your payment for *${chitGroup.name}* is *still pending*.\n\n` +
      `Amount Due: ${amount}\n\n` +
      `Kindly clear your dues as soon as possible. Thank you! 🙏`
    );
  }
}

/**
 * Send reminders for a specific type, grouped by admin.
 * Each admin's chit groups use that admin's own WhatsApp credentials.
 */
async function sendRemindersForType(type, chitGroups) {
  for (const chitGroup of chitGroups) {
    const currentMonth = chitGroup.getCurrentMonth();
    if (currentMonth < 1) continue;

    // Load admin credentials for this chit group
    let waCredentials = null;
    if (chitGroup.adminId) {
      const admin = await Admin.findById(chitGroup.adminId);
      if (admin && admin.whatsappEnabled && admin.whatsappPhoneNumberId && admin.whatsappAccessToken) {
        waCredentials = {
          phoneNumberId: admin.whatsappPhoneNumberId,
          accessToken:   admin.whatsappAccessToken,
          fromNumber:    admin.whatsappFromNumber
        };
      }
    }

    const notificationService = new NotificationService(waCredentials);

    const members = await Member.find({ chitGroupId: chitGroup._id, isActive: true });

    for (const member of members) {
      const paid = await Payment.findOne({
        memberId: member._id,
        chitGroupId: chitGroup._id,
        month: currentMonth
      });
      if (paid) continue;

      const message = buildReminderMessage(member, chitGroup, type);
      try {
        const result = await notificationService.sendGeneralNotification(member.phone, message);
        console.log(`[Reminder:${type}] ${result.success ? '✓' : '✗'} ${member.name} (${member.phone}) — ${chitGroup.name}`);
      } catch (err) {
        console.error(`[Reminder:${type}] Failed for ${member.name}:`, err.message);
      }
    }
  }
}

/**
 * Daily cron at 09:00 AM:
 *  - 5 days before collectionDay → 'before' reminder
 *  - On collectionDay            → 'due' reminder
 *  - 2 days after collectionDay  → 'overdue' reminder
 */
function setupReminderScheduler(cron) {
  cron.schedule('0 9 * * *', async () => {
    console.log('[ReminderScheduler] Running daily check...');
    const today = new Date().getDate();

    try {
      const activeGroups = await ChitGroup.find({ status: 'active' });

      const before  = activeGroups.filter(g => today === g.collectionDay - 5);
      const due     = activeGroups.filter(g => today === g.collectionDay);
      const overdue = activeGroups.filter(g => today === g.collectionDay + 2);

      if (before.length)  await sendRemindersForType('before',  before);
      if (due.length)     await sendRemindersForType('due',     due);
      if (overdue.length) await sendRemindersForType('overdue', overdue);

      console.log(`[ReminderScheduler] Done. before:${before.length} due:${due.length} overdue:${overdue.length}`);
    } catch (err) {
      console.error('[ReminderScheduler] Error:', err.message);
    }
  });

  console.log('[ReminderScheduler] Scheduled — runs daily at 09:00 AM');
}

module.exports = { setupReminderScheduler };
