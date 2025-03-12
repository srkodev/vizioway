
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
  HMSRoomProvider
} from "@100mslive/react-sdk";

const MeetingContent = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    
    // Pour une démonstration, nous utilisons un token fictif
    // Dans un environnement de production, vous devriez obtenir ce token de votre serveur
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3Nfa2V5IjoiNjFmMWYxNGFkYWJkNzc5YzlkYjFjZWIxIiwicm9vbV9pZCI6IjYxZjFmMWVkZGFiZDc3MzA3N2IxY2ViMiIsInVzZXJfaWQiOiJ1c2VyXzEiLCJyb2xlIjoiaG9zdCIsImlhdCI6MTY0MzI2NTUxNywiZXhwIjoxNjQzMzUxOTE3LCJqdGkiOiJiMjJiYjkwNi1mMzg0LTRmMzctOTMzZC03ZjU2OGRjY2JlYmUifQ.BJ-WKjNYMlkotDVxM5wVT50FQxvWO74jhRXoYjA35gY";
    
    const joinRoom = async () => {
      try {
        await hmsActions.join({
          userName: user?.firstName || 'Invité',
          authToken: mockToken,
          roomId: roomId
        });
        
        toast.success("Vous avez rejoint la réunion");
      } catch (error) {
        console.error("Error joining room:", error);
        toast.error("Impossible de rejoindre la réunion");
        navigate("/");
      }
    };
    
    joinRoom();
    
    return () => {
      if (isConnected) {
        hmsActions.leave();
      }
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

  const localPeer = peers.find(peer => peer.isLocal);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="pt-16 flex-1 flex">
        <div className="flex-1 flex flex-col p-4">
          <div className="flex-1 flex flex-col lg:flex-row gap-4">
            {/* Grille vidéo principale */}
            <div className="flex-1 bg-white rounded-lg shadow p-4 h-full">
              {!isConnected ? (
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
                          isAudioEnabled={peer.audioTrack?.enabled}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {/* Panneau latéral (chat ou participants) */}
            {(isChatOpen || isParticipantsOpen) && (
              <div className="w-full lg:w-80 h-80 lg:h-auto">
                {isChatOpen && <Chat onClose={toggleChat} />}
                {isParticipantsOpen && <Participants onClose={toggleParticipants} />}
              </div>
            )}
          </div>
          
          {/* Contrôles de la réunion */}
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
