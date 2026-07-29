export const registrationLinks = [
  {
    href: '/register',
    label: 'Model Registration',
    match: (pathname: string) =>
      pathname === '/register' || pathname === '/register/',
  },
  {
    href: '/register/community',
    label: 'Community Registration',
    match: (pathname: string) => pathname.startsWith('/register/community'),
  },
  {
    href: '/register/designer',
    label: 'Designer Registration',
    match: (pathname: string) => pathname.startsWith('/register/designer'),
  },
] as const
