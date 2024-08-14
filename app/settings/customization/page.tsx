import { Separator } from '@/components/ui/separator';
import { CustomizationForm } from '@/app/settings/customization/customization-form';

export default function CustomizationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Customization</h3>
        <p className="text-sm text-muted-foreground">
          Customize your experience by enabling powerful features and enhancing
          your assistants.
        </p>
      </div>
      <Separator />
      <CustomizationForm />
    </div>
  );
}
