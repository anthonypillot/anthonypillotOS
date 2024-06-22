import { PrismaClient } from "@prisma/client";
import type { User } from "@/components/task-holdem/CreateUser.vue";

const prisma = new PrismaClient();

export async function createRoom(roomId: string): Promise<User[]> {
  try {
    const room = await prisma.taskHoldemRoom.create({
      data: {
        id: roomId,
        data: [],
      },
    });

    return room.data as User[];
  } catch (error: any) {
    logger.error(`Error while creating room: ${error}`);
    throw new Error(error);
  }
}

export async function getUsers(roomId: string): Promise<User[] | null> {
  try {
    const room = await prisma.taskHoldemRoom.findUnique({
      where: {
        id: roomId,
      },
    });

    if (room && room.data) {
      return room.data as User[];
    } else {
      return null;
    }
  } catch (error: any) {
    logger.error(`Error while getting users: ${error}`);
    throw new Error(error);
  }
}

export async function updateUsers(roomId: string, users: User[]): Promise<User[]> {
  try {
    const room = await prisma.taskHoldemRoom.update({
      where: {
        id: roomId,
      },
      data: {
        // @ts-ignore
        data: users,
      },
    });

    return room.data as User[];
  } catch (error: any) {
    logger.error(`Error while updating users: ${error}`);
    throw new Error(error);
  }
}
