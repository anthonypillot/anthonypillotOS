import type { User } from "@/components/task-holdem/CreateUser.vue";
import * as dao from "@/server/dao/task-holdem.dao";
import { prefixLog, type Room } from "@/types/task-holdem.type";

export function getOrCreateRoom(id: string): Promise<Room> {
  logger.debug(`${prefixLog} Room created or fetched`);
  return dao.getOrCreateRoom(id);
}

export function updateRoom(id: string, roomToUpdate: Room): Promise<Room> {
  return dao.updateRoom(id, roomToUpdate);
}

export function restartRoom(id: string, room: Room): Promise<Room> {
  logger.debug(`${prefixLog} Room restarted`);

  room.game.status = "playing";
  room.users.forEach((user) => {
    user.selectedCard = null;
  });

  return updateRoom(id, room);
}

export function getUserBySessionId(id: string, sessionId: string): Promise<User | null> {
  return dao.getUserBySessionId(id, sessionId);
}

export async function createUser(id: string, sessionId: string, userToCreate: User): Promise<Room> {
  const room: Room = await getOrCreateRoom(id);
  if (!room.users.find((user) => user.id === userToCreate.id)) {
    logger.debug(`${prefixLog} User to create: [${userToCreate.name}]`);
    userToCreate.sessionId = sessionId;
    room.users.push(userToCreate);
  }

  return updateRoom(id, room);
}

export async function removeUser(id: string, userToRemove: User): Promise<Room> {
  const room: Room = await getOrCreateRoom(id);
  room.users = room.users.filter((user) => user.id !== userToRemove.id);

  logger.debug(`${prefixLog} User removed: [${userToRemove.name}]`);

  return updateRoom(id, room);
}

export async function removeUserBySessionId(id: string, sessionId: string): Promise<Room | null> {
  const room: Room | null = await dao.getRoom(id);
  if (room) {
    const userToRemove = room.users.find((user) => user.sessionId === sessionId);

    if (userToRemove) {
      room.users = room.users.filter((user) => {
        return user.sessionId !== sessionId;
      });

      logger.debug(`${prefixLog} User disconnected: [${userToRemove.name}]`);

      return updateRoom(id, room);
    } else {
      return null;
    }
  } else {
    return null;
  }
}
