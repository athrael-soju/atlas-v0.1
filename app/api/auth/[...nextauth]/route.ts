import NextAuth, {
  Account,
  Profile,
  SessionStrategy,
  Session,
  User,
} from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { JWT } from 'next-auth/jwt';
import { Adapter, AdapterUser } from 'next-auth/adapters';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '@/lib/services/db/mongodb';
import { getClientPromise } from '@/lib/client/mongodb';
import {
  uniqueNamesGenerator,
  Config,
  colors,
  starWars,
} from 'unique-names-generator';
import CredentialsProvider from 'next-auth/providers/credentials';
import { randomUUID } from 'crypto';
import { AtlasUser, Purpose } from '@/lib/types';
import { toAscii } from '@/lib/utils/helpers';

export const runtime = 'nodejs';

interface CustomUser extends User {
  provider?: string;
  files?: AtlasUser[];
  preferences?: {
    name: string | null;
    description: string | null;
    selectedAssistant: 'sage' | 'scribe' | null;
  };
}

interface CustomSession extends Session {
  token_provider?: string;
}

const createAnonymousUser = (): CustomUser => {
  const customConfig: Config = {
    dictionaries: [colors, starWars],
    separator: ' ',
    length: 2,
    style: 'capital',
  };
  const newName = uniqueNamesGenerator(customConfig);
  const emailHandle: string = toAscii(
    newName.replaceAll(' ', '_').toLowerCase()
  );

  const id: string = randomUUID();
  return {
    id: id,
    name: newName,
    email: `${emailHandle}@atlas-guest.com`,
    image: '',
    files: [],
    preferences: {
      name: null,
      description: null,
      selectedAssistant: null,
    },
  };
};

const providers = [
  GitHubProvider({
    clientId: process.env.GITHUB_ID as string,
    clientSecret: process.env.GITHUB_SECRET as string,
  }),
  GoogleProvider({
    clientId: process.env.GOOGLE_ID as string,
    clientSecret: process.env.GOOGLE_SECRET as string,
  }),
  CredentialsProvider({
    name: 'a Guest Account',
    credentials: {},
    async authorize(credentials, req) {
      const user = createAnonymousUser();

      // Get the MongoDB client and database
      const dbInstance = await db();

      // Check if user already exists
      const existingUser = await dbInstance.getUser(user.email as string);
      if (!existingUser) {
        // Save the new user if not exists
        await dbInstance.insertUser(user);
      }

      return user;
    },
  }),
];

const options: NextAuthOptions = {
  providers,
  adapter: MongoDBAdapter(getClientPromise()) as Adapter,
  callbacks: {
    async jwt({
      token,
      account,
      profile,
    }: {
      token: JWT;
      account: Account | null;
      profile?: Profile;
    }): Promise<JWT> {
      if (account?.expires_at && account?.type === 'oauth') {
        token.access_token = account.access_token;
        token.expires_at = account.expires_at;
        token.refresh_token = account.refresh_token;
        token.refresh_token_expires_in = account.refresh_token_expires_in;
        token.provider = account.provider;
      }
      if (!token.provider) token.provider = 'Atlas';
      return token;
    },
    async session({
      session,
      token,
      user,
    }: {
      session: CustomSession;
      token: JWT;
      user: AdapterUser;
    }): Promise<Session> {
      if (token.provider) {
        session.token_provider = token.provider as string;
      }

      const dbInstance = await db();
      const dbUser = await dbInstance.getUser(token.email as string);

      session.user = dbUser as CustomUser;

      return session;
    },
  },
  events: {
    async signIn({
      user,
      account,
      profile,
      isNewUser,
    }: {
      user: CustomUser;
      account: Account | null;
      profile?: Profile;
      isNewUser?: boolean;
    }): Promise<void> {
      if (isNewUser) {
        const dbInstance = await db();
        await dbInstance.updateUser(user.email as string, {
          assistants: {
            sage: {
              files: [],
              assistantId: '',
              threadId: '',
              purpose: Purpose.Sage,
            },
            scribe: {
              files: [],
              assistantId: '',
              threadId: '',
              purpose: Purpose.Scribe,
            },
          },
          preferences: {
            name: null,
            description: null,
            selectedAssistant: null,
          },
        });
      }
      console.info(
        `${user.name} from ${user?.provider ?? account?.provider} has just signed in!`
      );
    },
    async signOut({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<void> {
      console.info(`${token.name} from ${token.provider} has just signed out!`);
    },
  },
  session: {
    strategy: 'jwt' as SessionStrategy,
  },
};

const handler = NextAuth(options);
export { handler as GET, handler as POST };
