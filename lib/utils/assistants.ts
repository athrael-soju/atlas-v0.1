import { scribe, sage } from '../client/atlas';
import { MessageRole } from '../types';
import { toast } from '@/components/ui/use-toast';

export const handleScribe = async (
  userEmail: string,
  message: string,
  topK: number,
  topN: number,
  updateLastMessage: (role: MessageRole, content: string) => void,
  addNewMessage: (role: MessageRole, content: React.ReactNode) => void
) => {
  let firstRun = true;
  let currentMessage: string = '';

  try {
    await scribe(userEmail, message, topK, topN, (event) => {
      const { type, message } = JSON.parse(event?.replace('data: ', ''));
      switch (type) {
        case 'text_created':
          if (firstRun) {
            updateLastMessage(MessageRole.Text, '');
            firstRun = false;
          } else {
            currentMessage = '';
            addNewMessage(MessageRole.Text, '');
          }
          break;
        case 'text':
          currentMessage += message;
          updateLastMessage(MessageRole.Text, currentMessage);
          break;
        case 'error':
          toast({
            title: 'Error',
            description: `${message}`,
            variant: 'destructive',
          });
          throw new Error(message);
        default:
          break;
      }
    });
  } catch (error) {
    updateLastMessage(
      MessageRole.Error,
      `Something went wrong while trying to respond. Sorry about that ${userEmail}! If this persists, would you please contact support?`
    );
  }
};

export const handleSage = async (
  userEmail: string,
  message: string,
  updateLastMessage: (role: MessageRole, content: string) => void,
  addNewMessage: (role: MessageRole, content: React.ReactNode) => void
) => {
  let firstRun = true;
  let currentMessage: string = '';
  try {
    await sage(userEmail, message, (event: string) => {
      const { type, message } = JSON.parse(event.replace('data: ', ''));
      switch (type) {
        case 'text_created':
          if (firstRun) {
            updateLastMessage(MessageRole.Text, '');
            firstRun = false;
          } else {
            currentMessage = '';
            addNewMessage(MessageRole.Text, '');
          }
          break;
        case 'text':
          currentMessage += message;
          updateLastMessage(MessageRole.Text, currentMessage);
          break;
        case 'code_created':
          if (firstRun) {
            updateLastMessage(MessageRole.Code, '');
            firstRun = false;
          } else {
            currentMessage = '';
            addNewMessage(MessageRole.Code, '');
          }
          break;
        case 'code':
          currentMessage += message;
          updateLastMessage(MessageRole.Code, currentMessage);
          break;
        case 'image':
          currentMessage += message;
          updateLastMessage(MessageRole.Image, currentMessage);
          break;
        case 'error':
          toast({
            title: 'Error',
            description: `${message}`,
            variant: 'destructive',
          });
          throw new Error(message);
        default:
          break;
      }
    });
  } catch (error) {
    updateLastMessage(
      MessageRole.Error,
      `Something went wrong while trying to respond. Sorry about that ${userEmail}! If this persists, would you please contact support?`
    );
  }
};
