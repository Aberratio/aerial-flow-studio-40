import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import AerialJourney from "./AerialJourney";
import SkillTree from "@/components/SkillTree";
import SportLevelManager from "@/components/SportLevelManager";
import SportCategoryManager from "@/components/SportCategoryManager";
import { supabase } from "@/integrations/supabase/client";

const AerialJourneyRoutes = () => {
  const { mode, category } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [sportCategories, setSportCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchSportCategories();
  }, []);

  const fetchSportCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("sport_categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      setSportCategories(data || []);
    } catch (error) {
      console.error("Error fetching sport categories:", error);
    }
  };

  // Admin routes
  if (mode === "admin" && isAdmin) {
    if (category === "levels") {
      return <SportLevelManager onClose={() => navigate("/aerial-journey")} />;
    }
    if (category === "sports") {
      return <SportCategoryManager onClose={() => navigate("/aerial-journey")} />;
    }
  }

  // User sport category routes
  if (mode === "sport" && category) {
    const sportData = sportCategories.find(s => s.key_name === category);
    if (sportData) {
      return (
        <SkillTree
          sportCategory={category}
          sportName={sportData.name}
          onBack={() => navigate("/aerial-journey")}
        />
      );
    }
  }

  // Default: show main aerial journey page
  return <AerialJourney />;
};

export default AerialJourneyRoutes;