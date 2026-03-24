import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(clinicaId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { clinica_id: clinicaId },
      select: ['id', 'clinica_id', 'nombre', 'apellido', 'email', 'role', 'created_at'],
    });
  }

  async findOne(id: string, clinicaId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, clinica_id: clinicaId },
      select: ['id', 'clinica_id', 'nombre', 'apellido', 'email', 'role', 'created_at'],
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(clinicaId: string, createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      clinica_id: clinicaId,
      password: hashedPassword,
    });

    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return result as User;
  }

  async update(
    id: string,
    clinicaId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.findOne(id, clinicaId);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string, clinicaId: string): Promise<void> {
    const user = await this.findOne(id, clinicaId);
    await this.userRepository.remove(user);
  }
}
