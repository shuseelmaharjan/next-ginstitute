import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}

const useAuthStore = create<AuthState>((set: (arg0: { accessToken: any; }) => any) => ({
  accessToken: null,
  setAccessToken: (token: any) => set({ accessToken: token }),
}));

export default useAuthStore;
