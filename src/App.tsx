import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/Layout/AppLayout";
import Landing from "@/pages/Landing";
import Feed from "@/pages/Feed";
import Library from "@/pages/Library";
import Challenges from "@/pages/Challenges";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import BadConnection from "@/pages/BadConnection";
import PricingPage from "@/pages/PricingPage";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancelled from "@/pages/PaymentCancelled";
import AboutUs from "@/pages/AboutUs";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfUse from "@/pages/TermsOfUse";
import Inbox from "./pages/Inbox";
import FriendProfile from "@/pages/FriendProfileReal";
import Friends from "@/pages/Friends";
import Training from "@/pages/Training";
import TrainingSessionDetail from "@/pages/TrainingSessionDetail";
import TrainingExerciseSession from "@/pages/TrainingExerciseSession";
import EditTrainingSession from "@/pages/EditTrainingSession";
import TrainingSessionPageWrapper from "@/pages/TrainingSessionPageWrapper";
import MyJourney from "@/pages/MyJourney";
import EditChallenge from "@/pages/EditChallenge";

import ChallengeDayTimer from "@/pages/ChallengeDayTimer";
import ChallengePreview from "@/pages/ChallengePreview";
import PostDetail from "@/pages/PostDetail";
import ExerciseDetail from "@/pages/ExerciseDetail";
import EditExercise from "@/pages/EditExercise";
import AchievementManagement from "@/pages/AchievementManagement";
import Index from "@/pages/Index";
import AerialJourney from "@/pages/AerialJourney";
import FigureOfTheDay from "@/pages/FigureOfTheDay";

import LandingPageManagement from "@/pages/LandingPageManagement";
import SiteSettings from "@/pages/SiteSettings";
import RedemptionCodeManager from "@/pages/RedemptionCodeManager";
import PremiumRoute from "@/components/PremiumRoute";



const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    user,
    isLoading,
  } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

const ConditionalLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    user,
    isLoading,
  } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If user is logged in, wrap with AppLayout, otherwise render directly
  if (user) {
    return <AppLayout>{children}</AppLayout>;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Landing />
          </PublicRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        }
      />
      <Route
        path="/post/:postId"
        element={
          <ProtectedRoute>
            <PostDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <Library />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercise/:exerciseId"
        element={
          <ConditionalLayout>
            <ExerciseDetail />
          </ConditionalLayout>
        }
      />
      <Route
        path="/exercise/:exerciseId/edit"
        element={
          <ProtectedRoute>
            <EditExercise />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pricing"
        element={
          <ProtectedRoute>
            <PricingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-success"
        element={
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-cancelled"
        element={
          <ProtectedRoute>
            <PaymentCancelled />
          </ProtectedRoute>
        }
      />
      <Route
        path="/about"
        element={
          <ProtectedRoute>
            <AboutUs />
          </ProtectedRoute>
        }
      />
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-use" element={<TermsOfUse />} />
      <Route path="/connection-error" element={<BadConnection />} />
      <Route
        path="/inbox"
        element={
          <ProtectedRoute>
            <Inbox />
          </ProtectedRoute>
        }
      />
      <Route
        path="/challenges"
        element={
          <ProtectedRoute>
            <Challenges />
          </ProtectedRoute>
        }
      />
      <Route
        path="/challenges/:challengeId"
        element={
          <ProtectedRoute>
            <ChallengePreview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/my-journey"
        element={
          <ProtectedRoute>
            <MyJourney />
          </ProtectedRoute>
        }
      />
      <Route path="/profile/:id" element={<FriendProfile />} />
      <Route path="/friends/:id" element={<FriendProfile />} />
      <Route
        path="/friends"
        element={
          <ProtectedRoute>
            <Friends />
          </ProtectedRoute>
        }
      />
      <Route
        path="/training"
        element={
          <ProtectedRoute>
            <Training />
          </ProtectedRoute>
        }
      />
       <Route
         path="/training/:sessionId"
         element={
           <ProtectedRoute>
             <TrainingSessionDetail />
           </ProtectedRoute>
         }
       />
       <Route
         path="/training/:sessionId/session"
         element={
           <ProtectedRoute>
             <TrainingExerciseSession />
           </ProtectedRoute>
         }
       />
       <Route
         path="/training/:sessionId/edit"
         element={
           <ProtectedRoute>
             <EditTrainingSession />
           </ProtectedRoute>
         }
       />
      <Route
        path="/challenge/:challengeId/day/:dayId/timer"
        element={
          <ProtectedRoute>
            <ChallengeDayTimer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/training-session"
        element={
          <ProtectedRoute>
            <TrainingSessionPageWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/challenges/:challengeId/edit"
        element={
          <ProtectedRoute>
            <EditChallenge />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aerial-journey"
        element={
          <ProtectedRoute>
            <AerialJourney />
          </ProtectedRoute>
        }
      />
      <Route
        path="/figure-of-the-day"
        element={
          <ProtectedRoute>
            <FigureOfTheDay />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/achievements"
        element={
          <ProtectedRoute>
            <AchievementManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/landing-page"
        element={
          <ProtectedRoute>
            <LandingPageManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/redemption-codes"
        element={
          <ProtectedRoute>
            <RedemptionCodeManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/site-settings"
        element={
          <ProtectedRoute>
            <SiteSettings />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
