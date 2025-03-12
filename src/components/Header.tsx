
import { UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

interface HeaderProps {
  appName?: string;
}

const Header = ({ appName = "Vizioway" }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-blue-600">
            {appName}
          </span>
        </Link>
        <div className="flex items-center">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
};

export default Header;
