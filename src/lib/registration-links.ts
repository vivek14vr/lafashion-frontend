export const registrationLinks = [
  {
    href: '/register',
    label: 'Model Registration',
    match: (pathname: string) =>
      pathname === '/register' || pathname === '/register/',
  },
  {
    href: '/register/designer',
    label: 'Designer Registration',
    match: (pathname: string) => pathname.startsWith('/register/designer'),
  },
  {
    href: '/register/other',
    label: 'Other Registrations',
    match: (pathname: string) => pathname.startsWith('/register/other'),
  },
] as const
