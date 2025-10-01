import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstagramOEmbedResponse {
  html: string;
  author_name: string;
  thumbnail_url?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { instagram_url } = await req.json();

    if (!instagram_url || typeof instagram_url !== 'string') {
      throw new Error('Instagram URL is required');
    }

    // Validate Instagram URL format
    const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/;
    if (!instagramRegex.test(instagram_url)) {
      throw new Error('Invalid Instagram URL format');
    }

    console.log('[INSTAGRAM-OEMBED] Fetching embed for URL:', instagram_url);

    // Call Instagram oEmbed API
    const oembedUrl = `https://graph.instagram.com/oembed?url=${encodeURIComponent(instagram_url)}&hidecaption=false`;
    
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      console.error('[INSTAGRAM-OEMBED] API Error:', response.status, await response.text());
      throw new Error(`Instagram API returned ${response.status}`);
    }

    const data: InstagramOEmbedResponse = await response.json();

    console.log('[INSTAGRAM-OEMBED] Successfully fetched embed');

    return new Response(
      JSON.stringify({
        success: true,
        embed_html: data.html,
        author_name: data.author_name,
        thumbnail_url: data.thumbnail_url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[INSTAGRAM-OEMBED] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
