import { useMicVAD, utils } from '@ricky0123/vad-react';
import { usePlayer } from '@/lib/hooks/use-player';
import { herald } from '@/lib/client/atlas';
import { toast } from '@/components/ui/use-toast';
import { HeraldParams } from '../types';

export const useSpeech = (submitMessage: (message: string) => void) => {
  // const latestMessage = messages[messages.length - 1];
  // if (latestMessage?.role === 'assistant') {
  //   console.log('assistant message: ', latestMessage?.display?.props?.message);
  // }

  const player = usePlayer();
  const vad = useMicVAD({
    startOnLoad: false,
    onSpeechEnd: async (audio) => {
      player.stop();
      const wav = utils.encodeWAV(audio);
      const blob = new Blob([wav], { type: 'audio/wav' });
      try {
        const onUpdate = (event: string) => {
          const { type, message } = JSON.parse(event.replace('data: ', ''));

          if (type === 'transcript') {
            const transcript = message.trim();

            if (transcript && transcript !== '') {
              submitMessage(transcript);
            }
          } else if (type === 'text') {
            console.log('text: ', message);
          } else if (type === 'synthesis-complete') {
            const base64Data = message;
            const audioStream = base64ToReadableStream(base64Data);
            player.play(audioStream, () => {
              const isFirefox = navigator.userAgent.includes('Firefox');
              if (isFirefox) vad.start();
            });
          } else if (type === 'error') {
            toast({
              title: 'Error',
              description: `Failed: ${message}`,
              variant: 'destructive',
            });
          }
        };

        const voiceParams: HeraldParams = {
          message: blob,
        };

        await herald('transcribe', voiceParams, onUpdate);

        const aiResponseParams = {
          message: 'ok',
        };
        await herald('synthesize', aiResponseParams, onUpdate);
      } catch (error: any) {
        throw new Error(error.message);
      }
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
        crossOriginIsolated: true,
      };
    },
  });

  return {
    vad,
    startVAD: vad.start,
    stopVAD: vad.pause,
  };
};

function base64ToReadableStream(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create a ReadableStream from the Uint8Array
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}
