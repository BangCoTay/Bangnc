import { api } from './api';
import * as SecureStore from 'expo-secure-store';
import type { AuthResponse, RegisterRequest, LoginRequest, Profile } from '@ai-companions/shared';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    const result = response.data.data as AuthResponse;
    await this.saveTokens(result.access_token, result.refresh_token);
    return result;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    const result = response.data.data as AuthResponse;
    await this.saveTokens(result.access_token, result.refresh_token);
    return result;
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async getProfile(): Promise<Profile> {
    const response = await api.get('/user/profile');
    return response.data.data as Profile;
  },

  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
  },

  async hasToken(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('access_token');
    return !!token;
  },
};
