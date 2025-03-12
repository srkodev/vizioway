
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Participant {
  id: string;
  name: string;
  isLocal: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

interface SimpleParticipantsProps {
  onClose: () => void;
  participants: Participant[];
}

const SimpleParticipants = ({ onClose, participants }: SimpleParticipantsProps) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h3 className="text-lg font-medium dark:text-white">Participants ({participants.length})</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {participants.length === 0 ? (
          <p className="text-gray-500 text-center py-8 dark:text-gray-400">
            Aucun participant pour le moment
          </p>
        ) : (
          <ul className="space-y-2">
            {participants.map((participant) => (
              <li key={participant.id} className="flex items-center justify-between p-3 border-b dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="dark:text-white">
                    {participant.name} {participant.isLocal ? "(Vous)" : ""}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {participant.isLocal ? "Hôte" : "Participant"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SimpleParticipants;
