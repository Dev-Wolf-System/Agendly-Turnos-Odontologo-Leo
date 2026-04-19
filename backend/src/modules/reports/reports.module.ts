import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Turno } from '../turnos/entities/turno.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Clinica } from '../clinicas/entities/clinica.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Turno, Paciente, Pago, Clinica])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
