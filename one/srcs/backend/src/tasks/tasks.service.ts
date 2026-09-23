import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TasksGateway } from './tasks.gateway.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksGateway: TasksGateway,   // ← inject gateway
  ) {}

  async create(createTaskDto: CreateTaskDto) {
    const completed = createTaskDto.completed ?? false;

    const task = await this.prisma.task.create({
      data: {
        task: createTaskDto.task,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    this.tasksGateway.emitTaskUpdate('created', task);   // ← broadcast
    return task;
  }

  async findAll() {
    return this.prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task #${id} not found`);
    }
    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    const existing = await this.findOne(id);

    const data: {
      task?: string;
      completed?: boolean;
      completedAt?: Date | null;
    } = {};

    if (updateTaskDto.task !== undefined && updateTaskDto.task !== existing.task) {
      data.task = updateTaskDto.task;
    }

    if (
      updateTaskDto.completed !== undefined &&
      updateTaskDto.completed !== existing.completed
    ) {
      data.completed = updateTaskDto.completed;
      data.completedAt = updateTaskDto.completed ? new Date() : null;
    }

    // Nothing actually changed — skip DB write and broadcast
    if (Object.keys(data).length === 0) {
      return existing;
    }

    const task = await this.prisma.task.update({ where: { id }, data });

    this.tasksGateway.emitTaskUpdate('updated', task);   // ← broadcast
    return task;
  }

  async remove(id: number) {
    await this.findOne(id);
    const task = await this.prisma.task.delete({ where: { id } });

    this.tasksGateway.emitTaskUpdate('deleted', task);   // ← broadcast
    return task;
  }
}