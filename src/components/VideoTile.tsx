
import { useRef, useEffect } from "react";
import { 
  useHMSStore, 
  selectVideoTrackByPeerID,
  selectLocalVideoTrackID,
  selectRemoteVideoTrackByID
} from "@100mslive/react-sdk";
import { Mic, MicOff } from "lucide-react";

interface VideoTileProps {
  peerId: string;
  peerName: string;
  isLocal: boolean;
  isAudioEnabled?: boolean;
  isScreenShare?: boolean;
}

const VideoTile = ({ 
  peerId, 
  peerName, 
  isLocal, 
  isAudioEnabled = true,
  isScreenShare = false
}: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoTrack = useHMSStore(selectVideoTrackByPeerID(peerId));
  
  // We'll handle screen sharing separately in a more complex implementation
  // For now, focusing on fixing the type errors

  useEffect(() => {
    if (videoRef.current && videoTrack && videoTrack.enabled) {
      try {
        const videoElement = videoRef.current;
        
        if (videoTrack.id && !videoElement.srcObject) {
          const mediaStream = new MediaStream();
          // Safely get the MediaStreamTrack
          const track = typeof videoTrack.getMediaTrack === 'function' ? 
            videoTrack.getMediaTrack() : null;
            
          if (track) {
            mediaStream.addTrack(track);
            videoElement.srcObject = mediaStream;
          }
        }
      } catch (error) {
        console.error("Error attaching video track:", error);
      }
    }
  }, [videoTrack]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-800 w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || !isAudioEnabled}
        className={`w-full h-full object-cover ${videoTrack && videoTrack.enabled ? '' : 'hidden'}`}
      />

      {(!videoTrack || !videoTrack.enabled) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
            {peerName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-md text-sm flex items-center gap-2">
          {isLocal ? `${peerName} (Vous)` : peerName}
          {!isAudioEnabled && <MicOff className="h-4 w-4" />}
        </div>
      </div>
    </div>
  );
};

export default VideoTile;
