import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObraSocial } from './entities/obra-social.entity';
import { ObrasSocialesService } from './obras-sociales.service';
import { ObrasSocialesController } from './obras-sociales.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ObraSocial])],
  controllers: [ObrasSocialesController],
  providers: [ObrasSocialesService],
  exports: [ObrasSocialesService],
})
export class ObrasSocialesModule {}
