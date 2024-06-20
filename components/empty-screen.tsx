import { ExternalLink } from '@/components/external-link';
import { Purpose } from '@/lib/types';

interface EmptyScreenProps {
  assistantSelected: Purpose | null;
}

export function EmptyScreen({
  assistantSelected,
}: EmptyScreenProps): JSX.Element {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-2xl bg-secondary sm:p-4 p-2 text-sm sm:text-base">
        <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold max-w-fit inline-block mx-auto text-center">
          You are now consulting the <u>{assistantSelected}</u>
        </h1>
      </div>
      <p className="leading-normal text-muted-foreground text-[0.8rem] text-center max-w-96 ml-auto mr-auto">
        Note: This is a proof of concept. For more information, please{' '}
        <ExternalLink href="https://nextjs.org">Contact support</ExternalLink>
      </p>
    </div>
  );
}
