import { useMicVAD, utils } from '@ricky0123/vad-react';
import { usePlayer } from '@/lib/hooks/use-player';

export const useSpeech = () => {
  const player = usePlayer();

  const vad = useMicVAD({
    startOnLoad: true,
    onSpeechEnd: async (audio) => {
      player.stop();
      const wav = utils.encodeWAV(audio);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const formData = new FormData();

      formData.append('input', blob, 'audio.wav');

      const response = await fetch('/api/atlas/herald', {
        method: 'POST',
        body: formData,
      });

      player.play(response.body!, () => {
        const isFirefox = navigator.userAgent.includes('Firefox');
        if (isFirefox) vad.start();
      });
    },
    workletURL: '/vad.worklet.bundle.min.js',
    modelURL: '/silero_vad.onnx',
    positiveSpeechThreshold: 0.6,
    minSpeechFrames: 4,
    ortConfig(ort) {
      const isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent
      );

      ort.env.wasm = {
        wasmPaths: {
          'ort-wasm-simd-threaded.wasm': '/ort-wasm-simd-threaded.wasm',
          'ort-wasm-simd.wasm': '/ort-wasm-simd.wasm',
          'ort-wasm.wasm': '/ort-wasm.wasm',
          'ort-wasm-threaded.wasm': '/ort-wasm-threaded.wasm',
        },
        numThreads: isSafari ? 1 : 4,
      };
    },
  });

  return {
    vad,
  };
};
