import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  CheckCircle, 
  Bookmark, 
  AlertCircle, 
  CircleMinus,
  Edit,
  Tag,
  Target,
  Play
} from "lucide-react";

interface Figure {
  id: string;
  name: string;
  description?: string;
  difficulty_level?: string;
  category?: string;
  instructions?: string;
  image_url?: string;
  video_url?: string;
  type?: string;
  tags?: string[];
}

interface FigureProgress {
  id: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const FigureDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [figure, setFigure] = useState<Figure | null>(null);
  const [figureProgress, setFigureProgress] = useState<FigureProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusOptions, setShowStatusOptions] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFigure();
      fetchFigureProgress();
    }
  }, [id, user]);

  const fetchFigure = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('figures')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setFigure(data);
    } catch (error) {
      console.error('Error fetching figure:', error);
      toast({
        title: "Error",
        description: "Failed to load figure details.",
        variant: "destructive",
      });
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

  const fetchFigureProgress = async () => {
    if (!id || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('figure_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('figure_id', id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      setFigureProgress(data);
    } catch (error) {
      console.error('Error fetching figure progress:', error);
    }
  };

  const updateFigureStatus = async (status: string) => {
    if (!figure || !user) return;
    
    try {
      setUpdatingStatus(true);

      const { data, error } = await supabase
        .from('figure_progress')
        .upsert(
          {
            user_id: user.id,
            figure_id: figure.id,
            status: status,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,figure_id',
          }
        )
        .select()
        .single();

      if (error) throw error;
      setFigureProgress(data);
      setShowStatusOptions(false);
      toast({
        title: "Status updated!",
        description: `Exercise marked as ${status.replace("_", " ")}.`,
      });
    } catch (error) {
      console.error('Error updating figure status:', error);
      toast({
        title: "Error",
        description: "Failed to update exercise status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Advanced":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Expert":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "for_later":
        return <Bookmark className="w-4 h-4 text-blue-400" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <CircleMinus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "for_later":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!figure) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Figure not found</h1>
          <Button onClick={() => navigate('/library')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Media Section */}
          <Card className="glass-effect border-white/10">
            <CardContent className="p-0">
              {figure.video_url ? (
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={figure.video_url}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay={false}
                  />
                </div>
              ) : figure.image_url ? (
                <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                  <img
                    src={figure.image_url}
                    alt={figure.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full aspect-video flex items-center justify-center bg-gray-900 rounded-lg">
                  <div className="text-center">
                    <Target className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground">No media available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details Section */}
          <div className="space-y-6">
            <Card className="glass-effect border-white/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-3xl font-bold text-white">{figure.name}</h1>
                  {figure.difficulty_level && (
                    <Badge className={getDifficultyColor(figure.difficulty_level)}>
                      {figure.difficulty_level}
                    </Badge>
                  )}
                </div>

                {figure.description && (
                  <p className="text-muted-foreground mb-4">{figure.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {figure.category && (
                    <Badge variant="outline" className="border-white/20 text-white/80">
                      {figure.category}
                    </Badge>
                  )}
                  {figure.type && (
                    <Badge variant="outline" className="border-white/20 text-white/80">
                      {figure.type}
                    </Badge>
                  )}
                  {figure.tags &&
                    figure.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-purple-500/30 text-purple-300"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Progress Status Section */}
            {user && (
              <Card className="glass-effect border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">My Progress</h3>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Current status:</span>
                      {figureProgress ? (
                        <Badge className={getStatusColor(figureProgress.status)}>
                          {getStatusIcon(figureProgress.status)}
                          <span className="ml-1 capitalize">
                            {figureProgress.status.replace("_", " ")}
                          </span>
                        </Badge>
                      ) : (
                        <Badge className={getStatusColor("not_tried")}>
                          {getStatusIcon("not_tried")}
                          <span className="ml-1">Not Tried</span>
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowStatusOptions(!showStatusOptions)}
                      className="text-muted-foreground hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>

                  {showStatusOptions && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateFigureStatus("completed")}
                        disabled={updatingStatus}
                        className={`border-green-500/30 text-green-400 hover:bg-green-500/20 ${
                          figureProgress?.status === "completed" ? "bg-green-500/20" : ""
                        }`}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Completed
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateFigureStatus("for_later")}
                        disabled={updatingStatus}
                        className={`border-blue-500/30 text-blue-400 hover:bg-blue-500/20 ${
                          figureProgress?.status === "for_later" ? "bg-blue-500/20" : ""
                        }`}
                      >
                        <Bookmark className="w-4 h-4 mr-2" />
                        For Later
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateFigureStatus("failed")}
                        disabled={updatingStatus}
                        className={`border-red-500/30 text-red-400 hover:bg-red-500/20 ${
                          figureProgress?.status === "failed" ? "bg-red-500/20" : ""
                        }`}
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Failed
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateFigureStatus("not_tried")}
                        disabled={updatingStatus}
                        className={`border-gray-500/30 text-gray-400 hover:bg-gray-500/20 ${
                          figureProgress?.status === "not_tried" || !figureProgress
                            ? "bg-gray-500/20"
                            : ""
                        }`}
                      >
                        <CircleMinus className="w-4 h-4 mr-2" />
                        Not Tried
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            {figure.instructions && (
              <Card className="glass-effect border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Instructions</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {figure.instructions}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FigureDetail;