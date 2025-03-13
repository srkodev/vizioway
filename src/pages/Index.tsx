
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiClient } from "@/utils/api";
import LoginForm from "@/components/LoginForm";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [meetingCode, setMeetingCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();
  const { isSignedIn, isLoading } = useAuth();

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!meetingCode.trim()) {
      toast.error("Veuillez entrer un code de réunion valide");
      return;
    }
    
    try {
      setIsJoining(true);
      
      const response = await apiClient.joinRoomByCode(meetingCode.trim());
      
      if (response.success && response.data?.roomId) {
        navigate(`/meeting/${response.data.roomId}`);
      }
    } catch (error) {
      console.error("Erreur lors de la jointure à la réunion:", error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateMeeting = async () => {
    try {
      setIsCreating(true);
      
      const response = await apiClient.createRoom();
      
      if (response.success && response.data?.roomId) {
        navigate(`/meeting/${response.data.roomId}`);
      }
    } catch (error) {
      console.error("Erreur lors de la création de la réunion:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {isSignedIn ? (
        <>
          <Header appName="Vizioway" />
          <main className="pt-24 container mx-auto px-4 pb-12">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 app-name">
                Vizioway
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Votre plateforme de visioconférence sécurisée et simple d'utilisation
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-md">
                  <h2 className="text-2xl font-semibold mb-6 dark:text-white">Nouvelle réunion</h2>
                  <Button 
                    onClick={handleCreateMeeting}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer une réunion"
                    )}
                  </Button>
                </div>
                
                <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-md">
                  <h2 className="text-2xl font-semibold mb-6 dark:text-white">Rejoindre une réunion</h2>
                  <form onSubmit={handleJoinMeeting} className="space-y-3">
                    <Input
                      type="text"
                      placeholder="Entrez un code de réunion"
                      value={meetingCode}
                      onChange={(e) => setMeetingCode(e.target.value)}
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                      disabled={!meetingCode.trim() || isJoining}
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connexion...
                        </>
                      ) : (
                        "Rejoindre maintenant"
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </main>
        </>
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="max-w-md w-full px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4 app-name">
                Vizioway
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Connectez-vous pour accéder à la plateforme
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <LoginForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
