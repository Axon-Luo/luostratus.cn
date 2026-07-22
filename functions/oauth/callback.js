export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return new Response('未配置 GitHub OAuth 环境变量', { status: 500 });
  }

  // Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: code,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    return new Response(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`, { status: 400 });
  }

  const token = tokenData.access_token;

  // Return HTML that posts the token back to the CMS window
  return new Response(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><script>
  (function() {
    function receiveMessage(e) {
      e.source.postMessage({
        token: '${token}',
        provider: 'github',
        backendName: 'github'
      }, e.origin);
      window.removeEventListener('message', receiveMessage);
    }
    window.addEventListener('message', receiveMessage, false);
    window.opener && window.opener.postMessage(
      { type: 'netlify-cms/oauth-provider-ready' }, '*'
    );
  })();
</script></head>
<body><p>登录成功，正在跳转…</p></body>
</html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
