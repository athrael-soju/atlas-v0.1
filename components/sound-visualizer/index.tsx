import React from 'react';
import clsx from 'clsx';

interface SoundVisualizerProps {
  events: {
    loading: boolean;
    errored: boolean;
    userSpeaking: boolean;
  };
}

// Adding CSS for the animation
const styles = `
@keyframes gradient-move {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
`;

export const SoundVisualizer: React.FC<SoundVisualizerProps> = ({ events }) => {
  return (
    <>
      <style>{styles}</style>
      <div
        className={clsx(
          'absolute size-36 blur-3xl rounded-full -z-50 transition ease-in-out',
          {
            'opacity-0': events.loading || events.errored,
            'opacity-30':
              !events.loading && !events.errored && !events.userSpeaking,
            'opacity-100 scale-110': events.userSpeaking,
          }
        )}
        style={{
          background:
            'linear-gradient(270deg, red, orange, yellow, green, blue, indigo, violet, red)',
          backgroundSize: '200% 200%',
          animation: 'gradient-move 10s ease infinite',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          margin: 'auto',
        }}
      />
    </>
  );
};
