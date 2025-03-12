
import { useRef, useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";

interface VideoTileProps {
  stream: MediaStream;
  peerName: string;
  isLocal: boolean;
  isAudioEnabled?: boolean;
  isScreenShare?: boolean;
}

const VideoTile = ({ 
  stream, 
  peerName, 
  isLocal, 
  isAudioEnabled = true,
  isScreenShare = false
}: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnabled, setVideoEnabled] = useState(false);
  
  useEffect(() => {
    if (stream && videoRef.current) {
      try {
        videoRef.current.srcObject = stream;
        setVideoEnabled(true);
        
        const checkVideo = () => {
          const videoTracks = stream.getVideoTracks();
          setVideoEnabled(videoTracks.length > 0 && videoTracks[0].enabled);
        };
        
        // Vérification initiale
        checkVideo();
        
        // Vérification périodique
        const interval = setInterval(checkVideo, 1000);
        return () => clearInterval(interval);
      } catch (err) {
        console.error("Error setting video stream:", err);
        setVideoEnabled(false);
      }
    } else {
      setVideoEnabled(false);
    }
  }, [stream]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-900 w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${videoEnabled ? '' : 'hidden'}`}
      />

      {!videoEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
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
