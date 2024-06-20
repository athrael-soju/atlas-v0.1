import { useEffect, useState } from 'react';
import {
  BookOpenIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from './carousel';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface OnboardingCarouselProps {
  setIsOnboardingComplete: (finished: boolean) => void;
  setIsLoading: (loading: boolean) => void;
}

export function OnboardingCarousel({
  setIsOnboardingComplete,
  setIsLoading,
}: Readonly<OnboardingCarouselProps>) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [assistant, setAssistant] = useState<'sage' | 'scribe' | null>(null);

  const handleFinishedOnboarding = async (
    username: string,
    description: string,
    assistant: 'sage' | 'scribe' | null
  ) => {
    setIsLoading(true);
    setTimeout(() => {
      console.log('Onboarding Complete:', {
        username,
        description,
        assistant,
      });
      setIsLoading(false);
      setIsOnboardingComplete(true);
    }, 5000);
  };

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <div>
      <Carousel setApi={setApi} className="max-w-xl">
        <CarouselContent>
          <CarouselItem>
            <Card>
              <CardContent className="flex flex-col justify-center aspect-square p-6 text-center">
                <h2 className="text-2xl font-semibold text-center">
                  Welcome to Atlas
                </h2>
                <div className="flex-1 w-full p-4 text-left">
                  Atlas is a comprehensive data management solution that offers
                  advanced capabilities in processing, analysis, storage, and
                  security.
                  <br />
                  <br />
                  It efficiently processes both structured and unstructured
                  data, preparing it for in-depth analysis. With exceptional
                  accuracy and speed, it manages data to serve as a robust
                  knowledgebase. For real-time analysis and visualization, it
                  provides insightful and scalable data interpretation. It
                  ensures efficient storage and rapid retrieval of data,
                  optimizing overall data management. Additionally, Atlas
                  delivers strong data security and privacy, adhering to the
                  latest standards to protect sensitive information.
                  <br />
                  <br />
                  These integrated features make Atlas a versatile and powerful
                  tool for managing and leveraging data effectively across
                  various applications and industries.
                  <br />
                  <br />
                  Start using Atlas by setting up your personal assistant.
                </div>
              </CardContent>
            </Card>
          </CarouselItem>

          <CarouselItem>
            <Card>
              <CardContent className="flex flex-col justify-center aspect-square p-6 text-left">
                <h2 className="text-2xl font-semibold text-center">
                  What should your assistant know about you?
                </h2>
                <p>
                  Provide your name and a brief description about yourself to
                  help your assistant understand you better and tailor its
                  responses to your preferences.
                </p>
                <div className="w-full mt-4">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex w-full rounded-md border border-input text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1 p-4"
                    placeholder="Name"
                  />
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-4 flex h-full w-full rounded-md border border-input text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex-1 p-4"
                  placeholder="Description"
                  style={{ resize: 'none' }}
                />
              </CardContent>
            </Card>
          </CarouselItem>

          <CarouselItem>
            <Card className="h-full">
              <CardContent className="flex flex-col justify-center items-center p-6 text-center h-full">
                <h2 className="text-2xl font-semibold text-center">
                  Select your Personal Assistant
                </h2>
                <ToggleGroup
                  type="single"
                  value={assistant!}
                  onValueChange={(value) => {
                    if (value === 'sage' || value === 'scribe')
                      setAssistant(value);
                  }}
                  className="flex w-full mt-4 h-full"
                >
                  <div className="flex w-full h-full space-x-1">
                    <ToggleGroupItem
                      value="sage"
                      aria-label="Toggle sage"
                      className="relative flex-1 flex flex-col items-center justify-center h-full text-center py-4 hover:bg-gray-300 transform transition-all duration-200 hover:scale-105"
                    >
                      <DocumentChartBarIcon className="h-24 w-24 mb-2" />
                      <div className="flex items-center">
                        <span className="text-xl font-semibold">Sage</span>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <QuestionMarkCircleIcon className="h-6 w-6 ml-1 cursor-pointer" />
                          </HoverCardTrigger>
                          <HoverCardContent>
                            <p className="text-sm">
                              The Sage is able to write and execute code, run
                              complex calculations and generate charts/graphs
                              based on CSV data and code snippets.
                            </p>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="scribe"
                      aria-label="Toggle scribe"
                      className="relative flex-1 flex flex-col items-center justify-center h-full text-center py-4 hover:bg-gray-300 transform transition-all duration-200 hover:scale-105"
                    >
                      <BookOpenIcon className="h-24 w-24 mb-2" />
                      <div className="flex items-center">
                        <span className="text-xl font-semibold">Scribe</span>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <QuestionMarkCircleIcon className="h-6 w-6 ml-1 cursor-pointer" />
                          </HoverCardTrigger>
                          <HoverCardContent>
                            <p className="text-sm">
                              The Scribe is able to access a vast knowledgebase
                              and provide answers to your questions. You can
                              populate your knowledgebase by uploading files in
                              PDF format.
                            </p>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    </ToggleGroupItem>
                  </div>
                </ToggleGroup>
              </CardContent>
            </Card>
          </CarouselItem>

          <CarouselItem>
            <Card className="h-full w-full">
              <CardContent className="flex flex-col justify-between items-center h-full w-full p-6 text-center">
                <div className="flex flex-col items-center w-full">
                  <h2 className="text-2xl font-semibold">Finalize</h2>
                  <p>Review your details and finish the onboarding process.</p>
                </div>
                <div className="flex-1 mt-4 w-full overflow-y-auto border p-2 text-left rounded-lg max-h-80">
                  <h3 className="text-lg font-semibold">Terms of Service</h3>
                  <p className="text-sm">
                    {/* Replace this with the actual terms of service text */}
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Praesent imperdiet ligula ac leo commodo, non posuere justo
                    tincidunt. Suspendisse potenti. Nulla facilisi. Pellentesque
                    habitant morbi tristique senectus et netus et malesuada
                    fames ac turpis egestas. Vestibulum ante ipsum primis in
                    faucibus orci luctus et ultrices posuere cubilia curae;
                    Fusce id purus. Phasellus at lectus nulla. Cras vehicula,
                    tortor et ultricies laoreet, ligula dui aliquam justo, vel
                    pharetra justo turpis a neque. Duis aliquet egestas purus in
                    blandit. Curabitur vulputate, ligula lacinia scelerisque
                    tempor, lacus lacus ornare ante, ac egestas est urna sit
                    amet arcu. Sed ac dolor sit amet purus malesuada congue. Ut
                    a est eget ligula molestie gravida. Curabitur massa. Donec
                    eleifend, libero at sagittis mollis, tellus est malesuada
                    tellus, at luctus turpis elit sit amet quam. Vivamus pretium
                    ornare est. Lorem ipsum dolor sit amet, consectetur
                    adipiscing elit. Praesent imperdiet ligula ac leo commodo,
                    non posuere justo tincidunt. Suspendisse potenti. Nulla
                    facilisi. Pellentesque habitant morbi tristique senectus et
                    netus et malesuada fames ac turpis egestas. Vestibulum ante
                    ipsum primis in faucibus orci luctus et ultrices posuere
                    cubilia curae; Fusce id purus. Phasellus at lectus nulla.
                    Cras vehicula, tortor et ultricies laoreet, ligula dui
                    aliquam justo, vel pharetra justo turpis a neque. Duis
                    aliquet egestas purus in blandit. Curabitur vulputate,
                    ligula lacinia scelerisque tempor, lacus lacus ornare ante,
                    ac egestas est urna sit amet arcu. Sed ac dolor sit amet
                    purus malesuada congue. Ut a est eget ligula molestie
                    gravida. Curabitur massa. Donec eleifend, libero at sagittis
                    mollis, tellus est malesuada tellus, at luctus turpis elit
                    sit amet quam. Vivamus pretium ornare est.
                  </p>
                </div>
                <div className="flex flex-col items-center w-full mt-2">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="acceptTerms" className="text-sm">
                      I have read and accept the Terms of Service
                    </label>
                  </div>
                  <Button
                    onClick={() => {
                      handleFinishedOnboarding(
                        username,
                        description,
                        assistant
                      );
                    }}
                    disabled={
                      !username || !description || !assistant || !acceptTerms
                    }
                    className="mt-4 w-full"
                  >
                    Finish
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>
        {current !== 1 && <CarouselPrevious />}
        {current !== 4 && (
          <CarouselNext
            disabled={
              (current === 2 && (!username || !description)) ||
              (current === 3 && assistant === null)
            }
          />
        )}
      </Carousel>
    </div>
  );
}
