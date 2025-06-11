import type { User as FirebaseUser } from 'firebase/auth';

export type SubscriptionPlan = 'free' | 'basic' | 'professional' | 'enterprise';

export interface User extends FirebaseUser {
  subscriptionPlan: SubscriptionPlan;
  monthlyQrCount: number;
  lastQrResetDate: string; // ISO date string
}

export interface UserProfile {
  id: string;
  email: string;
  subscriptionPlan: SubscriptionPlan;
  monthlyQrCount: number;
  lastQrResetDate: string;
  createdAt: string;
  updatedAt: string;
} 