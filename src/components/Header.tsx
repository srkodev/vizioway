
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface HeaderProps {
  appName?: string;
}

const Header = ({ appName = "Vizioway" }: HeaderProps) => {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSignOut = () => {
    signOut();
    toast.success("Vous êtes déconnecté");
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 app-name">
            {appName}
          </span>
        </Link>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm hidden md:inline dark:text-white">
                {user.username}
              </span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSignOut}
                aria-label="Se déconnecter"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
