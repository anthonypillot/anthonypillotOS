import { randomBytes } from "node:crypto";
import { io, type Socket } from "socket.io-client";
import {
  taskHoldemProtocolVersion, taskHoldemSocketPath,
  type TaskHoldemClientEvents, type TaskHoldemResult, type TaskHoldemServerEvents,
} from "../../../shared/types/task-holdem.type";

export type TaskHoldemTestSocket = Socket<TaskHoldemServerEvents, TaskHoldemClientEvents>;

export function createTaskHoldemSocket(url: string): TaskHoldemTestSocket {
  return io(url, {
    path: taskHoldemSocketPath,
    auth: { protocolVersion: taskHoldemProtocolVersion },
    transports: ["websocket"],
    autoConnect: false,
    reconnection: false,
    ackTimeout: 8000,
    forceNew: true,
  });
}

export async function connectTaskHoldemSocket(url: string): Promise<TaskHoldemTestSocket> {
  const socket = createTaskHoldemSocket(url);
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { reject(new Error("Socket connection timed out")); }, 8000);
      socket.once("connect", () => { clearTimeout(timer); resolve(); });
      socket.once("connect_error", (error) => { clearTimeout(timer); reject(error); });
      socket.connect();
    });
    return socket;
  } catch (error) {
    socket.disconnect();
    throw error;
  }
}

export function taskHoldemSuccess<T>(result: TaskHoldemResult<T>): T {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.data;
}

export async function createTaskHoldemTestRoom(url: string, roomId: string): Promise<void> {
  const socket = await connectTaskHoldemSocket(url);
  try {
    taskHoldemSuccess(await socket.emitWithAck("room:create", {
      roomId, token: randomBytes(32).toString("hex"), profile: { name: "Room setup", avatar: "dragon" },
    }));
    taskHoldemSuccess(await socket.emitWithAck("room:leave", {}));
  } finally {
    socket.disconnect();
  }
}
