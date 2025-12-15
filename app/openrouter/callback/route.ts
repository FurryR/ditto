import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/typeorm/data-source';
import { Profile } from '@/lib/typeorm/entities/Profile';
import { getCurrentUserId } from '@/lib/typeorm/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const redirect = searchParams.get('redirect') || '/settings';

    if (!code) {
      return NextResponse.redirect(new URL('/settings?error=no_code', request.url));
    }

    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.redirect(new URL('/signin?redirect=' + encodeURIComponent(redirect), request.url));
    }

    // Get code_verifier from cookies
    const cookies = request.headers.get('cookie') || '';
    const codeVerifierMatch = cookies.match(/openrouter_code_verifier=([^;]+)/);
    const codeVerifier = codeVerifierMatch ? codeVerifierMatch[1] : null;

    if (!codeVerifier) {
      console.error('No code_verifier found in cookies');
      return NextResponse.redirect(new URL('/settings?error=no_verifier', request.url));
    }

    // Exchange code for API key with PKCE
    const exchangeResponse = await fetch('https://openrouter.ai/api/v1/auth/keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
        code_challenge_method: 'S256',
      }),
    });

    if (!exchangeResponse.ok) {
      const errorText = await exchangeResponse.text();
      console.error('OpenRouter auth failed:', errorText);
      return NextResponse.redirect(new URL('/settings?error=auth_failed', request.url));
    }

    const { key } = await exchangeResponse.json();

    if (!key) {
      return NextResponse.redirect(new URL('/settings?error=no_key', request.url));
    }

    // Save the key to database
    const profileRepo = await getRepository(Profile);
    const profile = await profileRepo.findOne({ where: { id: userId } });
    
    if (!profile) {
      return NextResponse.redirect(new URL('/settings?error=profile_not_found', request.url));
    }

    const apiSettings = profile.apiSettings || {};
    apiSettings.openrouter_key = key;

    await profileRepo.update({ id: userId }, { apiSettings: apiSettings });

    // Clear the code_verifier cookie and redirect
    const response = NextResponse.redirect(new URL(redirect + '?success=true', request.url));
    response.cookies.set('openrouter_code_verifier', '', { 
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OpenRouter callback error:', error);
    return NextResponse.redirect(new URL('/settings?error=internal_error', request.url));
  }
}
