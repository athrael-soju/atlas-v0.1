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

  const updateUser = async (
    userEmail: string,
    updateData: Partial<AtlasUser>
  ) => {
    const userUpdated = await userCollection.updateOne(
      { email: userEmail },
      { $set: updateData }
    );
    return userUpdated.modifiedCount === 1;
  };

  const retrieveArchives = async (userEmail: string, purpose: Purpose) => {
    const user = (await userCollection.findOne({
      email: userEmail,
    })) as unknown as AtlasUser;

    return user.assistants[purpose].files || [];
  };

  const retrieveArchive = async (
    userEmail: string,
    purpose: Purpose,
    fileId: string
  ) => {
    const files = await retrieveArchives(userEmail, purpose);
    const file = files.find((file) => file.id === fileId);
    return file;
  };

  const dismissAssistants = async (userEmail: string) => {
    const updateResult = await userCollection.updateOne(
      { email: userEmail },
      { $unset: { assistants: '' } }
    );
    return updateResult.modifiedCount === 1;
  };

  const insertArchive = async (
    userEmail: string,
    purpose: Purpose,
    file: AtlasFile
  ) => {
    const updateResult = userCollection.updateOne(
      { email: userEmail },
      {
        $push: {
          [`assistants.${purpose}.files`]: file,
        },
      }
    );
    return updateResult;
  };

  const purgeArchive = async (
    userEmail: string,
    purpose: string, // Ensure Purpose is of type string
    fileId: string
  ) => {
    const updateResult = await userCollection.updateOne(
      { email: userEmail },
      {
        $pull: {
          [`assistants.${purpose}.files`]: { id: fileId },
        },
      }
    );
    return updateResult;
  };

  return {
    getClient,
    insertUser,
    getUser,
    updateUser,
    retrieveArchives,
    retrieveArchive,
    dismissAssistants,
    insertArchive,
    purgeArchive,
  };
};
