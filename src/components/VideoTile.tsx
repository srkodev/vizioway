
import { useRef, useEffect, useState } from "react";
import { 
  useHMSStore, 
  selectVideoTrackByPeerID, 
  selectAudioTrackByPeerID,
  selectIsPeerAudioEnabled
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
  const audioTrack = useHMSStore(selectAudioTrackByPeerID(peerId));
  const isPeerAudioEnabled = useHMSStore(selectIsPeerAudioEnabled(peerId));
  const [videoEnabled, setVideoEnabled] = useState(false);
  
  useEffect(() => {
    if (videoTrack?.enabled && videoRef.current) {
      try {
        // 100ms SDK specific way to attach video
        if (videoTrack && videoRef.current) {
          const attachVideoTrack = async () => {
            try {
              // @ts-ignore - we know this method exists in the 100ms SDK
              await videoTrack.attachTo(videoRef.current);
              setVideoEnabled(true);
            } catch (err) {
              console.error("Error attaching video:", err);
              setVideoEnabled(false);
            }
          };
          
          attachVideoTrack();
        }
      } catch (err) {
        console.error("Error attaching video:", err);
        setVideoEnabled(false);
      }
      
      return () => {
        if (videoTrack && videoRef.current) {
          try {
            // @ts-ignore - we know this method exists in the 100ms SDK
            videoTrack.detachFrom(videoRef.current);
          } catch (err) {
            console.error("Error detaching video:", err);
          }
        }
      };
    } else {
      setVideoEnabled(false);
    }
  }, [videoTrack]);

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
          {!isPeerAudioEnabled && <MicOff className="h-4 w-4" />}
        </div>
      </div>
    </div>
  );
};

export default VideoTile;
