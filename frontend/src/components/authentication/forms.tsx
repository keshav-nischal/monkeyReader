import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useContext, useState } from 'react';
import { AuthContext } from '@/context/authContext';

interface LoginFormProps {
  startForgotPassword: () => void;
  infoMessage?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ startForgotPassword, infoMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('LoginForm mus  t be used within an AuthProvider');
  }

  const { login, error, loading } = authContext;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      // Error is handled by context
    }
  };

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      {infoMessage && <p className="text-sm text-green-500 mb-2">{infoMessage}</p>}
      <Input
        type="email"
        placeholder="name@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-2"
        required
      />
      <Input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-1"
        required
      />
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      <p className="text-sm text-muted mb-4">
        Forgot your password?{' '}
        <span className="underline cursor-pointer" onClick={startForgotPassword}>
          Reset Password
        </span>
      </p>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing In...' : 'Sign In With Email'}
      </Button>
    </form>
  );
};

interface SignUpFormProps {
  handleSignupSuccess: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ handleSignupSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('SignUpForm must be used within an AuthProvider');
  }

  const { signup, error, loading } = authContext;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      authContext.handleError('Passwords do not match');
      return;
    }

    try {
      await signup(email, password);
      handleSignupSuccess();
    } catch (error) {
      // Error is handled by context
    }
  };

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      <Input
        type="email"
        placeholder="name@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-2"
        required
      />
      <Input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-2"
        required
      />
      <Input
        type="password"
        placeholder="confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="mb-4"
        required
      />
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating Account...' : 'Sign Up With Email'}
      </Button>
    </form>
  );
};

// Email Verification Component (for users who need to verify their email)
interface EmailVerificationProps {
  onVerificationSent: () => void;
}

export const EmailVerificationForm: React.FC<EmailVerificationProps> = ({ onVerificationSent }) => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('EmailVerificationForm must be used within an AuthProvider');
  }

  const { user, verifyEmail, error, loading } = authContext;

  const handleResendVerification = async () => {
    try {
      await verifyEmail();
      onVerificationSent();
    } catch (error) {
      // Error handled by context
    }
  };

  if (!user) {
    return <div>Please sign in to verify your email.</div>;
  }

  return (
    <div className="w-full flex flex-col items-center">
      <h3 className="text-2xl font-medium my-4">Verify Your Email</h3>
      <p className="mb-4 text-center">
        We've sent a verification email to <strong>{user.email}</strong>. 
        Please check your inbox and click the verification link.
      </p>
      <p className="mb-4 text-sm text-muted text-center">
        Didn't receive the email? Check your spam folder or click below to resend.
      </p>
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      <Button 
        onClick={handleResendVerification} 
        className="w-full" 
        disabled={loading}
        variant="outline"
      >
        {loading ? 'Sending...' : 'Resend Verification Email'}
      </Button>
    </div>
  );
};

interface ForgotPasswordFormProps {
  onResetSent: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onResetSent }) => {
  const [email, setEmail] = useState('');
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('ForgotPasswordForm must be used within an AuthProvider');
  }

  const { forgotPassword, error, loading } = authContext;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await forgotPassword(email);
      onResetSent();
    } catch (error) {
      // Error handled by context
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <h3 className="text-2xl font-medium my-4">Reset Password</h3>
      <p className="mb-4 text-center">
        Enter your email address and we'll send you a link to reset your password.
      </p>
      <form onSubmit={handleSubmit} className="w-full">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className="w-full mb-4"
          required
        />
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending Reset Email...' : 'Send Reset Email'}
        </Button>
      </form>
    </div>
  );
};

// Password Reset Confirmation (for when user clicks the reset link from email)
interface ResetPasswordConfirmProps {
  oobCode: string; // This comes from the URL when user clicks the reset link
  onPasswordReset: () => void;
}

export const ResetPasswordConfirmForm: React.FC<ResetPasswordConfirmProps> = ({ 
  oobCode, 
  onPasswordReset 
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('ResetPasswordConfirmForm must be used within an AuthProvider');
  }

  const { confirmForgotPassword, error, loading } = authContext;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      authContext.handleError('Passwords do not match');
      return;
    }

    try {
      await confirmForgotPassword(oobCode, newPassword);
      onPasswordReset();
    } catch (error) {
      // Error handled by context
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <h3 className="text-2xl font-medium my-4">Set New Password</h3>
      <p className="mb-4 text-center">Enter your new password below.</p>
      <form onSubmit={handleSubmit} className="w-full">
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New Password"
          className="w-full mb-2"
          required
        />
        <Input
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          placeholder="Confirm New Password"
          className="w-full mb-4"
          required
        />
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Updating Password...' : 'Update Password'}
        </Button>
      </form>
    </div>
  );
};

// Change Password Form (for authenticated users)
interface ChangePasswordFormProps {
  onPasswordChanged: () => void;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onPasswordChanged }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('ChangePasswordForm must be used within an AuthProvider');
  }

  const { updateUserPassword, error, loading } = authContext;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      authContext.handleError('New passwords do not match');
      return;
    }

    try {
      await updateUserPassword(currentPassword, newPassword);
      onPasswordChanged();
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      // Error handled by context
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <h3 className="text-2xl font-medium my-4">Change Password</h3>
      <form onSubmit={handleSubmit} className="w-full">
        <Input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current Password"
          className="w-full mb-2"
          required
        />
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New Password"
          className="w-full mb-2"
          required
        />
        <Input
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          placeholder="Confirm New Password"
          className="w-full mb-4"
          required
        />
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Updating Password...' : 'Update Password'}
        </Button>
      </form>
    </div>
  );
};