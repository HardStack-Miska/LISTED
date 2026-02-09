import {
  AuthChangeEvent,
  Session,
  User,
  AuthError,
} from '@supabase/supabase-js';
import { getSupabaseClient } from '../supabase';

const CONFIG_ERROR: AuthResult = {
  user: null,
  session: null,
  error: { message: 'Supabase not configured', name: 'ConfigError' } as AuthError,
};

const CONFIG_ERROR_ONLY = {
  error: { message: 'Supabase not configured', name: 'ConfigError' } as AuthError,
};

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

type AuthStateCallback = (event: AuthChangeEvent, session: Session | null) => void;

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    const client = getSupabaseClient();
    if (!client) {
      return CONFIG_ERROR;
    }

    const { data, error } = await client.auth.signUp({
      email,
      password,
    });

    return {
      user: data.user,
      session: data.session,
      error,
    };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const client = getSupabaseClient();
    if (!client) {
      return CONFIG_ERROR;
    }

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    return {
      user: data.user,
      session: data.session,
      error,
    };
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    const client = getSupabaseClient();
    if (!client) {
      return { error: null };
    }

    const { error } = await client.auth.signOut();
    return { error };
  }

  async getSession(): Promise<Session | null> {
    const client = getSupabaseClient();
    if (!client) {
      return null;
    }

    const { data } = await client.auth.getSession();
    return data.session;
  }

  async getUser(): Promise<User | null> {
    const client = getSupabaseClient();
    if (!client) {
      return null;
    }

    const { data } = await client.auth.getUser();
    return data.user;
  }

  onAuthStateChange(callback: AuthStateCallback): () => void {
    const client = getSupabaseClient();
    if (!client) {
      return () => {};
    }

    const { data } = client.auth.onAuthStateChange(callback);
    return () => data.subscription.unsubscribe();
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const client = getSupabaseClient();
    if (!client) {
      return CONFIG_ERROR_ONLY;
    }

    const { error } = await client.auth.resetPasswordForEmail(email);
    return { error };
  }

  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    const client = getSupabaseClient();
    if (!client) {
      return CONFIG_ERROR_ONLY;
    }

    const { error } = await client.auth.updateUser({
      password: newPassword,
    });

    return { error };
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }
}

export const authService = AuthService.getInstance();
