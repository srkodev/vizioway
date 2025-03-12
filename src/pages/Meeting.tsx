import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import MeetingControls from "@/components/MeetingControls";
import VideoTile from "@/components/VideoTile";
import SimpleChat from "@/components/SimpleChat";
import SimpleParticipants from "@/components/SimpleParticipants";
import { peerService } from "@/utils/peerService";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

interface Participant {
  id: string;
  name: string;
  isLocal: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

const Meeting = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, { stream: MediaStream, name: string }>>(new Map());
  
  // Référence pour stocker le dernier ID de pair saisi
  const lastPeerIdRef = useRef("");

  // Initialiser PeerJS à l'entrée dans la réunion
  useEffect(() => {
    if (!roomId || !user) return;
    
    const initializeMeeting = async () => {
      try {
        setIsLoading(true);
        
        const userId = user.id;
        const userName = user.fullName || user.username || "Utilisateur";
        
        const stream = await peerService.initialize(userId, userName);
        setLocalStream(stream);
        
        setParticipants([{
          id: userId,
          name: userName,
          isLocal: true,
          isAudioEnabled: true,
          isVideoEnabled: true
        }]);
        
        // Écouter les nouveaux participants
        peerService.onPeerConnected((peerId, peerName, stream) => {
          setRemoteStreams(prev => {
            const newMap = new Map(prev);
            newMap.set(peerId, { stream, name: peerName });
            return newMap;
          });
          
          setParticipants(prev => [...prev, {
            id: peerId,
            name: peerName,
            isLocal: false,
            isAudioEnabled: true,
            isVideoEnabled: true
          }]);
          
          toast.success(`${peerName} a rejoint la réunion`);
        });
        
        // Écouter les déconnexions
        peerService.onPeerDisconnected((peerId) => {
          setRemoteStreams(prev => {
            const newMap = new Map(prev);
            const peerName = participants.find(p => p.id === peerId)?.name || "Un participant";
            newMap.delete(peerId);
            return newMap;
          });
          
          setParticipants(prev => prev.filter(p => p.id !== peerId));
          toast.info(`Un participant a quitté la réunion`);
        });
        
        toast.success("Vous avez rejoint la réunion");
      } catch (error) {
        console.error("Error joining room:", error);
        toast.error("Impossible de rejoindre la réunion");
        setTimeout(() => navigate('/'), 3000);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeMeeting();
    
    return () => {
      peerService.disconnect();
    };
  }, [roomId, user, navigate]);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (isParticipantsOpen) setIsParticipantsOpen(false);
  };

  const toggleParticipants = () => {
    setIsParticipantsOpen(!isParticipantsOpen);
    if (isChatOpen) setIsChatOpen(false);
  };

  const handleAudioToggle = async () => {
    try {
      await peerService.toggleAudio(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    } catch (error) {
      console.error("Error toggling audio:", error);
      toast.error("Impossible de modifier l'état du microphone");
    }
  };

  const handleVideoToggle = async () => {
    try {
      await peerService.toggleVideo(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {
      console.error("Error toggling video:", error);
      toast.error("Impossible de modifier l'état de la caméra");
    }
  };

  const handleScreenShareToggle = async () => {
    // Cette fonctionnalité n'est pas implémentée avec PeerJS
    toast.info("Le partage d'écran n'est pas disponible dans cette version gratuite");
  };

  const handleSendMessage = (message: string) => {
    if (!message.trim() || !user) return;
    
    const newMessage: Message = {
      id: crypto.randomUUID(),
      senderId: user.id,
      senderName: user.name,
      text: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Dans une version réelle, on enverrait ce message à tous les participants
    // (Non implémenté dans cette version simplifiée)
  };

  const handleJoinPeer = () => {
    const peerId = prompt("Entrez l'ID du participant à rejoindre:");
    
    if (peerId && peerId.trim() && peerId !== user?.id) {
      lastPeerIdRef.current = peerId.trim();
      
      toast.info("Connexion en cours...");
      
      // Essayer de se connecter au pair
      peerService.callPeer(peerId.trim())
        .catch(err => {
          console.error("Erreur lors de la connexion au pair:", err);
          toast.error("Impossible de rejoindre ce participant");
        });
    }
  };

  const handleLeaveRoom = async () => {
    try {
      peerService.disconnect();
      navigate("/");
      toast.info("Vous avez quitté la réunion");
    } catch (error) {
      console.error("Error leaving room:", error);
      toast.error("Impossible de quitter la réunion");
    }
  };

  return (
    <SignedIn>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header appName="Vizioway" />
        <main className="pt-16 flex-1 flex">
          <div className="flex-1 flex flex-col p-4">
            <div className="mb-4 bg-white dark:bg-gray-900 rounded-lg shadow p-4">
              <div className="flex flex-wrap items-center justify-between">
                <h2 className="text-xl font-semibold dark:text-white">Réunion: {roomId}</h2>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <p className="text-sm dark:text-gray-400">Votre ID: {user?.id}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      navigator.clipboard.writeText(user?.id || "");
                      toast.success("ID copié dans le presse-papier");
                    }}
                  >
                    Copier
                  </Button>
                  <Button size="sm" onClick={handleJoinPeer}>
                    Rejoindre par ID
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col lg:flex-row gap-4">
              <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg shadow p-4 h-full">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">Connexion à la réunion...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                    {localStream && (
                      <div className="aspect-video">
                        <VideoTile
                          stream={localStream}
                          peerName={user?.name || "Vous"}
                          isLocal={true}
                          isAudioEnabled={isAudioEnabled}
                        />
                      </div>
                    )}
                    
                    {Array.from(remoteStreams.entries()).map(([peerId, { stream, name }]) => (
                      <div key={peerId} className="aspect-video">
                        <VideoTile
                          stream={stream}
                          peerName={name}
                          isLocal={false}
                          isAudioEnabled={true}
                        />
                      </div>
                    ))}
                    
                    {remoteStreams.size === 0 && localStream && (
                      <div className="col-span-full h-full flex items-center justify-center">
                        <div className="text-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Aucun autre participant pour le moment
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Partagez votre ID ou invitez des participants à rejoindre avec le code: <span className="font-bold">{roomId}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {(isChatOpen || isParticipantsOpen) && (
                <div className="w-full lg:w-80 h-80 lg:h-auto">
                  {isChatOpen && (
                    <SimpleChat 
                      onClose={toggleChat} 
                      onSendMessage={handleSendMessage}
                      messages={messages}
                      currentUserId={user?.id || ""}
                    />
                  )}
                  {isParticipantsOpen && (
                    <SimpleParticipants 
                      onClose={toggleParticipants}
                      participants={participants}
                    />
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 mt-4">
              <MeetingControls 
                onChatToggle={toggleChat}
                onParticipantsToggle={toggleParticipants}
                onAudioToggle={handleAudioToggle}
                onVideoToggle={handleVideoToggle}
                onScreenShareToggle={handleScreenShareToggle}
                onLeaveRoom={handleLeaveRoom}
                isAudioEnabled={isAudioEnabled}
                isVideoEnabled={isVideoEnabled}
                isScreenShared={isScreenSharing}
              />
            </div>
          </div>
        </main>
      </div>
    </SignedIn>
    <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
  );
};

export default Meeting;
