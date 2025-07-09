import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Clock, Bookmark, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useFigureProgress } from '@/hooks/useFigureProgress';
import { FigurePreviewModal } from '@/components/FigurePreviewModal';

const MyJourney = () => {
  const { figureProgress, loading, getFiguresByStatus } = useFigureProgress();
  const [selectedFigure, setSelectedFigure] = useState(null);
  const [isFigureModalOpen, setIsFigureModalOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState('all');

  const statusConfig = {
    completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-400/10' },
    for_later: { label: 'For Later', icon: Bookmark, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
    failed: { label: 'Failed', icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-400/10' },
    not_tried: { label: 'Not Tried', icon: Clock, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  };

  const getFilteredFigures = () => {
    if (activeStatus === 'all') return figureProgress;
    return getFiguresByStatus(activeStatus);
  };

  const filteredFigures = getFilteredFigures();

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading your journey...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to="/profile" className="inline-flex items-center text-muted-foreground hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-white">My Figure Journey</h1>
          <p className="text-muted-foreground">Track your progress across all aerial figures</p>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveStatus('all')}
            className={activeStatus === 'all' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
          >
            All ({figureProgress.length})
          </Button>
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            const count = getFiguresByStatus(status).length;
            return (
              <Button
                key={status}
                variant={activeStatus === status ? 'default' : 'outline'}
                onClick={() => setActiveStatus(status)}
                className={`${activeStatus === status ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''} border-white/20`}
              >
                <Icon className={`w-4 h-4 mr-2 ${config.color}`} />
                {config.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* Figures Grid */}
        {filteredFigures.length === 0 ? (
          <Card className="glass-effect border-white/10">
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <p>No figures found for this status.</p>
                <p className="text-sm mt-2">
                  <Link to="/library" className="text-purple-400 hover:text-purple-300">
                    Explore the library to start your journey
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredFigures.map((figure) => {
              const statusInfo = statusConfig[figure.status as keyof typeof statusConfig];
              const Icon = statusInfo?.icon || Clock;
              
              return (
                <Card 
                  key={figure.id} 
                  className="glass-effect border-white/10 cursor-pointer hover:transform hover:scale-105 transition-all duration-300 group"
                  onClick={() => {
                    setSelectedFigure(figure);
                    setIsFigureModalOpen(true);
                  }}
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="aspect-square rounded-t-lg overflow-hidden">
                        {figure.image_url ? (
                          <img 
                            src={figure.image_url} 
                            alt={figure.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <span className="text-4xl">🤸</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Status Badge */}
                      <div className={`absolute top-2 right-2 p-2 rounded-full ${statusInfo?.bgColor || 'bg-gray-400/10'}`}>
                        <Icon className={`w-4 h-4 ${statusInfo?.color || 'text-gray-400'}`} />
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-white font-semibold mb-1 line-clamp-1">{figure.name}</h3>
                      {figure.difficulty_level && (
                        <Badge variant="outline" className="text-xs border-white/20 text-muted-foreground">
                          {figure.difficulty_level}
                        </Badge>
                      )}
                      {figure.category && (
                        <div className="text-xs text-muted-foreground mt-1">{figure.category}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Figure Preview Modal */}
      <FigurePreviewModal 
        figure={selectedFigure} 
        isOpen={isFigureModalOpen} 
        onClose={() => setIsFigureModalOpen(false)} 
      />
    </div>
  );
};

export default MyJourney;