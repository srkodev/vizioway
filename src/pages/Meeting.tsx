
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
  selectLocalPeer,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  HMSRoomProvider
} from "@100mslive/react-sdk";
import { apiClient } from "@/utils/api";

const MeetingContent = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  const localPeer = useHMSStore(selectLocalPeer);
  const isAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!roomId || !user) return;
    
    const joinRoom = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, we would fetch a token from our backend
        // For now, we'll use a direct connection
        const userName = user.firstName || 'Utilisateur';
        
        // Initialize the 100ms SDK and join the room
        await hmsActions.join({
          userName,
          roomCode: roomId // Using room code for simplicity
        });
        
        toast.success("Vous avez rejoint la réunion");
      } catch (error) {
        console.error("Error joining room:", error);
        toast.error("Impossible de rejoindre la réunion");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!isConnected) {
      joinRoom();
    }
    
    return () => {
      if (isConnected) {
        hmsActions.leave();
      }
    };
  }, [roomId, user, hmsActions, isConnected, navigate]);

  // Setup message listener
  useEffect(() => {
    const onMessage = (data: any) => {
      const newMessage = {
        id: `msg-${Date.now()}`,
        senderName: data.senderName,
        sender: data.senderId,
        message: data.message,
        time: Date.now()
      };
      
      setMessages(prev => [...prev, newMessage]);
    };
    
    hmsActions.onMessage(onMessage);
    
    return () => {
      hmsActions.offMessage(onMessage);
    };
  }, [hmsActions]);

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
      await hmsActions.setLocalAudioEnabled(!isAudioEnabled);
    } catch (error) {
      console.error("Error toggling audio:", error);
      toast.error("Impossible de modifier l'état du microphone");
    }
  };

  const handleVideoToggle = async () => {
    try {
      await hmsActions.setLocalVideoEnabled(!isVideoEnabled);
    } catch (error) {
      console.error("Error toggling video:", error);
      toast.error("Impossible de modifier l'état de la caméra");
    }
  };

  const handleScreenShareToggle = async () => {
    try {
      if (isScreenSharing) {
        await hmsActions.stopScreenShare();
      } else {
        await hmsActions.startScreenShare();
      }
      setIsScreenSharing(!isScreenSharing);
      toast.info(isScreenSharing ? "Partage d'écran arrêté" : "Partage d'écran démarré");
    } catch (error) {
      console.error("Error toggling screen share:", error);
      toast.error("Impossible de partager l'écran");
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    try {
      await hmsActions.sendBroadcastMessage(message);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Impossible d'envoyer le message");
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await hmsActions.leave();
      navigate("/");
      toast.info("Vous avez quitté la réunion");
    } catch (error) {
      console.error("Error leaving room:", error);
      toast.error("Impossible de quitter la réunion");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
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
                  {peers.length === 0 ? (
                    <div className="col-span-full h-full flex items-center justify-center">
                      <p className="text-gray-500">Aucun participant pour le moment</p>
                    </div>
                  ) : (
                    peers.map(peer => (
                      <div key={peer.id} className="aspect-video">
                        <VideoTile
                          peerId={peer.id}
                          peerName={peer.name}
                          isLocal={peer.isLocal}
                          isAudioEnabled={peer.audioTrack?.enabled || false}
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
                    onSendMessage={handleSendMessage}
                    messages={messages}
                  />
                )}
                {isParticipantsOpen && (
                  <Participants 
                    onClose={toggleParticipants}
                    peers={peers}
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
