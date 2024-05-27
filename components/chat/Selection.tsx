import React from 'react';
import { Button } from '@/components/ui/button';

interface SelectionProps {
  setView: (view: 'select' | 'upload' | 'chat' | 'analyze') => void;
}

export const Selection: React.FC<SelectionProps> = ({ setView }) => (
  <div className="flex items-center justify-center h-screen p-4">
    <div className="flex flex-col md:flex-row w-full max-w-4x1">
      <Button
        onClick={() => setView('upload')}
        className="flex-1 py-10 md:py-20 text-lg md:text-xl border-b-2 md:border-b-0 md:border-r-2 border-gray-300"
      >
        Enhance knowledgebase (Forge)
      </Button>
      <Button
        onClick={() => setView('chat')}
        className="flex-1 py-10 md:py-20 text-lg md:text-xl border-b-2 md:border-b-0 md:border-r-2 border-gray-300"
      >
        Search Knowledgebase (Oracle)
      </Button>
      <Button
        onClick={() => setView('analyze')}
        className="flex-1 py-10 md:py-20 text-lg md:text-xl rounded-b-lg md:rounded-r-lg md:rounded-l-none"
      >
        Analyze data (Sage)
      </Button>
    </div>
  </div>
);
