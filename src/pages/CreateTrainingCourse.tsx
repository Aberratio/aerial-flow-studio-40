import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CreateTrainingCourse = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail_url: "",
    difficulty_level: "beginner",
    duration_minutes: 0,
    is_published: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create a course",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Course title is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("training_courses")
        .insert({
          ...formData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Training course created successfully",
      });

      navigate(`/admin/training/courses/${data.id}`);
    } catch (error) {
      console.error("Error creating course:", error);
      toast({
        title: "Error",
        description: "Failed to create training course",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/training")}
            className="text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Training
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Training Course</h1>
            <p className="text-slate-400">Set up a new training course with lessons and videos</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">
                  Course Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter course title"
                  className="bg-slate-900/50 border-slate-600 text-white"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe what students will learn in this course"
                  className="bg-slate-900/50 border-slate-600 text-white min-h-[100px]"
                  rows={4}
                />
              </div>

              {/* Thumbnail URL */}
              <div className="space-y-2">
                <Label htmlFor="thumbnail_url" className="text-white">
                  Thumbnail Image URL
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="thumbnail_url"
                    value={formData.thumbnail_url}
                    onChange={(e) => handleInputChange("thumbnail_url", e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="bg-slate-900/50 border-slate-600 text-white flex-1"
                  />
                  <Button type="button" variant="outline" size="icon">
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Difficulty Level */}
                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="text-white">
                    Difficulty Level
                  </Label>
                  <Select
                    value={formData.difficulty_level}
                    onValueChange={(value) => handleInputChange("difficulty_level", value)}
                  >
                    <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="beginner" className="text-white">Beginner</SelectItem>
                      <SelectItem value="intermediate" className="text-white">Intermediate</SelectItem>
                      <SelectItem value="advanced" className="text-white">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-white">
                    Estimated Duration (minutes)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => handleInputChange("duration_minutes", parseInt(e.target.value) || 0)}
                    placeholder="60"
                    className="bg-slate-900/50 border-slate-600 text-white"
                    min="0"
                  />
                </div>
              </div>

              {/* Publish Setting */}
              <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg">
                <div>
                  <Label htmlFor="published" className="text-white font-medium">
                    Publish Course
                  </Label>
                  <p className="text-sm text-slate-400 mt-1">
                    Published courses are visible to users
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => handleInputChange("is_published", checked)}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/training")}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Create Course
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default CreateTrainingCourse;