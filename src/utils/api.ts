
import { toast } from "sonner";

// URL de base de l'API
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Token d'authentification
let authToken: string | null = null;

// Fonction pour définir le token d'authentification
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// Fonction pour obtenir le token d'authentification
export const getAuthToken = (): string | null => {
  return authToken;
};

// Type pour les réponses de l'API
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  message: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Options de base pour les requêtes fetch
const getBaseOptions = (options?: RequestInit): RequestInit => {
  const baseOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      ...(options?.headers || {})
    },
    ...options
  };
  
  return baseOptions;
};

// Fonction pour gérer les erreurs de requête
const handleRequestError = (error: any, defaultMessage: string): ApiErrorResponse => {
  console.error(defaultMessage, error);
  
  if (error.response) {
    return { 
      success: false, 
      message: error.response.data?.message || defaultMessage 
    };
  }
  
  toast.error(defaultMessage);
  return { success: false, message: defaultMessage };
};

/**
 * Client API pour communiquer avec le backend
 */
export const apiClient = {
  /**
   * S'inscrire avec un email et un mot de passe
   */
  async register(userData: { fullName: string, username: string, email: string, password: string }): Promise<ApiResponse<{token: string; user: any}>> {
    try {
      const response = await fetch(`${BASE_URL}/users/register`, {
        method: 'POST',
        ...getBaseOptions(),
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.message || 'Erreur lors de l\'inscription');
        return { success: false, message: data.message || 'Erreur lors de l\'inscription' };
      }
      
      // Stocker le token
      if (data.data?.token) {
        setAuthToken(data.data.token);
        localStorage.setItem('authToken', data.data.token);
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      return handleRequestError(error, 'Erreur lors de l\'inscription');
    }
  },
  
  /**
   * Se connecter avec un email et un mot de passe
   */
  async login(credentials: { email: string, password: string }): Promise<ApiResponse<{token: string; user: any}>> {
    try {
      const response = await fetch(`${BASE_URL}/users/login`, {
        method: 'POST',
        ...getBaseOptions(),
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.message || 'Erreur lors de la connexion');
        return { success: false, message: data.message || 'Erreur lors de la connexion' };
      }
      
      // Stocker le token
      if (data.data?.token) {
        setAuthToken(data.data.token);
        localStorage.setItem('authToken', data.data.token);
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      return handleRequestError(error, 'Erreur lors de la connexion');
    }
  },
  
  /**
   * Connexion en tant qu'invité
   */
  async guestLogin(username: string): Promise<ApiResponse<{token: string; user: any}>> {
    try {
      const response = await fetch(`${BASE_URL}/users/guest`, {
        method: 'POST',
        ...getBaseOptions(),
        body: JSON.stringify({ username })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.message || 'Erreur lors de la connexion');
        return { success: false, message: data.message || 'Erreur lors de la connexion' };
      }
      
      // Stocker le token
      if (data.data?.token) {
        setAuthToken(data.data.token);
        localStorage.setItem('authToken', data.data.token);
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      return handleRequestError(error, 'Erreur lors de la connexion');
    }
  },
  
  /**
   * Obtenir les informations de l'utilisateur actuel
   */
  async getCurrentUser(): Promise<ApiResponse<any>> {
    try {
      if (!authToken) {
        return { success: false, message: 'Non authentifié' };
      }
      
      const response = await fetch(`${BASE_URL}/users/me`, {
        ...getBaseOptions()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expiré ou invalide
          setAuthToken(null);
          localStorage.removeItem('authToken');
          toast.error('Session expirée, veuillez vous reconnecter');
        } else {
          toast.error(data.message || 'Erreur lors de la récupération des données utilisateur');
        }
        
        return { success: false, message: data.message || 'Erreur lors de la récupération des données utilisateur' };
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      return handleRequestError(error, 'Erreur lors de la récupération des données utilisateur');
    }
  },
  
  /**
   * Créer une nouvelle salle de réunion
   */
  async createRoom(name?: string): Promise<ApiResponse<{roomId: string}>> {
    try {
      const response = await fetch(`${BASE_URL}/rooms/create`, {
        method: 'POST',
        ...getBaseOptions(),
        body: JSON.stringify({ name: name || 'Nouvelle réunion' })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.message || 'Erreur lors de la création de la salle');
        return { success: false, message: data.message || 'Erreur lors de la création de la salle' };
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      return handleRequestError(error, 'Erreur lors de la création de la salle');
    }
  },
  
  /**
   * Rejoindre une salle avec un code
   */
  async joinRoomByCode(code: string): Promise<ApiResponse<{roomId: string}>> {
    try {
      const response = await fetch(`${BASE_URL}/rooms/join-by-code`, {
        method: 'POST',
        ...getBaseOptions(),
        body: JSON.stringify({ code })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.message || 'Code de réunion invalide');
        return { success: false, message: data.message || 'Code de réunion invalide' };
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      return handleRequestError(error, 'Erreur lors de la jointure à la salle');
    }
  },
  
  /**
   * Obtenir les détails d'une salle
   */
  async getRoomDetails(roomId: string): Promise<ApiResponse<{name: string; code: string}>> {
    try {
      const response = await fetch(`${BASE_URL}/rooms/${roomId}`, {
        ...getBaseOptions()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.message || 'Erreur lors de la récupération des détails de la salle');
        return { success: false, message: data.message || 'Erreur lors de la récupération des détails de la salle' };
      }
      
      return { success: true, data: data.data };
    } catch (error) {
      return handleRequestError(error, 'Erreur lors de la récupération des détails de la salle');
    }
  },
};
