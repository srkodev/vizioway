
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

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

  return (
    <div className="min-h-screen bg-gray-50">
      <SignedIn>
        <Header />
        <main className="pt-24 container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Bienvenue sur CoZoomia
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Votre plateforme de visioconférence sécurisée et simple d'utilisation
            </p>
            <form onSubmit={handleJoinMeeting} className="mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <input
                  type="text"
                  placeholder="Entrez un code de réunion"
                  className="w-full sm:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                />
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                >
                  Rejoindre
                </Button>
              </div>
            </form>
            <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Démarrer rapidement</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-lg mb-2">Nouvelle réunion</h3>
                  <p className="text-gray-600 mb-4">
                    Créez une nouvelle réunion et invitez des participants
                  </p>
                  <Button 
                    onClick={() => navigate("/new-meeting")}
                    className="w-full"
                  >
                    Créer une réunion
                  </Button>
                </div>
                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-lg mb-2">Rejoindre une réunion</h3>
                  <p className="text-gray-600 mb-4">
                    Participez à une réunion avec un code
                  </p>
                  <input
                    type="text"
                    placeholder="Entrez un code de réunion"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                  />
                  <Button
                    onClick={handleJoinMeeting}
                    className="w-full"
                    disabled={!meetingCode.trim()}
                  >
                    Rejoindre
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center">
          <SignIn />
        </div>
      </SignedOut>
    </div>
  );
};

export default Index;
