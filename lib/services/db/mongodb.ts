import { getDb, getClientPromise } from '@/lib/client/mongodb';
import { AtlasFile, AtlasUser, BaseFile } from '@/lib/types';
import { User } from 'next-auth';

export const db = async () => {
  const db = await getDb();
  const userCollection = db.collection<User>('users');

  const getClient = async () => {
    return await getClientPromise();
  };

  const insertUser = async (user: User) => {
    const result = await userCollection.insertOne(user);
    return result;
  };

  const getUser = async (userEmail: string) => {
    const user = await userCollection.findOne({ email: userEmail });
    return user;
  };

  const getUserFiles = async (userEmail: string) => {
    const user = (await userCollection.findOne({
      email: userEmail,
    })) as unknown as AtlasUser;

    return user.files;
  };

  const getUserFile = async (userEmail: string, fileId: string) => {
    const userFiles = await getUserFiles(userEmail);

    const userFile = userFiles.find((file) => file.id === fileId);
    return userFile;
  };

  const summonSage = async (userEmail: string, sageId: string) => {
    const updateResult = userCollection.updateOne(
      { email: userEmail },
      { $set: { sageId } }
    );
    return updateResult;
  };

  const addThreadId = async (userEmail: string, threadId: string) => {
    const updateResult = userCollection.updateOne(
      { email: userEmail },
      { $set: { threadId } }
    );
    return updateResult;
  };

  const dismissSage = async (userEmail: string) => {
    const updateResult = userCollection.updateOne(
      { email: userEmail },
      { $unset: { sageId: '', threadId: '' } }
    );
    return updateResult;
  };

  const addFile = async (userEmail: string, file: BaseFile | AtlasFile) => {
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

  const deleteFile = async (userEmail: string, fileId: string) => {
    const updateResult = userCollection.updateOne(
      { email: userEmail },
      {
        $pull: {
          files: { id: fileId },
        },
      }
    );
    return updateResult;
  };

  return {
    getClient,
    insertUser,
    getUser,
    getUserFiles,
    getUserFile,
    summonSage,
    addThreadId,
    dismissSage,
    addFile,
    deleteFile,
  };
};
