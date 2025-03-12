
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  useHMSStore, 
  selectPeers,
  selectDominantSpeaker,
  HMSPeer,
  selectIsPeerAudioEnabled,
  selectIsPeerVideoEnabled
} from "@100mslive/react-sdk";

interface ParticipantsProps {
  onClose: () => void;
}

const Participants = ({ onClose }: ParticipantsProps) => {
  const peers = useHMSStore(selectPeers) || [];
  const dominantSpeaker = useHMSStore(selectDominantSpeaker);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h3 className="text-lg font-medium dark:text-white">Participants ({peers.length})</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {peers.length === 0 ? (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">Aucun participant pour le moment</p>
        ) : (
          peers.map((peer) => {
            const isAudioEnabled = useHMSStore(selectIsPeerAudioEnabled(peer.id));
            const isVideoEnabled = useHMSStore(selectIsPeerVideoEnabled(peer.id));
            
            return (
              <div 
                key={peer.id} 
                className={`flex items-center p-3 rounded-md ${
                  dominantSpeaker?.id === peer.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold mr-3">
                  {peer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium dark:text-white">{peer.name} {peer.isLocal ? ' (Vous)' : ''}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isAudioEnabled ? 'Micro activé' : 'Micro désactivé'}
                    {' • '}
                    {isVideoEnabled ? 'Caméra activée' : 'Caméra désactivée'}
                  </p>
                </div>
                {dominantSpeaker?.id === peer.id && (
                  <div className="w-3 h-3 bg-green-500 rounded-full ml-2" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Participants;
