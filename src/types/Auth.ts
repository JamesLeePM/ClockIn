export interface AuthUser {
  id: string;
  phone: string;
  email?: string;
  name: string;
  employeeId?: string;
  companyId?: string;
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface OTPRequest {
  phone: string;
  email?: string;
  type: 'registration' | 'login' | 'password_reset';
}

export interface OTPVerification {
  phone: string;
  code: string;
  expiresAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
  isNewUser: boolean;
  requiresCompanyCode?: boolean;
}

export interface CompanyCodeVerification {
  companyCode: string;
  employeeId: string;
  position?: string;
  department?: string;
  hourlyRate?: number;
}

export interface RegistrationData {
  phone: string;
  name: string;
  email?: string;
  companyCode?: string;
  employeeId?: string;
  position?: string;
  department?: string;
}
