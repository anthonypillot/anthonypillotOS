import { PrismaClient } from "@prisma/client";
import type { Room } from "@/types/task-holdem.type";

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
        // @ts-ignore
        data: createEmptyRoom(),
      },
    });

    return room.data as Room;
  } catch (error: any) {
    logger.error(`Error while creating room: ${error}`);
    throw new Error(error);
  }
}

export async function createOrUpdateRoom(id: string): Promise<Room> {
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
        // @ts-ignore
        data: updatedRoom,
      },
    });

    return room.data as Room;
  } catch (error: any) {
    logger.error(`Error while updating room: ${error}`);
    throw new Error(error);
  }
}
