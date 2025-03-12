
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignedIn } from "@clerk/clerk-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/utils/api";

const NewMeeting = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const createMeeting = async () => {
    try {
      setIsCreating(true);
      // Utiliser notre API pour créer une nouvelle réunion
      const roomData = await apiClient.createRoom();
      navigate(`/meeting/${roomData.roomId}`);
    } catch (error) {
      console.error("Erreur lors de la création de la réunion:", error);
      toast.error("Impossible de créer la réunion pour le moment.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SignedIn>
        <Header />
        <main className="pt-24 container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Créer une nouvelle réunion
            </h1>
            <div className="space-y-6">
              <Button
                onClick={createMeeting}
                className="w-full"
                disabled={isCreating}
              >
                {isCreating ? "Création en cours..." : "Créer une réunion instantanée"}
              </Button>
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
