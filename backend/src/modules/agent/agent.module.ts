import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { Clinica } from '../clinicas/entities/clinica.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Turno } from '../turnos/entities/turno.entity';
import { User } from '../users/entities/user.entity';
import { Tratamiento } from '../tratamientos/entities/tratamiento.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { WebhookService } from '../../common/services/webhook.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Clinica,
      Paciente,
      Turno,
      User,
      Tratamiento,
      Subscription,
    ]),
  ],
  controllers: [AgentController],
  providers: [AgentService, WebhookService],
  exports: [AgentService],
})
export class AgentModule {}
