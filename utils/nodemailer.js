import nodemailer from 'nodemailer';

// Create reusable transporter object
const createTransporter = () => {
  // For production, use environment variables for SMTP configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } 
  
  // For development or if SMTP is not configured, use Ethereal (fake SMTP service)
  return new Promise(async (resolve, reject) => {
    try {
      // Generate test account
      const testAccount = await nodemailer.createTestAccount();
      
      // Create a test transporter
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      resolve({ transporter, testAccount });
    } catch (error) {
      reject(error);
    }
  });
};

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporterData = await createTransporter();
    
    // Determine if using ethereal or real transport
    const transporter = transporterData.transporter || transporterData;
    const isTestAccount = !!transporterData.testAccount;
    
    // Set email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Creative Minds" <noreply@creativeminds.com>',
      to,
      subject,
      html,
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    // If test account, return preview URL
    if (isTestAccount) {
      console.log('Test email sent. Preview URL: %s', nodemailer.getTestMessageUrl(info));
      return {
        success: true,
        previewUrl: nodemailer.getTestMessageUrl(info),
        messageId: info.messageId,
      };
    }
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const subject = 'Reset your Creative Minds password';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #3B82F6; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Creative Minds</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #1a1a1a; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #4b5563; line-height: 1.5;">Hello,</p>
        <p style="color: #4b5563; line-height: 1.5;">We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #4b5563; line-height: 1.5;">If you didn't request a password reset, you can safely ignore this email.</p>
        <p style="color: #4b5563; line-height: 1.5;">Thanks,<br>The Creative Minds Team</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser: <a href="${resetUrl}" style="color: #3B82F6; word-break: break-all;">${resetUrl}</a></p>
      </div>
    </div>
  `;
  
  return sendEmail({ to, subject, html });
}; 