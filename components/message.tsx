'use client';

import { IconAI, IconUser } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeProps, MessageProps, MessageRole } from '@/lib/types';

export function UserMessage({ text }: Readonly<{ text: React.ReactNode }>) {
  return (
    <div className="group relative flex items-start justify-end md:-mr-12">
      <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1 text-right">
        <div className="rounded-lg bg-primary-foreground p-2 shadow-sm inline-block">
          {typeof text === 'string' ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          ) : (
            text
          )}
        </div>
      </div>
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm bg-background">
        <IconUser />
      </div>
    </div>
  );
}

const CodeContent = ({ text }: { text: string }) => {
  return (
    <div className="codeMessage">
      {text.split('\n').map((line, index) => (
        <div key={index} className="flex">
          <span className="text-gray-500">{`${index + 1}. `}</span>
          <pre className="ml-2">{line}</pre>
        </div>
      ))}
    </div>
  );
};

const TextContent = ({ text }: { text: string }) => {
  return (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ inline, children, ...props }: CodeProps) => {
            return inline ? (
              <code className="inlineCode" {...props}>
                {children}
              </code>
            ) : (
              <CodeContent text={String(children).replace(/\n$/, '')} />
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

export const Message = ({ role, text }: MessageProps) => {
  if (role === MessageRole.Code) {
    return <CodeContent text={text} />;
  } else {
    return <TextContent text={text} />;
  }
};

export function AssistantMessage({
  role,
  text,
  className,
}: Readonly<{
  role: MessageRole;
  text: React.ReactNode;
  className?: string;
}>) {
  return (
    <div className={cn('group relative flex items-start md:-ml-12', className)}>
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm bg-primary text-primary-foreground">
        <IconAI />
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1 assistantMessage">
        <div className="rounded-lg bg-secondary p-2 shadow-sm inline-block">
          {typeof text === 'string' ? (
            <Message role={role} text={text} />
          ) : (
            text
          )}
        </div>
      </div>
    </div>
  );
}

export function AssistantCard({
  children,
  showAvatar = true,
}: Readonly<{
  children: React.ReactNode;
  showAvatar?: boolean;
}>) {
  return (
    <div className="group relative flex items-start">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm bg-primary text-primary-foreground',
          !showAvatar && 'invisible'
        )}
      >
        <IconAI />
      </div>
      <div className="ml-4 flex-1 px-1">{children}</div>
    </div>
  );
}

export function SystemMessage({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500">
      <div className="max-w-[600px] flex-initial px-2 py-2">{children}</div>
    </div>
  );
}
