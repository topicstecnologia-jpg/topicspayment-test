export type Role = "admin" | "member" | "guest";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  role: Role;
  isEmailVerified: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  email: string;
  requiresVerification: boolean;
  verificationCode?: string;
  expiresInMinutes?: number;
}

export interface MeResponse {
  user: User;
}

export interface ForgotPasswordResponse {
  message: string;
  resetUrl?: string;
  resetToken?: string;
  expiresInMinutes?: number;
}

export interface VerificationCodeResponse {
  message: string;
  verificationCode?: string;
  expiresInMinutes?: number;
}

export interface AdminOverview {
  totalUsers: number;
  admins: number;
  members: number;
  guests: number;
}
