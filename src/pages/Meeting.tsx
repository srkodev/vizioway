
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Header from "@/components/Header";
import MeetingControls from "@/components/MeetingControls";
import VideoTile from "@/components/VideoTile";
import SimpleChat from "@/components/SimpleChat";
import SimpleParticipants from "@/components/SimpleParticipants";
import { apiClient } from "@/utils/api";
import { rtcService } from "@/utils/rtcService";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
  stream?: MediaStream;
}

const Meeting = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { user, isSignedIn, isLoading: isAuthLoading } = useAuth();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [roomDetails, setRoomDetails] = useState<{ name: string; code: string } | null>(null);
  
  const remoteStreamsRef = useRef(new Map<string, MediaStream>());

  useEffect(() => {
    if (!isAuthLoading && !isSignedIn) {
      toast.error("Vous devez être connecté pour accéder à une réunion");
      navigate("/");
    }
  }, [isSignedIn, navigate, isAuthLoading]);

  useEffect(() => {
    if (!roomId || !user || !isSignedIn) return;
    
    const initializeMeeting = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer les détails de la salle
        const roomResponse = await apiClient.getRoomDetails(roomId);
        if (roomResponse.success && roomResponse.data) {
          setRoomDetails(roomResponse.data);
        }
        
        // Établir la connexion WebRTC
        const stream = await rtcService.joinRoom(roomId, (error) => {
          console.error("Erreur lors de la connexion à la salle:", error);
          toast.error("Impossible de rejoindre la réunion");
          setTimeout(() => navigate('/'), 3000);
        });
        
        setLocalStream(stream);
        
        // Ajouter l'utilisateur local aux participants
        setParticipants([{
          id: user.id,
          name: user.fullName,
          isLocal: true,
          isAudioEnabled: true,
          isVideoEnabled: true,
          stream
        }]);
        
        // Écouter les événements WebRTC
        const unsubscribeJoin = rtcService.onParticipantJoin((participant) => {
          setParticipants(prev => [
            ...prev.filter(p => p.id !== participant.id),
            {
              id: participant.id,
              name: participant.name,
              isLocal: false,
              isAudioEnabled: true,
              isVideoEnabled: true
            }
          ]);
          
          toast.success(`${participant.name} a rejoint la réunion`);
        });
        
        const unsubscribeLeave = rtcService.onParticipantLeave((userId) => {
          setParticipants(prev => prev.filter(p => p.id !== userId));
          remoteStreamsRef.current.delete(userId);
          
          toast.info("Un participant a quitté la réunion");
        });
        
        const unsubscribeStream = rtcService.onRemoteStream((userId, stream, name) => {
          remoteStreamsRef.current.set(userId, stream);
          
          setParticipants(prev => {
            const existing = prev.find(p => p.id === userId);
            
            if (existing) {
              return prev.map(p => 
                p.id === userId 
                  ? { ...p, stream } 
                  : p
              );
            } else {
              return [
                ...prev,
                {
                  id: userId,
                  name,
                  isLocal: false,
                  isAudioEnabled: true,
                  isVideoEnabled: true,
                  stream
                }
              ];
            }
          });
        });
        
        const unsubscribeMedia = rtcService.onMediaStateChange((userId, video, audio) => {
          setParticipants(prev => prev.map(p => 
            p.id === userId 
              ? { ...p, isVideoEnabled: video, isAudioEnabled: audio } 
              : p
          ));
        });
        
        const unsubscribeMessage = rtcService.onMessage((message) => {
          setMessages(prev => [...prev, message]);
        });
        
        toast.success("Vous avez rejoint la réunion");
        
        return () => {
          unsubscribeJoin();
          unsubscribeLeave();
          unsubscribeStream();
          unsubscribeMedia();
          unsubscribeMessage();
        };
      } catch (error) {
        console.error("Error joining room:", error);
        toast.error("Impossible de rejoindre la réunion");
        setTimeout(() => navigate('/'), 3000);
      } finally {
        setIsLoading(false);
      }
    };
    
    const cleanupFn = initializeMeeting();
    
    return () => {
      rtcService.leaveRoom();
      cleanupFn?.then(cleanup => cleanup && cleanup());
    };
  }, [roomId, user, navigate, isSignedIn]);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (isParticipantsOpen) setIsParticipantsOpen(false);
  };

  const toggleParticipants = () => {
    setIsParticipantsOpen(!isParticipantsOpen);
    if (isChatOpen) setIsChatOpen(false);
  };

  const handleAudioToggle = () => {
    try {
      rtcService.toggleAudio(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    } catch (error) {
      console.error("Error toggling audio:", error);
      toast.error("Impossible de modifier l'état du microphone");
    }
  };

  const handleVideoToggle = () => {
    try {
      rtcService.toggleVideo(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {
      console.error("Error toggling video:", error);
      toast.error("Impossible de modifier l'état de la caméra");
    }
  };

  const handleScreenShareToggle = async () => {
    try {
      await rtcService.toggleScreenShare(!isScreenSharing);
      setIsScreenSharing(!isScreenSharing);
      
      if (!isScreenSharing) {
        toast.success("Partage d'écran activé");
      } else {
        toast.info("Partage d'écran désactivé");
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      toast.error("Impossible de partager l'écran");
    }
  };

  const handleSendMessage = (message: string) => {
    if (!message.trim() || !user) return;
    
    const success = rtcService.sendMessage(message);
    
    if (success) {
      // Le message sera ajouté au chat via l'écouteur onMessage
    }
  };

  const handleCopyRoomCode = () => {
    if (roomDetails?.code) {
      navigator.clipboard.writeText(roomDetails.code);
      toast.success("Code de réunion copié dans le presse-papier");
    }
  };

  const handleLeaveRoom = () => {
    rtcService.leaveRoom();
    navigate("/");
    toast.info("Vous avez quitté la réunion");
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header appName="Vizioway" />
      <main className="pt-16 flex-1 flex">
        <div className="flex-1 flex flex-col p-4">
          <div className="mb-4 bg-white dark:bg-gray-900 rounded-lg shadow p-4">
            <div className="flex flex-wrap items-center justify-between">
              <h2 className="text-xl font-semibold dark:text-white">
                {roomDetails?.name || `Réunion: ${roomId?.substring(0, 8)}`}
              </h2>
              {roomDetails?.code && (
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <p className="text-sm dark:text-gray-400">Code: <span className="font-medium">{roomDetails.code}</span></p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCopyRoomCode}
                  >
                    Copier
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col lg:flex-row gap-4">
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg shadow p-4 h-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin mr-2 text-blue-600" />
                  <p className="text-gray-500 dark:text-gray-400">Connexion à la réunion...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  {localStream && (
                    <div className="aspect-video">
                      <VideoTile
                        stream={localStream}
                        peerName={user?.fullName || "Vous"}
                        isLocal={true}
                        isAudioEnabled={isAudioEnabled}
                      />
                    </div>
                  )}
                  
                  {participants
                    .filter(p => !p.isLocal && p.stream)
                    .map((participant) => (
                      <div key={participant.id} className="aspect-video">
                        <VideoTile
                          stream={participant.stream!}
                          peerName={participant.name}
                          isLocal={false}
                          isAudioEnabled={participant.isAudioEnabled}
                        />
                      </div>
                    ))}
                  
                  {participants.filter(p => !p.isLocal && p.stream).length === 0 && localStream && (
                    <div className="col-span-full h-full flex items-center justify-center">
                      <div className="text-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          Aucun autre participant pour le moment
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Invitez des participants à rejoindre avec le code: <span className="font-bold">{roomDetails?.code || 'N/A'}</span>
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
  );
};

export default Meeting;
