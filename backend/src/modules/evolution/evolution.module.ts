import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvolutionService } from './evolution.service';
import { EvolutionController } from './evolution.controller';
import { Clinica } from '../clinicas/entities/clinica.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Clinica])],
  controllers: [EvolutionController],
  providers: [EvolutionService],
  exports: [EvolutionService],
})
export class EvolutionModule {}
