import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { authService } from "@/services/auth";
import { supabaseService } from "@/services/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isConfigured = supabaseService.isConfigured();

  useEffect(() => {
    // Don't auto-initialize Supabase - let app work offline first
    // Auth will be initialized when user explicitly tries to sign in
    setIsLoading(false);

    if (!isConfigured) {
      return;
    }

    // Only set up auth listener if Supabase is configured
    supabaseService.initialize();

    const loadSession = async () => {
      try {
        const currentSession = await authService.getSession();
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user ?? null);
        }
      } catch (error) {
        // Silent fail - user can use app without auth
        console.log("No active session");
      }
    };

    loadSession();

    const unsubscribe = authService.onAuthStateChange((event, newSession) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED"
      ) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    });

    return unsubscribe;
  }, [isConfigured]);

  const signIn = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ error: string | null }> => {
      const result = await authService.signIn(email, password);
      if (result.error) {
        return { error: result.error.message };
      }
      return { error: null };
    },
    [],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ error: string | null }> => {
      const result = await authService.signUp(email, password);
      if (result.error) {
        return { error: result.error.message };
      }
      return { error: null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const resetPassword = useCallback(
    async (email: string): Promise<{ error: string | null }> => {
      const result = await authService.resetPassword(email);
      if (result.error) {
        return { error: result.error.message };
      }
      return { error: null };
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        isConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
