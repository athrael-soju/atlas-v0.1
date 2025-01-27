'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { useForm, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useSession } from 'next-auth/react';

import { cn } from '@/lib/utils';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { archivist } from '@/lib/client/atlas';
import { AtlasUser, ForgeConfigParams } from '@/lib/types';

const forgeFormSchema = z
  .object({
    parsingProvider: z.string({
      required_error: 'Please select a Parsing provider.',
    }),
    minChunkSize: z.number().min(0).max(1024).step(256),
    maxChunkSize: z.number().min(0).max(1024).step(256),
    chunkOverlap: z.number().min(0).max(256).step(1),
    chunkBatch: z.number().min(50).max(150).step(50),
    partitioningStrategy: z.string({
      required_error: 'Please select a partitioning strategy.',
    }),
    chunkingStrategy: z.string({
      required_error: 'Please select a chunking strategy.',
    }),
  })
  .refine((data) => data.minChunkSize <= data.maxChunkSize, {
    message: 'Max chunk size cannot be smaller than min chunk size.',
    path: ['maxChunkSize'],
  });

type ForgeFormValues = z.infer<typeof forgeFormSchema>;

const defaultValues: Partial<ForgeFormValues> = {
  parsingProvider: 'io',
  partitioningStrategy: 'fast',
  chunkingStrategy: 'basic',
  minChunkSize: 0,
  maxChunkSize: 1024,
  chunkOverlap: 0,
  chunkBatch: 50,
};

const parsingProviders = [{ label: 'Unstructured.io', value: 'io' }] as const;
const partitioningStrategies = [
  { label: 'Fast', value: 'fast' },
  { label: 'Hi Res', value: 'hi_res' },
  { label: 'Auto', value: 'auto' },
  { label: 'OCR Only', value: 'ocr_only' },
] as const;
const chunkingStrategies = [
  { label: 'Basic', value: 'basic' },
  { label: 'By Title', value: 'by_title' },
  { label: 'By Page', value: 'by_page' },
  { label: 'By Similarity', value: 'by_similarity' },
] as const;

const partitioningStrategyDescriptions = {
  fast: 'The “rule-based” strategy quickly pulls all text elements using traditional NLP extraction techniques. It is not recommended for image-based file types.',
  hi_res:
    'The “model-based” strategy uses document layout for additional information, making it ideal for use cases needing accurate classification of document elements.',
  auto: 'The “auto” strategy selects the best partitioning approach based on document characteristics and function parameters.',
  ocr_only:
    'A “model-based” strategy that uses Optical Character Recognition to extract text from image-based files.',
};

const chunkingStrategyDescriptions = {
  basic:
    'Combines sequential elements to fill chunks while respecting max_characters (hard-max) and new_after_n_chars (soft-max) values.',
  by_title:
    'Preserves section boundaries, ensuring each chunk contains text from only one section, optionally considering page boundaries.',
  by_page:
    'Ensures content from different pages remains separate, starting a new chunk when a new page is detected.',
  by_similarity:
    'Uses the sentence-transformers/multi-qa-mpnet-base-dot-v1 model to group topically similar sequential elements into chunks.',
};

export function ForgeForm() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user as AtlasUser;
  const userEmail = user?.email;

  const form = useForm<ForgeFormValues>({
    resolver: zodResolver(forgeFormSchema),
    defaultValues,
  });

  const [minChunkSize, setMinChunkSize] = useState(
    defaultValues.minChunkSize ?? 0
  );
  const [maxChunkSize, setMaxChunkSize] = useState(
    defaultValues.maxChunkSize ?? 1024
  );
  const [chunkOverlap, setChunkOverlap] = useState(
    defaultValues.chunkOverlap ?? 0
  );
  const [parsingProvider, setParsingProvider] = useState(
    defaultValues.parsingProvider ?? 'io'
  );
  const [partitioningStrategy, setPartitioningStrategy] = useState(
    defaultValues.partitioningStrategy ?? 'fast'
  );
  const [chunkingStrategy, setChunkingStrategy] = useState(
    defaultValues.chunkingStrategy ?? 'basic'
  );
  const [chunkBatch, setChunkBatch] = useState(defaultValues.chunkBatch ?? 50);

  // Load saved values from local storage on mount
  useEffect(() => {
    if (userEmail) {
      const savedValues = localStorage.getItem(`forgeFormValues-${userEmail}`);
      if (savedValues) {
        const parsedValues = JSON.parse(savedValues);
        form.reset(parsedValues);
        setMinChunkSize(parsedValues.minChunkSize ?? 0);
        setMaxChunkSize(parsedValues.maxChunkSize ?? 1024);
        setChunkOverlap(parsedValues.chunkOverlap ?? 0);
        setParsingProvider(parsedValues.parsingProvider ?? 'io');
        setPartitioningStrategy(parsedValues.partitioningStrategy ?? 'fast');
        setChunkingStrategy(parsedValues.chunkingStrategy ?? 'basic');
        setChunkBatch(parsedValues.chunkBatch ?? 50);
      }
    }
  }, [form, userEmail]);

  // Save values to local storage on change
  useEffect(() => {
    if (userEmail) {
      const subscription = form.watch((values) => {
        localStorage.setItem(
          `forgeFormValues-${userEmail}`,
          JSON.stringify(values)
        );
      });
      return () => subscription.unsubscribe();
    }
  }, [form.watch, userEmail]);

  async function onSubmit(data: ForgeFormValues) {
    const forgeConfigData: ForgeConfigParams = {
      forge: { ...data },
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
          description: `Failed to update forge: ${message}`,
          variant: 'destructive',
        });
      }
    };
    await archivist(email, action, forgeConfigData, onUpdate);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="parsingProvider"
            render={({ field }) => (
              <FormItem
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <FormLabel>Provider</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          'w-[200px] justify-between',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value
                          ? parsingProviders.find(
                              (parsingProvider) =>
                                parsingProvider.value === field.value
                            )?.label
                          : 'Select provider'}
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search provider..." />
                      <CommandList>
                        <CommandEmpty>No provider found.</CommandEmpty>
                        <CommandGroup>
                          {parsingProviders.map((parsingProvider) => (
                            <CommandItem
                              value={parsingProvider.label}
                              key={parsingProvider.value}
                              onSelect={() => {
                                form.setValue(
                                  'parsingProvider',
                                  parsingProvider.value
                                );
                                setParsingProvider(parsingProvider.value);
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  parsingProvider.value === field.value
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              {parsingProvider.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  The Unstructured Serverless API provides efficient, secure,
                  and scalable data processing for AI applications with high
                  performance, cost-effective per-page pricing, and enhanced
                  developer experience.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="partitioningStrategy"
            render={({ field }) => (
              <FormItem
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <FormLabel>Partitioning Strategy</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          'w-[200px] justify-between',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value
                          ? partitioningStrategies.find(
                              (partitioningStrategy) =>
                                partitioningStrategy.value === field.value
                            )?.label
                          : 'Select strategy'}
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search strategy..." />
                      <CommandList>
                        <CommandEmpty>No strategy found.</CommandEmpty>
                        <CommandGroup>
                          {partitioningStrategies.map(
                            (partitioningStrategy) => (
                              <CommandItem
                                value={partitioningStrategy.label}
                                key={partitioningStrategy.value}
                                onSelect={() => {
                                  form.setValue(
                                    'partitioningStrategy',
                                    partitioningStrategy.value
                                  );
                                  setPartitioningStrategy(
                                    partitioningStrategy.value
                                  );
                                }}
                              >
                                <CheckIcon
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    partitioningStrategy.value === field.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {partitioningStrategy.label}
                              </CommandItem>
                            )
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  {
                    partitioningStrategyDescriptions[
                      field.value as keyof typeof partitioningStrategyDescriptions
                    ]
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="chunkingStrategy"
            render={({ field }) => (
              <FormItem
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <FormLabel>Chunking Strategy</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          'w-[200px] justify-between',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value
                          ? chunkingStrategies.find(
                              (chunkingStrategy) =>
                                chunkingStrategy.value === field.value
                            )?.label
                          : 'Select strategy'}
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search strategy..." />
                      <CommandList>
                        <CommandEmpty>No strategy found.</CommandEmpty>
                        <CommandGroup>
                          {chunkingStrategies.map((chunkingStrategy) => (
                            <CommandItem
                              value={chunkingStrategy.label}
                              key={chunkingStrategy.value}
                              onSelect={() => {
                                form.setValue(
                                  'chunkingStrategy',
                                  chunkingStrategy.value
                                );
                                setChunkingStrategy(chunkingStrategy.value);
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  chunkingStrategy.value === field.value
                                    ? 'opacity-100'
                                    : 'opacity-0'
                                )}
                              />
                              {chunkingStrategy.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  {
                    chunkingStrategyDescriptions[
                      field.value as keyof typeof chunkingStrategyDescriptions
                    ]
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="minChunkSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Chunk Size</FormLabel>
              <FormControl>
                <Controller
                  control={form.control}
                  name="minChunkSize"
                  render={({ field }) => (
                    <Slider
                      value={[field.value || 0]}
                      onValueChange={(value) => {
                        field.onChange(value[0]);
                        setMinChunkSize(value[0]);
                      }}
                      min={0}
                      max={1024}
                      step={256}
                      aria-label="Min Chunk Size"
                    />
                  )}
                />
              </FormControl>
              <FormDescription>
                Set the minimum chunk size (0-1024). Current value:{' '}
                {minChunkSize}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxChunkSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Chunk Size</FormLabel>
              <FormControl>
                <Controller
                  control={form.control}
                  name="maxChunkSize"
                  render={({ field }) => (
                    <Slider
                      value={[field.value || 0]}
                      onValueChange={(value) => {
                        field.onChange(value[0]);
                        setMaxChunkSize(value[0]);
                      }}
                      min={0}
                      max={1024}
                      step={256}
                      aria-label="Max Chunk Size"
                    />
                  )}
                />
              </FormControl>
              <FormDescription>
                Set the maximum chunk size (0-1024). Cannot be smaller than min
                chunk size. Current value: {maxChunkSize}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="chunkOverlap"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chunk Overlap</FormLabel>
              <FormControl>
                <Controller
                  control={form.control}
                  name="chunkOverlap"
                  render={({ field }) => (
                    <Slider
                      value={[field.value || 0]}
                      onValueChange={(value) => {
                        field.onChange(value[0]);
                        setChunkOverlap(value[0]);
                      }}
                      min={0}
                      max={256}
                      step={1}
                      aria-label="Chunk Overlap"
                    />
                  )}
                />
              </FormControl>
              <FormDescription>
                Set the chunk overlap (0-256). Current value: {chunkOverlap}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="chunkBatch"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chunk Batch</FormLabel>
              <FormControl>
                <Controller
                  control={form.control}
                  name="chunkBatch"
                  render={({ field }) => (
                    <Slider
                      value={[field.value || 0]}
                      onValueChange={(value) => {
                        field.onChange(value[0]);
                        setChunkBatch(value[0]);
                      }}
                      min={50}
                      max={150}
                      step={50}
                      aria-label="Chunk Batch"
                    />
                  )}
                />
              </FormControl>
              <FormDescription>
                Set the chunk batch (50-150). Current value: {chunkBatch}
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
