import twilio from 'twilio'
import { ChittiGroup } from '../models/ChittiGroup'
import { Member } from '../models/Member'
import { Payment } from '../models/Payment'
import { Withdrawal } from '../models/Withdrawal'

interface WhatsAppMessage {
  to: string
  body: string
  mediaUrl?: string
}

export class WhatsAppService {
  private client: twilio.Twilio
  private fromNumber: string

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || ''

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured')
    }

    this.client = twilio(accountSid, authToken)
  }

  private formatPhoneNumber(phone: string): string {
    // Remove spaces and ensure proper format for WhatsApp
    return phone.replace(/\s/g, '')
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN')
  }

  public async sendPaymentReminder(memberId: string, groupId: string): Promise<void> {
    try {
      const member = await Member.findById(memberId)
      const group = await ChittiGroup.findById(groupId)

      if (!member || !group) {
        throw new Error('Member or group not found')
      }

      const message = `Hello ${member.name}! 📋

This is a reminder for your monthly contribution to *${group.name}*.

*Amount Due:* ${this.formatCurrency(group.monthlyAmount)}
*Due Date:* ${new Date().toLocaleDateString('en-IN')}
*Group:* ${group.name}

Please make your payment at your earliest convenience.

Thank you! 🙏

*Chitti Manager Team*`

      await this.sendMessage({
        to: `whatsapp:${this.formatPhoneNumber(member.phoneNumber)}`,
        body: message
      })

      console.log(`Payment reminder sent to ${member.name} (${member.phoneNumber})`)
    } catch (error) {
      console.error('Error sending payment reminder:', error)
      throw error
    }
  }

  public async sendPaymentConfirmation(paymentId: string): Promise<void> {
    try {
      const payment = await Payment.findById(paymentId)
        .populate('memberId', 'name phoneNumber')
        .populate('groupId', 'name') as any

      if (!payment) {
        throw new Error('Payment not found')
      }

      const message = `✅ *Payment Received*

Hello ${payment.memberId?.name}!

We have successfully received your payment for *${payment.groupId?.name}*.

*Payment Details:*
• Amount: ${this.formatCurrency(payment.amount)}
• Date: ${this.formatDate(payment.paymentDate)}
• Method: ${payment.paymentMethod}
${payment.transactionId ? `• Transaction ID: ${payment.transactionId}` : ''}

Thank you for your timely payment! 🙏

*Chitti Manager Team*`

      await this.sendMessage({
        to: `whatsapp:${this.formatPhoneNumber(payment.memberId?.phoneNumber || '')}`,
        body: message
      })

      console.log(`Payment confirmation sent to ${payment.memberId?.name}`)
    } catch (error) {
      console.error('Error sending payment confirmation:', error)
      throw error
    }
  }

  public async sendWithdrawalRequestNotification(withdrawalId: string): Promise<void> {
    try {
      const withdrawal = await Withdrawal.findById(withdrawalId)
        .populate('memberId', 'name phoneNumber')
        .populate('groupId', 'name') as any

      if (!withdrawal) {
        throw new Error('Withdrawal not found')
      }

      const message = `📝 *Withdrawal Request Submitted*

Hello ${withdrawal.memberId?.name}!

Your withdrawal request for *${withdrawal.groupId?.name}* has been successfully submitted.

*Request Details:*
• Amount: ${this.formatCurrency(withdrawal.amount)}
• Date: ${this.formatDate(withdrawal.withdrawalDate)}
• Status: ${withdrawal.status}
• Reason: ${withdrawal.reason}

Our admin team will review your request and notify you of the decision within 24-48 hours.

Thank you! 🙏

*Chitti Manager Team*`

      await this.sendMessage({
        to: `whatsapp:${this.formatPhoneNumber(withdrawal.memberId?.phoneNumber || '')}`,
        body: message
      })

      console.log(`Withdrawal notification sent to ${withdrawal.memberId?.name}`)
    } catch (error) {
      console.error('Error sending withdrawal notification:', error)
      throw error
    }
  }

  public async sendWithdrawalApprovalNotification(withdrawalId: string): Promise<void> {
    try {
      const withdrawal = await Withdrawal.findById(withdrawalId)
        .populate('memberId', 'name phoneNumber')
        .populate('groupId', 'name') as any

      if (!withdrawal) {
        throw new Error('Withdrawal not found')
      }

      const message = `✅ *Withdrawal Request Approved*

Hello ${withdrawal.memberId?.name}!

Great news! Your withdrawal request for *${withdrawal.groupId?.name}* has been *approved*.

*Approval Details:*
• Amount: ${this.formatCurrency(withdrawal.amount)}
• Date: ${this.formatDate(withdrawal.withdrawalDate)}
• Approved On: ${this.formatDate(withdrawal.approvedAt || new Date())}
• Reason: ${withdrawal.reason}
${withdrawal.notes ? `• Notes: ${withdrawal.notes}` : ''}

Please contact the admin for further instructions on receiving your withdrawal amount.

Thank you! 🙏

*Chitti Manager Team*`

      await this.sendMessage({
        to: `whatsapp:${this.formatPhoneNumber(withdrawal.memberId?.phoneNumber || '')}`,
        body: message
      })

      console.log(`Withdrawal approval sent to ${withdrawal.memberId?.name}`)
    } catch (error) {
      console.error('Error sending withdrawal approval:', error)
      throw error
    }
  }

  public async sendWithdrawalRejectionNotification(withdrawalId: string): Promise<void> {
    try {
      const withdrawal = await Withdrawal.findById(withdrawalId)
        .populate('memberId', 'name phoneNumber')
        .populate('groupId', 'name') as any

      if (!withdrawal) {
        throw new Error('Withdrawal not found')
      }

      const message = `❌ *Withdrawal Request Rejected*

Hello ${withdrawal.memberId?.name}!

We regret to inform you that your withdrawal request for *${withdrawal.groupId?.name}* has been *rejected*.

*Request Details:*
• Amount: ${this.formatCurrency(withdrawal.amount)}
• Date: ${this.formatDate(withdrawal.withdrawalDate)}
• Status: ${withdrawal.status}
• Reason: ${withdrawal.reason}
${withdrawal.notes ? `• Notes: ${withdrawal.notes}` : ''}

If you have any questions, please contact the admin for clarification.

Thank you for your understanding! 🙏

*Chitti Manager Team*`

      await this.sendMessage({
        to: `whatsapp:${this.formatPhoneNumber(withdrawal.memberId?.phoneNumber || '')}`,
        body: message
      })

      console.log(`Withdrawal rejection sent to ${withdrawal.memberId?.name}`)
    } catch (error) {
      console.error('Error sending withdrawal rejection:', error)
      throw error
    }
  }

  public async sendGroupInvitation(memberId: string, groupId: string): Promise<void> {
    try {
      const member = await Member.findById(memberId)
      const group = await ChittiGroup.findById(groupId)

      if (!member || !group) {
        throw new Error('Member or group not found')
      }

      const message = `🎉 *Welcome to ${group.name}!*

Hello ${member.name}!

You have been successfully added to *${group.name}*.

*Group Details:*
• Group Name: ${group.name}
• Monthly Contribution: ${this.formatCurrency(group.monthlyAmount)}
• Admin: Admin
• Join Date: ${this.formatDate(new Date())}

Please make sure to:
1. Mark your calendar for monthly payments
2. Contact the admin for any questions
3. Stay updated with group announcements

Welcome aboard! 🚀

*Chitti Manager Team*`

      await this.sendMessage({
        to: `whatsapp:${this.formatPhoneNumber(member.phoneNumber)}`,
        body: message
      })

      console.log(`Group invitation sent to ${member.name}`)
    } catch (error) {
      console.error('Error sending group invitation:', error)
      throw error
    }
  }

  public async sendBulkPaymentReminder(groupId: string, memberIds: string[]): Promise<void> {
    try {
      const group = await ChittiGroup.findById(groupId)
      if (!group) {
        throw new Error('Group not found')
      }

      const members = await Member.find({
        _id: { $in: memberIds }
      })

      const message = `📢 *Monthly Payment Reminder*

Hello everyone!

This is a reminder for your monthly contribution to *${group.name}*.

*Payment Details:*
• Amount Due: ${this.formatCurrency(group.monthlyAmount)}
• Due Date: ${new Date().toLocaleDateString('en-IN')}
• Group: ${group.name}

Please make your payments at your earliest convenience.

Thank you! 🙏

*Chitti Manager Team*`

      const promises = members.map(member => 
        this.sendMessage({
          to: `whatsapp:${this.formatPhoneNumber(member.phoneNumber)}`,
          body: message
        })
      )

      await Promise.all(promises)
      console.log(`Bulk payment reminders sent to ${members.length} members`)
    } catch (error) {
      console.error('Error sending bulk payment reminders:', error)
      throw error
    }
  }

  private async sendMessage(message: WhatsAppMessage): Promise<void> {
    try {
      if (!this.fromNumber) {
        throw new Error('WhatsApp number not configured')
      }

      await this.client.messages.create({
        body: message.body,
        from: `whatsapp:${this.fromNumber}`,
        to: message.to,
        ...(message.mediaUrl && { mediaUrl: [message.mediaUrl] })
      })
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      throw error
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      if (!this.fromNumber) {
        throw new Error('WhatsApp number not configured')
      }

      // Test by getting the message service
      await this.client.messages.list({ limit: 1 })
      return true
    } catch (error) {
      console.error('WhatsApp connection test failed:', error)
      return false
    }
  }
}

// Lazy singleton — only instantiated on first use so missing env vars don't crash the server on startup
let _instance: WhatsAppService | null = null
const getInstance = (): WhatsAppService => {
  if (!_instance) {
    _instance = new WhatsAppService()
  }
  return _instance
}

// Convenience functions for easy use
export const sendPaymentReminder = (memberId: string, groupId: string) =>
  getInstance().sendPaymentReminder(memberId, groupId)

export const sendPaymentConfirmation = (paymentId: string) =>
  getInstance().sendPaymentConfirmation(paymentId)

export const sendWithdrawalRequestNotification = (withdrawalId: string) =>
  getInstance().sendWithdrawalRequestNotification(withdrawalId)

export const sendWithdrawalApprovalNotification = (withdrawalId: string) =>
  getInstance().sendWithdrawalApprovalNotification(withdrawalId)

export const sendWithdrawalRejectionNotification = (withdrawalId: string) =>
  getInstance().sendWithdrawalRejectionNotification(withdrawalId)

export const sendGroupInvitation = (memberId: string, groupId: string) =>
  getInstance().sendGroupInvitation(memberId, groupId)

export const sendBulkPaymentReminder = (groupId: string, memberIds: string[]) =>
  getInstance().sendBulkPaymentReminder(groupId, memberIds)

export const testConnection = () =>
  getInstance().testConnection()
