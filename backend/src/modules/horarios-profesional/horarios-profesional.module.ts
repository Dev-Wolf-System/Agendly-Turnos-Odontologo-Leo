import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorarioProfesional } from './entities/horario-profesional.entity';
import { Clinica } from '../clinicas/entities/clinica.entity';
import { HorarioProfesionalService } from './horarios-profesional.service';
import { HorarioProfesionalController } from './horarios-profesional.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HorarioProfesional, Clinica])],
  controllers: [HorarioProfesionalController],
  providers: [HorarioProfesionalService],
  exports: [HorarioProfesionalService],
})
export class HorariosProfesionalModule {}
