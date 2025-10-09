import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Trophy, 
  GraduationCap, 
  Globe, 
  Ticket, 
  Settings, 
  UserCheck,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImpersonateClick: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ 
  isOpen, 
  onClose,
  onImpersonateClick 
}) => {
  const handleLinkClick = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" />
            Admin Panel
          </DialogTitle>
        </DialogHeader>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="content">
            <AccordionTrigger>📝 Content Management</AccordionTrigger>
            <AccordionContent className="space-y-2">
              <Link to="/admin/landing-page" onClick={handleLinkClick}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-sm">Landing Page Editor</CardTitle>
                        <CardDescription className="text-xs">Edit homepage content</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/admin/achievements" onClick={handleLinkClick}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-sm">Achievements</CardTitle>
                        <CardDescription className="text-xs">Manage user achievements</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/admin/training" onClick={handleLinkClick}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-sm">Training Management</CardTitle>
                        <CardDescription className="text-xs">Create & edit training</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="users">
            <AccordionTrigger>👥 User Management</AccordionTrigger>
            <AccordionContent className="space-y-2">
              <Card 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => {
                  onImpersonateClick();
                  onClose();
                }}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-sm">Impersonate User</CardTitle>
                      <CardDescription className="text-xs">View as another user</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="system">
            <AccordionTrigger>⚙️ System</AccordionTrigger>
            <AccordionContent className="space-y-2">
              <Link to="/admin/redemption-codes" onClick={handleLinkClick}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <Ticket className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-sm">Redemption Codes</CardTitle>
                        <CardDescription className="text-xs">Manage promo codes</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/admin/site-settings" onClick={handleLinkClick}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-sm">Site Settings</CardTitle>
                        <CardDescription className="text-xs">Configure site options</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  );
};
