import type { User } from "@/components/task-holdem/CreateUser.vue";
import * as dao from "@/server/dao/task-holdem.dao";
import { prefixLog, type Room } from "@/types/task-holdem.type";

export function getOrCreateRoom(id: string): Promise<Room> {
  return dao.getOrCreateRoom(id);
}

export function updateRoom(id: string, roomToUpdate: Room): Promise<Room> {
  return dao.updateRoom(id, roomToUpdate);
}

export function restartRoom(roomId: string, room: Room): Promise<Room> {
  room.game.status = "playing";
  room.users.forEach((user) => {
    user.selectedCard = null;
  });

  return updateRoom(roomId, room);
}

export function getUserBySessionId(roomId: string, sessionId: string): Promise<User | null> {
  return dao.getUserBySessionId(roomId, sessionId);
}

export async function createUser(roomId: string, sessionId: string, userToCreate: User): Promise<Room> {
  const room: Room = await getOrCreateRoom(roomId);
  if (!room.users.find((user) => user.id === userToCreate.id)) {
    logger.debug(`${prefixLog} User to create: [${userToCreate.name}]`);
    userToCreate.sessionId = sessionId;
    room.users.push(userToCreate);
  }

  return updateRoom(roomId, room);
}

export async function removeUser(roomId: string, userToRemove: User): Promise<Room> {
  const room: Room = await getOrCreateRoom(roomId);
  room.users = room.users.filter((user) => user.id !== userToRemove.id);

  logger.debug(`${prefixLog} User removed: [${userToRemove.name}]`);

  return updateRoom(roomId, room);
}

export async function removeUserBySessionId(roomId: string, sessionId: string): Promise<Room | null> {
  const room: Room | null = await dao.getRoom(roomId);
  if (room) {
    const userToRemove = room.users.find((user) => user.sessionId === sessionId);

    if (userToRemove) {
      room.users = room.users.filter((user) => {
        return user.sessionId !== sessionId;
      });

      logger.debug(`${prefixLog} User disconnected: [${userToRemove.name}]`);

      return updateRoom(roomId, room);
    } else {
      return null;
    }
  } else {
    return null;
  }
}
