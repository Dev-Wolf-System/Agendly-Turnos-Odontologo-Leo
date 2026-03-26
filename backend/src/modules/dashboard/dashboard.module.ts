import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Turno } from '../turnos/entities/turno.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Inventario } from '../inventario/entities/inventario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Turno, Paciente, Pago, Inventario])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
