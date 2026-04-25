import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListaEspera } from './entities/lista-espera.entity';
import { ListaEsperaService } from './lista-espera.service';
import { ListaEsperaController } from './lista-espera.controller';
import { WebhookService } from '../../common/services/webhook.service';
import { Clinica } from '../clinicas/entities/clinica.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ListaEspera, Clinica])],
  controllers: [ListaEsperaController],
  providers: [ListaEsperaService, WebhookService],
  exports: [ListaEsperaService],
})
export class ListaEsperaModule {}
