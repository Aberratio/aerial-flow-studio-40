
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/Layout/AppLayout";
import { ProfileUpgradeWrapper } from "@/components/ProfileUpgradeWrapper";
import Landing from "@/pages/Landing";
import Feed from "@/pages/Feed";
import Library from "@/pages/Library";
import Challenges from "@/pages/Challenges";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import BadConnection from "@/pages/BadConnection";
import PricingPage from "@/pages/PricingPage";
import AboutUs from "@/pages/AboutUs";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfUse from "@/pages/TermsOfUse";
import Inbox from "./pages/Inbox";
import FriendProfile from "@/pages/FriendProfile";
import Friends from "@/pages/Friends";
import Training from "@/pages/Training";
import TrainingSessionPageWrapper from "@/pages/TrainingSessionPageWrapper";
import MyJourney from "@/pages/MyJourney";
import EditChallenge from "@/pages/EditChallenge";
import ChallengeDayOverview from "@/pages/ChallengeDayOverview";
import AchievementManagement from "@/pages/AchievementManagement";
import PremiumRoute from "@/components/PremiumRoute";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <AppLayout>{children}</AppLayout>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/feed" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={
        <PublicRoute>
          <Landing />
        </PublicRoute>
      } />
      <Route path="/feed" element={
        <ProtectedRoute>
          <Feed />
        </ProtectedRoute>
      } />
      <Route path="/library" element={
        <ProtectedRoute>
          <PremiumRoute>
            <Library />
          </PremiumRoute>
        </ProtectedRoute>
      } />
      <Route path="/pricing" element={
        <ProtectedRoute>
          <PricingPage />
        </ProtectedRoute>
      } />
      <Route path="/about" element={
        <ProtectedRoute>
          <AboutUs />
        </ProtectedRoute>
      } />
      <Route path="/privacy-policy" element={
        <ProtectedRoute>
          <PrivacyPolicy />
        </ProtectedRoute>
      } />
      <Route path="/terms-of-use" element={
        <ProtectedRoute>
          <TermsOfUse />
        </ProtectedRoute>
      } />
      <Route path="/connection-error" element={<BadConnection />} />
      <Route path="/inbox" element={
        <ProtectedRoute>
          <Inbox />
        </ProtectedRoute>
      } />
      <Route path="/challenges" element={
        <ProtectedRoute>
          <PremiumRoute>
            <Challenges />
          </PremiumRoute>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/profile/my-journey" element={
        <ProtectedRoute>
          <MyJourney />
        </ProtectedRoute>
      } />
      <Route path="/profile/:id" element={
        <ProtectedRoute>
          <FriendProfile />
        </ProtectedRoute>
      } />
      <Route path="/friends" element={
        <ProtectedRoute>
          <Friends />
        </ProtectedRoute>
      } />
      <Route path="/training" element={
        <ProtectedRoute>
          <PremiumRoute>
            <Training />
          </PremiumRoute>
        </ProtectedRoute>
      } />
      <Route path="/challenge/:challengeId/day/:dayId" element={
        <ProtectedRoute>
          <PremiumRoute>
            <ChallengeDayOverview />
          </PremiumRoute>
        </ProtectedRoute>
      } />
      <Route path="/training-session" element={
        <ProtectedRoute>
          <PremiumRoute>
            <TrainingSessionPageWrapper />
          </PremiumRoute>
        </ProtectedRoute>
      } />
      <Route path="/challenges/:challengeId/edit" element={
        <ProtectedRoute>
          <PremiumRoute>
            <EditChallenge />
          </PremiumRoute>
        </ProtectedRoute>
      } />
      <Route path="/admin/achievements" element={
        <ProtectedRoute>
          <AchievementManagement />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ProfileUpgradeWrapper>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ProfileUpgradeWrapper>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
