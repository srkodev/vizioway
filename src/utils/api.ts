
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Client API pour communiquer avec le backend
 */
export const apiClient = {
  /**
   * Crée une nouvelle salle de réunion
   */
  async createRoom(name?: string) {
    try {
      const response = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Impossible de créer la salle');
      }
      
      return data.data;
    } catch (error) {
      console.error('Erreur lors de la création de la salle:', error);
      toast.error('Impossible de créer la salle de réunion');
      throw error;
    }
  },
  
  /**
   * Obtient les détails d'une salle
   */
  async getRoom(roomId: string) {
    try {
      const response = await fetch(`${API_URL}/rooms/${roomId}`);
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Impossible de récupérer les détails de la salle');
      }
      
      return data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de la salle:', error);
      toast.error('Impossible de récupérer les détails de la salle');
      throw error;
    }
  },
  
  /**
   * Rejoint une salle et obtient un token
   */
  async joinRoom(roomId: string, name: string, role = 'guest') {
    try {
      const response = await fetch(`${API_URL}/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, role }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Impossible de rejoindre la salle');
      }
      
      return data.data;
    } catch (error) {
      console.error('Erreur lors de la tentative de rejoindre la salle:', error);
      toast.error('Impossible de rejoindre la réunion');
      throw error;
    }
  },
  
  /**
   * Quitte une salle
   */
  async leaveRoom(roomId: string, participantId: string) {
    try {
      const response = await fetch(`${API_URL}/rooms/${roomId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantId }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Impossible de quitter la salle');
      }
      
      return data.data;
    } catch (error) {
      console.error('Erreur lors de la tentative de quitter la salle:', error);
      toast.error('Erreur lors de la déconnexion de la réunion');
      return false;
    }
  }
};
