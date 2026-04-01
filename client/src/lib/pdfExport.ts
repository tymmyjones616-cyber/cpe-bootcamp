import html2pdf from "html2pdf.js";

interface InvoiceData {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  description: string;
  amountUsd: string;
  dueDate: Date;
  createdAt: Date;
  qrCodeUrl?: string;
  walletAddress?: string;
  network?: string;
  exchange?: string;
  paymentInstructions?: string;
}

export async function generateInvoicePDF(invoice: InvoiceData) {
  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #1C1C1E;
          line-height: 1.6;
        }
        
        .container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          background: white;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          border-bottom: 2px solid #0A84FF;
          padding-bottom: 20px;
        }
        
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #0A84FF;
        }
        
        .invoice-title {
          text-align: right;
        }
        
        .invoice-title h1 {
          font-size: 32px;
          font-weight: bold;
          color: #1C1C1E;
          margin-bottom: 5px;
        }
        
        .invoice-number {
          font-family: monospace;
          color: #6C6C6E;
          font-size: 14px;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #6C6C6E;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }
        
        .section-content {
          font-size: 14px;
          color: #1C1C1E;
          line-height: 1.8;
        }
        
        .two-column {
          display: flex;
          gap: 40px;
          margin-bottom: 30px;
        }
        
        .column {
          flex: 1;
        }
        
        .amount-box {
          background: #F2F2F7;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #0A84FF;
        }
        
        .amount-label {
          font-size: 12px;
          color: #6C6C6E;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        
        .amount-value {
          font-size: 40px;
          font-weight: bold;
          color: #1C1C1E;
        }
        
        .payment-section {
          background: #F9F9FB;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .payment-method {
          display: flex;
          gap: 20px;
          align-items: center;
        }
        
        .qr-code {
          width: 120px;
          height: 120px;
          border: 1px solid #E5E5EA;
          border-radius: 4px;
        }
        
        .payment-details {
          flex: 1;
        }
        
        .payment-details-label {
          font-size: 12px;
          color: #6C6C6E;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        
        .wallet-address {
          font-family: monospace;
          font-size: 12px;
          color: #1C1C1E;
          word-break: break-all;
          background: white;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #E5E5EA;
          margin-bottom: 10px;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #E5E5EA;
          font-size: 12px;
          color: #6C6C6E;
          text-align: center;
        }
        
        .due-date {
          color: #FF3B30;
          font-weight: 600;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        th {
          background: #F2F2F7;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6C6C6E;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #E5E5EA;
        }
        
        td {
          padding: 12px;
          border-bottom: 1px solid #E5E5EA;
          font-size: 14px;
        }
        
        .total-row td {
          font-weight: 600;
          background: #F9F9FB;
          border-top: 2px solid #0A84FF;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo">CPE Online Academy</div>
          <div class="invoice-title">
            <h1>INVOICE</h1>
            <div class="invoice-number">${invoice.invoiceNumber}</div>
          </div>
        </div>
        
        <!-- Dates -->
        <div class="two-column">
          <div class="column">
            <div class="section">
              <div class="section-title">Bill To</div>
              <div class="section-content">
                <strong>${invoice.clientName}</strong><br>
                ${invoice.clientEmail}
              </div>
            </div>
          </div>
          <div class="column">
            <div class="section">
              <div class="section-title">Invoice Details</div>
              <div class="section-content">
                <strong>Invoice Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}<br>
                <strong>Due Date:</strong> <span class="due-date">${new Date(invoice.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Amount -->
        <div class="amount-box">
          <div class="amount-label">Amount Due</div>
          <div class="amount-value">$${invoice.amountUsd}</div>
        </div>
        
        <!-- Line Items -->
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.description}</td>
              <td style="text-align: right;">$${invoice.amountUsd}</td>
            </tr>
            <tr class="total-row">
              <td>TOTAL DUE</td>
              <td style="text-align: right;">$${invoice.amountUsd}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- Payment Instructions -->
        ${invoice.paymentInstructions ? `
        <div class="section">
          <div class="section-title">Payment Instructions</div>
          <div class="section-content" style="white-space: pre-wrap;">
            ${invoice.paymentInstructions}
          </div>
        </div>
        ` : ''}
        
        <!-- Payment Method -->
        ${invoice.qrCodeUrl ? `
        <div class="payment-section">
          <div class="section-title">Payment Method</div>
          <div class="payment-method">
            <img src="${invoice.qrCodeUrl}" alt="QR Code" class="qr-code">
            <div class="payment-details">
              <div class="payment-details-label">Network</div>
              <div style="font-size: 16px; font-weight: 600; margin-bottom: 15px;">${invoice.network?.toUpperCase() || 'CRYPTOCURRENCY'}</div>
              
              ${invoice.exchange ? `
              <div class="payment-details-label">Exchange</div>
              <div style="font-size: 14px; margin-bottom: 15px;">${invoice.exchange.charAt(0).toUpperCase() + invoice.exchange.slice(1)}</div>
              ` : ''}
              
              ${invoice.walletAddress ? `
              <div class="payment-details-label">Wallet Address</div>
              <div class="wallet-address">${invoice.walletAddress}</div>
              ` : ''}
            </div>
          </div>
        </div>
        ` : ''}
        
        <!-- Footer -->
        <div class="footer">
          <p>Thank you for your business. Please contact us if you have any questions about this invoice.</p>
          <p style="margin-top: 10px;">CPE Online Academy | cpeonlineacademymanagement@gmail.com | +1 (407) 676-4098</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // PDF options
  const options: any = {
    margin: 0,
    filename: `${invoice.invoiceNumber}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
  };

  // Generate PDF
  html2pdf().set(options).from(htmlContent).save();
}
