
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignedIn } from "@clerk/clerk-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const NewMeeting = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const createMeeting = async () => {
    try {
      setIsCreating(true);
      const meetingId = `${Math.random().toString(36).substr(2, 9)}`;
      // Ici nous simulerons la création d'une réunion pour le moment
      // Dans une version future, nous ajouterons l'intégration complète avec 100ms
      navigate(`/meeting/${meetingId}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer la réunion pour le moment.",
      });
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
