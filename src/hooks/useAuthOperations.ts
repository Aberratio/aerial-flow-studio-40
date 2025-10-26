import { supabase } from '@/integrations/supabase/client';

export const useAuthOperations = () => {
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // Update login tracking only on successful sign in
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('update_user_login_tracking', {
          user_id: user.id
        });
        console.log('Login tracking updated on sign in');
      }
    } catch (trackingError) {
      console.error('Failed to update login tracking:', trackingError);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: username,
        },
      },
    });

    if (error) {
      throw error;
    }

    // Return session and user data
    return { session: data.session, user: data.user };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  return {
    signIn,
    signUp,
    signOut,
    // Backward compatibility
    login: signIn,
    register: signUp,
    logout: signOut,
  };
};