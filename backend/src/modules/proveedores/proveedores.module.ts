import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { Categoria } from '../categorias/entities/categoria.entity';
import { ProveedoresService } from './proveedores.service';
import { ProveedoresController } from './proveedores.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Proveedor, Categoria])],
  controllers: [ProveedoresController],
  providers: [ProveedoresService],
  exports: [ProveedoresService],
})
export class ProveedoresModule {}
