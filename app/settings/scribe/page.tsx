import { Separator } from '@/components/ui/separator';
import { ScribeForm } from '@/app/settings/scribe/scribe-form';

export default function ScribeAssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">The Scribe</h3>
        <p className="text-sm text-muted-foreground">
          Personalize your Scribe - The Advanced Semantic Similarity Assistant.
        </p>
      </div>
      <Separator />
      <ScribeForm />
    </div>
  );
}
