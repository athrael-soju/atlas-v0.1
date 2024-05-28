import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faArrowRight } from '@fortawesome/free-solid-svg-icons';
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
        <FontAwesomeIcon icon={faCog} />
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
        <FontAwesomeIcon icon={faArrowRight} />
        <span className="sr-only">Send message</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent>Send message</TooltipContent>
  </Tooltip>
);
