'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { format, parseISO } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { archivist } from '@/lib/client/atlas';
import { AtlasUser, ProfileConfigParams } from '@/lib/types';

const languages = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Spanish', value: 'es' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Chinese', value: 'zh' },
] as const;

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' })
    .max(30, { message: 'Name must not be longer than 30 characters.' })
    .optional(),
  dob: z.date({ required_error: 'A date of birth is required.' }).optional(),
  language: z
    .string({ required_error: 'Please select a language.' })
    .optional(),
  username: z
    .string()
    .min(2, { message: 'Username must be at least 2 characters.' })
    .max(30, { message: 'Username must not be longer than 30 characters.' })
    .optional(),
  email: z
    .string({ required_error: 'Please select an email to display.' })
    .email()
    .optional(),
  bio: z.string().max(160).min(0),
});

type CombinedFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user as AtlasUser;
  const userEmail = user?.email;

  const defaultValues: Partial<CombinedFormValues> = {
    bio: '',
    language: 'en',
    email: userEmail || '',
    dob: undefined,
  };

  const form = useForm<CombinedFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const [name, setName] = useState(defaultValues.name ?? '');
  const [username, setUsername] = useState(defaultValues.username ?? '');
  const [email, setEmail] = useState(defaultValues.email ?? '');
  const [dob, setDob] = useState<Date | undefined>(defaultValues.dob);
  const [language, setLanguage] = useState(defaultValues.language ?? 'en');
  const [bio, setBio] = useState(defaultValues.bio ?? '');

  // Load saved values from local storage on mount
  useEffect(() => {
    if (userEmail) {
      const savedValues = localStorage.getItem(
        `profileFormValues-${userEmail}`
      );
      if (savedValues) {
        const parsedValues = JSON.parse(savedValues);
        form.reset({
          ...parsedValues,
          dob: parsedValues.dob ? parseISO(parsedValues.dob) : undefined,
        });
        setName(parsedValues.name ?? '');
        setUsername(parsedValues.username ?? '');
        setDob(parsedValues.dob ? parseISO(parsedValues.dob) : undefined);
        setLanguage(parsedValues.language ?? 'en');
        setBio(parsedValues.bio ?? '');
        setEmail(parsedValues.email ?? '');
      }
    }
  }, [form, userEmail]);

  // Save values to local storage on change
  useEffect(() => {
    if (userEmail) {
      const subscription = form.watch((values) => {
        localStorage.setItem(
          `profileFormValues-${userEmail}`,
          JSON.stringify({ ...values, dob: values.dob?.toISOString() })
        );
      });
      return () => subscription.unsubscribe();
    }
  }, [form.watch, userEmail]);

  async function onSubmit(data: CombinedFormValues) {
    const profileConfigData: ProfileConfigParams = {
      profile: { ...data },
    };
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
          description: `Failed to update profile: ${message}`,
          variant: 'destructive',
        });
      }
    };
    await archivist(
      profileConfigData.profile.email as string,
      action,
      profileConfigData,
      onUpdate
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        style={{ display: 'grid', gap: '1rem' }}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your name"
                  {...field}
                  value={field.value || name}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    setName(e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                This is the name that will be displayed on your profile and in
                emails.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your username"
                  {...field}
                  value={field.value || username}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    setUsername(e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                You can choose a unique username that will be used to link to
                your profile.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your email"
                  {...field}
                  value={userEmail ?? field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  disabled={!!userEmail}
                />
              </FormControl>
              <FormDescription>
                This is the email associated with your account.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About you</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share a little bit about yourself"
                  className="resize-none"
                  {...field}
                  value={field.value || bio}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    setBio(e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                You can <span>@mention</span> other users and organizations to
                link to them.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div style={{ display: 'flex', gap: '1rem' }}>
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <FormLabel>Date of birth</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-[240px] pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setDob(date);
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormDescription>
                  Your date of birth is used to calculate your age.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <FormLabel>Language</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          'w-[200px] justify-between',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value
                          ? languages.find(
                              (language) => language.value === field.value
                            )?.label
                          : 'Select language'}
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search language..." />
                        <CommandList>
                          <CommandEmpty>No language found.</CommandEmpty>
                          <CommandGroup>
                            {languages.map((language) => (
                              <CommandItem
                                value={language.label}
                                key={language.value}
                                onSelect={() => {
                                  form.setValue('language', language.value);
                                  setLanguage(language.value);
                                }}
                              >
                                <CheckIcon
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    language.value === field.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {language.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormDescription>
                  This is the language that will be used in the dashboard.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit">Update settings</Button>
      </form>
    </Form>
  );
}
