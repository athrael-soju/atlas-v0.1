import React from 'react';
import clsx from 'clsx';

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
          'conic-gradient(red, orange, yellow, green, blue, indigo, violet, red)',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        margin: 'auto',
      }}
    />
  );
};
