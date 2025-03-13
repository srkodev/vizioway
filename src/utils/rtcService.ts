
import { io, Socket } from "socket.io-client";
import { getAuthToken } from "./api";
import { toast } from "sonner";

interface PeerConnection {
  id: string;
  name: string;
  connection: RTCPeerConnection;
  stream: MediaStream | null;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

type MediaStateChangeHandler = (userId: string, video: boolean, audio: boolean) => void;
type ParticipantJoinHandler = (participant: { id: string; name: string }) => void;
type ParticipantLeaveHandler = (userId: string) => void;
type MessageHandler = (message: Message) => void;
type StreamHandler = (userId: string, stream: MediaStream, name: string) => void;

class RTCService {
  private socket: Socket | null = null;
  private peerConnections: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private roomId: string | null = null;
  private onMediaStateChangeHandlers: Set<MediaStateChangeHandler> = new Set();
  private onParticipantJoinHandlers: Set<ParticipantJoinHandler> = new Set();
  private onParticipantLeaveHandlers: Set<ParticipantLeaveHandler> = new Set();
  private onMessageHandlers: Set<MessageHandler> = new Set();
  private onRemoteStreamHandlers: Set<StreamHandler> = new Set();
  
  // Configuration ICE pour WebRTC
  private peerConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" }
    ]
  };
  
  constructor() {
    this.initialize();
  }
  
  private initialize() {
    // Initialisation automatique avec le token si disponible
    const token = getAuthToken() || localStorage.getItem('authToken');
    
    if (token) {
      this.connectSocket(token);
    }
  }
  
  /**
   * Connecter au serveur Socket.IO
   */
  public connectSocket(token: string) {
    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    // Déconnecter si déjà connecté
    if (this.socket) {
      this.socket.disconnect();
    }
    
    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    this.setupSocketListeners();
  }
  
  /**
   * Configurer les écouteurs d'événements Socket.IO
   */
  private setupSocketListeners() {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('Connecté au serveur Socket.IO');
    });
    
    this.socket.on('connect_error', (err) => {
      console.error('Erreur de connexion Socket.IO:', err);
      toast.error('Impossible de se connecter au serveur de visioconférence');
    });
    
    this.socket.on('user-joined', async (user) => {
      console.log('Utilisateur rejoint:', user);
      
      // Notifier les écouteurs
      this.onParticipantJoinHandlers.forEach(handler => handler(user));
      
      // Créer une connexion pair-à-pair pour le nouvel utilisateur
      if (this.localStream) {
        await this.createPeerConnection(user.userId, user.name);
        await this.sendOffer(user.userId);
      }
    });
    
    this.socket.on('room-participants', async (participants) => {
      console.log('Participants de la salle:', participants);
      
      // Établir des connexions avec tous les participants existants
      if (this.localStream) {
        for (const participant of participants) {
          // Ne pas créer une connexion avec soi-même
          if (participant.id !== this.socket?.id) {
            await this.createPeerConnection(participant.id, participant.name);
            await this.sendOffer(participant.id);
          }
        }
      }
    });
    
    this.socket.on('user-left', (data) => {
      console.log('Utilisateur parti:', data);
      
      // Fermer la connexion avec l'utilisateur
      const connection = this.peerConnections.get(data.userId);
      if (connection) {
        connection.connection.close();
        this.peerConnections.delete(data.userId);
      }
      
      // Notifier les écouteurs
      this.onParticipantLeaveHandlers.forEach(handler => handler(data.userId));
    });
    
    this.socket.on('receive-offer', async (data) => {
      console.log('Offre reçue de:', data.from);
      
      // Créer une connexion si elle n'existe pas
      let peerConnection = this.peerConnections.get(data.from);
      
      if (!peerConnection) {
        peerConnection = await this.createPeerConnection(data.from, data.fromName);
      }
      
      try {
        // Définir l'offre distante
        await peerConnection.connection.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        // Créer et envoyer une réponse
        const answer = await peerConnection.connection.createAnswer();
        await peerConnection.connection.setLocalDescription(answer);
        
        this.socket?.emit('send-answer', {
          to: data.from,
          answer
        });
      } catch (error) {
        console.error('Erreur lors du traitement de l\'offre:', error);
      }
    });
    
    this.socket.on('receive-answer', async (data) => {
      console.log('Réponse reçue de:', data.from);
      
      const peerConnection = this.peerConnections.get(data.from);
      
      if (peerConnection) {
        try {
          await peerConnection.connection.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (error) {
          console.error('Erreur lors du traitement de la réponse:', error);
        }
      }
    });
    
    this.socket.on('receive-ice-candidate', async (data) => {
      console.log('Candidat ICE reçu de:', data.from);
      
      const peerConnection = this.peerConnections.get(data.from);
      
      if (peerConnection && data.candidate) {
        try {
          await peerConnection.connection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('Erreur lors de l\'ajout du candidat ICE:', error);
        }
      }
    });
    
    this.socket.on('receive-message', (message) => {
      console.log('Message reçu:', message);
      
      // Notifier les écouteurs
      this.onMessageHandlers.forEach(handler => handler({
        ...message,
        timestamp: new Date(message.timestamp)
      }));
    });
    
    this.socket.on('user-media-change', (data) => {
      console.log('Changement de média pour l\'utilisateur:', data);
      
      // Notifier les écouteurs
      this.onMediaStateChangeHandlers.forEach(handler => 
        handler(data.userId, data.video, data.audio)
      );
    });
  }
  
  /**
   * Créer une connexion pair-à-pair avec un autre utilisateur
   */
  private async createPeerConnection(userId: string, userName: string): Promise<PeerConnection> {
    // Si la connexion existe déjà, la retourner
    if (this.peerConnections.has(userId)) {
      return this.peerConnections.get(userId)!;
    }
    
    // Créer une nouvelle connexion
    const connection = new RTCPeerConnection(this.peerConfig);
    
    // Créer l'objet de connexion
    const peerConnection: PeerConnection = {
      id: userId,
      name: userName,
      connection,
      stream: null
    };
    
    // Ajouter les pistes locales à la connexion
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        connection.addTrack(track, this.localStream!);
      });
    }
    
    // Gérer les candidats ICE
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket?.emit('send-ice-candidate', {
          to: userId,
          candidate: event.candidate
        });
      }
    };
    
    // Gérer les changements d'état de connexion
    connection.onconnectionstatechange = () => {
      console.log(`État de connexion avec ${userName}:`, connection.connectionState);
    };
    
    // Gérer les pistes reçues
    connection.ontrack = (event) => {
      console.log(`Piste reçue de ${userName}:`, event.streams[0]);
      
      peerConnection.stream = event.streams[0];
      
      // Notifier les écouteurs
      this.onRemoteStreamHandlers.forEach(handler => 
        handler(userId, event.streams[0], userName)
      );
    };
    
    // Stocker la connexion
    this.peerConnections.set(userId, peerConnection);
    
    return peerConnection;
  }
  
  /**
   * Envoyer une offre à un pair
   */
  private async sendOffer(userId: string) {
    const peerConnection = this.peerConnections.get(userId);
    
    if (!peerConnection) {
      console.error('Tentative d\'envoi d\'offre à un pair inexistant:', userId);
      return;
    }
    
    try {
      // Créer une offre
      const offer = await peerConnection.connection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      // Définir la description locale
      await peerConnection.connection.setLocalDescription(offer);
      
      // Envoyer l'offre
      this.socket?.emit('send-offer', {
        to: userId,
        offer
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'offre:', error);
    }
  }
  
  /**
   * Rejoindre une salle
   */
  public async joinRoom(roomId: string, onError?: (error: any) => void) {
    try {
      if (!this.socket) {
        throw new Error('Non connecté au serveur');
      }
      
      console.log('Tentative de rejoindre la salle:', roomId);
      
      // Demander les autorisations de média
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        });
      } catch (mediaError) {
        console.error('Erreur d\'accès aux périphériques média:', mediaError);
        toast.error('Impossible d\'accéder à la caméra ou au microphone');
        
        // Essayer avec audio seulement
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
        
        toast.info('Mode audio uniquement activé');
      }
      
      // Rejoindre la salle
      this.socket.emit('join-room', { roomId });
      this.roomId = roomId;
      
      return this.localStream;
    } catch (error) {
      console.error('Erreur lors de la connexion à la salle:', error);
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
  }
  
  /**
   * Quitter la salle actuelle
   */
  public leaveRoom() {
    // Arrêter toutes les pistes du flux local
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Fermer toutes les connexions WebRTC
    for (const peerConnection of this.peerConnections.values()) {
      peerConnection.connection.close();
    }
    
    this.peerConnections.clear();
    this.roomId = null;
    
    // Déconnecter du socket (optionnel)
    // this.socket?.disconnect();
  }
  
  /**
   * Envoyer un message dans la salle
   */
  public sendMessage(message: string) {
    if (!this.socket || !this.roomId) {
      toast.error('Non connecté à une salle');
      return false;
    }
    
    this.socket.emit('send-message', {
      roomId: this.roomId,
      message
    });
    
    return true;
  }
  
  /**
   * Activer/désactiver l'audio
   */
  public toggleAudio(isEnabled: boolean) {
    if (!this.localStream) return false;
    
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = isEnabled;
    });
    
    // Informer les autres participants
    if (this.socket && this.roomId) {
      this.socket.emit('media-state-change', {
        roomId: this.roomId,
        audio: isEnabled,
        video: this.localStream.getVideoTracks()[0]?.enabled || false
      });
    }
    
    return true;
  }
  
  /**
   * Activer/désactiver la vidéo
   */
  public toggleVideo(isEnabled: boolean) {
    if (!this.localStream) return false;
    
    this.localStream.getVideoTracks().forEach(track => {
      track.enabled = isEnabled;
    });
    
    // Informer les autres participants
    if (this.socket && this.roomId) {
      this.socket.emit('media-state-change', {
        roomId: this.roomId,
        video: isEnabled,
        audio: this.localStream.getAudioTracks()[0]?.enabled || false
      });
    }
    
    return true;
  }
  
  /**
   * Partager l'écran
   */
  public async toggleScreenShare(isEnabled: boolean) {
    try {
      if (!this.socket || !this.roomId) {
        throw new Error('Non connecté à une salle');
      }
      
      if (isEnabled) {
        // Arrêter l'ancien flux vidéo
        if (this.localStream) {
          this.localStream.getVideoTracks().forEach(track => track.stop());
        }
        
        // Obtenir le flux de partage d'écran
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        // Remplacer le flux vidéo
        if (this.localStream) {
          // Garder l'audio du flux original
          const audioTrack = this.localStream.getAudioTracks()[0];
          
          // Créer un nouveau flux avec la piste audio existante et la nouvelle piste vidéo
          const newStream = new MediaStream();
          
          if (audioTrack) {
            newStream.addTrack(audioTrack);
          }
          
          screenStream.getVideoTracks().forEach(track => {
            newStream.addTrack(track);
            
            // Détecter la fin du partage d'écran
            track.onended = () => {
              this.toggleScreenShare(false).catch(console.error);
            };
          });
          
          // Remplacer le flux local
          this.localStream = newStream;
          
          // Mettre à jour les connexions existantes
          for (const peerConn of this.peerConnections.values()) {
            const senders = peerConn.connection.getSenders();
            const videoSender = senders.find(sender => 
              sender.track?.kind === 'video'
            );
            
            if (videoSender) {
              videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
            }
          }
        }
      } else {
        // Arrêter le partage d'écran et revenir à la caméra
        if (this.localStream) {
          this.localStream.getVideoTracks().forEach(track => track.stop());
        }
        
        // Obtenir un nouveau flux de caméra
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        
        // Remplacer le flux vidéo
        if (this.localStream) {
          // Garder l'audio du flux original
          const audioTrack = this.localStream.getAudioTracks()[0];
          
          // Créer un nouveau flux
          const newStream = new MediaStream();
          
          if (audioTrack) {
            newStream.addTrack(audioTrack);
          }
          
          cameraStream.getVideoTracks().forEach(track => {
            newStream.addTrack(track);
          });
          
          // Remplacer le flux local
          this.localStream = newStream;
          
          // Mettre à jour les connexions existantes
          for (const peerConn of this.peerConnections.values()) {
            const senders = peerConn.connection.getSenders();
            const videoSender = senders.find(sender => 
              sender.track?.kind === 'video'
            );
            
            if (videoSender) {
              videoSender.replaceTrack(cameraStream.getVideoTracks()[0]);
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors du partage d\'écran:', error);
      toast.error('Impossible de partager l\'écran');
      throw error;
    }
  }
  
  /**
   * S'abonner aux événements de changement d'état des médias
   */
  public onMediaStateChange(handler: MediaStateChangeHandler) {
    this.onMediaStateChangeHandlers.add(handler);
    
    return () => {
      this.onMediaStateChangeHandlers.delete(handler);
    };
  }
  
  /**
   * S'abonner aux événements d'arrivée de participants
   */
  public onParticipantJoin(handler: ParticipantJoinHandler) {
    this.onParticipantJoinHandlers.add(handler);
    
    return () => {
      this.onParticipantJoinHandlers.delete(handler);
    };
  }
  
  /**
   * S'abonner aux événements de départ de participants
   */
  public onParticipantLeave(handler: ParticipantLeaveHandler) {
    this.onParticipantLeaveHandlers.add(handler);
    
    return () => {
      this.onParticipantLeaveHandlers.delete(handler);
    };
  }
  
  /**
   * S'abonner aux événements de messages
   */
  public onMessage(handler: MessageHandler) {
    this.onMessageHandlers.add(handler);
    
    return () => {
      this.onMessageHandlers.delete(handler);
    };
  }
  
  /**
   * S'abonner aux événements de flux distants
   */
  public onRemoteStream(handler: StreamHandler) {
    this.onRemoteStreamHandlers.add(handler);
    
    return () => {
      this.onRemoteStreamHandlers.delete(handler);
    };
  }
  
  /**
   * Obtenir tous les participants connectés
   */
  public getParticipants() {
    return Array.from(this.peerConnections.values()).map(conn => ({
      id: conn.id,
      name: conn.name,
      stream: conn.stream
    }));
  }
  
  /**
   * Obtenir le flux local
   */
  public getLocalStream() {
    return this.localStream;
  }
}

// Exporter une instance unique
export const rtcService = new RTCService();
