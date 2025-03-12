
import { useRef, useEffect } from "react";
import { 
  useHMSStore, 
  selectCameraStreamByPeerID,
  selectScreenShareByPeerID
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
  const videoTrack = useHMSStore(isScreenShare 
    ? selectScreenShareByPeerID(peerId) 
    : selectCameraStreamByPeerID(peerId));

  useEffect(() => {
    if (videoRef.current && videoTrack) {
      if (videoTrack.enabled) {
        const videoElement = videoRef.current;
        if (videoElement.srcObject !== videoTrack.track) {
          videoElement.srcObject = new MediaStream([videoTrack.track]);
        }
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
        className={`w-full h-full object-cover ${!videoTrack?.enabled ? 'hidden' : ''}`}
      />

      {!videoTrack?.enabled && (
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
