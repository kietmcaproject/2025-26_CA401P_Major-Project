import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Moon, LogOut, User, Shield, Map } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const navLinks = [
  { label: "FEATURES", target: "features" },
  { label: "DESTINATIONS", target: "destinations" },
  { label: "EXPLORE MAP", href: "/explore" },
  { label: "LOCAL SECRETS", href: "/local-secrets" },
  { label: "BUDDIES", href: "/buddies" },
  { label: "PROOFS", href: "/proofs" },
  { label: "CONTACT", target: "contact" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useIsAdmin();

  const scrollToSection = (id: string) => {
    setMobileOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 300);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNavClick = (link: typeof navLinks[0]) => {
    setMobileOpen(false);
    if ("href" in link && link.href) navigate(link.href);
    else if ("target" in link && link.target) scrollToSection(link.target);
  };

  const handleAuthAction = () => {
    if (user) navigate("/dashboard");
    else navigate("/auth");
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black text-black-foreground border-b border-black-glow/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <a href="/" className="text-xl font-extrabold tracking-widest uppercase">
            MYSTIGO
          </a>

          <nav className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link)}
                className="text-black-foreground/80 hover:text-accent text-xs font-medium tracking-wide transition-colors"
              >
                {link.label}
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="text-accent hover:text-accent-glow text-xs font-bold tracking-wide transition-colors flex items-center gap-1"
              >
                <Shield className="w-3 h-3" /> ADMIN
              </button>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => document.documentElement.classList.toggle("dark")}
              className="w-10 h-10 rounded-full bg-black-glow/20 flex items-center justify-center text-black-foreground hover:bg-black-glow/30 transition-colors"
              title="Toggle dark mode"
            >
              <Moon className="w-4 h-4" />
            </button>
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Button onClick={() => navigate("/dashboard")} className="bg-accent text-accent-foreground font-bold hover:bg-accent/90 rounded-md px-4 py-2 text-sm">
                  <User className="w-4 h-4 mr-1" /> Dashboard
                </Button>
                <Button onClick={handleSignOut} variant="outline" className="border-black-foreground/20 text-black-foreground hover:bg-black-glow/20 rounded-md px-3 py-2 text-sm">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={handleAuthAction} className="hidden md:flex bg-accent text-accent-foreground font-bold hover:bg-accent/90 rounded-md px-6 py-2 text-sm tracking-wide">
                START JOURNEY
              </Button>
            )}
            <button className="lg:hidden text-black-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden mt-4 pb-4 space-y-3">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link)}
                className="block text-black-foreground/80 hover:text-accent text-sm font-medium w-full text-left"
              >
                {link.label}
              </button>
            ))}
            {isAdmin && (
              <button onClick={() => { setMobileOpen(false); navigate("/admin"); }} className="block text-accent text-sm font-bold w-full text-left">
                ADMIN PANEL
              </button>
            )}
            {user ? (
              <>
                <Button onClick={() => navigate("/dashboard")} className="w-full bg-accent text-accent-foreground font-bold hover:bg-accent/90 rounded-md text-sm">
                  Dashboard
                </Button>
                <Button onClick={handleSignOut} variant="outline" className="w-full border-black-foreground/20 text-black-foreground hover:bg-black-glow/20 text-sm">
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={handleAuthAction} className="w-full bg-accent text-accent-foreground font-bold hover:bg-accent/90 rounded-md text-sm">
                START JOURNEY
              </Button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
