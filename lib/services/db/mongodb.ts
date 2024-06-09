import { getDb, getClientPromise } from '@/lib/client/mongodb';
import { AtlasFile, AtlasUser, BaseFile } from '@/lib/types';
import { User } from 'next-auth';

export const db = async () => {
  const insertUser = async (user: User) => {
    const db = await getDb();
    const userCollection = db.collection<User>('users');
    const result = await userCollection.insertOne(user);
    return result;
  };

  const getUser = async (userEmail: string) => {
    const db = await getDb();
    const userCollection = db.collection<AtlasUser>('users');
    const user = await userCollection.findOne({ email: userEmail });
    return user;
  };

  const getClient = async () => {
    return await getClientPromise();
  };

  const summonSage = async (userEmail: string, sageId: string) => {
    const db = await getDb();
    const userCollection = db.collection<AtlasUser>('users');
    const updateResult = userCollection.updateOne(
      { email: userEmail },
      { $set: { sageId } }
    );
    return updateResult;
  };

  const addThreadId = async (userEmail: string, threadId: string) => {
    const db = await getDb();
    const userCollection = db.collection<AtlasUser>('users');
    const updateResult = userCollection.updateOne(
      { email: userEmail },
      { $set: { threadId } }
    );
    return updateResult;
  };

  const dismissSage = async (userEmail: string) => {
    const db = await getDb();
    const userCollection = db.collection<AtlasUser>('users');
    const updateResult = userCollection.updateOne(
      { email: userEmail },
      { $unset: { sageId: '', threadId: '' } }
    );
    return updateResult;
  };

  const addFile = async (userEmail: string, file: BaseFile | AtlasFile) => {
    const db = await getDb();
    const userCollection = db.collection<AtlasUser>('users');
    const updateResult = userCollection.updateOne(
      { email: userEmail },
      {
        $push: {
          files: file,
        },
      }
    );
    return updateResult;
  };

  return {
    insertUser,
    getUser,
    getClient,
    summonSage,
    addThreadId,
    dismissSage,
    addFile,
  };
};
