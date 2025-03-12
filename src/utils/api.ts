
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
      // For simplicity, we'll just return a random ID
      // In a real app, this would create a room via 100ms API
      return {
        id: Math.random().toString(36).substring(2, 12),
        name: name || 'Réunion sans nom'
      };
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
      // For development, we can use 100ms test token
      // In production, this should call your backend API
      const response = await fetch(`https://prod-in2.100ms.live/hmsapi/get-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: roomId,
          user_id: `${userName}-${Date.now()}`,
          role
        }),
      });
      
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
   * Rejoind une salle avec un code
   */
  async joinWithCode(roomCode: string, userName: string) {
    // In a real app, this would validate the code and get room details
    // For simplicity, we'll just return the code as the room ID
    return roomCode;
  }
};
