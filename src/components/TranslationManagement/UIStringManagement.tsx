import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UIString {
  id: string;
  string_key: string;
  language_id: string;
  value: string;
  category?: string;
}

interface Language {
  id: string;
  name: string;
  native_name: string;
  is_default: boolean;
}

interface UIStringManagementProps {
  uiStrings: UIString[];
  languages: Language[];
  onUIStringsUpdate: () => void;
}

export function UIStringManagement({ 
  uiStrings, 
  languages, 
  onUIStringsUpdate 
}: UIStringManagementProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [uiSearchTerm, setUISearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showUntranslated, setShowUntranslated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uiStringForm, setUIStringForm] = useState({
    string_key: '',
    category: '',
    value: ''
  });
  const [editingStringId, setEditingStringId] = useState<string | null>(null);
  
  const { toast } = useToast();

  const saveUIString = async () => {
    if (!uiStringForm.string_key || !selectedLanguage || !uiStringForm.value) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      if (editingStringId) {
        // Update existing string
        const { error } = await supabase
          .from('ui_strings')
          .update({
            value: uiStringForm.value,
            category: uiStringForm.category || null
          })
          .eq('id', editingStringId);

        if (error) throw error;
      } else {
        // Create new string
        const { error } = await supabase
          .from('ui_strings')
          .insert({
            string_key: uiStringForm.string_key,
            language_id: selectedLanguage,
            value: uiStringForm.value,
            category: uiStringForm.category || null
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "UI string saved successfully"
      });

      // Reset form
      setUIStringForm({ string_key: '', category: '', value: '' });
      setEditingStringId(null);
      onUIStringsUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save UI string",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Manage translations for UI elements. Total strings: {uiStrings.length}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Add/Edit UI String</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">String Key</Label>
              <Input 
                placeholder="e.g., button.save, alert.success"
                value={uiStringForm.string_key}
                onChange={(e) => setUIStringForm(prev => ({ ...prev, string_key: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                disabled={!!editingStringId}
              />
            </div>
            
            <div>
              <Label className="text-white">Category</Label>
              <Select 
                value={uiStringForm.category} 
                onValueChange={(value) => setUIStringForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buttons">Buttons</SelectItem>
                  <SelectItem value="labels">Labels</SelectItem>
                  <SelectItem value="messages">Messages</SelectItem>
                  <SelectItem value="alerts">Alerts</SelectItem>
                  <SelectItem value="navigation">Navigation</SelectItem>
                  <SelectItem value="exercises">Exercises</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                  <SelectItem value="time">Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.native_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Translation</Label>
              <Textarea
                placeholder="Enter the translated text"
                value={uiStringForm.value}
                onChange={(e) => setUIStringForm(prev => ({ ...prev, value: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button 
                variant="primary"
                onClick={saveUIString} 
                disabled={isLoading}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingStringId ? 'Update' : 'Save'} Translation
              </Button>
              {editingStringId && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setEditingStringId(null);
                    setUIStringForm({ string_key: '', category: '', value: '' });
                  }}
                  className="border-white/20 text-white"
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">UI Strings</CardTitle>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search strings..."
                  value={uiSearchTerm}
                  onChange={(e) => setUISearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="buttons">Buttons</SelectItem>
                  <SelectItem value="labels">Labels</SelectItem>
                  <SelectItem value="messages">Messages</SelectItem>
                  <SelectItem value="alerts">Alerts</SelectItem>
                  <SelectItem value="navigation">Navigation</SelectItem>
                  <SelectItem value="exercises">Exercises</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                  <SelectItem value="time">Time</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showUntranslated"
                  checked={showUntranslated}
                  onChange={(e) => setShowUntranslated(e.target.checked)}
                  className="rounded border-white/20"
                />
                <label htmlFor="showUntranslated" className="text-white text-sm">
                  Show only untranslated strings
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(() => {
                const filteredStrings = uiStrings.filter(str => {
                  const matchesSearch = str.string_key.toLowerCase().includes(uiSearchTerm.toLowerCase()) ||
                                        str.value.toLowerCase().includes(uiSearchTerm.toLowerCase());
                  const matchesCategory = categoryFilter === 'all' || !categoryFilter || str.category === categoryFilter;
                  
                  if (showUntranslated) {
                    // Show strings that have a key but empty or missing value
                    return matchesSearch && matchesCategory && (!str.value || str.value.trim() === '');
                  }
                  
                  return matchesSearch && matchesCategory;
                });
                
                return filteredStrings;
              })().map(string => (
                <div key={string.id} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm">{string.string_key}</div>
                      <div className="text-muted-foreground text-xs mb-1">
                        {string.language_id.toUpperCase()} • {string.category}
                      </div>
                      <div className="text-white text-sm">{string.value}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setUIStringForm({
                          string_key: string.string_key,
                          category: string.category || '',
                          value: string.value
                        });
                        setSelectedLanguage(string.language_id);
                        setEditingStringId(string.id);
                      }}
                      className="text-white hover:bg-white/10"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}