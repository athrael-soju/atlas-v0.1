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
import clientPromise from '@/lib/client/mongodb';
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
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const requiredEnvVars = [
  'GITHUB_ID',
  'GITHUB_SECRET',
  'GOOGLE_ID',
  'GOOGLE_SECRET',
];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

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

const createAnonymousUser = async (): Promise<CustomUser> => {
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

  const user: CustomUser = {
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

  try {
    const dbInstance = await db();
    const existingUser = await dbInstance.getUser(user.email as string);
    if (!existingUser) {
      await dbInstance.insertUser(user);
    }
  } catch (error) {
    console.error('Error creating or fetching user:', error);
    throw new Error('Error during user creation');
  }

  return user;
};

const providers = [
  GitHubProvider({
    allowDangerousEmailAccountLinking: true,
    clientId: process.env.GITHUB_ID as string,
    clientSecret: process.env.GITHUB_SECRET as string,
    authorization: {
      params: {
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code',
      },
    },
  }),
  GoogleProvider({
    allowDangerousEmailAccountLinking: true,
    clientId: process.env.GOOGLE_ID as string,
    clientSecret: process.env.GOOGLE_SECRET as string,
    authorization: {
      params: {
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code',
      },
    },
  }),
  CredentialsProvider({
    name: 'a Guest Account',
    credentials: {},
    async authorize() {
      return await createAnonymousUser();
    },
  }),
];

const options: NextAuthOptions = {
  providers,
  adapter: MongoDBAdapter(clientPromise) as Adapter,
  callbacks: {
    async jwt({
      token,
      account,
    }: {
      token: JWT;
      account: Account | null;
      profile?: Profile;
    }): Promise<JWT> {
      try {
        if (account?.expires_at && account?.type === 'oauth') {
          token.access_token = account.access_token;
          token.expires_at = account.expires_at;
          token.refresh_token = account.refresh_token;
          token.refresh_token_expires_in = account.refresh_token_expires_in;
          token.provider = account.provider;
        }
        if (!token.provider) token.provider = 'Atlas';
        return token;
      } catch (error) {
        console.error('Error in JWT callback:', error);
        return token;
      }
    },
    async session({
      session,
      token,
    }: {
      session: CustomSession;
      token: JWT;
      user: AdapterUser;
    }): Promise<Session> {
      try {
        if (token.provider) {
          session.token_provider = token.provider as string;
        }
        const dbInstance = await db();
        const dbUser = await dbInstance.getUser(token.email as string);
        session.user = dbUser as CustomUser;
        return session;
      } catch (error) {
        console.error('Error in session callback:', error);
        return session;
      }
    },
    async redirect({ baseUrl }) {
      return baseUrl;
    },
  },
  events: {
    async signIn({
      user,
      account,
    }: {
      user: CustomUser;
      account: Account | null;
      profile?: Profile;
    }): Promise<void> {
      console.info(
        `signIn of ${user.name} from ${user?.provider ?? account?.provider}`
      );
    },
    async signOut({ token }: { session: Session; token: JWT }): Promise<void> {
      console.info(`signOut of ${token.name} from ${token.provider}`);
    },
  },
  session: {
    strategy: 'jwt' as SessionStrategy,
  },
};

const handler = NextAuth(options);
export { handler as GET, handler as POST };
