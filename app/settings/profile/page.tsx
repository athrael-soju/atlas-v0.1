import { Separator } from '@/components/ui/separator';
import { ProfileForm } from '@/app/settings/profile/profile-form';

export default function SettingsProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Personalize your profile settings.
        </p>
      </div>
      <Separator />
      <ProfileForm />
    </div>
  );
}
