import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AuthTokens, AuthUser, OTPRequest, OTPVerification, RegistrationData } from '../types/Auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.208:3001/api';
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  OTP_DATA: 'otp_data',
};

export class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private accessToken: string | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // OTP Request - Send OTP to phone/email
  async requestOTP(phone: string, email?: string, type: 'registration' | 'login' | 'password_reset' = 'registration'): Promise<{ success: boolean; message: string }> {
    try {
      const otpRequest: OTPRequest = {
        phone,
        email,
        type,
      };

      const response = await fetch(`${API_BASE_URL}/auth/otp/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(otpRequest),
      });

      const result = await response.json();

      if (response.ok) {
        // Store OTP data locally for verification
        await this.storeOTPData({
          phone,
          code: '', // Will be filled by user
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        });

        return {
          success: true,
          message: result.message || 'OTP sent successfully',
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to send OTP',
        };
      }
    } catch (error) {
      console.error('Error requesting OTP:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  // OTP Verification - Verify the OTP code
  async verifyOTP(phone: string, code: string): Promise<{ success: boolean; message: string; requiresRegistration?: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code }),
      });

      const result = await response.json();

      if (response.ok) {
        // Clear OTP data after successful verification
        await this.clearOTPData();

        if (result.requiresRegistration) {
          return {
            success: true,
            message: 'OTP verified successfully',
            requiresRegistration: true,
          };
        } else {
          // User exists, store tokens and user data
          await this.storeAuthData(result.user, result.tokens);
          this.currentUser = result.user;
          this.accessToken = result.tokens.accessToken;

          return {
            success: true,
            message: 'Login successful',
          };
        }
      } else {
        return {
          success: false,
          message: result.message || 'Invalid OTP code',
        };
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  // User Registration - Complete user registration
  async registerUser(registrationData: RegistrationData): Promise<{ success: boolean; message: string; user?: AuthUser }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();

      if (response.ok) {
        // Store user data and tokens
        await this.storeAuthData(result.user, result.tokens);
        this.currentUser = result.user;
        this.accessToken = result.tokens.accessToken;

        return {
          success: true,
          message: 'Registration successful',
          user: result.user,
        };
      } else {
        return {
          success: false,
          message: result.message || 'Registration failed',
        };
      }
    } catch (error) {
      console.error('Error registering user:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  // Company Code Verification - Verify company code and employee ID
  async verifyCompanyCode(companyCode: string, employeeId: string): Promise<{ success: boolean; message: string; company?: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/company/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyCode, employeeId }),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: 'Company code verified successfully',
          company: result.company,
        };
      } else {
        return {
          success: false,
          message: result.message || 'Invalid company code or employee ID',
        };
      }
    } catch (error) {
      console.error('Error verifying company code:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (userData) {
        this.currentUser = JSON.parse(userData);
        return this.currentUser;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }

    return null;
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      return !!accessToken;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      // Clear all stored data
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.OTP_DATA,
      ]);

      // Clear secure storage
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

      // Clear in-memory data
      this.currentUser = null;
      this.accessToken = null;
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  // Private helper methods
  private async storeAuthData(user: AuthUser, tokens: AuthTokens): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }

  private async storeOTPData(otpData: OTPVerification): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OTP_DATA, JSON.stringify(otpData));
    } catch (error) {
      console.error('Error storing OTP data:', error);
    }
  }

  private async clearOTPData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.OTP_DATA);
    } catch (error) {
      console.error('Error clearing OTP data:', error);
    }
  }

  // Get stored OTP data
  async getStoredOTPData(): Promise<OTPVerification | null> {
    try {
      const otpData = await AsyncStorage.getItem(STORAGE_KEYS.OTP_DATA);
      if (otpData) {
        const parsed = JSON.parse(otpData);
        // Check if OTP is still valid (not expired)
        if (new Date(parsed.expiresAt) > new Date()) {
          return parsed;
        } else {
          // OTP expired, clear it
          await this.clearOTPData();
        }
      }
    } catch (error) {
      console.error('Error getting stored OTP data:', error);
    }
    return null;
  }
}
