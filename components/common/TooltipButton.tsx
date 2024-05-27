// components/chat/TooltipButtons.tsx

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IconPlus, IconArrowElbow } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

interface TooltipButtonProps {
  setView: (view: 'select') => void;
}

export const TooltipButton: React.FC<TooltipButtonProps> = ({ setView }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="outline"
        size="icon"
        className="absolute left-4 top-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
        onClick={() => setView('select')}
      >
        <IconPlus />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Options</TooltipContent>
  </Tooltip>
);

export const SendMessageButton: React.FC = () => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="submit"
        size="icon"
        className="bg-transparent shadow-none text-secondary-foreground rounded-full hover:bg-secondary-foreground/25"
      >
        <IconArrowElbow />
        <span className="sr-only">Send message</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent>Send message</TooltipContent>
  </Tooltip>
);
