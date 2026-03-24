import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paciente } from './entities/paciente.entity';
import { Turno } from '../turnos/entities/turno.entity';
import { HistorialMedico } from '../historial-medico/entities/historial-medico.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { PacientesService } from './pacientes.service';
import { PacientesController } from './pacientes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Paciente, Turno, HistorialMedico, Pago])],
  controllers: [PacientesController],
  providers: [PacientesService],
  exports: [PacientesService],
})
export class PacientesModule {}
