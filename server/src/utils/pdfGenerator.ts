import PDFKit from 'pdfkit'

interface GroupReportData {
  group: any
  members: any[]
  payments: any[]
  withdrawals: any[]
  summary: {
    totalMembers: number
    totalPayments: number
    totalAmountCollected: number
    totalWithdrawals: number
    totalAmountWithdrawn: number
    pendingPayments: number
    pendingWithdrawals: number
  }
}

export class PDFGenerator {
  private doc: any

  constructor() {
    this.doc = new PDFKit({
      size: 'A4',
      margin: 50,
      bufferPages: true
    })
  }

  private addHeader(title: string): void {
    // Logo placeholder
    this.doc.fontSize(16).font('Helvetica-Bold').text('Chitti Manager', { align: 'center' })
    this.doc.moveDown(0.5)
    this.doc.fontSize(12).font('Helvetica').text('Financial Management System', { align: 'center' })
    this.doc.moveDown(1)
    
    // Title
    this.doc.fontSize(14).font('Helvetica-Bold').text(title, { align: 'center' })
    this.doc.moveDown(1)
    
    // Line separator
    this.doc.moveTo(50, this.doc.y).lineTo(550, this.doc.y).stroke()
    this.doc.moveDown(1)
  }

  private addFooter(): void {
    this.doc.moveTo(50, this.doc.page.height - 50)
      .lineTo(550, this.doc.page.height - 50)
      .stroke()
    
    this.doc.fontSize(8).font('Helvetica-Oblique')
      .text(`Generated on ${new Date().toLocaleString()} | Chitti Manager`, 50, this.doc.page.height - 40, {
        align: 'center'
      })
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

  public async generateGroupReport(data: GroupReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = []
      
      this.doc.on('data', (chunk) => buffers.push(chunk))
      this.doc.on('end', () => {
        const pdfData = Buffer.concat(buffers)
        resolve(pdfData)
      })
      this.doc.on('error', reject)

      this.addHeader(`Group Report: ${data.group.name}`)
      
      // Group Information
      this.doc.fontSize(12).font('Helvetica-Bold').text('Group Information', { underline: true })
      this.doc.moveDown(0.5)
      this.doc.fontSize(10).font('Helvetica')
      this.doc.text(`Group Name: ${data.group.name}`)
      this.doc.text(`Admin: ${data.group.adminName || 'Unknown'}`)
      this.doc.text(`Monthly Contribution: ${this.formatCurrency(data.group.monthlyContribution)}`)
      this.doc.text(`Created: ${this.formatDate(data.group.createdAt)}`)
      this.doc.moveDown(1)

      // Summary Section
      this.doc.fontSize(12).font('Helvetica-Bold').text('Summary', { underline: true })
      this.doc.moveDown(0.5)
      this.doc.fontSize(10).font('Helvetica')
      this.doc.text(`Total Members: ${data.summary.totalMembers}`)
      this.doc.text(`Total Payments: ${data.summary.totalPayments}`)
      this.doc.text(`Total Amount Collected: ${this.formatCurrency(data.summary.totalAmountCollected)}`)
      this.doc.text(`Total Withdrawals: ${data.summary.totalWithdrawals}`)
      this.doc.text(`Total Amount Withdrawn: ${this.formatCurrency(data.summary.totalAmountWithdrawn)}`)
      this.doc.text(`Pending Payments: ${data.summary.pendingPayments}`)
      this.doc.text(`Pending Withdrawals: ${data.summary.pendingWithdrawals}`)
      this.doc.moveDown(1)

      // Members Table
      if (data.members.length > 0) {
        this.doc.fontSize(12).font('Helvetica-Bold').text('Members', { underline: true })
        this.doc.moveDown(0.5)
        this.createTable([
          ['Member Name', 'Phone Number', 'Status', 'Join Date']
        ], data.members.map(member => [
          member.name,
          member.phoneNumber,
          member.status || 'Active',
          this.formatDate(member.createdAt)
        ]))
        this.doc.moveDown(1)
      }

      // Payments Table
      if (data.payments.length > 0) {
        this.doc.fontSize(12).font('Helvetica-Bold').text('Recent Payments', { underline: true })
        this.doc.moveDown(0.5)
        this.createTable([
          ['Member', 'Amount', 'Status', 'Payment Date', 'Method']
        ], data.payments.map(payment => [
          payment.memberName,
          this.formatCurrency(payment.amount),
          payment.status,
          this.formatDate(payment.paymentDate),
          payment.paymentMethod
        ]))
        this.doc.moveDown(1)
      }

      // Withdrawals Table
      if (data.withdrawals.length > 0) {
        this.doc.fontSize(12).font('Helvetica-Bold').text('Recent Withdrawals', { underline: true })
        this.doc.moveDown(0.5)
        this.createTable([
          ['Member', 'Amount', 'Status', 'Request Date', 'Reason']
        ], data.withdrawals.map(withdrawal => [
          withdrawal.memberName,
          this.formatCurrency(withdrawal.amount),
          withdrawal.status,
          this.formatDate(withdrawal.withdrawalDate),
          (withdrawal.reason || '').substring(0, 30) + ((withdrawal.reason || '').length > 30 ? '...' : '')
        ]))
      }

      this.addFooter()
      this.doc.end()
    })
  }

  public async generatePaymentReceipt(paymentData: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = []
      
      this.doc.on('data', (chunk) => buffers.push(chunk))
      this.doc.on('end', () => {
        const pdfData = Buffer.concat(buffers)
        resolve(pdfData)
      })
      this.doc.on('error', reject)

      this.addHeader('Payment Receipt')

      // Receipt Header
      this.doc.fontSize(14).font('Helvetica-Bold').text('PAYMENT RECEIPT', { align: 'center' })
      this.doc.moveDown(1)
      this.doc.fontSize(10).font('Helvetica')
      this.doc.text(`Receipt No: ${paymentData.receiptNumber || 'N/A'}`)
      this.doc.text(`Date: ${this.formatDate(paymentData.paymentDate)}`)
      this.doc.moveDown(1)

      // Payment Details
      this.doc.fontSize(12).font('Helvetica-Bold').text('Payment Details', { underline: true })
      this.doc.moveDown(0.5)
      this.doc.fontSize(10).font('Helvetica')
      this.doc.text(`Member: ${paymentData.memberName}`)
      this.doc.text(`Group: ${paymentData.groupName}`)
      this.doc.text(`Amount: ${this.formatCurrency(paymentData.amount)}`)
      this.doc.text(`Status: ${paymentData.status}`)
      this.doc.text(`Payment Method: ${paymentData.paymentMethod}`)
      if (paymentData.transactionId) {
        this.doc.text(`Transaction ID: ${paymentData.transactionId}`)
      }
      this.doc.moveDown(1)

      // Signature
      this.doc.moveDown(2)
      this.doc.fontSize(10).font('Helvetica-Oblique')
      this.doc.text('Authorized Signature: ________________________', { align: 'right' })

      this.addFooter()
      this.doc.end()
    })
  }

  public async generateWithdrawalReceipt(withdrawalData: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = []
      
      this.doc.on('data', (chunk) => buffers.push(chunk))
      this.doc.on('end', () => {
        const pdfData = Buffer.concat(buffers)
        resolve(pdfData)
      })
      this.doc.on('error', reject)

      this.addHeader('Withdrawal Receipt')

      // Receipt Header
      this.doc.fontSize(14).font('Helvetica-Bold').text('WITHDRAWAL RECEIPT', { align: 'center' })
      this.doc.moveDown(1)
      this.doc.fontSize(10).font('Helvetica')
      this.doc.text(`Receipt No: ${withdrawalData.receiptNumber || 'N/A'}`)
      this.doc.text(`Date: ${this.formatDate(withdrawalData.withdrawalDate)}`)
      this.doc.moveDown(1)

      // Withdrawal Details
      this.doc.fontSize(12).font('Helvetica-Bold').text('Withdrawal Details', { underline: true })
      this.doc.moveDown(0.5)
      this.doc.fontSize(10).font('Helvetica')
      this.doc.text(`Member: ${withdrawalData.memberName}`)
      this.doc.text(`Group: ${withdrawalData.groupName}`)
      this.doc.text(`Amount: ${this.formatCurrency(withdrawalData.amount)}`)
      this.doc.text(`Status: ${withdrawalData.status}`)
      this.doc.text(`Reason: ${withdrawalData.reason}`)
      if (withdrawalData.approvedBy) {
        this.doc.text(`Approved By: ${withdrawalData.approvedBy}`)
        this.doc.text(`Approved On: ${this.formatDate(withdrawalData.approvedAt)}`)
      }
      this.doc.moveDown(1)

      // Signature
      this.doc.moveDown(2)
      this.doc.fontSize(10).font('Helvetica-Oblique')
      this.doc.text('Authorized Signature: ________________________', { align: 'right' })

      this.addFooter()
      this.doc.end()
    })
  }

  private createTable(headers: string[][], data: string[][]): void {
    const tableTop = this.doc.y
    const columnCount = headers[0].length
    const columnWidth = (500 - (columnCount - 1) * 10) / columnCount
    const rowHeight = 20

    // Draw headers
    this.doc.font('Helvetica-Bold')
    headers[0].forEach((header, index) => {
      const x = 50 + index * (columnWidth + 10)
      this.doc.text(header, x, tableTop, { width: columnWidth, height: rowHeight, align: 'left' })
    })

    // Draw header separator
    this.doc.moveTo(50, tableTop + rowHeight + 5)
      .lineTo(550, tableTop + rowHeight + 5)
      .stroke()

    // Draw data rows
    this.doc.font('Helvetica')
    data.forEach((row, rowIndex) => {
      const y = tableTop + rowHeight + 10 + rowIndex * rowHeight
      
      row.forEach((cell, cellIndex) => {
        const x = 50 + cellIndex * (columnWidth + 10)
        this.doc.text(cell, x, y, { width: columnWidth, height: rowHeight, align: 'left' })
      })

      // Draw row separator
      this.doc.moveTo(50, y + rowHeight + 5)
        .lineTo(550, y + rowHeight + 5)
        .stroke()
    })

    this.doc.y = tableTop + rowHeight + 10 + data.length * rowHeight + 10
  }
}

// Export utility functions for easy use
export const generateGroupReport = async (data: GroupReportData): Promise<Buffer> => {
  const generator = new PDFGenerator()
  return generator.generateGroupReport(data)
}

export const generatePaymentReceipt = async (paymentData: any): Promise<Buffer> => {
  const generator = new PDFGenerator()
  return generator.generatePaymentReceipt(paymentData)
}

export const generateWithdrawalReceipt = async (withdrawalData: any): Promise<Buffer> => {
  const generator = new PDFGenerator()
  return generator.generateWithdrawalReceipt(withdrawalData)
}