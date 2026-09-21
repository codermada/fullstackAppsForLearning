import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        task: createTaskDto.task,
        completed: createTaskDto.completed ?? false,
        // Set completedAt if created already completed
        completedAt: createTaskDto.completed ? new Date() : null,
      },
    });
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
    // Make sure it exists first (throws 404 if not)
    await this.findOne(id);

    const data: {
      task?: string;
      completed?: boolean;
      completedAt?: Date | null;
    } = {};

    if (updateTaskDto.task !== undefined) {
      data.task = updateTaskDto.task;
    }

    if (updateTaskDto.completed !== undefined) {
      data.completed = updateTaskDto.completed;
      // Keep completedAt in sync with the completed flag
      data.completedAt = updateTaskDto.completed ? new Date() : null;
    }

    return this.prisma.task.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }
}