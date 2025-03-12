
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const HMS_TOKEN_ENDPOINT = import.meta.env.VITE_HMS_TOKEN_ENDPOINT;

/**
 * Client API pour communiquer avec le backend
 */
export const apiClient = {
  /**
   * Crée une nouvelle salle de réunion
   */
  async createRoom(name?: string) {
    try {
      const response = await fetch(`${API_URL}/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name || 'Réunion sans nom' }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création de la salle');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la création de la salle:', error);
      toast.error('Impossible de créer la salle de réunion');
      throw error;
    }
  },
  
  /**
   * Obtient un token pour rejoindre une salle
   */
  async getToken(roomId: string, userName: string, role = 'host') {
    try {
      const response = await fetch(HMS_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: roomId,
          user_name: userName,
          role
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'obtention du token');
      }
      
      const data = await response.json();
      
      if (!data.token) {
        throw new Error('Impossible d\'obtenir un token');
      }
      
      return data.token;
    } catch (error) {
      console.error('Erreur lors de l\'obtention du token:', error);
      toast.error('Impossible de rejoindre la réunion');
      throw error;
    }
  },
  
  /**
   * Rejoint une salle avec un code
   */
  async joinWithCode(roomCode: string, userName: string) {
    try {
      const response = await fetch(`${API_URL}/rooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: roomCode, userName }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Code de réunion invalide');
      }
      
      const data = await response.json();
      return data.roomId;
    } catch (error) {
      console.error('Erreur lors de la jointure à la salle:', error);
      toast.error('Code de réunion invalide');
      throw error;
    }
  }
};
