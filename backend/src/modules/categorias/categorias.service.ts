import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './entities/categoria.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) {}

  async findAll(clinicaId: string): Promise<Categoria[]> {
    return this.categoriaRepository.find({
      where: { clinica_id: clinicaId },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string, clinicaId: string): Promise<Categoria> {
    const categoria = await this.categoriaRepository.findOne({
      where: { id, clinica_id: clinicaId },
    });
    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }
    return categoria;
  }

  async create(clinicaId: string, dto: CreateCategoriaDto): Promise<Categoria> {
    const categoria = this.categoriaRepository.create({
      ...dto,
      clinica_id: clinicaId,
    });
    return this.categoriaRepository.save(categoria);
  }

  async update(id: string, clinicaId: string, dto: UpdateCategoriaDto): Promise<Categoria> {
    const categoria = await this.findOne(id, clinicaId);
    Object.assign(categoria, dto);
    return this.categoriaRepository.save(categoria);
  }

  async remove(id: string, clinicaId: string): Promise<void> {
    const categoria = await this.findOne(id, clinicaId);
    await this.categoriaRepository.remove(categoria);
  }
}
