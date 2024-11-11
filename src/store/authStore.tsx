import { create } from 'zustand';
import { auth } from '../firebase';
import { User } from 'firebase/auth';  // Import the User type from Firebase Auth

interface AuthStore {
  user: User | null;  // Use User type from Firebase Auth
  setUser: (user: User | null) => void;
  initAuth: () => void;  // Add initAuth for setting up auth state listener
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  initAuth: () => {
    auth.onAuthStateChanged((user) => {
      set({ user });
    });
  },
}));

export default useAuthStore;
