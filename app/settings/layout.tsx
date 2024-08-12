import { Metadata } from 'next';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { SidebarNav } from '@/app/settings/components/sidebar-nav';
import { IconUTurnLeft } from '@/components/ui/icons';
export const metadata: Metadata = {
  title: 'Forms',
  description: 'Advanced form example using react-hook-form and Zod.',
};

const sidebarNavItems = [
  {
    title: 'Profile',
    href: '/settings/profile',
  },
  {
    title: 'The Forge',
    href: '/settings/forge',
  },
  {
    title: 'The Scribe',
    href: '/settings/scribe',
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}
// TODO: Update all forms from DB & remove env vars.
export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="hidden space-y-6 p-10 pb-16 md:block">
      <div className="flex justify-between items-center space-y-0.5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and configure advanced features.
          </p>
        </div>
        <Link href="/" title="Go back to homepage">
          <button className="btn btn-primary flex items-center space-x-2 transform scale-150">
            <IconUTurnLeft className="h-5 w-5" />
          </button>
        </Link>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
