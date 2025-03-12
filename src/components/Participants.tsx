
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  useHMSStore, 
  selectPeers,
  selectDominantSpeaker,
  HMSPeer
} from "@100mslive/react-sdk";

interface ParticipantsProps {
  onClose: () => void;
}

const Participants = ({ onClose }: ParticipantsProps) => {
  const peers = useHMSStore(selectPeers);
  const dominantSpeaker = useHMSStore(selectDominantSpeaker);

  // Fonction sécurisée pour vérifier l'état du micro
  const getAudioStatus = (peer: HMSPeer) => {
    if (!peer.audioTrack) return false;
    if (typeof peer.audioTrack === 'string') return false;
    if (typeof peer.audioTrack.enabled !== 'boolean') return false;
    return peer.audioTrack.enabled;
  };

  // Fonction sécurisée pour vérifier l'état de la caméra
  const getVideoStatus = (peer: HMSPeer) => {
    if (!peer.videoTrack) return false;
    if (typeof peer.videoTrack === 'string') return false;
    if (typeof peer.videoTrack.enabled !== 'boolean') return false;
    return peer.videoTrack.enabled;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-medium">Participants ({peers.length})</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {peers.map((peer) => (
          <div 
            key={peer.id} 
            className={`flex items-center p-3 rounded-md ${
              dominantSpeaker?.id === peer.id ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold mr-3">
              {peer.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-medium">{peer.name} {peer.isLocal ? ' (Vous)' : ''}</p>
              <p className="text-xs text-gray-500">
                {getAudioStatus(peer) ? 'Micro activé' : 'Micro désactivé'}
                {' • '}
                {getVideoStatus(peer) ? 'Caméra activée' : 'Caméra désactivée'}
              </p>
            </div>
            {dominantSpeaker?.id === peer.id && (
              <div className="w-3 h-3 bg-green-500 rounded-full ml-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Participants;
