
import { SignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import Header from "@/components/Header";

const Index = () => {
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <input
                type="text"
                placeholder="Entrez un code de réunion"
                className="w-full sm:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Rejoindre
              </button>
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
