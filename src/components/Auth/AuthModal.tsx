
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onOpenChange, mode, onModeChange }) => {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(formData.email, formData.password);
      toast({
        title: t('auth_welcome_back') || "Welcome back!",
        description: t('auth_signin_success') || "You have been successfully signed in.",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t('auth_signin_failed') || "Sign in failed",
        description: error.message || t('auth_check_credentials') || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('auth_password_mismatch') || "Password mismatch",
        description: t('auth_passwords_no_match') || "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.username);
      toast({
        title: t('auth_account_created') || "Account created!",
        description: t('auth_verify_email') || "Please check your email to verify your account.",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t('auth_signup_failed') || "Sign up failed",
        description: error.message || t('auth_try_again') || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-900/95 border-white/30 shadow-2xl backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-white text-center">{t('auth_welcome') || 'Welcome to IguanaFlow'}</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={onModeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="login" className="text-white data-[state=active]:bg-white/10">
              {t('auth_signin') || 'Sign In'}
            </TabsTrigger>
            <TabsTrigger value="register" className="text-white data-[state=active]:bg-white/10">
              {t('auth_signup') || 'Sign Up'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white">{t('auth_email') || 'Email'}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                  placeholder={t('auth_enter_email') || 'Enter your email'}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-white">{t('auth_password') || 'Password'}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/60 pr-10"
                    placeholder={t('auth_enter_password') || 'Enter your password'}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white h-auto p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('auth_signing_in') || 'Signing in...'}
                  </>
                ) : (
                  t('auth_signin') || 'Sign In'
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="signup-email" className="text-white">{t('auth_email') || 'Email'}</Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                  placeholder={t('auth_enter_email') || 'Enter your email'}
                  required
                />
              </div>

              <div>
                <Label htmlFor="username" className="text-white">{t('auth_username') || 'Username'}</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                  placeholder={t('auth_choose_username') || 'Choose a username'}
                  required
                />
              </div>

              <div>
                <Label htmlFor="signup-password" className="text-white">{t('auth_password') || 'Password'}</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/60 pr-10"
                    placeholder={t('auth_create_password') || 'Create a password'}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white h-auto p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-white">{t('auth_confirm_password') || 'Confirm Password'}</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                  placeholder={t('auth_confirm_password_placeholder') || 'Confirm your password'}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('auth_creating_account') || 'Creating account...'}
                  </>
                ) : (
                  t('auth_create_account') || 'Create Account'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
