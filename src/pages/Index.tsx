
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { 
  Video, 
  Users, 
  MessageSquare, 
  ScreenShare, 
  Mic
} from "lucide-react";

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
        <Header appName="Vizioway" />
        <main className="pt-24 container mx-auto px-4 pb-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Bienvenue sur Vizioway
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Votre plateforme de visioconférence sécurisée et simple d'utilisation
            </p>
            
            <form onSubmit={handleJoinMeeting} className="mb-12">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
                <Input
                  type="text"
                  placeholder="Entrez un code de réunion"
                  className="w-full"
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-2xl font-semibold mb-6">Démarrer une réunion</h2>
                <div className="mb-6">
                  <p className="text-gray-600 mb-6">
                    Créez une nouvelle réunion et invitez vos collaborateurs à vous rejoindre.
                  </p>
                  <Button 
                    onClick={() => navigate("/new-meeting")}
                    className="w-full"
                    size="lg"
                  >
                    Nouvelle réunion
                  </Button>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <h2 className="text-2xl font-semibold mb-6">Rejoindre une réunion</h2>
                <div className="mb-6">
                  <p className="text-gray-600 mb-6">
                    Rejoignez une réunion existante en utilisant le code fourni par l'organisateur.
                  </p>
                  <div className="space-y-3">
                    <Input
                      type="text"
                      placeholder="Entrez un code de réunion"
                      value={meetingCode}
                      onChange={(e) => setMeetingCode(e.target.value)}
                    />
                    <Button
                      onClick={handleJoinMeeting}
                      className="w-full"
                      size="lg"
                      disabled={!meetingCode.trim()}
                    >
                      Rejoindre maintenant
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-8">Nos fonctionnalités</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <FeatureCard 
                  icon={<Video className="h-8 w-8" />}
                  title="Vidéo HD"
                  description="Profitez d'une qualité vidéo exceptionnelle"
                />
                <FeatureCard 
                  icon={<Mic className="h-8 w-8" />}
                  title="Audio clair"
                  description="Son cristallin pour vos communications"
                />
                <FeatureCard 
                  icon={<MessageSquare className="h-8 w-8" />}
                  title="Chat en direct"
                  description="Échangez des messages pendant vos réunions"
                />
                <FeatureCard 
                  icon={<ScreenShare className="h-8 w-8" />}
                  title="Partage d'écran"
                  description="Partagez votre écran avec les participants"
                />
                <FeatureCard 
                  icon={<Users className="h-8 w-8" />}
                  title="Nombreux participants"
                  description="Réunissez toute votre équipe"
                />
              </div>
            </div>
          </div>
        </main>
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Vizioway
              </h1>
              <p className="text-gray-600">
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

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
    <div className="mb-4 text-blue-600">{icon}</div>
    <h3 className="font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

export default Index;
