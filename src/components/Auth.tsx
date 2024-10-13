// src/components/Auth.tsx
import React from 'react';
import useAuthStore from '../store/authStore';
import { signInWithGoogle, logOut } from '../firebase';

const Auth: React.FC = () => {
  const { user, setUser } = useAuthStore();

  const handleSignIn = async () => {
    try {
      const signedInUser = await signInWithGoogle();
      setUser(signedInUser);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.displayName}</p>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <button onClick={handleSignIn}>Sign in with Google</button>
      )}
    </div>
  );
};

export default Auth;
