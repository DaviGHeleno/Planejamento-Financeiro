import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    if (user === 'casal' && pwd === 'nossasenha123') {
      return NextResponse.next();
    }
  }

  return new NextResponse('Acesso Restrito', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Acesso Restrito"',
    },
  });
}

// Ignora assets estáticos, favicon e ficheiros internos do Next.js/Vercel
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};