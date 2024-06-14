import { getDb, getClientPromise } from '@/lib/client/mongodb';
import { AtlasFile, AtlasUser, Purpose } from '@/lib/types';
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
    return user as unknown as AtlasUser;
  };

  const getAllUserFiles = async (userEmail: string) => {
    const user = (await userCollection.findOne({
      email: userEmail,
    })) as unknown as AtlasUser;

    return user.files;
  };

  const getUserFilesByPurpose = async (userEmail: string, purpose: Purpose) => {
    const userFiles = await getAllUserFiles(userEmail);
    const userFilesByPurpose = userFiles.filter(
      (file) => file.purpose === purpose
    );
    return userFilesByPurpose;
  };

  const getUserFile = async (userEmail: string, fileId: string) => {
    const userFiles = await getAllUserFiles(userEmail);
    const userFile = userFiles.find((file) => file.id === fileId);
    return userFile;
  };

  const getSageId = async (userEmail: string) => {
    const user = await getUser(userEmail);
    return user.sageId;
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

  const getThreadId = async (userEmail: string) => {
    const user = await getUser(userEmail);
    return user.threadId;
  };

  const dismissSage = async (userEmail: string) => {
    const updateResult = userCollection.updateOne(
      { email: userEmail },
      { $unset: { sageId: '', threadId: '' } }
    );
    return updateResult;
  };

  const addFile = async (userEmail: string, file: AtlasFile) => {
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
    getAllUserFiles,
    getUserFilesByPurpose,
    getUserFile,
    getSageId,
    summonSage,
    addThreadId,
    getThreadId,
    dismissSage,
    addFile,
    deleteFile,
  };
};
