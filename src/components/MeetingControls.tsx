
import { 
  Mic, MicOff, Video, VideoOff, 
  ScreenShare, Share2, MessageCircle, Users, PhoneOff
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MeetingControlsProps {
  onChatToggle: () => void;
  onParticipantsToggle: () => void;
  onAudioToggle: () => void;
  onVideoToggle: () => void;
  onScreenShareToggle: () => void;
  onLeaveRoom: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenShared: boolean;
}

const MeetingControls = ({ 
  onChatToggle, 
  onParticipantsToggle,
  onAudioToggle,
  onVideoToggle,
  onScreenShareToggle,
  onLeaveRoom,
  isAudioEnabled,
  isVideoEnabled,
  isScreenShared
}: MeetingControlsProps) => {
  return (
    <div className="flex flex-wrap items-center justify-center space-x-2 md:space-x-4">
      <Button 
        onClick={onAudioToggle} 
        variant="outline" 
        size="icon" 
        className={`rounded-full p-3 ${!isAudioEnabled ? 'bg-red-100' : ''}`}
      >
        {isAudioEnabled ? <Mic /> : <MicOff className="text-red-500" />}
      </Button>
      
      <Button 
        onClick={onVideoToggle} 
        variant="outline" 
        size="icon" 
        className={`rounded-full p-3 ${!isVideoEnabled ? 'bg-red-100' : ''}`}
      >
        {isVideoEnabled ? <Video /> : <VideoOff className="text-red-500" />}
      </Button>
      
      <Button 
        onClick={onScreenShareToggle} 
        variant="outline" 
        size="icon" 
        className={`rounded-full p-3 ${isScreenShared ? 'bg-blue-100' : ''}`}
      >
        {isScreenShared ? <Share2 className="text-blue-500" /> : <ScreenShare />}
      </Button>
      
      <Button 
        onClick={onChatToggle} 
        variant="outline" 
        size="icon" 
        className="rounded-full p-3"
      >
        <MessageCircle />
      </Button>
      
      <Button 
        onClick={onParticipantsToggle} 
        variant="outline" 
        size="icon" 
        className="rounded-full p-3"
      >
        <Users />
      </Button>
      
      <Button 
        onClick={onLeaveRoom} 
        variant="destructive" 
        size="icon" 
        className="rounded-full p-3"
      >
        <PhoneOff />
      </Button>
    </div>
  );
};

export default MeetingControls;
