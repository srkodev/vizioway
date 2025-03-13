
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient, setAuthToken, getAuthToken } from "@/utils/api";
import { toast } from "sonner";

interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  isGuest?: boolean;
}

interface AuthContextType {
  user: User | null;
  isSignedIn: boolean;
  isLoading: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<boolean>;
  signUp: (userData: { fullName: string; username: string; email: string; password: string }) => Promise<boolean>;
  signInAsGuest: (username: string) => Promise<boolean>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Vérifier si un token existe dans le localStorage
        const token = localStorage.getItem('authToken');
        
        if (token) {
          // Définir le token dans le service API
          setAuthToken(token);
          
          // Récupérer les données de l'utilisateur
          const response = await apiClient.getCurrentUser();
          
          if (response.success && response.data) {
            setUser(response.data);
            setIsSignedIn(true);
          } else {
            // Token invalide ou expiré
            localStorage.removeItem('authToken');
            setAuthToken(null);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const signIn = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.login(credentials);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsSignedIn(true);
        toast.success('Connexion réussie');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      toast.error('Erreur lors de la connexion');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (userData: { fullName: string; username: string; email: string; password: string }) => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.register(userData);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsSignedIn(true);
        toast.success('Inscription réussie');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      toast.error('Erreur lors de l\'inscription');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signInAsGuest = async (username: string) => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.guestLogin(username);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsSignedIn(true);
        toast.success('Connexion en tant qu\'invité réussie');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la connexion en tant qu\'invité:', error);
      toast.error('Erreur lors de la connexion en tant qu\'invité');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('authToken');
    setAuthToken(null);
    setUser(null);
    setIsSignedIn(false);
    toast.info('Déconnexion réussie');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isSignedIn, 
      isLoading,
      signIn, 
      signUp,
      signInAsGuest,
      signOut 
    }}>
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
