import { scribe, sage } from '../client/atlas';
import { MessageRole, Purpose } from '../types';
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
  let prevType: MessageRole.Text | MessageRole.Code | MessageRole.Image;
  let currentMessage: string = '';

  try {
    await scribe(userEmail, message, topK, topN, (event) => {
      const { type, message } = JSON.parse(event?.replace('data: ', ''));
      if (type.includes('created') && firstRun === false) {
        addNewMessage(prevType, currentMessage);
        if (type === 'text_created') {
          prevType = MessageRole.Text;
        } else if (type === 'tool_created') {
          prevType = MessageRole.Code;
        }
        currentMessage = '';
      } else if (type === 'error') {
        toast({
          title: 'Error',
          description: `${message}`,
          variant: 'destructive',
        });
        throw new Error(message);
      } else if (
        [MessageRole.Text, MessageRole.Code, MessageRole.Image].includes(type)
      ) {
        currentMessage += message;
        prevType = type;
        firstRun = false;
        updateLastMessage(type, currentMessage);
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
  let prevType: MessageRole.Text | MessageRole.Code | MessageRole.Image;
  let currentMessage: string = '';

  try {
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
      } else if (type === 'error') {
        toast({
          title: 'Error',
          description: `${message}`,
          variant: 'destructive',
        });
        throw new Error(message);
      } else if (
        [MessageRole.Text, MessageRole.Code, MessageRole.Image].includes(type)
      ) {
        currentMessage += message;
        prevType = type;
        firstRun = false;
        updateLastMessage(type, currentMessage);
      }
    });
  } catch (error) {
    updateLastMessage(
      MessageRole.Error,
      `Something went wrong while trying to respond. Sorry about that ${userEmail}! If this persists, would you please contact support?`
    );
  }
};
