import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_9wNW3wcj_H8GN5YKgjv3iCYMTEv24JddY');

export async function sendInvoiceEmail(to: string, clientName: string, invoiceNumber: string, amountUsd: string, invoiceUrl: string) {
  try {
    await resend.emails.send({
      from: 'CPE Bootcamp <billing@cpe-bootcamp.online>',
      to: [to],
      subject: `New Invoice ${invoiceNumber} - CPE Bootcamp`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>New Invoice Created</h1>
          <p>Hello ${clientName},</p>
          <p>A new invoice has been generated for your recent bootcamp services.</p>
          <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
            <p><strong>Amount:</strong> $${amountUsd} USD</p>
          </div>
          <p>You can view and pay your invoice online at the following link:</p>
          <a href="${invoiceUrl}" style="display: inline-block; padding: 12px 24px; background: #0070f3; color: white; text-decoration: none; border-radius: 5px;">View Invoice</a>
          <p>If you have any questions, please contact our support.</p>
          <p>Best regards,<br/>CPE Bootcamp Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('[Email] Failed to send invoice email:', error);
  }
}

export async function sendPaymentProofNotification(adminEmail: string, clientName: string, invoiceNumber: string) {
  try {
    await resend.emails.send({
      from: 'CPE Billing System <billing@cpe-bootcamp.online>',
      to: [adminEmail],
      subject: `Payment Proof Submitted: ${invoiceNumber}`,
      html: `
        <div style="font-family: sans-serif;">
          <h1>New Payment Proof Submitted</h1>
          <p>Client ${clientName} has submitted a payment proof for invoice <strong>${invoiceNumber}</strong>.</p>
          <p>Please log in to the admin panel to review and verify the transaction.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('[Email] Failed to send admin notification:', error);
  }
}

export async function sendPaymentStatusUpdate(to: string, clientName: string, invoiceNumber: string, status: 'approved' | 'rejected', reason?: string) {
  const isApproved = status === 'approved';
  const statusLabel = isApproved ? 'Approved' : 'Rejected';
  const color = isApproved ? '#10b981' : '#ef4444';

  try {
    await resend.emails.send({
      from: 'CPE Bootcamp <billing@cpe-bootcamp.online>',
      to: [to],
      subject: `Invoice ${invoiceNumber} Payment ${statusLabel}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: ${color};">Payment ${statusLabel}</h1>
          <p>Hello ${clientName},</p>
          <p>Your payment for invoice <strong>${invoiceNumber}</strong> has been ${statusLabel.toLowerCase()}.</p>
          ${!isApproved && reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>You can view the latest status here:</p>
          <a href="${process.env.APP_URL || ''}/invoice/${invoiceNumber}" style="display: inline-block; padding: 10px 20px; background: ${color}; color: white; text-decoration: none; border-radius: 5px;">View Latest Status</a>
          <p>Thank you for your business!</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('[Email] Failed to send status update email:', error);
  }
}
