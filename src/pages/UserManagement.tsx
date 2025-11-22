import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type UserRole = 'free' | 'premium' | 'trainer' | 'admin';

interface UserWithRole {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  last_login_at: string | null;
  login_count: number;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url, role, created_at, last_login_at, login_count')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = users;

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.username.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredUsers(filtered);
  }, [users, search, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      // Update user_roles table (trigger will sync profiles automatically)
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'trainer':
        return 'default';
      case 'premium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleStats = () => {
    return {
      total: users.length,
      admin: users.filter(u => u.role === 'admin').length,
      trainer: users.filter(u => u.role === 'trainer').length,
      premium: users.filter(u => u.role === 'premium').length,
      free: users.filter(u => u.role === 'free').length,
    };
  };

  const stats = getRoleStats();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage user roles and permissions</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Admins</CardDescription>
              <CardTitle className="text-2xl text-destructive">{stats.admin}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Trainers</CardDescription>
              <CardTitle className="text-2xl text-primary">{stats.trainer}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Premium</CardDescription>
              <CardTitle className="text-2xl text-secondary">{stats.premium}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Free</CardDescription>
              <CardTitle className="text-2xl text-muted-foreground">{stats.free}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by username or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Logins</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userItem) => (
                      <TableRow key={userItem.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={userItem.avatar_url || undefined} />
                              <AvatarFallback>{userItem.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{userItem.username}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{userItem.email || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(userItem.role)}>
                            {userItem.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(userItem.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {userItem.last_login_at
                            ? formatDistanceToNow(new Date(userItem.last_login_at), { addSuffix: true })
                            : 'Never'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {userItem.login_count || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={userItem.role}
                            onValueChange={(role) => handleRoleChange(userItem.id, role as UserRole)}
                            disabled={userItem.id === user?.id}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="trainer">Trainer</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;
