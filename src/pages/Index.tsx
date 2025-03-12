
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";

const Index = () => {
  const [meetingCode, setMeetingCode] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingCode.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un code de réunion valide",
        variant: "destructive",
      });
      return;
    }
    navigate(`/meeting/${meetingCode.trim()}`);
  };

  const handleCreateMeeting = () => {
    const newMeetingId = uuidv4().substring(0, 8);
    navigate(`/meeting/${newMeetingId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <SignedIn>
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
                >
                  Créer une réunion
                </Button>
              </div>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-md">
                <h2 className="text-2xl font-semibold mb-6 dark:text-white">Rejoindre une réunion</h2>
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Entrez un code de réunion"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                  <Button
                    onClick={handleJoinMeeting}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                    disabled={!meetingCode.trim()}
                  >
                    Rejoindre maintenant
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="max-w-md w-full px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4 app-name">
                Vizioway
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Connexion à votre compte pour accéder à la plateforme
              </p>
            </div>
            <SignIn />
          </div>
        </div>
      </SignedOut>
    </div>
  );
};

export default Index;
