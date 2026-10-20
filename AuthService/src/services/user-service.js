const UserRepository = require('../repository/user-repo');
const sendOTPEmail = require('../utils/send-email');
const jwt = require('jsonwebtoken');
const ClientError = require('../utils/client-error');
const { StatusCodes } = require('http-status-codes');

const { JWT_KEY } = require('../config/serverConfig');
const bcrypt = require('bcrypt');

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async createUser(data) {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      const user = await this.userRepository.create({
        ...data,
        otp,
        otpExpiry,
        isVerified: false
      });

      try {
        await sendOTPEmail(user.email, otp);
      } catch (emailError) {
        console.log('EMAIL SENDING FAILED:', emailError.message);
      }

      return user;
    } catch (error) {
      console.log('Something went wrong in the service layer');
      throw error;
    }
  }

  createToken(user) {
    try {
      const result = jwt.sign(user, JWT_KEY, { expiresIn: '1d' });
      return result;
    } catch (error) {
      console.log('Something went wrong while creating token');
      throw error;
    }
  }

  checkPassword(userinputPlainPassword, encryptedPassword) {
    try {
      const isMatch = bcrypt.compareSync(userinputPlainPassword, encryptedPassword);
      return isMatch;
    } catch (error) {
      console.log('Something went wrong while checking password');
      throw error;
    }
  }

  async signIn(email, plainPassword) {
    try {
      const user = await this.userRepository.getByEmail(email);

      if (!user.isVerified) {
        throw new ClientError(
          'NotVerified',
          'Email not verified',
          'Please verify your email before logging in',
          StatusCodes.UNAUTHORIZED
        );
      }

      const isPasswordMatch = this.checkPassword(plainPassword, user.password);
      if (!isPasswordMatch) {
        throw new ClientError(
          'InvalidCredentials',
          'Invalid credentials',
          'The password entered is incorrect',
          StatusCodes.UNAUTHORIZED
        );
      }

      const userWithRoles = await this.userRepository.getUserWithRoles(user.id);
      const roleNames = userWithRoles.Roles ? userWithRoles.Roles.map(role => role.name) : [];

      const NewJWT = this.createToken({ email: user.email, id: user.id, roles: roleNames });
      return NewJWT;
    } 
    catch (error) {
      console.log('Something went wrong while signing in');
      throw error;
    }
  }

  verifyToken(token) {
    try {
      const result = jwt.verify(token, JWT_KEY);
      return result;
    }       
    catch (error) {
      console.log('Something went wrong while verifying token');
      throw error;
    }
  }

  async verifyOTP(email, enteredOtp) {
    try {
      const user = await this.userRepository.getByEmail(email);

      if (user.isVerified) {
        throw new ClientError(
          'AlreadyVerified',
          'User already verified',
          'This email has already been verified',
          StatusCodes.BAD_REQUEST
        );
      }

      const storedOTP = String(user.otp).trim();
      const receivedOTP = String(enteredOtp).trim();

      if (storedOTP !== receivedOTP) {
        throw new ClientError(
          'InvalidOTP',
          'Invalid OTP',
          'The OTP entered does not match',
          StatusCodes.BAD_REQUEST
        );
      }

      if (new Date() > user.otpExpiry) {
        throw new ClientError(
          'OTPExpired',
          'OTP expired',
          'The OTP has expired, please request a new one',
          StatusCodes.BAD_REQUEST
        );
      }

      user.isVerified = true;
      user.otp = null;
      user.otpExpiry = null;
      await user.save();

      return user;
    } catch (error) {
      console.log('Something went wrong while verifying OTP');
      throw error;
    }
  }

  async assignRole(userId, roleId) {
    try {
      const user = await this.userRepository.addRoleToUser(userId, roleId);
      return user;
    } catch (error) {
      console.log('Something went wrong while assigning role');
      throw error;
    }
  }
}

module.exports = UserService;