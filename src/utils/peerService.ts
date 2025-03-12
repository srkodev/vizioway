
import Peer, { MediaConnection } from 'peerjs';
import { toast } from 'sonner';

interface PeerConnection {
  connection: MediaConnection;
  stream: MediaStream;
  peerName: string;
}

class PeerService {
  private peer: Peer | null = null;
  private localStream: MediaStream | null = null;
  private connections: Map<string, PeerConnection> = new Map();
  private onPeerConnectedCallbacks: Array<(peerId: string, peerName: string, stream: MediaStream) => void> = [];
  private onPeerDisconnectedCallbacks: Array<(peerId: string) => void> = [];
  private userId: string = '';
  private userName: string = '';

  async initialize(userId: string, userName: string): Promise<MediaStream> {
    this.userId = userId;
    this.userName = userName;
    
    try {
      // Création du peer
      this.peer = new Peer(userId, {
        debug: 2
      });
      
      // Obtention du flux média local
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      // Gestion des appels entrants
      this.peer.on('call', async (call) => {
        try {
          call.answer(this.localStream!);
          
          call.on('stream', (remoteStream) => {
            // Extraire le nom du pair des métadonnées
            const peerName = call.metadata?.name || 'Inconnu';
            
            // Ajouter à nos connexions
            this.connections.set(call.peer, {
              connection: call,
              stream: remoteStream,
              peerName
            });
            
            // Notifier les callbacks
            this.onPeerConnectedCallbacks.forEach(callback => {
              callback(call.peer, peerName, remoteStream);
            });
          });
          
          call.on('close', () => {
            this.connections.delete(call.peer);
            this.onPeerDisconnectedCallbacks.forEach(callback => {
              callback(call.peer);
            });
          });
          
          call.on('error', (err) => {
            console.error('Erreur sur l\'appel:', err);
            toast.error(`Erreur de connexion: ${err.message}`);
          });
        } catch (err) {
          console.error('Erreur lors de la réponse à l\'appel:', err);
          toast.error('Impossible de répondre à l\'appel');
        }
      });
      
      this.peer.on('error', (err) => {
        console.error('Erreur PeerJS:', err);
        toast.error(`Erreur de connexion: ${err.message}`);
      });
      
      return this.localStream;
    } catch (err) {
      console.error('Erreur d\'initialisation:', err);
      toast.error('Impossible d\'accéder à la caméra ou au microphone');
      throw err;
    }
  }
  
  async callPeer(peerId: string): Promise<void> {
    if (!this.peer || !this.localStream) {
      throw new Error('PeerService non initialisé');
    }
    
    try {
      const call = this.peer.call(peerId, this.localStream, {
        metadata: {
          name: this.userName
        }
      });
      
      call.on('stream', (remoteStream) => {
        // On suppose que le nom sera fourni ultérieurement
        const peerName = 'Participant';
        
        this.connections.set(peerId, {
          connection: call,
          stream: remoteStream,
          peerName
        });
        
        this.onPeerConnectedCallbacks.forEach(callback => {
          callback(peerId, peerName, remoteStream);
        });
      });
      
      call.on('close', () => {
        this.connections.delete(peerId);
        this.onPeerDisconnectedCallbacks.forEach(callback => {
          callback(peerId);
        });
      });
      
      call.on('error', (err) => {
        console.error('Erreur sur l\'appel:', err);
        toast.error(`Erreur de connexion: ${err.message}`);
      });
    } catch (err) {
      console.error('Erreur lors de l\'appel:', err);
      toast.error('Impossible de joindre ce participant');
      throw err;
    }
  }
  
  onPeerConnected(callback: (peerId: string, peerName: string, stream: MediaStream) => void): void {
    this.onPeerConnectedCallbacks.push(callback);
  }
  
  onPeerDisconnected(callback: (peerId: string) => void): void {
    this.onPeerDisconnectedCallbacks.push(callback);
  }
  
  getConnections(): Map<string, PeerConnection> {
    return this.connections;
  }
  
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }
  
  async toggleAudio(enabled: boolean): Promise<void> {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }
  
  async toggleVideo(enabled: boolean): Promise<void> {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }
  
  disconnect(): void {
    // Arrêter toutes les connexions
    this.connections.forEach((connection) => {
      connection.connection.close();
    });
    
    // Vider la liste des connexions
    this.connections.clear();
    
    // Arrêter le flux local
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Fermer le peer
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

// Singleton
export const peerService = new PeerService();
