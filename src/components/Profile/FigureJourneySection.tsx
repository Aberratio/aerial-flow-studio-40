import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useFigureProgress } from "@/hooks/useFigureProgress";
import { useNavigate } from "react-router-dom";
import { useDictionary } from "@/contexts/DictionaryContext";

export const FigureJourneySection: React.FC = () => {
  const {
    figureProgress,
    loading: figureLoading,
    getFiguresByStatus,
  } = useFigureProgress();
  const navigate = useNavigate();
  const { getDifficultyLabel } = useDictionary();

  const renderFigureGrid = (figures: any[], status: string) => {
    if (figures.length === 0) return null;

    const statusConfig = {
      completed: { label: "Ukończone", icon: "✅", color: "text-green-400" },
      for_later: { label: "Na później", icon: "🔖", color: "text-blue-400" },
      failed: { label: "Nieudane", icon: "❌", color: "text-red-400" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-3 flex items-center">
          <span className={`${config.color} mr-2`}>{config.icon}</span>
          {config.label} ({figures.length})
        </h3>
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {figures.slice(0, 5).map((figure) => (
            <div
              key={figure.id}
              className="flex-shrink-0 w-32 cursor-pointer hover:transform hover:scale-105 transition-transform"
              onClick={() => {
                navigate(`/exercise/${figure.id}`);
              }}
            >
              <div
                className={`aspect-square rounded-lg overflow-hidden mb-2 ${
                  status === "for_later"
                    ? "opacity-70"
                    : status === "failed"
                    ? "grayscale"
                    : ""
                }`}
              >
                {figure.image_url ? (
                  <img
                    src={figure.image_url}
                    alt={figure.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <span className="text-2xl">🤸</span>
                  </div>
                )}
              </div>
              <div className="text-white text-sm font-medium truncate">
                {figure.name}
              </div>
              <div className="text-muted-foreground text-xs">
                {getDifficultyLabel(figure.difficulty_level) || "Początkujący"}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="glass-effect border-white/10 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              Moja podróż przez figury
            </h2>
            <Link
              to="/profile/my-journey"
              className="flex items-center text-purple-400 hover:text-purple-300 text-sm"
            >
              Pokaż więcej <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {figureLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Ładowanie figur...
            </div>
          ) : figureProgress.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Jeszcze brak postępów w figurach!</p>
              <p className="text-sm mt-2">
                <Link
                  to="/library"
                  className="text-purple-400 hover:text-purple-300"
                >
                  Przejdź do biblioteki, aby rozpocząć swoją podróż
                </Link>
              </p>
            </div>
          ) : (
            <>
              {renderFigureGrid(getFiguresByStatus("completed"), "completed")}
              {renderFigureGrid(getFiguresByStatus("for_later"), "for_later")}
              {renderFigureGrid(getFiguresByStatus("failed"), "failed")}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
};
