import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data: sessionData } = await supabase.auth.exchangeCodeForSession(code);

    // Sync GitHub username from auth provider metadata
    if (sessionData?.user) {
      const user = sessionData.user;
      const githubUsername = user.user_metadata?.user_name || user.user_metadata?.preferred_username;
      const avatarUrl = user.user_metadata?.avatar_url;

      if (githubUsername) {
        // Update or insert profile with latest GitHub data
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              github_username: githubUsername,
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'id',
              ignoreDuplicates: false,
            }
          );

        if (upsertError) {
          console.error('Failed to upsert profile:', upsertError);
          // Continue even if profile creation fails, user can still access the app
        }
      } else {
        console.warn('GitHub username is missing in user metadata');
        // Continue even without username, user can still access the app
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/`);
}
