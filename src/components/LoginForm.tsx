
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const { signIn } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !username.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    signIn({ email, username });
    toast.success("Connexion réussie");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium dark:text-white mb-1">
          Nom d'utilisateur
        </label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Votre nom d'utilisateur"
          required
        />
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium dark:text-white mb-1">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          required
        />
      </div>
      
      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
        Se connecter
      </Button>
    </form>
  );
};

export default LoginForm;
