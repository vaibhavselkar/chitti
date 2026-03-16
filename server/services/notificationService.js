const nodemailer = require('nodemailer');

class NotificationService {
  constructor(waCredentials = null) {
    // waCredentials = { phoneNumberId, accessToken, fromNumber }
    this.waCredentials = waCredentials;

    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  _normalizePhone(toPhone) {
    let phone = toPhone.replace(/[\s\-+]/g, '');
    if (phone.length === 10) phone = '91' + phone;
    return phone;
  }

  _hasCredentials() {
    return !!(this.waCredentials?.phoneNumberId && this.waCredentials?.accessToken);
  }

  /**
   * Upload a PDF buffer to WhatsApp Media API and return the media_id.
   * This avoids saving files to disk entirely.
   */
  async uploadWhatsAppMedia(buffer, filename) {
    const { phoneNumberId, accessToken } = this.waCredentials;
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/media`;

    const formData = new FormData();
    formData.append('messaging_product', 'whatsapp');
    formData.append('type', 'application/pdf');
    formData.append('file', new Blob([buffer], { type: 'application/pdf' }), filename);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || 'Media upload failed');
    return data.id; // media_id
  }

  /**
   * Send WhatsApp text message via Meta Cloud API
   */
  async sendWhatsAppMessage(toPhone, message) {
    if (!this._hasCredentials()) {
      console.log(`[WhatsApp] Credentials not configured. Would send to ${toPhone}: ${message.substring(0, 60)}...`);
      return { success: false, reason: 'WhatsApp not configured' };
    }

    const { phoneNumberId, accessToken } = this.waCredentials;
    const phone = this._normalizePhone(toPhone);

    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error(`[WhatsApp] API error for ${phone}:`, data?.error?.message || JSON.stringify(data));
        return { success: false, error: data?.error?.message };
      }

      console.log(`[WhatsApp] Text sent to ${phone} ✓`);
      return { success: true, messageId: data?.messages?.[0]?.id };
    } catch (error) {
      console.error(`[WhatsApp] Network error for ${phone}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send WhatsApp document via media_id (buffer uploaded first) + caption text
   */
  async sendWhatsAppDocumentBuffer(toPhone, buffer, filename, caption) {
    if (!this._hasCredentials()) {
      console.log(`[WhatsApp] Credentials not configured. Would send document to ${toPhone}`);
      return { success: false, reason: 'WhatsApp not configured' };
    }

    const { phoneNumberId, accessToken } = this.waCredentials;
    const phone = this._normalizePhone(toPhone);

    try {
      // Step 1: upload buffer → get media_id
      const mediaId = await this.uploadWhatsAppMedia(buffer, filename);

      // Step 2: send document using media_id
      const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'document',
          document: {
            id: mediaId,
            filename,
            caption,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error(`[WhatsApp] Document send error for ${phone}:`, data?.error?.message || JSON.stringify(data));
        return { success: false, error: data?.error?.message };
      }

      console.log(`[WhatsApp] Document sent to ${phone} ✓`);
      return { success: true, messageId: data?.messages?.[0]?.id };
    } catch (error) {
      console.error(`[WhatsApp] Document error for ${phone}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send payment receipt — PDF buffer as document + caption, fallback to text
   */
  async sendPaymentReceipt(member, payment, chitGroup, pdfBuffer, fileName) {
    const { caption, fallback } = this.generatePaymentMessage(member, payment, chitGroup);

    if (!this._hasCredentials()) {
      console.log(`[WhatsApp] Skipping notification for ${member.name} — credentials not set`);
      return { success: false, reason: 'WhatsApp not configured' };
    }

    // Try to send PDF as document with caption
    if (pdfBuffer && fileName) {
      const result = await this.sendWhatsAppDocumentBuffer(member.phone, pdfBuffer, fileName, caption);
      if (result.success) return { success: true, whatsapp: result };
      console.warn('[WhatsApp] Document send failed, falling back to text:', result.error);
    }

    // Fallback: plain text message
    const result = await this.sendWhatsAppMessage(member.phone, fallback);
    return { success: true, whatsapp: result };
  }

  generatePaymentMessage(member, payment, chitGroup) {
    const date = new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const totalExpected = chitGroup.monthlyContribution * chitGroup.duration;
    const remaining = Math.max(0, totalExpected - member.totalPaid);

    const caption =
      `Hello ${member.name},\n\n` +
      `✅ *Payment Confirmed!*\n\n` +
      `📋 *${chitGroup.name}*\n` +
      `Month: ${payment.month} of ${chitGroup.duration}\n` +
      `Amount: ₹${payment.amount.toLocaleString('en-IN')}\n` +
      `Date: ${date}\n` +
      `Receipt No: ${payment.receiptNumber}\n\n` +
      `Total Paid: ₹${member.totalPaid.toLocaleString('en-IN')}\n` +
      `Remaining: ₹${remaining.toLocaleString('en-IN')} (${chitGroup.duration - payment.month} months left)\n\n` +
      `Thank you for your payment! 🙏`;

    return { caption, fallback: caption };
  }

  async sendGeneralNotification(phone, message) {
    return await this.sendWhatsAppMessage(phone, message);
  }

  async sendBulkNotification(members, message) {
    const results = [];
    for (const member of members) {
      const result = await this.sendWhatsAppMessage(member.phone, message);
      results.push({ member: member.name, phone: member.phone, ...result });
    }
    return results;
  }

  async sendEmail(to, subject, body) {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html: body
      });
      return { success: true };
    } catch (error) {
      console.error('[Email] Error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = NotificationService;
