
import { useRef, useEffect, useState } from "react";
import { 
  useHMSStore, 
  selectVideoTrackByPeerID,
  HMSPeer
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
  const [videoEnabled, setVideoEnabled] = useState(false);
  
  useEffect(() => {
    // Vérifier si la vidéo est activée de manière sécurisée
    if (videoTrack && typeof videoTrack !== 'string') {
      setVideoEnabled(typeof videoTrack.enabled === 'boolean' ? videoTrack.enabled : false);
    } else {
      setVideoEnabled(false);
    }
    
    if (videoRef.current && videoTrack && typeof videoTrack !== 'string' && videoTrack.enabled) {
      try {
        const videoElement = videoRef.current;
        
        // Pour les besoins de simulation, nous pouvons créer un flux fictif
        if (process.env.NODE_ENV === 'development') {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
              videoElement.srcObject = stream;
              videoElement.play().catch(e => console.error("Error playing video:", e));
            })
            .catch(e => {
              console.error("Could not get video:", e);
            });
        } else if (typeof videoTrack.getMediaTrack === 'function') {
          // Utilisation de 100ms pour obtenir le flux
          const track = videoTrack.getMediaTrack();
          if (track) {
            const mediaStream = new MediaStream([track]);
            videoElement.srcObject = mediaStream;
            videoElement.play().catch(e => console.error("Error playing video:", e));
          }
        }
      } catch (error) {
        console.error("Error attaching video track:", error);
      }
    }
  }, [videoTrack, peerId]);

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
