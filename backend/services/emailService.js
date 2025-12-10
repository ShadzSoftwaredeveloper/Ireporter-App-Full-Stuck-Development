const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // Check if we're using SendGrid or SMTP
  if (process.env.EMAIL_SERVICE === 'sendgrid') {
    console.log('📧 Using SendGrid email service');
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else if (process.env.EMAIL_SERVICE === 'gmail') {
    console.log('📧 Using Gmail email service');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
      }
    });
  } else {
    // Default SMTP configuration; support both EMAIL_* and SMTP_* variables
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.mailtrap.io';
    const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 2525);
    const secure = String(process.env.EMAIL_SECURE || process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;

    console.log(`📧 Using SMTP email service: host=${host}, port=${port}, secure=${secure}, user=${user ? '***' : 'none'}`);

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined
    });
  }
};

// Send email to admin when incident is created
const sendIncidentCreatedEmail = async (admin, incident, createdBy) => {
  try {
    console.log(`📧 Preparing incident created email for admin: ${admin.email}`);
    const transporter = createTransporter();
    const incidentType = incident.type === 'red-flag' ? 'Red-flag' : 'Intervention';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@incidentreporting.com',
      to: admin.email,
      subject: `🚨 New ${incidentType} Incident Reported`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .incident-box { background: white; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 New Incident Alert</h1>
            </div>
            <div class="content">
              <p>Dear ${admin.name},</p>
              <p>A new ${incidentType.toLowerCase()} incident has been reported by <strong>${createdBy.name}</strong>.</p>
              
              <div class="incident-box">
                <h3>Incident Details</h3>
                <p><strong>Title:</strong> ${incident.title}</p>
                <p><strong>Type:</strong> ${incidentType}</p>
                <p><strong>Status:</strong> ${incident.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                <p><strong>Location:</strong> ${incident.location.address || `${incident.location.lat}, ${incident.location.lng}`}</p>
                <p><strong>Reported on:</strong> ${new Date(incident.createdAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}</p>
                
                <h4>Description:</h4>
                <p>${incident.description}</p>
              </div>

              <p>Please review this incident and take appropriate action.</p>
              
              <p>Best regards,<br>Incident Reporting System</p>
            </div>
            <div class="footer">
              <p>This is an automated message from the Incident Reporting System.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent to admin:', admin.email, '| Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email to admin:', admin.email, error);
    throw error;
  }
};

// Send email to user when status is updated
const sendStatusUpdateEmail = async (user, incident, oldStatus, newStatus) => {
  try {
    console.log(`📧 Preparing status update email for user: ${user.email} (${oldStatus} -> ${newStatus})`);
    const transporter = createTransporter();
    const statusText = newStatus.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const oldStatusText = oldStatus.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    let statusEmoji = '📊';
    let statusColor = '#3b82f6';
    if (newStatus === 'resolved') {
      statusEmoji = '✅';
      statusColor = '#22c55e';
    }
    if (newStatus === 'rejected') {
      statusEmoji = '❌';
      statusColor = '#ef4444';
    }
    if (newStatus === 'under-investigation') {
      statusEmoji = '🔍';
      statusColor = '#3b82f6';
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@incidentreporting.com',
      to: user.email,
      subject: `${statusEmoji} Incident Status Updated: ${incident.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .status-box { background: white; border-left: 4px solid ${statusColor}; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .status-badge { display: inline-block; padding: 8px 16px; background: ${statusColor}; color: white; border-radius: 20px; font-size: 14px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${statusEmoji} Status Update</h1>
            </div>
            <div class="content">
              <p>Dear ${user.name},</p>
              <p>Your incident report has been updated by an administrator.</p>
              
              <div class="status-box">
                <h3>${incident.title}</h3>
                <p><strong>Previous Status:</strong> ${oldStatusText}</p>
                <p><strong>New Status:</strong> <span class="status-badge">${statusText}</span></p>
                
                ${incident.adminComment ? `
                  <h4>Admin Comment:</h4>
                  <p>${incident.adminComment}</p>
                ` : ''}
                
                <p><strong>Last Updated:</strong> ${new Date(incident.updatedAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}</p>
              </div>

              <p>You can view the full incident details through your dashboard.</p>
              
              <p>Thank you for using our incident reporting system.</p>
              
              <p>Best regards,<br>Incident Reporting System</p>
            </div>
            <div class="footer">
              <p>This is an automated message from the Incident Reporting System.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent to user:', user.email, '| Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email to user:', user.email, error);
    throw error;
  }
};

// Test email configuration
const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return false;
  }
};

module.exports = {
  sendIncidentCreatedEmail,
  sendStatusUpdateEmail,
  testEmailConnection,
};

// Export createTransporter so other modules (otpEmail) can reuse the configured transporter
module.exports.createTransporter = createTransporter;