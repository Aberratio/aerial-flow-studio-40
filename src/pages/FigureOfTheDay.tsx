import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, BookOpen, Target, Lock, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

interface Figure {
  id: string;
  name: string;
  description: string | null;
  difficulty_level: string | null;
  image_url: string | null;
  video_url: string | null;
  category: string | null;
  instructions: string | null;
  premium: boolean;
}

const FigureOfTheDay = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPremiumAccess } = useSubscriptionStatus();
  const [figure, setFigure] = useState<Figure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFigureOfTheDay();
    }
  }, [user]);

  const fetchFigureOfTheDay = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's sports preferences
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("sports")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const userSports = profile?.sports || [];

      if (userSports.length === 0) {
        toast({
          title: "No sports selected",
          description: "Please select your sports preferences first",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const { data: categories, error: categoriesError } = await supabase
        .from("sport_categories")
        .select("key_name")
        .in("id", userSports);

      if (categoriesError) throw categoriesError;

      // Fetch random figure from user's sports categories
      const { data: figures, error: figuresError } = await supabase
        .from("figures")
        .select("*")
        .in("category", categories?.map((category) => category.key_name) || [])
        .eq("premium", false); // Only fetch free figures for now

      if (figuresError) throw figuresError;

      if (!figures || figures.length === 0) {
        toast({
          title: "No figures available",
          description: "No figures found for your selected sports",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // If no free figures, try premium figures for premium users
      if ((!figures || figures.length === 0) && hasPremiumAccess) {
        const { data: premiumFigures, error: premiumError } = await supabase
          .from("figures")
          .select("*")
          .in("category", userSports);

        if (premiumError) throw premiumError;

        if (premiumFigures && premiumFigures.length > 0) {
          const randomIndex = Math.floor(Math.random() * premiumFigures.length);
          setFigure(premiumFigures[randomIndex]);
          return;
        }
      }

      // Select random figure from free figures
      const randomIndex = Math.floor(Math.random() * figures.length);
      setFigure(figures[randomIndex]);
    } catch (error) {
      console.error("Error fetching figure of the day:", error);
      toast({
        title: "Error",
        description: "Failed to load figure of the day",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-white">Loading your figure of the day...</div>
      </div>
    );
  }

  if (!figure) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            No Figure Available
          </h1>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const isPremiumFigure = figure?.premium && !hasPremiumAccess;

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Button
            onClick={() => navigate("/home")}
            variant="ghost"
            size="sm"
            className="text-white hover:text-primary p-0 h-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 mb-2">
            <Target className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
            Figure of the Day
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Perfect your technique with today's featured move
          </p>
        </div>

        {/* Figure Card */}
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-white text-xl sm:text-2xl mb-2 flex items-center gap-2">
                  {figure.name}
                  {isPremiumFigure && (
                    <Lock className="w-5 h-5 text-yellow-400" />
                  )}
                </CardTitle>
                <div className="flex flex-wrap gap-2 mb-4">
                  {figure.category && (
                    <Badge
                      variant="secondary"
                      className="bg-purple-500/20 text-purple-400"
                    >
                      {figure.category}
                    </Badge>
                  )}
                  {figure.difficulty_level && (
                    <Badge
                      variant="outline"
                      className="border-white/20 text-white"
                    >
                      {figure.difficulty_level}
                    </Badge>
                  )}
                  {figure.premium && (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-500/20 text-yellow-400"
                    >
                      Premium
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Image/Video */}
            <div className="relative bg-black/20 rounded-lg overflow-hidden">
              {figure.image_url ? (
                <img
                  src={figure.image_url}
                  alt={figure.name}
                  className="w-full h-auto max-h-96 object-contain mx-auto"
                  style={{ display: "block" }}
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center text-white/60">
                  <BookOpen className="w-16 h-16" />
                </div>
              )}
              {isPremiumFigure && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center text-white">
                    <Lock className="w-12 h-12 mx-auto mb-2 text-yellow-400" />
                    <p className="font-semibold">Premium Content</p>
                    <p className="text-sm text-white/80">
                      Upgrade to view this figure
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {figure.description && !isPremiumFigure && (
              <div>
                <h3 className="text-white font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{figure.description}</p>
              </div>
            )}

            {/* Instructions */}
            {figure.instructions && !isPremiumFigure && (
              <div>
                <h3 className="text-white font-semibold mb-2">Instructions</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {figure.instructions}
                </p>
              </div>
            )}

            {/* Premium Message */}
            {isPremiumFigure && (
              <div className="text-center py-4">
                <p className="text-white/80 mb-4">
                  This is a premium figure. Upgrade to access detailed
                  instructions and content.
                </p>
                <Button
                  onClick={() => navigate("/pricing")}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  Upgrade to Premium
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {figure.video_url && !isPremiumFigure && (
                <Button className="flex-1" asChild>
                  <a
                    href={figure.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Video
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate(`/exercise/${figure.id}`)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                View in Library
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/library")}
                className="flex-1"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Explore More
              </Button>
              <Button
                variant="secondary"
                onClick={fetchFigureOfTheDay}
                className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 sm:flex-initial"
              >
                <Target className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">New Figure</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FigureOfTheDay;
