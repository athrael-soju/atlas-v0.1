// pages/api/user.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { User, UserFile } from '@/lib/types';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case 'POST':
      // Add a new user
      try {
        const { id, email, img, assistantId, files } = req.body as User;

        const newUser = await prisma.user.create({
          data: {
            id,
            email,
            img,
            assistantId,
            files: {
              create: files.map((file: UserFile) => ({
                purpose: file.purpose,
              })),
            },
          },
        });

        res.status(201).json(newUser);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create user' });
      }
      break;

    case 'PUT':
      // Update an existing user
      try {
        const { id, email, img, assistantId, files } = req.body as User;

        const updatedUser = await prisma.user.update({
          where: { id },
          data: {
            email,
            img,
            assistantId,
            files: {
              deleteMany: {},
              create: files.map((file: UserFile) => ({
                purpose: file.purpose,
              })),
            },
          },
        });

        res.status(200).json(updatedUser);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user' });
      }
      break;

    default:
      res.setHeader('Allow', ['POST', 'PUT']);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
}
