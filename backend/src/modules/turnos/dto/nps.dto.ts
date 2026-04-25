import { IsInt, Max, Min } from 'class-validator';

export class NpsDto {
  @IsInt()
  @Min(1)
  @Max(10)
  score: number;
}
