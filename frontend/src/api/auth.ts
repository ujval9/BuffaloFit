// api/auth.ts
import axios from 'axios';
import { User } from '../types';

const BASE = `${process.env.REACT_APP_API_URL}/api/auth`;

/** Demo-friendly: find or create an account by username only */
export const usernameLogin = async (username: string): Promise<User> => {
  const { data } = await axios.post(`${BASE}/username-login`, { username });
  return data;
};

export const signup = async (email: string, name: string, password: string): Promise<User> => {
  const { data } = await axios.post(`${BASE}/signup`, { email, name, password });
  return data;
};

export const login = async (email: string, password: string): Promise<User> => {
  const { data } = await axios.post(`${BASE}/login`, { email, password });
  return data;
};

export const completeOnboarding = async (userId: number): Promise<User> => {
  const { data } = await axios.patch(`${BASE}/onboarding/${userId}`);
  return data;
};

export const getStoredUser = (): User | null => {
  try {
    const json = localStorage.getItem('buffaloffit_user');
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
};

export const storeUser = (user: User): void => {
  localStorage.setItem('buffaloffit_user', JSON.stringify(user));
};

export const removeUser = (): void => {
  localStorage.removeItem('buffaloffit_user');
};
