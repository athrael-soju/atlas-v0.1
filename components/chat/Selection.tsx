import React from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHammer, faEye, faBook } from '@fortawesome/free-solid-svg-icons';

interface SelectionProps {
  setView: (view: 'select' | 'upload' | 'chat' | 'analyze') => void;
}

export const Selection: React.FC<SelectionProps> = ({ setView }) => (
  <div className="flex items-center justify-center h-screen p-4">
    <div className="flex flex-1 flex-col md:flex-row w-full h-full">
      <Button
        onClick={() => setView('upload')}
        className="flex-1 h-full py-10 md:py-20 text-lg md:text-xl border-b-2 md:border-b-0 md:border-r-2 border-gray-300 flex flex-col items-center"
      >
        <FontAwesomeIcon
          icon={faHammer}
          style={{ fontSize: '10rem' }}
          className="mb-4"
        />
        Enhance knowledgebase (Forge)
      </Button>
      <Button
        onClick={() => setView('chat')}
        className="flex-1 h-full py-10 md:py-20 text-lg md:text-xl border-b-2 md:border-b-0 md:border-r-2 border-gray-300 flex flex-col items-center"
      >
        <FontAwesomeIcon
          icon={faEye}
          style={{ fontSize: '10rem' }}
          className="mb-4"
        />
        Search Knowledgebase (Oracle)
      </Button>
      <Button
        onClick={() => setView('analyze')}
        className="flex-1 h-full py-10 md:py-20 text-lg md:text-xl border-b-2 md:border-b-0 md:border-r-2 border-gray-300 flex flex-col items-center"
      >
        <FontAwesomeIcon
          icon={faBook}
          style={{ fontSize: '10rem' }}
          className="mb-4"
        />
        Analyze data (Sage)
      </Button>
    </div>
  </div>
);
