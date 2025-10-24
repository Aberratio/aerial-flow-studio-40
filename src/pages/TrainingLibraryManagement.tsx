import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateTrainingLibraryModal } from '@/components/CreateTrainingLibraryModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, Video, Dumbbell, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Training {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty_level: string | null;
  training_type: string;
  premium: boolean;
  is_published: boolean;
  duration_seconds: number | null;
  thumbnail_url: string | null;
}

export default function TrainingLibraryManagement() {
  const navigate = useNavigate();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const { data, error } = await supabase
        .from('training_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrainings(data || []);
    } catch (error) {
      console.error('Error fetching trainings:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać treningów",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('training_library')
        .update({ is_published: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sukces",
        description: currentStatus ? "Trening został ukryty" : "Trening został opublikowany",
      });

      fetchTrainings();
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zmienić statusu",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('training_library')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: "Sukces",
        description: "Trening został usunięty",
      });

      fetchTrainings();
    } catch (error) {
      console.error('Error deleting training:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć treningu",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'figure_set':
        return <Dumbbell className="w-4 h-4" />;
      case 'complex':
        return <Layers className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'video':
        return 'Wideo';
      case 'figure_set':
        return 'Zestaw ćwiczeń';
      case 'complex':
        return 'Kompleksowy';
      default:
        return type;
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Ładowanie...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Zarządzanie Biblioteką Treningów</h1>
          <p className="text-muted-foreground mt-2">Twórz i edytuj treningi dla użytkowników</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Dodaj trening
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trainings.map((training) => (
          <Card key={training.id} className="overflow-hidden group">
            {training.thumbnail_url && (
              <div className="aspect-video bg-muted relative overflow-hidden">
                <img
                  src={training.thumbnail_url}
                  alt={training.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  {training.premium && <Badge variant="secondary">Premium</Badge>}
                  <Badge variant={training.is_published ? 'default' : 'outline'}>
                    {training.is_published ? 'Opublikowany' : 'Szkic'}
                  </Badge>
                </div>
              </div>
            )}

            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <h3 className="font-semibold line-clamp-1">{training.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {training.description || 'Brak opisu'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="gap-1">
                  {getTypeIcon(training.training_type)}
                  {getTypeName(training.training_type)}
                </Badge>
                {training.duration_seconds && training.duration_seconds > 0 && (
                  <Badge variant="outline">
                    {Math.round(training.duration_seconds / 60)} min
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/training/library/${training.id}`)}
                >
                  Podgląd
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTogglePublish(training.id, training.is_published)}
                >
                  {training.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteId(training.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {trainings.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Nie masz jeszcze żadnych treningów</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Dodaj pierwszy trening
          </Button>
        </Card>
      )}

      <CreateTrainingLibraryModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={fetchTrainings}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć ten trening?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Trening zostanie trwale usunięty z biblioteki.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
