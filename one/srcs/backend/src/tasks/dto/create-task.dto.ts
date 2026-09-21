import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({
    description: 'The task description',
    example: 'Buy groceries',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  task: string;

  @ApiProperty({
    description: 'Whether the task is already completed',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}