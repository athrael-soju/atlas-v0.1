import React from 'react';
import { Button } from '@/components/ui/button';

interface SelectionProps {
  setView: (view: 'select' | 'upload' | 'chat' | 'analyze') => void;
}

export const Selection: React.FC<SelectionProps> = ({ setView }) => (
  <div className="flex flex-col items-center justify-center h-screen space-y-4">
    <Button onClick={() => setView('upload')}>
      Enhance knowledgebase (Forge)
    </Button>
    <Button onClick={() => setView('chat')}>
      Search Knowledgebase (Oracle)
    </Button>
    <Button onClick={() => setView('analyze')}>Analyze data (Sage)</Button>
  </div>
);
