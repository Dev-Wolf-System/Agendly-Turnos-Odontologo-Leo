import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicaMpConfig } from './entities/clinica-mp-config.entity';
import { ClinicaMpService } from './clinica-mp.service';
import { ClinicaMpController, AdminClinicaMpController } from './clinica-mp.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicaMpConfig])],
  controllers: [ClinicaMpController, AdminClinicaMpController],
  providers: [ClinicaMpService],
  exports: [ClinicaMpService],
})
export class ClinicaMpModule {}
