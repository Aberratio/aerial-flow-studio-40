
import React, { useState } from 'react';
import { Search, Filter, CheckCircle, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FigurePreviewModal } from '@/components/FigurePreviewModal';

const Library = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFigure, setSelectedFigure] = useState(null);

  const categories = ['all', 'silks', 'hoop', 'pole', 'straps'];
  
  const figures = [
    {
      id: 1,
      name: 'Scorpion',
      category: 'hoop',
      difficulty: 'Intermediate',
      image: 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=300&h=300&fit=crop',
      completed: false,
      description: 'A beautiful backbend pose that requires flexibility and strength.'
    },
    {
      id: 2,
      name: 'Crucifix',
      category: 'silks',
      difficulty: 'Advanced',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
      completed: true,
      description: 'An impressive pose showcasing control and upper body strength.'
    },
    {
      id: 3,
      name: 'Attitude',
      category: 'pole',
      difficulty: 'Beginner',
      image: 'https://images.unsplash.com/photo-1506629905496-4d3e5b9e7e59?w=300&h=300&fit=crop',
      completed: false,
      description: 'A graceful leg extension that builds balance and flexibility.'
    },
    {
      id: 4,
      name: 'Bird of Paradise',
      category: 'silks',
      difficulty: 'Advanced',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=300&fit=crop',
      completed: false,
      description: 'An elegant pose requiring hip flexibility and core strength.'
    },
    {
      id: 5,
      name: 'Star',
      category: 'hoop',
      difficulty: 'Intermediate',
      image: 'https://images.unsplash.com/photo-1594736797933-d0d8e3b82d9a?w=300&h=300&fit=crop',
      completed: true,
      description: 'A symmetrical pose that showcases form and control.'
    },
    {
      id: 6,
      name: 'Jasmine',
      category: 'pole',
      difficulty: 'Advanced',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
      completed: false,
      description: 'A challenging invert requiring significant upper body strength.'
    }
  ];

  const filteredFigures = figures.filter(figure => {
    const matchesSearch = figure.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || figure.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Figure Library</h1>
          <p className="text-muted-foreground">Explore and master aerial figures across different disciplines</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search figures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/60"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category 
                  ? "bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" 
                  : "border-white/20 text-white hover:bg-white/10"
                }
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Figures Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFigures.map((figure) => (
            <Card 
              key={figure.id} 
              className="glass-effect border-white/10 hover-lift group overflow-hidden cursor-pointer"
              onClick={() => setSelectedFigure(figure)}
            >
              <div className="relative">
                <img 
                  src={figure.image} 
                  alt={figure.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Completion Status */}
                {figure.completed && (
                  <div className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
                
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white text-lg">{figure.name}</h3>
                  <Badge className={`text-xs ${getDifficultyColor(figure.difficulty)}`}>
                    {figure.difficulty}
                  </Badge>
                </div>
                
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                  {figure.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-white/20 text-white/80">
                    {figure.category}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="text-purple-400 hover:text-purple-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFigure(figure);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <FigurePreviewModal 
        figure={selectedFigure}
        isOpen={!!selectedFigure}
        onClose={() => setSelectedFigure(null)}
      />
    </div>
  );
};

export default Library;
