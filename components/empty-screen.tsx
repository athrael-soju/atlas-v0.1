import { Button } from "@/components/ui/button";
import { ExternalLink } from "@/components/external-link";
import { IconArrowRight } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { sub } from "date-fns";

const exampleMessages = [
  {
    heading: "Could you please explain",
    subheading: "what Atlas is?",
    message: "Could you please explain what Atlas is?",
  },
  {
    heading: "How does Atlas",
    subheading: "process and store my data?",
    message: "How does Atlas process and store my data?",
  },
];

export function EmptyScreen({
  submitMessage,
}: Readonly<{
  submitMessage: (message: string) => void;
}>) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-2xl bg-secondary sm:p-4 p-2 text-sm sm:text-base">
        <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold max-w-fit inline-block mx-auto text-center">
          Welcome to Atlas
        </h1>
        {/* <p className="mb-2 leading-normal text-muted-foreground">
          This is simple interface to the powerful Atlas RAG Pipeline.
        </p>
        <p className="mb-2 leading-normal text-muted-foreground">
          The application is built with
          <ExternalLink href="https://nextjs.org">
            Next.js
          </ExternalLink> and {' '}
          <ExternalLink href="https://sdk.vercel.ai/docs">Vercel</ExternalLink> and it uses{' '}
          <ExternalLink href="https://vercel.com/blog/ai-sdk-3-generative-ui">
            a powerful RAG Engine
          </ExternalLink>
          to generate responses to your questions.
        </p> */}
      </div>
      <p className="leading-normal text-muted-foreground text-[0.8rem] text-center max-w-96 ml-auto mr-auto">
        Note: Data and latency are simulated for illustrative purposes and
        should not be considered as financial advice.
      </p>
      <div className="mb-4 grid sm:grid-cols-2 gap-2 sm:gap-4 px-4 sm:px-0">
        {exampleMessages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "cursor-pointer bg-secondary rounded-2xl p-4 sm:p-6 transition-colors"
            )}
            onClick={async () => {
              submitMessage(message.message);
            }}
          >
            <div className="font-medium">{message.heading}</div>
            <div className="text-sm text-muted-foreground">
              {message.subheading}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
