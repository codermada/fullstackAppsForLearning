// src/tasks/tasks.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'tasks', // Separate namespace to keep task events organized [citation:1]
})
export class TasksGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected to tasks namespace: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // This method will be called by the TasksService after any mutation
  emitTaskUpdate(event: 'created' | 'updated' | 'deleted', task: any) {
    // Broadcast to ALL clients in this namespace
    this.server.emit('taskUpdated', { event, task });
  }
}