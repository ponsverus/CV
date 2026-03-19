export function isPasswordRecoveryUrl() {
  try {
    const url = new URL(window.location.href);
    const s = url.searchParams;
    const hashRaw = (url.hash || '').replace(/^#/, '');
    const hashParams = new URLSearchParams(
      hashRaw.startsWith('?') ? hashRaw.slice(1) : hashRaw
    );

    const type = s.get('type') || hashParams.get('type');
    const code = s.get('code') || hashParams.get('code');
    const accessToken =
      s.get('access_token') || hashParams.get('access_token');

    return type === 'recovery' || !!code || !!accessToken;
  } catch {
    const href = window.location.href || '';
    return (
      href.includes('type=recovery') ||
      href.includes('access_token=') ||
      href.includes('code=')
    );
  }
}
