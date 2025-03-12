
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Mic, MicOff, Video, VideoOff, 
  ScreenShare, Share2, MessageCircle, Users, PhoneOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  useHMSActions, 
  useHMSStore, 
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectIsLocalScreenShared
} from "@100mslive/react-sdk";

interface MeetingControlsProps {
  onChatToggle: () => void;
  onParticipantsToggle: () => void;
}

const MeetingControls = ({ onChatToggle, onParticipantsToggle }: MeetingControlsProps) => {
  const navigate = useNavigate();
  const hmsActions = useHMSActions();
  
  const isAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const isScreenShared = useHMSStore(selectIsLocalScreenShared);

  const toggleAudio = async () => {
    await hmsActions.setLocalAudioEnabled(!isAudioEnabled);
  };

  const toggleVideo = async () => {
    await hmsActions.setLocalVideoEnabled(!isVideoEnabled);
  };

  const toggleScreenShare = async () => {
    await hmsActions.setScreenShareEnabled(!isScreenShared);
  };

  const leaveRoom = async () => {
    try {
      await hmsActions.leave();
      navigate("/");
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center space-x-2 md:space-x-4">
      <Button 
        onClick={toggleAudio} 
        variant="outline" 
        size="icon" 
        className={`rounded-full p-3 ${!isAudioEnabled ? 'bg-red-100' : ''}`}
      >
        {isAudioEnabled ? <Mic /> : <MicOff className="text-red-500" />}
      </Button>
      
      <Button 
        onClick={toggleVideo} 
        variant="outline" 
        size="icon" 
        className={`rounded-full p-3 ${!isVideoEnabled ? 'bg-red-100' : ''}`}
      >
        {isVideoEnabled ? <Video /> : <VideoOff className="text-red-500" />}
      </Button>
      
      <Button 
        onClick={toggleScreenShare} 
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
        onClick={leaveRoom} 
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
