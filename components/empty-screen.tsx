import { Button } from '@/components/ui/button';
import { ExternalLink } from '@/components/external-link';
import { IconArrowRight } from '@/components/ui/icons';

const exampleMessages = [
  {
    heading: 'What are the trending stocks?',
    message: 'What are the trending stocks?',
  },
  {
    heading: "What's the stock price of AAPL?",
    message: "What's the stock price of AAPL?",
  },
  {
    heading: "I'd like to buy 10 shares of MSFT",
    message: "I'd like to buy 10 shares of MSFT",
  },
];

export function EmptyScreen({
  submitMessage,
}: {
  submitMessage: (message: string) => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-2xl bg-secondary sm:p-8 p-4 text-sm sm:text-base">
        <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold max-w-fit inline-block mx-auto text-center">
          Welcome to Atlas 1.0!
        </h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          This is a demo of an interactive assistant which allows you to ask
          questions about documents you have uploaded.
        </p>
        <p className="mb-2 leading-normal text-muted-foreground">
          The demo is built with
          <ExternalLink href="https://nextjs.org">Next.js</ExternalLink> and the{' '}
          <ExternalLink href="https://sdk.vercel.ai/docs">Atlas</ExternalLink>.
        </p>
        <p className="mb-2 leading-normal text-muted-foreground">
          It uses
          <ExternalLink href="https://vercel.com/blog/ai-sdk-3-generative-ui">
            a powerful RAG Engine
          </ExternalLink>
          to generate responses to your questions.
        </p>
        <p className="leading-normal text-muted-foreground">Try an example:</p>
        <div className="mt-4 flex flex-col items-start space-y-2 mb-4">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              onClick={async () => {
                submitMessage(message.message);
              }}
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
      <p className="leading-normal text-muted-foreground text-[0.8rem] text-center max-w-96 ml-auto mr-auto">
        Note: Data and latency are simulated for illustrative purposes and
        should not be considered as financial advice.
      </p>
    </div>
  );
}
