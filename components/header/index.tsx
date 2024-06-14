'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import MobileMenu from './mobile-menu';
import DesktopNav from './desktop-nav';
import UserMenu from './user-menu';
import { Bars3Icon } from '@heroicons/react/20/solid';

export function Header() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = () => {
    signIn();
  };

  const handleLogout = () => {
    signOut();
  };

  return (
    <header className="bg-background header">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
        aria-label="Global"
      >
        {session?.user && (
          <div className="flex lg:flex-1">
            <button type="button" className="-m-1.5 p-1.5" onClick={() => {}}>
              <span className="sr-only">Atlas</span>
              <img
                className="h-8"
                src="/atlas.png"
                alt="Atlas Logo"
                style={{ transform: 'scale(2.5)', transformOrigin: 'center' }}
              />
            </button>
          </div>
        )}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        {session?.user && <DesktopNav />}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4">
          {session ? (
            <UserMenu session={session} handleLogout={handleLogout} />
          ) : (
            <button
              onClick={handleLogin}
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Log in <span aria-hidden="true">&rarr;</span>
            </button>
          )}
        </div>
      </nav>
      <MobileMenu
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        session={session}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
      />
    </header>
  );
}
