import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  type Auth,
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  sendEmailVerification,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { auth } from "@/firebase/config"; // You'll need to create this file

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  handleError: (error: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (oobCode: string, newPassword: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  handleError: () => {},
  login: async () => {},
  logout: async () => {},
  signup: async () => {},
  verifyEmail: async () => {},
  forgotPassword: async () => {},
  confirmForgotPassword: async () => {},
  updateUserPassword: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleError = (error: unknown) => {
    let message = "An unexpected error occurred";
    
    if (error instanceof Error) {
      // Handle Firebase specific errors
      switch (error.message) {
        case 'auth/user-not-found':
          message = "No user found with this email address";
          break;
        case 'auth/wrong-password':
          message = "Incorrect password";
          break;
        case 'auth/email-already-in-use':
          message = "An account with this email already exists";
          break;
        case 'auth/weak-password':
          message = "Password should be at least 6 characters";
          break;
        case 'auth/invalid-email':
          message = "Invalid email address";
          break;
        case 'auth/too-many-requests':
          message = "Too many failed attempts. Please try again later";
          break;
        default:
          message = error.message;
      }
    }
    
    setError(message);
    throw new Error(message);
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    console.log("clicking login")
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      navigate("/home");
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      
      // Automatically send email verification
      await sendEmailVerification(userCredential.user);
      
      // Optional: You might want to navigate to a verification page instead
      // navigate("/verify-email");
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async () => {
    if (!user) {
      throw new Error("No user logged in");
    }
    
    setLoading(true);
    setError(null);
    try {
      await sendEmailVerification(user);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const confirmForgotPassword = async (oobCode: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) {
      throw new Error("No user logged in");
    }

    setLoading(true);
    setError(null);
    try {
      // Re-authenticate user before updating password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      navigate("/auth");
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user?true:false,
        loading,
        error,
        handleError,
        login,
        logout,
        signup,
        verifyEmail,
        forgotPassword,
        confirmForgotPassword,
        updateUserPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};