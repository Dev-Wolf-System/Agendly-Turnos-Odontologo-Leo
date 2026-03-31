import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsUUID()
  receiver_id?: string;
}
