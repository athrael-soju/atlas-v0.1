'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { archivist } from '@/lib/client/atlas';
import {
  AtlasUser,
  CustomizationConfigParams,
  CustomizationParams,
} from '@/lib/types';
import { useSession } from 'next-auth/react';

const customizationSchema = z.object({
  speech: z.boolean().default(false),
});

type CustomizationFormValues = z.infer<typeof customizationSchema>;

const defaultValues: Partial<CustomizationFormValues> = {
  speech: false,
};

export function CustomizationForm() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user as AtlasUser;
  const userEmail = user?.email;

  const form = useForm<CustomizationFormValues>({
    resolver: zodResolver(customizationSchema),
    defaultValues,
  });

  const [speech, setSpeech] = useState(defaultValues.speech ?? false);

  // Load saved values from local storage on mount
  useEffect(() => {
    if (userEmail) {
      const savedValues = localStorage.getItem(`scribeFormValues-${userEmail}`);
      if (savedValues) {
        const parsedValues = JSON.parse(savedValues);
        form.reset(parsedValues);
        setSpeech(parsedValues.speech);
      }
    }
  }, [form, userEmail]);

  // Save values to local storage on change
  useEffect(() => {
    if (userEmail) {
      const subscription = form.watch((values) => {
        localStorage.setItem(
          `scribeFormValues-${userEmail}`,
          JSON.stringify(values)
        );
      });
      return () => subscription.unsubscribe();
    }
  }, [form.watch, userEmail]);

  async function onSubmit(data: CustomizationFormValues) {
    const customizationConfigData: CustomizationConfigParams = {
      customization: { ...data },
    };
    const email = session?.user?.email as string;
    const action = 'update-settings';
    const onUpdate = (event: string) => {
      const { type, message } = JSON.parse(event.replace('data: ', ''));
      if (type === 'final-notification') {
        toast({
          title: 'You submitted the following values:',
          description: (
            <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
              <code className="text-white">
                {JSON.stringify(data, null, 2)}
              </code>
            </pre>
          ),
        });
        updateSession();
      } else if (type === 'error') {
        toast({
          title: 'Error',
          description: `Failed to update customization: ${message}`,
          variant: 'destructive',
        });
      }
    };
    await archivist(email, action, customizationConfigData, onUpdate);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* FormFields here */}
        <div>
          <h3 className="mb-4 text-lg font-medium">Email Notifications</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="speech"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Speech</FormLabel>
                    <FormDescription>
                      Interact seamlessly with any assistant, using your voice
                      and hearing the response.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(value) => {
                        field.onChange(value);
                        setSpeech(value);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type="submit" style={{ width: '100%' }}>
          Update settings
        </Button>
      </form>
    </Form>
  );
}
