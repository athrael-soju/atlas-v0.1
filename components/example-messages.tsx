import React from 'react';
import { cn } from '@/lib/utils';

interface ExampleMessagesProps {
  onClick: (message: string) => void;
}

export const ExampleMessages: React.FC<ExampleMessagesProps> = ({
  onClick,
}) => {
  const exampleMessages = [
    {
      heading: 'Could you please explain',
      subheading: 'what Atlas is?',
      message: 'Could you please explain what Atlas is?',
    },
    {
      heading: 'How does Atlas',
      subheading: 'process and store my data?',
      message: 'How does Atlas process and store my data?',
    },
  ];

  return (
    <div className="mb-2 grid sm:grid-cols-2 gap-2 sm:gap-4 px-4 sm:px-0">
      {exampleMessages.map((message, index) => (
        <div
          key={index}
          className={cn(
            'cursor-pointer bg-secondary rounded-2xl p-4 sm:p-6 hover:bg-gray-300 transition-colors',
          )}
          onClick={() => onClick(message.message)}
        >
          <div className="font-medium">{message.heading}</div>
          <div className="text-sm text-muted-foreground">
            {message.subheading}
          </div>
        </div>
      ))}
    </div>
  );
};
