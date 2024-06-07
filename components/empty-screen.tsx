import { ExternalLink } from '@/components/external-link';

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-2xl bg-secondary sm:p-4 p-2 text-sm sm:text-base">
        <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold max-w-fit inline-block mx-auto text-center">
          Welcome to Atlas
        </h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          Atlas is a revolutionary application designed to store millions of
          documents and seamlessly retrieve information from them. Imagine
          having all your data at your fingertips, securely stored and easily
          accessible, enhancing your interactions with any large language model
          you use.
        </p>
        <p className="mb-2 leading-normal text-muted-foreground">
          Atlas is built with{' '}
          <ExternalLink href="https://nextjs.org">Next.js</ExternalLink>
          {', '}
          <ExternalLink href="https://sdk.vercel.ai/docs">
            Vercel
          </ExternalLink>{' '}
          and uses a powerful Retrieval Augmented Generation Engine (RAG) to
          generate fast and accurate responses to your questions.
        </p>
      </div>
      <p className="leading-normal text-muted-foreground text-[0.8rem] text-center max-w-96 ml-auto mr-auto">
        Note: Data and latency are simulated for illustrative purposes.
      </p>
    </div>
  );
}
