import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArchivoMedico } from './entities/archivo-medico.entity';
import { ArchivosMedicosService } from './archivos-medicos.service';
import { ArchivosMedicosController } from './archivos-medicos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ArchivoMedico])],
  controllers: [ArchivosMedicosController],
  providers: [ArchivosMedicosService],
  exports: [ArchivosMedicosService],
})
export class ArchivosMedicosModule implements OnModuleInit {
  constructor(private readonly archivosMedicosService: ArchivosMedicosService) {}

  async onModuleInit() {
    await this.archivosMedicosService.ensureBuckets();
  }
}
