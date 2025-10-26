import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig | null = null;

  async initialize(config: EmailConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true for 465, false for other ports
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });

    // Verify connection
    try {
      await this.transporter.verify();
      console.log('[email] SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('[email] SMTP connection failed:', error);
      return false;
    }
  }

  async sendEmail(to: string | string[], subject: string, html: string, text?: string) {
    if (!this.transporter || !this.config) {
      console.warn('[email] Email service not initialized, skipping email send');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.config.from,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      });

      console.log('[email] Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('[email] Failed to send email:', error);
      return false;
    }
  }

  async sendChangeApprovalNotification(
    to: string[],
    changeNumber: string,
    changeTitle: string,
    requester: string,
    changeId: string,
    customerName: string
  ) {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';

    const subject = `[Victrix Servicedesk] Change Approval Required: ${changeNumber}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2563eb;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px 20px;
            border: 1px solid #e5e7eb;
          }
          .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .details {
            background-color: white;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .details-row {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .details-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: 600;
            color: #6b7280;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">Change Approval Required</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>A new change request has been submitted and requires your approval.</p>
          
          <div class="details">
            <div class="details-row">
              <span class="label">Change Number:</span> ${changeNumber}
            </div>
            <div class="details-row">
              <span class="label">Title:</span> ${changeTitle}
            </div>
            <div class="details-row">
              <span class="label">Requested By:</span> ${requester}
            </div>
            <div class="details-row">
              <span class="label">Company:</span> ${customerName}
            </div>
          </div>

          <p style="text-align: center;">
            <a href="${baseUrl}/changes/${changeId}" class="button">Review Change Request</a>
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            Please review this change request and approve or reject it at your earliest convenience.
          </p>
        </div>
        <div class="footer">
          <p>This is an automated notification from Victrix Servicedesk Solution.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(to, subject, html);
  }

  async sendCIOwnerNotification(
    to: string,
    type: 'incident' | 'change',
    number: string,
    title: string,
    ciName: string,
    recordId: string
  ) {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';

    const typeLabel = type === 'incident' ? 'Incident' : 'Change';
    const subject = `[Victrix Servicedesk] ${typeLabel} Created for Your CI: ${ciName}`;
    const path = type === 'incident' ? 'tickets' : 'changes';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: ${type === 'incident' ? '#dc2626' : '#2563eb'};
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px 20px;
            border: 1px solid #e5e7eb;
          }
          .button {
            display: inline-block;
            background-color: ${type === 'incident' ? '#dc2626' : '#2563eb'};
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .details {
            background-color: white;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .details-row {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .details-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: 600;
            color: #6b7280;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">${typeLabel} Notification</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>A new ${type} has been created for a configuration item you own.</p>
          
          <div class="details">
            <div class="details-row">
              <span class="label">${typeLabel} Number:</span> ${number}
            </div>
            <div class="details-row">
              <span class="label">Title:</span> ${title}
            </div>
            <div class="details-row">
              <span class="label">Configuration Item:</span> ${ciName}
            </div>
          </div>

          <p style="text-align: center;">
            <a href="${baseUrl}/${path}/${recordId}" class="button">View ${typeLabel}</a>
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            As the owner of this configuration item, you are being notified of this ${type}.
          </p>
        </div>
        <div class="footer">
          <p>This is an automated notification from Victrix Servicedesk Solution.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(to, subject, html);
  }

  isConfigured(): boolean {
    return this.transporter !== null && this.config !== null;
  }
}

export const emailService = new EmailService();
