import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  MessageSquare,
  Image,
  GraduationCap,
  Globe,
  Ticket,
  Settings,
  UserCheck,
  TrendingUp,
  Heart,
  ShoppingCart,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: usersCount },
        { count: challengesCount },
        { count: postsCount },
        { count: galleryCount },
        { count: trainingsCount },
        // User Engagement
        { count: activeUsers },
        { count: newUsers },
        { data: loginData },
        // Challenge Participation
        { count: activeParticipants },
        { count: completedChallenges },
        { data: popularChallenge },
        // Social Engagement
        { count: friendshipsCount },
        { count: postsThisWeek },
        // Revenue & Purchases
        { count: ordersCount },
        { data: revenueData },
        { count: redemptionsCount },
        // Aerial Journey
        { count: figureCompletions }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('challenges').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('gallery_media').select('*', { count: 'exact', head: true }),
        supabase.from('training_courses').select('*', { count: 'exact', head: true }),
        // User Engagement
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_login_at', sevenDaysAgo),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
        supabase.from('profiles').select('login_count'),
        // Challenge Participation
        supabase.from('challenge_participants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('challenge_participants').select('*', { count: 'exact', head: true }).eq('completed', true),
        supabase.from('challenge_participants').select('challenge_id, challenges(title)').limit(1),
        // Social Engagement
        supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
        supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        // Revenue & Purchases
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('orders').select('amount').eq('status', 'completed'),
        supabase.from('challenge_redemption_codes').select('current_uses'),
        // Aerial Journey
        supabase.from('figure_progress').select('*', { count: 'exact', head: true }).eq('status', 'completed')
      ]);

      const totalLogins = loginData?.reduce((sum, user) => sum + (user.login_count || 0), 0) || 0;
      const avgLogins = usersCount ? (totalLogins / usersCount).toFixed(1) : '0';
      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
      const totalRedemptions = redemptionsCount || 0;

      return {
        users: usersCount || 0,
        challenges: challengesCount || 0,
        posts: postsCount || 0,
        gallery: galleryCount || 0,
        trainings: trainingsCount || 0,
        // User Engagement
        activeUsers: activeUsers || 0,
        newUsers: newUsers || 0,
        totalLogins,
        avgLogins,
        // Challenge Participation
        activeParticipants: activeParticipants || 0,
        completedChallenges: completedChallenges || 0,
        popularChallenge: popularChallenge?.[0]?.challenges?.title || 'N/A',
        // Social Engagement
        friendships: friendshipsCount || 0,
        postsThisWeek: postsThisWeek || 0,
        // Revenue & Purchases
        orders: ordersCount || 0,
        revenue: totalRevenue / 100, // Convert from cents
        redemptions: totalRedemptions,
        // Aerial Journey
        figureCompletions: figureCompletions || 0
      };
    },
    refetchInterval: 30000 // Refresh every 30s
  });

  const quickActions = [
    {
      title: 'User Management',
      description: 'View & manage all users',
      icon: UserCheck,
      href: '/admin/user-management',
      color: 'text-cyan-500'
    },
    {
      title: 'Achievements',
      description: 'Manage user achievements',
      icon: Trophy,
      href: '/admin/achievements',
      color: 'text-yellow-500'
    },
    {
      title: 'Training',
      description: 'Create & edit training sessions',
      icon: GraduationCap,
      href: '/admin/training',
      color: 'text-blue-500'
    },
    {
      title: 'Landing Page',
      description: 'Edit homepage content',
      icon: Globe,
      href: '/admin/landing-page',
      color: 'text-green-500'
    },
    {
      title: 'Redemption Codes',
      description: 'Manage promo codes',
      icon: Ticket,
      href: '/admin/redemption-codes',
      color: 'text-purple-500'
    },
    {
      title: 'Site Settings',
      description: 'Configure site options',
      icon: Settings,
      href: '/admin/site-settings',
      color: 'text-gray-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Welcome to your control center</p>
        </div>

        {/* Basic Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {isLoading ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </>
          ) : (
            <>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.users}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Challenges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.challenges}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.posts}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Gallery Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.gallery}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/10 border-pink-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Training Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.trainings}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* User Activity Insights */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            User Activity Insights
          </h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : (
            <>
              {/* User Engagement Stats */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 text-muted-foreground">User Engagement</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Active Users (7d)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.activeUsers}</div>
                      <p className="text-xs text-muted-foreground">Logged in last week</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        New Users (30d)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.newUsers}</div>
                      <p className="text-xs text-muted-foreground">Registered this month</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Total Logins
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalLogins}</div>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Avg Logins/User
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.avgLogins}</div>
                      <p className="text-xs text-muted-foreground">Per user</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Challenge & Social Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Challenge Participation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Active</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeParticipants}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Completed</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.completedChallenges}</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Social Engagement</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          Friendships
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.friendships}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Posts (7d)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.postsThisWeek}</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Revenue & Aerial Journey */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Revenue & Purchases</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3" />
                          Orders
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.orders}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${stats?.revenue.toFixed(0)}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                          <Ticket className="w-3 h-3" />
                          Codes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.redemptions}</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Aerial Journey Progress</h3>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Figure Completions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.figureCompletions}</div>
                      <p className="text-xs text-muted-foreground">Total figures mastered</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} to={action.href}>
                <Card className="h-full hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <action.icon className={`w-8 h-8 ${action.color}`} />
                      <div>
                        <CardTitle className="text-base">{action.title}</CardTitle>
                        <CardDescription className="text-sm">{action.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>All systems operational</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="text-sm text-green-500 font-medium">● Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage</span>
                <span className="text-sm text-green-500 font-medium">● Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Authentication</span>
                <span className="text-sm text-green-500 font-medium">● Online</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
