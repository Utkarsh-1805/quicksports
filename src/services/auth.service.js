/**
 * Authentication Service
 * Handles user registration, login, OTP generation/verification
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export class AuthService {
  
  /**
   * Register a new user
   * @param {Object} userData - { email, password, name, phone, role }
   * @returns {Promise<Object>} - Created user data (without password)
   */
  async registerUser(userData) {
    const { email, password, name, phone, role = 'USER' } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        phone: phone?.trim() || null,
        role: role
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true
      }
    });

    return user;
  }

  /**
   * Login user
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} - { user, accessToken }
   */
  async loginUser(email, password) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new Error('Please verify your email first');
    }

    // Generate JWT
    const accessToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      accessToken
    };
  }

  /**
   * Generate and send OTP
   * @param {string} email 
   * @param {string} type - 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'
   * @returns {Promise<Object>} - { success: boolean, expiresAt: Date }
   */
  async generateOtp(email, type = 'EMAIL_VERIFICATION') {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Calculate expiry time
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    // Delete any existing unused OTPs
    await prisma.otp.deleteMany({
      where: {
        userId: user.id,
        type,
        isUsed: false
      }
    });

    // Create new OTP
    const otp = await prisma.otp.create({
      data: {
        code: otpCode,
        type,
        expiresAt,
        userId: user.id
      }
    });

    return {
      success: true,
      otpCode, // In production, don't return this - send via email
      expiresAt: otp.expiresAt
    };
  }

  /**
   * Verify OTP
   * @param {string} email 
   * @param {string} code 
   * @param {string} type 
   * @returns {Promise<Object>} - { success: boolean, user? }
   */
  async verifyOtp(email, code, type = 'EMAIL_VERIFICATION') {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Find valid OTP
    const otp = await prisma.otp.findFirst({
      where: {
        userId: user.id,
        code,
        type,
        isUsed: false,
        expiresAt: {
          gte: new Date()
        }
      }
    });

    if (!otp) {
      throw new Error('Invalid or expired OTP');
    }

    // Mark OTP as used
    await prisma.otp.update({
      where: { id: otp.id },
      data: { isUsed: true }
    });

    // If email verification, mark user as verified
    if (type === 'EMAIL_VERIFICATION') {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword
    };
  }

  /**
   * Verify JWT token
   * @param {string} token 
   * @returns {Promise<Object>} - Decoded token payload
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Optional: Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isVerified: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return { ...decoded, user };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   * @param {string} userId 
   * @returns {Promise<Object>} - User data
   */
  async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}