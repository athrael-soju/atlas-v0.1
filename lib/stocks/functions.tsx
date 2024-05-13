'use server';

import {
  spinner,
  BotCard,
  BotMessage,
  Stock,
  Purchase,
  Stocks,
  Events,
  SystemMessage,
} from '@/components/llm-stocks';

import { runAsyncFnWithoutBlocking, sleep, formatNumber } from '@/lib/utils';

import { StockSkeleton } from '@/components/llm-stocks/stock-skeleton';
import { EventsSkeleton } from '@/components/llm-stocks/events-skeleton';
import { StocksSkeleton } from '@/components/llm-stocks/stocks-skeleton';
import { createStreamableUI, getMutableAIState } from 'ai/rsc';
import { AI } from '@/app/action';

type ListStocksInfo = {
  stocks: StockPriceInfo[];
};

type StockPriceInfo = {
  symbol: string;
  price: number;
  delta: number;
};

type StockPurchaseInfo = {
  symbol: string;
  price: number;
  numberOfShares: number;
};

type EventInfo = {
  date: string;
  headline: string;
  description: string;
};

export async function checkIfCalled(completion: any, reply: any, aiState: any) {
  completion.onFunctionCall(
    'list_stocks',
    async ({ stocks }: ListStocksInfo) => {
      reply.update(
        <BotCard>
          <StocksSkeleton />
        </BotCard>
      );

      await sleep(1000);

      reply.done(
        <BotCard>
          <Stocks stocks={stocks} />
        </BotCard>
      );

      aiState.done([
        ...aiState.get(),
        {
          role: 'function',
          name: 'list_stocks',
          content: JSON.stringify(stocks),
        },
      ]);
    }
  );

  completion.onFunctionCall(
    'get_events',
    async ({ events }: { events: EventInfo[] }) => {
      reply.update(
        <BotCard>
          <EventsSkeleton />
        </BotCard>
      );

      await sleep(1000);

      reply.done(
        <BotCard>
          <Events events={events} />
        </BotCard>
      );

      aiState.done([
        ...aiState.get(),
        {
          role: 'function',
          name: 'get_events',
          content: JSON.stringify(events),
        },
      ]);
    }
  );

  completion.onFunctionCall(
    'show_stock_price',
    async ({ symbol, price, delta }: StockPriceInfo) => {
      reply.update(
        <BotCard>
          <StockSkeleton />
        </BotCard>
      );

      await sleep(1000);

      reply.done(
        <BotCard>
          <Stock name={symbol} price={price} delta={delta} />
        </BotCard>
      );

      aiState.done([
        ...aiState.get(),
        {
          role: 'function',
          name: 'show_stock_price',
          content: `[Price of ${symbol} = ${price}]`,
        },
      ]);
    }
  );

  completion.onFunctionCall(
    'show_stock_purchase_ui',
    ({ symbol, price, numberOfShares = 100 }: StockPurchaseInfo) => {
      if (numberOfShares <= 0 || numberOfShares > 1000) {
        reply.done(<BotMessage>Invalid amount</BotMessage>);
        aiState.done([
          ...aiState.get(),
          {
            role: 'function',
            name: 'show_stock_purchase_ui',
            content: `[Invalid amount]`,
          },
        ]);
        return;
      }

      reply.done(
        <>
          <BotMessage>
            Sure!{' '}
            {typeof numberOfShares === 'number'
              ? `Click the button below to purchase ${numberOfShares} shares of $${symbol}:`
              : `How many $${symbol} would you like to purchase?`}
          </BotMessage>
          <BotCard showAvatar={false}>
            <Purchase
              defaultAmount={numberOfShares}
              name={symbol}
              price={+price}
            />
          </BotCard>
        </>
      );
      aiState.done([
        ...aiState.get(),
        {
          role: 'function',
          name: 'show_stock_purchase_ui',
          content: `[UI for purchasing ${numberOfShares} shares of ${symbol}. Current price = ${price}, total cost = ${
            numberOfShares * price
          }]`,
        },
      ]);
    }
  );
}

export async function confirmPurchase(
  symbol: string,
  price: number,
  amount: number
) {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  );

  const systemMessage = createStreamableUI(null);

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000);

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    );

    await sleep(1000);

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{' '}
          {formatNumber(amount * price)}
        </p>
      </div>
    );

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
        {formatNumber(amount * price)}.
      </SystemMessage>
    );

    aiState.done([
      ...aiState.get(),
      {
        role: 'system',
        content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
          amount * price
        }]`,
      },
    ]);
  });

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: Date.now(),
      display: systemMessage.value,
    },
  };
}
