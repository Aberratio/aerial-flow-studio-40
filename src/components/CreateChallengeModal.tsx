import React, { useState } from 'react';
import { Calendar, Plus, Save, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeCreated: () => void;
}

const CreateChallengeModal = ({ isOpen, onClose, onChallengeCreated }: CreateChallengeModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setChallengeId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const saveDraft = async () => {
    if (!user) return;
    
    if (!title.trim() || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in title, start date, and end date.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const challengeData = {
        title: title.trim(),
        description: description.trim() || null,
        start_date: startDate,
        end_date: endDate,
        created_by: user.id,
        status: 'draft'
      };

      let result;
      if (challengeId) {
        // Update existing draft
        result = await supabase
          .from('challenges')
          .update(challengeData)
          .eq('id', challengeId)
          .select()
          .single();
      } else {
        // Create new draft
        result = await supabase
          .from('challenges')
          .insert([challengeData])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setChallengeId(result.data.id);
      toast({
        title: "Draft Saved",
        description: "Challenge saved as draft successfully.",
      });
    } catch (error) {
      console.error('Error saving challenge:', error);
      toast({
        title: "Error",
        description: "Failed to save challenge draft.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const publishChallenge = async () => {
    if (!challengeId && !title.trim()) {
      toast({
        title: "Save Draft First",
        description: "Please save as draft before publishing.",
        variant: "destructive",
      });
      return;
    }

    // Save as draft first if not already saved
    if (!challengeId) {
      await saveDraft();
      if (!challengeId) return; // If save failed, don't proceed
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('challenges')
        .update({ status: 'published' })
        .eq('id', challengeId);

      if (error) throw error;

      toast({
        title: "Challenge Published",
        description: "Challenge has been published successfully.",
      });
      
      onChallengeCreated();
      handleClose();
    } catch (error) {
      console.error('Error publishing challenge:', error);
      toast({
        title: "Error",
        description: "Failed to publish challenge.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Challenge
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Challenge Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter challenge title"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your challenge..."
              rows={4}
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </Button>
              
              <Button
                onClick={publishChallenge}
                disabled={isLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
              >
                <Globe className="w-4 h-4" />
                Publish Challenge
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChallengeModal;