
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { SignedIn } from "@clerk/clerk-react";
import Header from "@/components/Header";

const Meeting = () => {
  const { id } = useParams();

  useEffect(() => {
    // Ici nous ajouterons l'initialisation de la connexion 100ms
    console.log("Initialisation de la réunion:", id);
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SignedIn>
        <Header />
        <main className="pt-24 container mx-auto px-4">
          <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-4">
            <div className="aspect-video bg-gray-900 rounded-lg mb-4">
              {/* Zone vidéo principale */}
            </div>
            <div className="flex items-center justify-center space-x-4">
              <button className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white">
                Quitter
              </button>
            </div>
          </div>
        </main>
      </SignedIn>
    </div>
  );
};

export default Meeting;
