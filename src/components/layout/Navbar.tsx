'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Zap, LogOut, LayoutDashboard, Calendar, Shield, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isAdmin = session?.user?.role === 'ADMIN'

  const playerLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/book', label: 'Book Slot', icon: Calendar },
  ]

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Floor View', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/tables', label: 'Tables', icon: Calendar },
    { href: '/admin/checkin', label: 'Check-In', icon: Shield },
  ]

  const links = isAdmin ? adminLinks : playerLinks

  return (
    <nav className="glass-dark sticky top-0 z-50 border-b border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-lg group-hover:shadow-cyan-500/25 transition-all duration-300">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-gradient text-lg font-bold tracking-tight hidden sm:block">
              TT BookIt
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* User + Logout */}
          <div className="flex items-center gap-3">
            {session && (
              <>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-foreground leading-tight">
                    {session.user.name}
                  </span>
                  <span className={cn(
                    'text-xs font-semibold uppercase tracking-wider leading-tight',
                    isAdmin ? 'text-violet-400' : 'text-cyan-400'
                  )}>
                    {isAdmin ? 'Admin' : 'Player'}
                  </span>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                  {session.user.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:block">Sign out</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden gap-1 pb-2 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
