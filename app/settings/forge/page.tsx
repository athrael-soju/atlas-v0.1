import { Separator } from '@/components/ui/separator';
import { ForgeForm } from '@/app/settings/forge/forge-form';

export default function SettingsForgePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Forge</h3>
        <p className="text-sm text-muted-foreground">
          Personalize your Processing settings to achieve the best results in
          semantic similarity.
        </p>
      </div>
      <Separator />
      <ForgeForm />
    </div>
  );
}
