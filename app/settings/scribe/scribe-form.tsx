'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { Slider } from '@/components/ui/slider';
import { archivist } from '@/lib/client/atlas';
import { AtlasUser, ScribeConfigParams } from '@/lib/types';
import { useSession } from 'next-auth/react';

const advancedDataAnalysisSchema = z.object({
  cohereTopN: z.number().min(1).max(100).step(1),
  cohereRelevanceThreshold: z.number().min(0).max(100).step(5),
  pineconeTopK: z.number().min(100).max(1000).step(100),
});

type AdvancedDataAnalysisValues = z.infer<typeof advancedDataAnalysisSchema>;

const defaultValues: Partial<AdvancedDataAnalysisValues> = {
  cohereTopN: 10,
  cohereRelevanceThreshold: 50,
  pineconeTopK: 100,
};

export function ScribeForm() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user as AtlasUser;
  const userEmail = user?.email;

  const form = useForm<AdvancedDataAnalysisValues>({
    resolver: zodResolver(advancedDataAnalysisSchema),
    defaultValues,
  });

  const [cohereTopN, setCohereTopN] = useState(defaultValues.cohereTopN);
  const [cohereRelevanceThreshold, setCohereRelevanceThreshold] = useState(
    defaultValues.cohereRelevanceThreshold
  );
  const [pineconeTopK, setPineconeTopK] = useState(defaultValues.pineconeTopK);

  // Load saved values from local storage on mount
  useEffect(() => {
    if (userEmail) {
      const savedValues = localStorage.getItem(`scribeFormValues-${userEmail}`);
      if (savedValues) {
        const parsedValues = JSON.parse(savedValues);
        form.reset(parsedValues);
        setCohereTopN(parsedValues.cohereTopN);
        setCohereRelevanceThreshold(parsedValues.cohereRelevanceThreshold);
        setPineconeTopK(parsedValues.pineconeTopK);
      }
    }
  }, [form]);

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
  }, [form.watch]);

  async function onSubmit(data: AdvancedDataAnalysisValues) {
    const scribeConfigData: ScribeConfigParams = {
      scribe: { ...data },
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
          description: `Failed to update scribe: ${message}`,
          variant: 'destructive',
        });
      }
    };
    await archivist(email, action, scribeConfigData, onUpdate);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="cohereTopN"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cohere TopN</FormLabel>
              <FormControl>
                <Controller
                  control={form.control}
                  name="cohereTopN"
                  render={({ field }) => (
                    <Slider
                      value={[field.value || 10]}
                      onValueChange={(value) => {
                        field.onChange(value[0]);
                        setCohereTopN(value[0]);
                      }}
                      min={1}
                      max={100}
                      step={1}
                      aria-label="Cohere Top N"
                    />
                  )}
                />
              </FormControl>
              <FormDescription>
                Set the top N value for Cohere (1-100). Current value:{' '}
                {cohereTopN}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cohereRelevanceThreshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cohere Relevance Threshold</FormLabel>
              <FormControl>
                <Controller
                  control={form.control}
                  name="cohereRelevanceThreshold"
                  render={({ field }) => (
                    <Slider
                      value={[field.value || 0]}
                      onValueChange={(value) => {
                        console.log(field.value);
                        field.onChange(value[0]);
                        setCohereRelevanceThreshold(value[0]);
                      }}
                      min={0}
                      max={100}
                      step={5}
                      aria-label="Cohere Relevance Threshold"
                    />
                  )}
                />
              </FormControl>
              <FormDescription>
                Set the relevance threshold for Cohere (0-100%). Current value:{' '}
                {cohereRelevanceThreshold}%
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pineconeTopK"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pinecone TopK</FormLabel>
              <FormControl>
                <Controller
                  control={form.control}
                  name="pineconeTopK"
                  render={({ field }) => (
                    <Slider
                      value={[field.value || 100]}
                      onValueChange={(value) => {
                        field.onChange(value[0]);
                        setPineconeTopK(value[0]);
                      }}
                      min={100}
                      max={1000}
                      step={100}
                      aria-label="Pinecone Top K"
                    />
                  )}
                />
              </FormControl>
              <FormDescription>
                Set the top K value for Pinecone (100-1000). Current value:{' '}
                {pineconeTopK}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" style={{ width: '100%' }}>
          Update settings
        </Button>
      </form>
    </Form>
  );
}
