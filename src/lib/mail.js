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
}

export const mailService = new MailService();