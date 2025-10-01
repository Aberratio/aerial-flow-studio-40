import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, FileText, Shield, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const SettingsTab: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <div className="space-y-6">
      {/* Links Section */}
      <Card className="glass-effect border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link to="/privacy-policy">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5"
            >
              <Shield className="w-5 h-5 mr-3" />
              Privacy Policy
            </Button>
          </Link>
          <Link to="/terms-of-use">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5"
            >
              <FileText className="w-5 h-5 mr-3" />
              Terms of Use
            </Button>
          </Link>
          <Link to="/about-us">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5"
            >
              <Info className="w-5 h-5 mr-3" />
              About Us
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Logout Section */}
      <Card className="glass-effect border-white/10">
        <CardContent className="pt-6">
          <Button
            onClick={signOut}
            variant="destructive"
            className="w-full"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
