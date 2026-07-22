export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider') || 'github';

  if (!env.GITHUB_CLIENT_ID) {
    return new Response('未配置 GITHUB_CLIENT_ID 环境变量', { status: 500 });
  }

  const redirectUri = `${url.origin}/oauth/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize`
    + `?client_id=${env.GITHUB_CLIENT_ID}`
    + `&scope=repo,user`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return Response.redirect(githubAuthUrl, 302);
}
