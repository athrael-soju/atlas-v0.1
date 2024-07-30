import { FormEvent, ReactNode, useState } from 'react';
import { scribe, sage } from '../client/atlas';
import { AssistantMessage, UserMessage } from '@/components/message';
import { useUIState, useActions } from 'ai/rsc';
import { AI } from '@/app/action';
import { ForgeParams, MessageRole, Purpose } from '../types';
import { usePlayer } from '@/lib/hooks/use-player';
import { useMicVAD, utils } from '@ricky0123/vad-react';
import { track } from '@vercel/analytics';

export const useMessaging = (
  userEmail: string,
  spinner: JSX.Element,
  purpose: Purpose
) => {
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();
  const [inputValue, setInputValue] = useState<string>('');
  const player = usePlayer();

  const topK = parseInt(process.env.NEXT_PUBLIC_PINECONE_TOPK as string) || 100;
  const topN = parseInt(process.env.NEXT_PUBLIC_COHERE_TOPN as string) || 10;

  const forgeParams: ForgeParams = {
    provider: (process.env.NEXT_PUBLIC_PARSING_PROVIDER as string) || 'local',
    maxChunkSize:
      parseInt(process.env.NEXT_PUBLIC_MAX_CHUNK_SIZE as string) || 1024,
    minChunkSize:
      parseInt(process.env.NEXT_PUBLIC_MIN_CHUNK_SIZE as string) || 256,
    overlap: parseInt(process.env.NEXT_PUBLIC_OVERLAP as string) || 128,
    chunkBatch: parseInt(process.env.NEXT_PUBLIC_CHUNK_BATCH as string) || 150,
    parsingStrategy:
      (process.env.NEXT_PUBLIC_UNSTRUCTURED_PARSING_STRATEGY as string) ||
      'auto',
  };

  const vad = useMicVAD({
    startOnLoad: true,
    onSpeechEnd: (audio) => {
      player.stop();
      const wav = utils.encodeWAV(audio);
      const blob = new Blob([wav], { type: 'audio/wav' });
      submitBlob(blob);
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

  const updateLastMessage = (role: MessageRole, content: string) => {
    setMessages((currentMessages) => {
      const newMessages = [...currentMessages];
      newMessages[newMessages.length - 1].display = (
        <AssistantMessage role={role} message={content} />
      );
      return newMessages;
    });
  };

  const addNewMessage = (role: MessageRole, content: ReactNode) => {
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        display: <AssistantMessage role={role} message={content} />,
      },
    ]);
  };

  const submitBlob = async (data: string | Blob) => {
    const formData = new FormData();
    if (typeof data === 'string') {
      formData.append('input', data);
      track('Text input');
    } else {
      formData.append('input', data, 'audio.wav');
      track('Speech input');
    }

    for (const message of messages) {
      formData.append('message', JSON.stringify(message));
    }

    const submittedAt = Date.now();
    try {
      const response = await fetch('/api/atlas/herald', {
        method: 'POST',
        body: formData,
      });

      const transcript = decodeURIComponent(
        response.headers.get('X-Transcript') || ''
      );

      const text = decodeURIComponent(response.headers.get('X-Response') || '');

      if (!response.ok || !transcript || !text || !response.body) {
        if (response.status === 429) {
          console.error('Too many requests. Please try again later.');
        } else {
          console.error((await response.text()) || 'An error occurred.');
        }
        return messages;
      }
      const latency = Date.now() - submittedAt;

      player.play(response.body, () => {
        const isFirefox = navigator.userAgent.includes('Firefox');
        if (isFirefox) vad.start();
      });

      setInputValue(transcript);
      return [
        ...messages,
        {
          role: 'user',
          content: transcript,
        },
        {
          role: 'assistant',
          content: text,
        },
      ];
    } catch (error: any) {
      addNewMessage(
        MessageRole.Error,
        <AssistantMessage role={MessageRole.Text} message={error.message} />
      );
    }
  };

  const submitMessage = async (message: string) => {
    setInputValue('');
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        display: <UserMessage text={message} />,
      },
    ]);
    let context = '';
    if (process.env.NEXT_PUBLIC_INFERENCE_MODEL === 'assistant') {
      addNewMessage(MessageRole.Spinner, spinner);
      try {
        let firstRun = true;
        let prevType: MessageRole.Text | MessageRole.Code | MessageRole.Image;
        let currentMessage: string = '';
        if (purpose === Purpose.Scribe) {
          await scribe(userEmail, message, topK, topN, (event) => {
            const { type, message } = JSON.parse(event.replace('data: ', ''));
            if (type.includes('created') && firstRun === false) {
              addNewMessage(prevType, currentMessage);
              if (type === 'text_created') {
                prevType = MessageRole.Text;
              } else if (type === 'tool_created') {
                prevType = MessageRole.Code;
              }
              currentMessage = '';
            } else if (
              [MessageRole.Text, MessageRole.Code, MessageRole.Image].includes(
                type
              )
            ) {
              currentMessage += message;
              prevType = type;
              firstRun = false;
              updateLastMessage(type, currentMessage);
            }
          });
        } else if (purpose === Purpose.Sage) {
          firstRun = true;
          currentMessage = '';
          await sage(userEmail, message, (event: string) => {
            const { type, message } = JSON.parse(event.replace('data: ', ''));
            if (type.includes('created') && firstRun === false) {
              addNewMessage(prevType, currentMessage);
              if (type === 'text_created') {
                prevType = MessageRole.Text;
              } else if (type === 'tool_created') {
                prevType = MessageRole.Code;
              } else if (type === 'image_created') {
                prevType = MessageRole.Image;
              }
              currentMessage = '';
            } else if (
              [MessageRole.Text, MessageRole.Code, MessageRole.Image].includes(
                type
              )
            ) {
              currentMessage += message;
              prevType = type;
              firstRun = false;
              updateLastMessage(type, currentMessage);
            }
          });
        }
      } catch (error: any) {
        addNewMessage(
          MessageRole.Error,
          <AssistantMessage role={MessageRole.Text} message={error.message} />
        );
      }
    } else {
      // Otherwise completions is used.
      const responseMessage = await submitUserMessage(message, context);
      setMessages((currentMessages) => [...currentMessages, responseMessage]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (window.innerWidth < 600) {
      (e.target as HTMLFormElement)['message']?.blur();
    }

    const value = inputValue.trim();
    if (!value) return;

    await submitMessage(value);
  };

  return {
    vad,
    messages,
    inputValue,
    forgeParams,
    setInputValue,
    submitMessage,
    handleSubmit,
  };
};
