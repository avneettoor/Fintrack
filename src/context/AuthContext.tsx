import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { ensureUserProfile } from '../lib/fintrackService';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { UserProfile } from '../types/finance';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signingIn: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        await ensureUserProfile(firebaseUser);
        const profilePath = `users/${firebaseUser.uid}`;
        unsubscribeProfile = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snap) => {
            if (snap.exists()) {
              setProfile(snap.data() as UserProfile);
            }
            setLoading(false);
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, profilePath);
          }
        );
      } catch (err) {
        setAuthError(
          err instanceof Error
            ? err.message
            : 'Could not load your student profile. Please try signing in again.'
        );
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signInWithGoogle = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError('Google Sign-In was cancelled before completion.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError(
          'Your browser blocked the Google Sign-In popup. Please allow popups for this site and try again.'
        );
      } else {
        setAuthError(
          err instanceof Error ? err.message : 'Unable to sign in with Google right now.'
        );
      }
    } finally {
      setSigningIn(false);
    }
  };

  const logout = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signingIn,
        authError,
        signInWithGoogle,
        logout,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
