'use client';

import { IconAI, IconUser } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './chat.module.css';
import { MessageProps } from '@/lib/types';

export function UserMessage({ text }: Readonly<{ text: React.ReactNode }>) {
  return (
    <div className="group relative flex items-start md:-ml-12">
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm bg-background">
        <IconUser />
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
        {typeof text === 'string' ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        ) : (
          text
        )}
      </div>
    </div>
  );
}

const CodeContent = ({ text }: { text: string }) => {
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
const TextContent = ({ text }: { text: string }) => {
  return (
    <div className={styles.assistantMessage}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
};

export const Message = ({ role, text }: MessageProps) => {
  if (role === 'code') {
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
  role: 'text' | 'code' | 'image' | 'spinner';
  text: React.ReactNode;
  className?: string;
}>) {
  return (
    <div className={cn('group relative flex items-start md:-ml-12', className)}>
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm bg-primary text-primary-foreground">
        <IconAI />
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
        {typeof text === 'string' ? <Message role={role} text={text} /> : text}
      </div>
    </div>
  );
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

export function SystemMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-500">
      <div className="max-w-[600px] flex-initial px-2 py-2">{children}</div>
    </div>
  );
}
