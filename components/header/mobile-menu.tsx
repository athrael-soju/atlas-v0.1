'use client';

import {
  Dialog,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { classNames, products, callsToAction } from './user-menu';

interface MobileMenuProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  session: any;
  handleLogin: () => void;
  handleLogout: () => void;
}

export default function MobileMenu({
  mobileMenuOpen,
  setMobileMenuOpen,
  session,
  handleLogin,
  handleLogout,
}: Readonly<MobileMenuProps>) {
  return (
    <Dialog
      className="lg:hidden"
      open={mobileMenuOpen}
      onClose={setMobileMenuOpen}
    >
      <div className="fixed inset-0 z-10" />
      <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
        <button
          type="button"
          className="-m-1.5 p-1.5"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="sr-only">Close menu</span>
          <img className="h-8 w-8" src="/atlas.png" alt="Atlas Logo" />
        </button>
        <div className="mt-6 flow-root">
          <div className="-my-6 divide-y divide-gray-500/10">
            <div className="space-y-2 py-6">
              <button
                type="button"
                className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
              >
                About Atlas
              </button>
              <Disclosure as="div" className="-mx-3">
                {({ open }) => (
                  <>
                    <DisclosureButton className="flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">
                      Features
                      <ChevronDownIcon
                        className={classNames(
                          open ? 'rotate-180' : '',
                          'h-5 w-5 flex-none'
                        )}
                        aria-hidden="true"
                      />
                    </DisclosureButton>
                    <DisclosurePanel className="mt-2 space-y-2">
                      {[...products, ...callsToAction].map((item) => (
                        <DisclosureButton
                          key={item.name}
                          as="a"
                          href={item.href}
                          className="block rounded-lg py-2 pl-6 pr-3 text-sm font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                        >
                          {item.name}
                        </DisclosureButton>
                      ))}
                    </DisclosurePanel>
                  </>
                )}
              </Disclosure>

              <button
                type="button"
                className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
              >
                Contact us
              </button>
            </div>
            {session ? (
              <button
                onClick={handleLogout}
                className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                type="button"
              >
                Log out
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                type="button"
              >
                Log in
              </button>
            )}
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  );
}
