/**
 * Email Service
 * Handles sending emails for OTP verification and notifications
 */

import nodemailer from 'nodemailer';

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send OTP verification email
   * @param {string} email 
   * @param {string} otpCode 
   * @param {string} name 
   * @returns {Promise<Object>}
   */
  async sendOtpEmail(email, otpCode, name) {
    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'QuickCourt - Email Verification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification - QuickCourt</title>
        </head>
        <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">QuickCourt</h1>
              <p style="color: #666; margin-top: 5px;">Sports Facility Booking Platform</p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${name}!</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
              Welcome to QuickCourt! Please verify your email address to complete your registration.
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; text-align: center; margin: 25px 0;">
              <p style="color: #333; margin-bottom: 10px; font-weight: bold;">Your Verification Code:</p>
              <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; margin: 10px 0;">
                ${otpCode}
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 10px;">
                This code expires in 10 minutes
              </p>
            </div>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Enter this code in the QuickCourt app to verify your email address and start booking your favorite sports facilities!
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                If you didn't create a QuickCourt account, please ignore this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        QuickCourt - Email Verification
        
        Hi ${name}!
        
        Welcome to QuickCourt! Please verify your email address to complete your registration.
        
        Your verification code: ${otpCode}
        
        This code expires in 10 minutes.
        
        Enter this code in the QuickCourt app to verify your email address and start booking your favorite sports facilities!
        
        If you didn't create a QuickCourt account, please ignore this email.
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('OTP email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send password reset email
   * @param {string} email 
   * @param {string} otpCode 
   * @param {string} name 
   * @returns {Promise<Object>}
   */
  async sendPasswordResetEmail(email, otpCode, name) {
    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'QuickCourt - Password Reset',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - QuickCourt</title>
        </head>
        <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">QuickCourt</h1>
              <p style="color: #666; margin-top: 5px;">Sports Facility Booking Platform</p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${name}!</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
              We received a request to reset your QuickCourt account password.
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; text-align: center; margin: 25px 0;">
              <p style="color: #333; margin-bottom: 10px; font-weight: bold;">Your Password Reset Code:</p>
              <div style="font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 4px; margin: 10px 0;">
                ${otpCode}
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 10px;">
                This code expires in 10 minutes
              </p>
            </div>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Enter this code in the QuickCourt app to reset your password. If you didn't request a password reset, please ignore this email.
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                This is an automated message from QuickCourt. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        QuickCourt - Password Reset
        
        Hi ${name}!
        
        We received a request to reset your QuickCourt account password.
        
        Your password reset code: ${otpCode}
        
        This code expires in 10 minutes.
        
        Enter this code in the QuickCourt app to reset your password. If you didn't request a password reset, please ignore this email.
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Test email configuration
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('SMTP connection is working');
      return true;
    } catch (error) {
      console.error('SMTP connection failed:', error);
      return false;
    }
  }

  /**
   * Send booking confirmation email
   * @param {Object} booking - Booking details
   * @returns {Promise<Object>}
   */
  async sendBookingConfirmation(booking) {
    const { user, venue, court, date, startTime, endTime, totalAmount, bookingId } = booking;
    
    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: user.email,
      subject: `Booking Confirmed - ${venue.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">QuickCourt</h1>
              <p style="color: #666; margin-top: 5px;">Booking Confirmation</p>
            </div>
            
            <div style="background-color: #dcfce7; border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 25px;">
              <span style="color: #166534; font-size: 18px; font-weight: bold;">✓ Booking Confirmed!</span>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${user.name}!</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
              Your booking has been confirmed. Here are the details:
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Booking ID</td>
                  <td style="padding: 10px 0; color: #333; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">${bookingId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Venue</td>
                  <td style="padding: 10px 0; color: #333; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">${venue.name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Court</td>
                  <td style="padding: 10px 0; color: #333; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">${court.name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Date</td>
                  <td style="padding: 10px 0; color: #333; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">${new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Time</td>
                  <td style="padding: 10px 0; color: #333; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">${startTime} - ${endTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Amount Paid</td>
                  <td style="padding: 10px 0; color: #16a34a; font-weight: bold; text-align: right; font-size: 18px;">₹${parseFloat(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
              <p style="color: #1e40af; margin: 0; font-size: 14px;">
                <strong>📍 Venue Address:</strong><br>
                ${venue.address}, ${venue.city}
              </p>
            </div>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Please arrive 10 minutes before your scheduled time. Don't forget to bring appropriate footwear and equipment!
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                Need to cancel? You can do so from your dashboard up to 24 hours before the booking.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Booking confirmation email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send booking confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send booking cancellation email
   * @param {Object} booking - Booking details
   * @returns {Promise<Object>}
   */
  async sendBookingCancellation(booking) {
    const { user, venue, court, date, startTime, endTime, refundAmount, bookingId, reason } = booking;
    
    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: user.email,
      subject: `Booking Cancelled - ${venue.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">QuickCourt</h1>
              <p style="color: #666; margin-top: 5px;">Booking Cancellation</p>
            </div>
            
            <div style="background-color: #fef2f2; border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 25px;">
              <span style="color: #991b1b; font-size: 18px; font-weight: bold;">Booking Cancelled</span>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${user.name},</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
              Your booking has been cancelled. Here are the details:
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Booking ID</td>
                  <td style="padding: 10px 0; color: #333; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">${bookingId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Venue</td>
                  <td style="padding: 10px 0; color: #333; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">${venue.name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Court</td>
                  <td style="padding: 10px 0; color: #333; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">${court.name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Date</td>
                  <td style="padding: 10px 0; color: #333; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">${new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Time</td>
                  <td style="padding: 10px 0; color: #333; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">${startTime} - ${endTime}</td>
                </tr>
                ${reason ? `<tr>
                  <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Reason</td>
                  <td style="padding: 10px 0; color: #333; text-align: right; border-bottom: 1px solid #eee;">${reason}</td>
                </tr>` : ''}
                ${refundAmount ? `<tr>
                  <td style="padding: 10px 0; color: #666;">Refund Amount</td>
                  <td style="padding: 10px 0; color: #16a34a; font-weight: bold; text-align: right; font-size: 18px;">₹${refundAmount}</td>
                </tr>` : ''}
              </table>
            </div>
            
            ${refundAmount ? `
            <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
              <p style="color: #1e40af; margin: 0; font-size: 14px;">
                <strong>💰 Refund Information:</strong><br>
                Your refund of ₹${refundAmount} will be processed within 5-7 business days to your original payment method.
              </p>
            </div>
            ` : ''}
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              We're sorry to see you cancel. Feel free to book again whenever you're ready!
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                If you have any questions about your refund, please contact our support team.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Booking cancellation email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send booking reminder email (24 hours before)
   * @param {Object} booking - Booking details
   * @returns {Promise<Object>}
   */
  async sendBookingReminder(booking) {
    const { user, venue, court, date, startTime, endTime, bookingId } = booking;
    
    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: user.email,
      subject: `Reminder: Booking Tomorrow at ${venue.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">QuickCourt</h1>
              <p style="color: #666; margin-top: 5px;">Booking Reminder</p>
            </div>
            
            <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 25px;">
              <span style="color: #92400e; font-size: 18px; font-weight: bold;">⏰ Reminder: Your booking is tomorrow!</span>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${user.name}!</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
              Just a friendly reminder that you have a booking scheduled for tomorrow:
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Venue</td>
                  <td style="padding: 10px 0; color: #333; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">${venue.name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Court</td>
                  <td style="padding: 10px 0; color: #333; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">${court.name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; border-bottom: 1px solid #eee;">Date</td>
                  <td style="padding: 10px 0; color: #2563eb; font-weight: bold; text-align: right; border-bottom: 1px solid #eee;">${new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Time</td>
                  <td style="padding: 10px 0; color: #2563eb; font-weight: bold; text-align: right; font-size: 18px;">${startTime} - ${endTime}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
              <p style="color: #1e40af; margin: 0; font-size: 14px;">
                <strong>📍 Venue Address:</strong><br>
                ${venue.address}, ${venue.city}
              </p>
            </div>
            
            <div style="background-color: #f0fdf4; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
              <p style="color: #166534; margin: 0; font-size: 14px;">
                <strong>✅ Tips for your visit:</strong><br>
                • Arrive 10 minutes early<br>
                • Bring valid ID<br>
                • Wear appropriate sports gear<br>
                • Carry water and towel
              </p>
            </div>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Have a great game! 🏸🎾⚽
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                Booking ID: ${bookingId}
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Booking reminder email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send reminder email:', error);
      return { success: false, error: error.message };
    }
  }
}

export const mailService = new MailService();