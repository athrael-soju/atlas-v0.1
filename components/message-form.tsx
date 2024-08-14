import React from 'react';
import Textarea from 'react-textarea-autosize';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from './ui/button';
import { IconArrowElbow, IconPlus } from './ui/icons';
import { MessageFormProps } from '@/lib/types';

export const MessageForm = ({
  inputValue,
  setInputValue,
  onKeyDown,
  inputRef,
}: MessageFormProps) => (
  <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-secondary px-12 sm:rounded-3xl sm:px-12">
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="absolute left-4 top-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
          onClick={(e) => {
            e.preventDefault();
            window.location.reload();
          }}
        >
          <IconPlus />
        </Button>
      </TooltipTrigger>
      <TooltipContent>New Chat</TooltipContent>
    </Tooltip>

    <Textarea
      ref={inputRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      placeholder="Send a message."
      className="min-h-[60px] w-full bg-transparent placeholder:text-muted-foreground resize-none px-8 py-[1.3rem] focus-within:outline-none sm:text-sm"
      autoFocus
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      name="message"
      rows={1}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
    />
    <div className="absolute right-4 top-[13px] sm:right-4 flex items-center space-x-1">
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
    </div>
  </div>
);
