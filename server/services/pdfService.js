const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Brand colours
const C = {
  primary:   '#0284c7',   // sky-600
  dark:      '#0c1a2e',   // near-black header
  light:     '#f0f9ff',   // sky-50 background band
  border:    '#e0f2fe',   // sky-100
  muted:     '#64748b',   // slate-500
  success:   '#16a34a',   // green-600
  white:     '#ffffff',
  black:     '#111827',
};

function drawRect(doc, x, y, w, h, color, radius = 0) {
  doc.save().roundedRect(x, y, w, h, radius).fill(color).restore();
}

function drawLine(doc, x1, y1, x2, y2, color = C.border, width = 0.5) {
  doc.save().moveTo(x1, y1).lineTo(x2, y2).lineWidth(width).strokeColor(color).stroke().restore();
}

class PDFService {
  static generatePaymentReceipt(payment, member, chitGroup, admin = null) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });

        // Collect into memory — no file written to disk
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve({ buffer: Buffer.concat(chunks), fileName: `receipt-${payment.receiptNumber}.pdf` }));
        doc.on('error', reject);

        const PW = 595, PH = 842;   // A4 points
        const ML = 48, MR = PW - 48; // left / right margin

        // ── DARK HEADER BAND ──────────────────────────────────────
        drawRect(doc, 0, 0, PW, 90, C.dark);

        doc.fillColor(C.white)
           .font('Helvetica-Bold').fontSize(20)
           .text('CHITTI MANAGEMENT', ML, 22, { width: PW - ML * 2, align: 'center' });

        doc.fillColor(C.primary)
           .font('Helvetica').fontSize(9)
           .text('Chit Fund Management System  |  Official Payment Receipt', ML, 48, { width: PW - ML * 2, align: 'center' });

        // ── RECEIPT NUMBER BADGE ──────────────────────────────────
        drawRect(doc, 0, 80, PW, 38, C.primary);
        doc.fillColor(C.white)
           .font('Helvetica-Bold').fontSize(10)
           .text(`RECEIPT NO:  ${payment.receiptNumber}`, ML, 90, { width: (PW - ML * 2) / 2 });

        const dateStr = new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        doc.fillColor(C.white)
           .font('Helvetica').fontSize(10)
           .text(`DATE:  ${dateStr}`, ML + (PW - ML * 2) / 2, 90, { width: (PW - ML * 2) / 2, align: 'right' });

        let y = 140;

        // ── PAYMENT CONFIRMED BANNER ─────────────────────────────
        drawRect(doc, ML, y, PW - ML * 2, 36, C.light, 6);
        doc.fillColor(C.success)
           .font('Helvetica-Bold').fontSize(13)
           .text('✓  Payment Confirmed', ML, y + 10, { width: PW - ML * 2, align: 'center' });
        y += 52;

        // ── TWO-COLUMN INFO SECTION ───────────────────────────────
        const colW = (PW - ML * 2 - 16) / 2;

        // --- Member Info Card ---
        drawRect(doc, ML, y, colW, 130, '#f8fafc', 6);
        doc.save().rect(ML, y, colW, 130).clip();
        drawRect(doc, ML, y, colW, 22, C.primary, 0);
        doc.restore();

        doc.fillColor(C.white).font('Helvetica-Bold').fontSize(9)
           .text('  MEMBER INFORMATION', ML + 6, y + 7);

        let ry = y + 30;
        const infoLine = (label, value, ix, iy) => {
          doc.fillColor(C.muted).font('Helvetica').fontSize(8).text(label, ix + 8, iy);
          doc.fillColor(C.black).font('Helvetica-Bold').fontSize(9.5).text(value || '—', ix + 8, iy + 11);
        };

        infoLine('Name', member.name, ML, ry);          ry += 30;
        infoLine('Phone', member.phone, ML, ry);         ry += 30;
        infoLine('Chit Group', chitGroup.name, ML, ry);

        // --- Payment Info Card ---
        const cx = ML + colW + 16;
        drawRect(doc, cx, y, colW, 130, '#f8fafc', 6);
        doc.save().rect(cx, y, colW, 130).clip();
        drawRect(doc, cx, y, colW, 22, C.primary, 0);
        doc.restore();

        doc.fillColor(C.white).font('Helvetica-Bold').fontSize(9)
           .text('  PAYMENT INFORMATION', cx + 6, y + 7);

        ry = y + 30;
        infoLine('Amount Paid', `Rs. ${payment.amount.toLocaleString('en-IN')}`, cx, ry);  ry += 30;
        infoLine('Month', `Month ${payment.month} of ${chitGroup.duration}`, cx, ry);       ry += 30;
        infoLine('Payment Method', (payment.paymentMethod || '').replace('_', ' ').toUpperCase(), cx, ry);

        y += 148;

        // ── PAYMENT HISTORY TABLE ─────────────────────────────────
        doc.fillColor(C.black).font('Helvetica-Bold').fontSize(11)
           .text('Payment History', ML, y);
        y += 16;

        const cols = [
          { label: 'Month',  x: ML,        w: 60  },
          { label: 'Date',   x: ML + 60,   w: 110 },
          { label: 'Amount', x: ML + 170,  w: 100 },
          { label: 'Method', x: ML + 270,  w: 110 },
          { label: 'Receipt No.', x: ML + 380, w: 118 },
        ];

        drawRect(doc, ML, y, PW - ML * 2, 22, C.dark);
        cols.forEach(c => {
          doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8.5)
             .text(c.label, c.x + 4, y + 7, { width: c.w - 8 });
        });
        y += 22;

        const rowH = 20;
        for (let m = 1; m <= payment.month; m++) {
          const isThis = (m === payment.month);
          const rowBg = isThis ? '#ecfdf5' : (m % 2 === 0 ? '#f8fafc' : C.white);
          drawRect(doc, ML, y, PW - ML * 2, rowH, rowBg);
          drawLine(doc, ML, y + rowH, MR, y + rowH, C.border);

          const mDate = isThis
            ? new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';
          const mAmt  = isThis ? `Rs. ${payment.amount.toLocaleString('en-IN')}` : `Rs. ${chitGroup.monthlyContribution.toLocaleString('en-IN')}`;
          const mMeth = isThis ? (payment.paymentMethod || '').replace('_', ' ').toUpperCase() : '—';
          const mRec  = isThis ? payment.receiptNumber : '—';

          const rowColor = isThis ? C.success : C.black;
          const rowFont  = isThis ? 'Helvetica-Bold' : 'Helvetica';

          const cells = [`Month ${m}`, mDate, mAmt, mMeth, mRec];
          cells.forEach((val, i) => {
            doc.fillColor(rowColor).font(rowFont).fontSize(8.5)
               .text(val, cols[i].x + 4, y + 6, { width: cols[i].w - 8 });
          });

          y += rowH;
        }

        // Table footer — total
        drawRect(doc, ML, y, PW - ML * 2, 24, C.primary);
        doc.fillColor(C.white).font('Helvetica-Bold').fontSize(9)
           .text('Total Paid So Far', ML + 4, y + 8, { width: 260 });
        doc.fillColor(C.white).font('Helvetica-Bold').fontSize(9)
           .text(`Rs. ${member.totalPaid.toLocaleString('en-IN')}`, ML + 170, y + 8, { width: 100 });

        const totalExpected = chitGroup.monthlyContribution * chitGroup.duration;
        const remaining = totalExpected - member.totalPaid;
        doc.fillColor(C.white).font('Helvetica').fontSize(8)
           .text(`Remaining: Rs. ${remaining.toLocaleString('en-IN')}  (${chitGroup.duration - payment.month} months left)`,
                 ML + 280, y + 8, { width: 218 });
        y += 36;

        // ── NOTES ────────────────────────────────────────────────
        if (payment.notes) {
          doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(9)
             .text(`Notes: ${payment.notes}`, ML, y);
          y += 18;
        }

        y += 10;

        // ── SIGNATURE SECTION ────────────────────────────────────
        const sigBoxH = 80;
        drawRect(doc, ML, y, PW - ML * 2, sigBoxH, '#f8fafc', 6);
        drawLine(doc, ML, y, MR, y, C.border, 1);

        doc.fillColor(C.muted).font('Helvetica').fontSize(8)
           .text('Received By', ML + 12, y + 10);
        doc.fillColor(C.black).font('Helvetica-Bold').fontSize(11)
           .text(payment.receivedBy || 'Admin', ML + 12, y + 22);

        if (admin?.name) {
          doc.fillColor(C.muted).font('Helvetica').fontSize(8)
             .text(admin.email || '', ML + 12, y + 38);
        }

        const sigLabelX = PW / 2 + 20;
        doc.fillColor(C.muted).font('Helvetica').fontSize(8)
           .text('Authorised Signature', sigLabelX, y + 10);

        let sigPlaced = false;
        if (admin?.digitalSignatureImage) {
          try {
            const sigPath = path.join(__dirname, '../../', admin.digitalSignatureImage.replace(/^\//, ''));
            if (fs.existsSync(sigPath)) {
              doc.image(sigPath, sigLabelX, y + 18, { height: 44, fit: [160, 44] });
              sigPlaced = true;
            }
          } catch (e) { /* signature image missing */ }
        }
        if (!sigPlaced) {
          drawLine(doc, sigLabelX, y + 55, sigLabelX + 160, y + 55, C.muted, 0.8);
          doc.fillColor(C.muted).font('Helvetica-Oblique').fontSize(8)
             .text('(signature)', sigLabelX, y + 58, { width: 160, align: 'center' });
        }

        drawLine(doc, PW / 2 + 8, y + 6, PW / 2 + 8, y + sigBoxH - 6, C.border, 1);

        // ── FOOTER ───────────────────────────────────────────────
        drawRect(doc, 0, PH - 36, PW, 36, C.dark);
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(8)
           .text('This is a computer-generated receipt and is valid without a physical signature.', 0, PH - 23, { width: PW, align: 'center' });

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFService;
