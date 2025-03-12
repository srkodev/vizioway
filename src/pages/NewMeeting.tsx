
import { useNavigate } from "react-router-dom";
import { SignedIn } from "@clerk/clerk-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";

const NewMeeting = () => {
  const navigate = useNavigate();

  const createMeeting = async () => {
    try {
      const randomRoomId = uuidv4().substring(0, 8);
      toast.success("Réunion créée avec succès");
      navigate(`/meeting/${randomRoomId}`);
    } catch (error) {
      console.error("Erreur lors de la création de la réunion:", error);
      toast.error("Impossible de créer la réunion pour le moment.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <SignedIn>
        <Header appName="Vizioway" />
        <main className="pt-24 container mx-auto px-4">
          <div className="max-w-xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Créer une nouvelle réunion
            </h1>
            <div className="space-y-6">
              <Button
                onClick={createMeeting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Créer une réunion instantanée
              </Button>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
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
