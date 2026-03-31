import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinica } from './entities/clinica.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { ClinicasService } from './clinicas.service';
import { ClinicasController } from './clinicas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Clinica, Subscription])],
  controllers: [ClinicasController],
  providers: [ClinicasService],
  exports: [ClinicasService],
})
export class ClinicasModule {}
