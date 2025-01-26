import type { User } from "@/components/task-holdem/CreateUser.vue";
import type { Room } from "@/types/task-holdem.type";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getRoom(id: string): Promise<Room | null> {
  try {
    const room = await prisma.taskHoldemRoom.findUnique({
      where: {
        id,
      },
    });

    if (room && room.data) {
      return room.data as Room;
    } else {
      return null;
    }
  } catch (error: any) {
    logger.error(`Error while getting room: ${error}`);
    throw new Error(error);
  }
}

function createEmptyRoom(): Room {
  return {
    users: [],
    game: {
      status: "playing",
    },
  };
}

export async function createRoom(id: string): Promise<Room> {
  try {
    const room = await prisma.taskHoldemRoom.create({
      data: {
        id,
        data: createEmptyRoom(),
      },
    });

    return room.data as Room;
  } catch (error: any) {
    logger.error(`Error while creating room: ${error}`);
    throw new Error(error);
  }
}

export async function getOrCreateRoom(id: string): Promise<Room> {
  const room = await getRoom(id);

  if (room) {
    return room;
  } else {
    return await createRoom(id);
  }
}

export async function updateRoom(id: string, updatedRoom: Room): Promise<Room> {
  try {
    const room = await prisma.taskHoldemRoom.update({
      where: {
        id,
      },
      data: {
        data: updatedRoom,
      },
    });

    return room.data as Room;
  } catch (error: any) {
    logger.error(`Error while updating room: ${error}`);
    throw new Error(error);
  }
}

export async function getUserByUserId(roomId: string, userId: string): Promise<User | null> {
  const room: Room | null = await getRoom(roomId);
  if (room) {
    const user = room.users.find((user) => user.id === userId);
    return user || null;
  } else {
    return null;
  }
}

export async function getUserBySessionId(roomId: string, sessionId: string): Promise<User | null> {
  const room: Room | null = await getRoom(roomId);
  if (room) {
    const user = room.users.find((user) => user.sessionId === sessionId);
    return user || null;
  } else {
    return null;
  }
}
