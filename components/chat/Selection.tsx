import React from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHammer, faEye, faBook } from '@fortawesome/free-solid-svg-icons';

interface SelectionProps {
  setView: (view: 'select' | 'upload' | 'chat' | 'analyze') => void;
}

const commonButtonStyles = `
  flex-1 text-lg md:text-2xl border-2 border-transparent  
  bg-secondary text-secondary-foreground transition-transform transition-colors duration-300 ease-in-out 
  transform hover:bg-primary hover:text-primary-foreground hover:scale-105 hover:z-10 shadow-lg hover:border-primary
  flex flex-col items-center justify-center 
`;

const containerStyles = `
  flex flex-1 flex-col md:flex-row gap-4 p-8 min-h-[920px] md:min-h-[890px] 
`;

const iconStyles = {
  fontSize: '4rem',
  stroke: 'var(--color-bg-secondary)',
  strokeWidth: '1px',
};

export const Selection: React.FC<SelectionProps> = ({ setView }) => (
  <div className={containerStyles}>
    <button
      onClick={() => setView('upload')}
      className={`${commonButtonStyles} border-b-2 md:border-b-0 md:border-r-2`}
    >
      <FontAwesomeIcon icon={faHammer} style={iconStyles} className="mb-4" />
      <div>Forge</div>
    </button>
    <button
      onClick={() => setView('chat')}
      className={`${commonButtonStyles} border-b-2 md:border-b-0 md:border-r-2`}
    >
      <FontAwesomeIcon icon={faEye} style={iconStyles} className="mb-4" />
      <div>Retrieve</div>
    </button>
    <button
      onClick={() => setView('analyze')}
      className={`${commonButtonStyles} border-b-2 md:border-b-0`}
    >
      <FontAwesomeIcon icon={faBook} style={iconStyles} className="mb-4" />
      <div>Analyze</div>
    </button>
  </div>
);
