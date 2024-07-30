import clsx from 'clsx';
import React from 'react';

interface SoundVisualizerProps {
  events: {
    loading: boolean;
    errored: boolean;
    userSpeaking: boolean;
  };
}

export const SoundVisualizer: React.FC<SoundVisualizerProps> = ({ events }) => {
  return (
    <div
      className={clsx(
        'absolute size-36 blur-3xl rounded-full bg-gradient-to-b from-red-200 to-red-400 dark:from-red-600 dark:to-red-800 -z-50 transition ease-in-out',
        {
          'opacity-0': events.loading || events.errored,
          'opacity-30':
            !events.loading && !events.errored && !events.userSpeaking,
          'opacity-100 scale-110': events.userSpeaking,
        }
      )}
      style={{
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        margin: 'auto',
      }}
    />
  );
};
