
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
import { apiClient } from "@/utils/api";
import { 
  useHMSActions, 
  useHMSStore, 
  selectPeers, 
  selectIsConnectedToRoom,
  HMSRoomProvider,
  HMSPeer
} from "@100mslive/react-sdk";

// Type de sécurité pour le participant local
interface LocalParticipant {
  id: string;
  roomId: string;
  token: string;
}

const MeetingContent = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    
    const joinRoom = async () => {
      try {
        setIsLoading(true);
        
        // Obtenir un token depuis notre backend
        const joinResponse = await apiClient.joinRoom(
          roomId, 
          user?.firstName || 'Invité'
        );
        
        // Stocker les infos du participant local
        setLocalParticipant({
          id: joinResponse.participantId,
          roomId,
          token: joinResponse.token
        });
        
        // Connecter à 100ms avec le token fourni par notre backend
        await hmsActions.join({
          userName: user?.firstName || 'Invité',
          authToken: joinResponse.token,
          settings: {
            isAudioMuted: true,
            isVideoMuted: false,
          }
        });
        
        toast.success("Vous avez rejoint la réunion");
      } catch (error) {
        console.error("Error joining room:", error);
        toast.error("Impossible de rejoindre la réunion");
        
        // En mode développement, nous simulons une connexion
        if (process.env.NODE_ENV === 'development') {
          console.log("Simulation d'une connexion à la salle de réunion");
          setLocalParticipant({
            id: 'local-user-id',
            roomId: roomId || '',
            token: 'simulated-token'
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    joinRoom();
    
    return () => {
      // Déconnexion lorsque le composant est démonté
      const leaveRoom = async () => {
        if (isConnected) {
          await hmsActions.leave();
        }
        
        // Informer le backend que nous quittons la salle
        if (localParticipant) {
          await apiClient.leaveRoom(
            localParticipant.roomId,
            localParticipant.id
          );
        }
      };
      
      leaveRoom();
    };
  }, [roomId, hmsActions, navigate, user, isConnected]);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (isParticipantsOpen) setIsParticipantsOpen(false);
  };

  const toggleParticipants = () => {
    setIsParticipantsOpen(!isParticipantsOpen);
    if (isChatOpen) setIsChatOpen(false);
  };

  const getVideoEnabled = (peer: HMSPeer) => {
    if (!peer.videoTrack) return false;
    return typeof peer.videoTrack === 'string' ? false : peer.videoTrack.enabled;
  };

  const getAudioEnabled = (peer: HMSPeer) => {
    if (!peer.audioTrack) return false;
    return typeof peer.audioTrack === 'string' ? false : peer.audioTrack.enabled;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="pt-16 flex-1 flex">
        <div className="flex-1 flex flex-col p-4">
          <div className="flex-1 flex flex-col lg:flex-row gap-4">
            <div className="flex-1 bg-white rounded-lg shadow p-4 h-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">Connexion à la réunion...</p>
                </div>
              ) : !isConnected ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500">
                    Connexion à la réunion...
                    {process.env.NODE_ENV === 'development' && ' (Mode simulation)'}
                  </p>
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
                          isAudioEnabled={getAudioEnabled(peer)}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {(isChatOpen || isParticipantsOpen) && (
              <div className="w-full lg:w-80 h-80 lg:h-auto">
                {isChatOpen && <Chat onClose={toggleChat} />}
                {isParticipantsOpen && <Participants onClose={toggleParticipants} />}
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 mt-4">
            <MeetingControls 
              onChatToggle={toggleChat}
              onParticipantsToggle={toggleParticipants}
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
