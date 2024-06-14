'use client';

import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from '@headlessui/react';
import {
  PhoneIcon,
  PlayCircleIcon,
  ChevronDownIcon,
} from '@heroicons/react/20/solid';

import {
  Cog6ToothIcon,
  ChartPieIcon,
  BookOpenIcon,
  FingerPrintIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';

export const products = [
  {
    name: 'Processing',
    description:
      'The Forge processes both structured and unstructured data, preparing it for analysis',
    href: '#',
    icon: Cog6ToothIcon,
  },
  {
    name: 'Knowdlegebase',
    description:
      'The Scribe processes data with unparalleled efficiency, accuracy, and speed',
    href: '#',
    icon: BookOpenIcon,
  },
  {
    name: 'Analytics',
    description:
      'The Sage provides real-time analysis and visualization of complex data at scale',
    href: '#',
    icon: ChartPieIcon,
  },
  {
    name: 'Data Management',
    description:
      'The Archivist excels in storage and managment of data for rapid retrieval',
    href: '#',
    icon: DocumentChartBarIcon,
  },
  {
    name: 'Data Security',
    description:
      'Cerberus delivers data security and privacy in compliance with latest standards',
    href: '#',
    icon: FingerPrintIcon,
  },
];

export const callsToAction = [
  { name: 'Watch demo', href: '#', icon: PlayCircleIcon },
  { name: 'Support', href: '#', icon: PhoneIcon },
];

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface UserMenuProps {
  session: any;
  handleLogout: () => void;
}

export default function UserMenu({
  session,
  handleLogout,
}: Readonly<UserMenuProps>) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="inline-flex">
        <img
          src={session.user?.image || '/cabbage.png'}
          alt="User Avatar"
          className="h-8 rounded-full"
        />
        <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </MenuButton>
      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <MenuItem>
              {({ focus }) => (
                <button
                  onClick={() => {}}
                  className={classNames(
                    focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'block w-full text-left px-4 py-2 text-sm'
                  )}
                >
                  Settings
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  onClick={handleLogout}
                  className={classNames(
                    focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                    'block w-full text-left px-4 py-2 text-sm'
                  )}
                >
                  Log out
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
