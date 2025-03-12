
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SignedIn } from "@clerk/clerk-react";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import MeetingControls from "@/components/MeetingControls";
import VideoTile from "@/components/VideoTile";
import Chat from "@/components/Chat";
import Participants from "@/components/Participants";
import { 
  useHMSActions, 
  useHMSStore, 
  selectPeers, 
  selectIsConnectedToRoom,
  HMSRoomProvider,
} from "@100mslive/react-sdk";

// Type for simulated participants
interface SimulatedParticipant {
  id: string;
  name: string;
  isLocal: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

const MeetingContent = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [simulatedPeers, setSimulatedPeers] = useState<SimulatedParticipant[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [simulatedMessages, setSimulatedMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!roomId) return;
    
    const simulateConference = () => {
      try {
        setIsLoading(true);
        console.log("Simulation de connexion à la conférence");
        
        // Simuler les participants
        const localUser = {
          id: 'local-user-id',
          name: user?.firstName || 'Vous',
          isLocal: true,
          audioEnabled: isAudioEnabled,
          videoEnabled: isVideoEnabled
        };
        
        const otherParticipants = [
          {
            id: 'participant-1',
            name: 'Jean Martin',
            isLocal: false,
            audioEnabled: true,
            videoEnabled: true
          },
          {
            id: 'participant-2',
            name: 'Sophie Dupont',
            isLocal: false,
            audioEnabled: false,
            videoEnabled: true
          },
          {
            id: 'participant-3',
            name: 'Marc Leroy',
            isLocal: false,
            audioEnabled: true,
            videoEnabled: false
          }
        ];
        
        setSimulatedPeers([localUser, ...otherParticipants]);
        
        // Simuler quelques messages pour le chat
        setSimulatedMessages([
          {
            id: 'msg-1',
            senderName: 'Jean Martin',
            sender: 'participant-1',
            senderUserId: 'participant-1',
            message: 'Bonjour tout le monde !',
            time: new Date().getTime() - 15000
          },
          {
            id: 'msg-2',
            senderName: 'Sophie Dupont',
            sender: 'participant-2',
            senderUserId: 'participant-2',
            message: 'Comment allez-vous aujourd\'hui ?',
            time: new Date().getTime() - 10000
          }
        ]);
        
        toast.success("Vous avez rejoint la réunion");
      } catch (error) {
        console.error("Error in simulation:", error);
        toast.error("Impossible de rejoindre la réunion");
      } finally {
        setIsLoading(false);
      }
    };
    
    simulateConference();
    
    return () => {
      console.log("Déconnexion de la salle de réunion");
      
      // Réinitialiser l'état
      setSimulatedPeers([]);
      setSimulatedMessages([]);
    };
  }, [roomId, navigate, user]);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (isParticipantsOpen) setIsParticipantsOpen(false);
  };

  const toggleParticipants = () => {
    setIsParticipantsOpen(!isParticipantsOpen);
    if (isChatOpen) setIsChatOpen(false);
  };

  const handleAudioToggle = () => {
    setIsAudioEnabled(!isAudioEnabled);
    
    // Mettre à jour l'état audio du participant local simulé
    setSimulatedPeers(prev => 
      prev.map(peer => 
        peer.isLocal 
          ? { ...peer, audioEnabled: !isAudioEnabled } 
          : peer
      )
    );
  };

  const handleVideoToggle = () => {
    setIsVideoEnabled(!isVideoEnabled);
    
    // Mettre à jour l'état vidéo du participant local simulé
    setSimulatedPeers(prev => 
      prev.map(peer => 
        peer.isLocal 
          ? { ...peer, videoEnabled: !isVideoEnabled } 
          : peer
      )
    );
  };

  const handleScreenShareToggle = () => {
    setIsScreenSharing(!isScreenSharing);
    toast.info(isScreenSharing ? "Partage d'écran arrêté" : "Partage d'écran démarré");
  };

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: `msg-${Date.now()}`,
      senderName: user?.firstName || 'Vous',
      sender: 'local-user-id',
      senderUserId: 'local-user-id',
      message: message,
      time: new Date().getTime()
    };
    
    setSimulatedMessages(prev => [...prev, newMessage]);
  };

  const handleLeaveRoom = () => {
    navigate("/");
    toast.info("Vous avez quitté la réunion");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header appName="Vizioway" />
      <main className="pt-16 flex-1 flex">
        <div className="flex-1 flex flex-col p-4">
          <div className="flex-1 flex flex-col lg:flex-row gap-4">
            <div className="flex-1 bg-white rounded-lg shadow p-4 h-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">Connexion à la réunion...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  {simulatedPeers.length === 0 ? (
                    <div className="col-span-full h-full flex items-center justify-center">
                      <p className="text-gray-500">Aucun participant pour le moment</p>
                    </div>
                  ) : (
                    simulatedPeers.map(peer => (
                      <div key={peer.id} className="aspect-video">
                        <VideoTile
                          peerId={peer.id}
                          peerName={peer.name}
                          isLocal={peer.isLocal}
                          isAudioEnabled={peer.audioEnabled}
                          simulationMode={true}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {(isChatOpen || isParticipantsOpen) && (
              <div className="w-full lg:w-80 h-80 lg:h-auto">
                {isChatOpen && (
                  <Chat 
                    onClose={toggleChat} 
                    simulatedMessages={simulatedMessages}
                    onSendMessage={handleSendMessage}
                  />
                )}
                {isParticipantsOpen && (
                  <Participants 
                    onClose={toggleParticipants} 
                    simulatedPeers={simulatedPeers}
                  />
                )}
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 mt-4">
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
  );
};

const Meeting = () => {
  return (
    <SignedIn>
      <HMSRoomProvider>
        <MeetingContent />
      </HMSRoomProvider>
    </SignedIn>
  );
};

export default Meeting;
