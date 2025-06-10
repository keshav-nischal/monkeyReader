import React, { useContext, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  LoginForm, 
  SignUpForm, 
  EmailVerificationForm, 
  ForgotPasswordForm 
} from '@/components/authentication/forms';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { AuthContext } from '@/context/authContext';

const LeftSection = () => (
  <div className="hidden md:flex w-full h-full flex-col justify-between bg-muted p-8">
    <div className="">
      <Logo></Logo>
    </div>
    <div>
      <blockquote className="space-y-2">
        <p className="text-lg">
          "We cannot solve our problems with the same thinking we used when we created them."
        </p>
        <footer className="text-sm">Albert Einstein</footer>
      </blockquote>
    </div>
  </div>
);

interface RightSectionProps {
  authMode: 'login' | 'signup' | 'emailVerification' | 'forgotPassword';
  toggleAuthMode: () => void;
  handleSignupSuccess: () => void;
  handleVerificationSent: () => void;
  startForgotPassword: () => void;
  handleResetSent: () => void;
  infoMessage: string;
}

const RightSection: React.FC<RightSectionProps> = ({
  authMode,
  toggleAuthMode,
  handleSignupSuccess,
  handleVerificationSent,
  startForgotPassword,
  handleResetSent,
  infoMessage,
}) => (
  <div className="flex items-center justify-center w-full h-full relative">
    {authMode !== 'emailVerification' && (
      <Button
        className="absolute right-4 top-4 md:right-8 md:top-8"
        onClick={toggleAuthMode}
        variant="outline"
      >
        {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
      </Button>
    )}
    
    {authMode === 'forgotPassword' && (
      <Button
        className="absolute left-4 top-4 md:left-8 md:top-8"
        onClick={() => window.history.back()}
        variant="ghost"
      >
        ← Back
      </Button>
    )}

    <div className="flex flex-col items-center justify-center h-full w-3/5 text-center">
      {authMode === 'login' && (
        <>
          <h3 className="text-2xl font-medium my-4">Sign in to your account</h3>
          <LoginForm startForgotPassword={startForgotPassword} infoMessage={infoMessage} />
        </>
      )}
      
      {authMode === 'signup' && (
        <>
          <h3 className="text-2xl font-medium my-4">Create an account</h3>
          <SignUpForm handleSignupSuccess={handleSignupSuccess} />
        </>
      )}
      
      {authMode === 'emailVerification' && (
        <EmailVerificationForm onVerificationSent={handleVerificationSent} />
      )}
      
      {authMode === 'forgotPassword' && (
        <ForgotPasswordForm onResetSent={handleResetSent} />
      )}
    </div>
  </div>
);

const Authentication = () => {
  const [authMode, setAuthMode] = useState<
    'login' | 'signup' | 'emailVerification' | 'forgotPassword'
  >('login');
  
  const [infoMessage, setInfoMessage] = useState('');

  const toggleAuthMode = () => {
    setAuthMode((prevMode) => (prevMode === 'login' ? 'signup' : 'login'));
    setInfoMessage(''); // Clear any info messages when switching modes
  };

  // Handle successful signup - show email verification form
  const handleSignupSuccess = () => {
    setAuthMode('emailVerification');
    setInfoMessage('Account created successfully! Please verify your email.');
  };

  // Handle verification email sent
  const handleVerificationSent = () => {
    setInfoMessage('Verification email sent! Please check your inbox and verify your email before signing in.');
    setAuthMode('login');
  };

  // Start forgot password process
  const startForgotPassword = () => {
    setAuthMode('forgotPassword');
    setInfoMessage('');
  };

  // Handle password reset email sent
  const handleResetSent = () => {
    setInfoMessage('Password reset email sent! Please check your inbox and follow the instructions to reset your password.');
    setAuthMode('login');
  };

  return (
    <div className="flex w-screen h-screen">
       
    {/* <Button onClick={clickHandler}>check</Button> */}
      <LeftSection />
      <RightSection
        authMode={authMode}
        toggleAuthMode={toggleAuthMode}
        handleSignupSuccess={handleSignupSuccess}
        handleVerificationSent={handleVerificationSent}
        startForgotPassword={startForgotPassword}
        handleResetSent={handleResetSent}
        infoMessage={infoMessage}
      />
    </div>
  );
};

export default Authentication;