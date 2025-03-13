
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isSignedIn: boolean;
  signIn: (userData: { email: string; username: string }) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsSignedIn(true);
    }
  }, []);

  const signIn = (userData: { email: string; username: string }) => {
    const newUser: User = {
      id: crypto.randomUUID(),
      fullName: userData.username,
      username: userData.username,
      email: userData.email
    };
    
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
    setIsSignedIn(true);
  };

  const signOut = () => {
    localStorage.removeItem("user");
    setUser(null);
    setIsSignedIn(false);
  };

  return (
    <AuthContext.Provider value={{ user, isSignedIn, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
