'use client';

import { IconAI, IconUser } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './chat.module.css';
import { MessageProps } from '@/lib/types';

function UserMessage({ text }: Readonly<{ text: React.ReactNode }>) {
  return (
    <div className="group relative flex items-start md:-ml-12">
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm bg-background">
        <IconUser />
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">{text}</div>
    </div>
  );
}

const CodeMessage = ({ text }: { text: string }) => {
  return (
    <div className={styles.codeMessage}>
      {text.split('\n').map((line, index) => (
        <div key={index}>
          <span>{`${index + 1}. `}</span>
          {line}
        </div>
      ))}
    </div>
  );
};

const AssistantMessage = ({ text }: { text: string }) => {
  return (
    <div className={styles.assistantMessage}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
};

const Message = ({ role, text }: MessageProps) => {
  switch (role) {
    case 'user':
      return <UserMessage text={text} />;
    case 'assistant':
      return <AssistantMessage text={text} />;
    case 'code':
      return <CodeMessage text={text} />;
    default:
      return null;
  }
};

export function BotMessage({
  children,
  className,
  role,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  role: 'user' | 'assistant' | 'code';
}>) {
  if (role === 'user') {
    return <UserMessage text={children as string} />;
  } else {
    return (
      <div
        className={cn('group relative flex items-start md:-ml-12', className)}
      >
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm bg-primary text-primary-foreground">
          <IconAI />
        </div>
        <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
          {typeof children === 'string' ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {children}
            </ReactMarkdown>
          ) : (
            children
          )}
        </div>
      </div>
    );
  }
}

export function BotCard({
  children,
  showAvatar = true,
}: Readonly<{
  children: React.ReactNode;
  showAvatar?: boolean;
}>) {
  return (
    <div className="group relative flex items-start md:-ml-12">
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
    <div
      className={
        'mt-2 flex items-center justify-center gap-2 text-xs text-gray-500'
      }
    >
      <div className={'max-w-[600px] flex-initial px-2 py-2'}>{children}</div>
    </div>
  );
}
