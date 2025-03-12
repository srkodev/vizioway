
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignedIn } from "@clerk/clerk-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/utils/api";

const NewMeeting = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [meetingName, setMeetingName] = useState("");

  const createMeeting = async () => {
    try {
      setIsCreating(true);
      
      // In a production app, we would create a room with 100ms API
      // For simplicity, we're using a random roomId
      const randomRoomId = Math.random().toString(36).substring(2, 12);
      
      toast.success("Réunion créée avec succès");
      navigate(`/meeting/${randomRoomId}`);
    } catch (error) {
      console.error("Erreur lors de la création de la réunion:", error);
      toast.error("Impossible de créer la réunion pour le moment.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Comfortaa, sans-serif' }}>
      <SignedIn>
        <Header appName="Vizioway" />
        <main className="pt-24 container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Créer une nouvelle réunion
            </h1>
            <div className="space-y-6">
              <div>
                <label htmlFor="meeting-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la réunion (optionnel)
                </label>
                <Input
                  id="meeting-name"
                  type="text"
                  placeholder="Ex: Réunion d'équipe hebdomadaire"
                  value={meetingName}
                  onChange={(e) => setMeetingName(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Button
                onClick={createMeeting}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isCreating}
              >
                {isCreating ? "Création en cours..." : "Créer une réunion instantanée"}
              </Button>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Fonctionnalités disponibles:</h3>
                <ul className="list-disc pl-5 space-y-1 text-blue-700">
                  <li>Chat en temps réel</li>
                  <li>Audio et vidéo</li>
                  <li>Partage d'écran</li>
                  <li>Liste des participants</li>
                  <li>Possibilité de couper le micro/la caméra</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-600 text-center">
                Une fois la réunion créée, vous pourrez inviter d'autres participants en partageant le lien
              </p>
            </div>
          </div>
        </main>
      </SignedIn>
    </div>
  );
};

export default NewMeeting;
