
import { useRef, useEffect, useState } from "react";
import { useHMSStore, selectVideoTrackByPeerID } from "@100mslive/react-sdk";
import { Mic, MicOff } from "lucide-react";

interface VideoTileProps {
  peerId: string;
  peerName: string;
  isLocal: boolean;
  isAudioEnabled?: boolean;
  isScreenShare?: boolean;
  simulationMode?: boolean;
}

const VideoTile = ({ 
  peerId, 
  peerName, 
  isLocal, 
  isAudioEnabled = true,
  isScreenShare = false,
  simulationMode = true
}: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoTrack = useHMSStore(selectVideoTrackByPeerID(peerId));
  const [videoEnabled, setVideoEnabled] = useState(false);
  
  useEffect(() => {
    // In simulation mode, we'll always consider video as enabled for demo purposes
    if (simulationMode) {
      setVideoEnabled(!!Math.round(Math.random())); // Randomly enable/disable video for simulation
      
      if (videoRef.current) {
        // For simulation, we can create a mock video stream
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(e => console.error("Error playing video:", e));
            }
          })
          .catch(e => {
            console.error("Could not get video:", e);
            setVideoEnabled(false);
          });
      }
    } else if (videoTrack) {
      // This would be used in production with real 100ms integration
      setVideoEnabled(false); // Default to false for non-simulation mode
    }
  }, [peerId, simulationMode, videoTrack]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-800 w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || !isAudioEnabled}
        className={`w-full h-full object-cover ${videoEnabled ? '' : 'hidden'}`}
      />

      {!videoEnabled && (
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
