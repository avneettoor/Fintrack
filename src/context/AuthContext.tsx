import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { deleteAllUserAccountData, ensureUserProfile } from '../lib/fintrackService';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { AgeGroup, UserProfile } from '../types/finance';

interface PendingSignupMeta {
  displayName: string;
  campusName: string;
  ageGroup: AgeGroup;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signingIn: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (input: {
    fullName: string;
    email: string;
    password: string;
    campusName: string;
    ageGroup: AgeGroup;
  }) => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  sendResetPasswordEmail: (email: string) => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  refreshUserSession: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google Sign-In was cancelled before completion.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Popup blocked by browser. Please allow popups for this site and try again.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method → Email/Password). Use "Continue with Google" for instant access, or enable Email/Password in your Firebase Console.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Please log in instead.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (code === 'auth/weak-password') {
    return 'Password should be at least 6 characters long.';
  }
  if (code === 'auth/requires-recent-login') {
    return 'For your security, please sign out and sign back in before completing this action.';
  }
  return err instanceof Error ? err.message : 'Authentication error. Please try again.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingMeta, setPendingMeta] = useState<PendingSignupMeta | null>(null);

  useEffect(() => {
    const isDark = profile?.theme === 'dark';
    document.documentElement.classList.toggle('dark', Boolean(isDark));
  }, [profile?.theme]);

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

      if (!firebaseUser.emailVerified) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        await ensureUserProfile(firebaseUser, pendingMeta || undefined);
        if (pendingMeta) setPendingMeta(null);

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
            : 'Unable to load your FinTrack Campus profile. Please retry.'
        );
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [pendingMeta]);

  const signInWithGoogle = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err));
    } finally {
      setSigningIn(false);
    }
  };

  const signUpWithEmail = async (input: {
    fullName: string;
    email: string;
    password: string;
    campusName: string;
    ageGroup: AgeGroup;
  }): Promise<boolean> => {
    setSigningIn(true);
    setAuthError(null);
    try {
      setPendingMeta({
        displayName: input.fullName,
        campusName: input.campusName,
        ageGroup: input.ageGroup,
      });
      const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
      await updateProfile(cred.user, { displayName: input.fullName.trim() });
      await sendEmailVerification(cred.user);
      return true;
    } catch (err) {
      setPendingMeta(null);
      setAuthError(mapFirebaseAuthError(err));
      return false;
    } finally {
      setSigningIn(false);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return true;
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err));
      return false;
    } finally {
      setSigningIn(false);
    }
  };

  const sendResetPasswordEmail = async (email: string): Promise<boolean> => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err));
      return false;
    } finally {
      setSigningIn(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
  };

  const refreshUserSession = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    const refreshed = auth.currentUser;
    setUser(refreshed ? ({ ...refreshed } as User) : null);
    if (refreshed?.emailVerified) {
      await ensureUserProfile(refreshed, pendingMeta || undefined);
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!auth.currentUser) return;
    await updatePassword(auth.currentUser, newPassword);
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    await deleteAllUserAccountData(uid);
    await deleteUser(auth.currentUser);
  };

  const logout = async () => {
    setAuthError(null);
    document.documentElement.classList.remove('dark');
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
        signUpWithEmail,
        signInWithEmail,
        sendResetPasswordEmail,
        resendVerificationEmail,
        refreshUserSession,
        changePassword,
        deleteAccount,
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
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
