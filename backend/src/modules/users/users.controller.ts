import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentClinica, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { PlanLimitGuard, CheckPlanLimit } from '../../common/guards/plan-limit.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@CurrentClinica() clinicaId: string) {
    return this.usersService.findAll(clinicaId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.usersService.findOne(id, clinicaId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TURNOS_ONLY)
  @UseGuards(PlanLimitGuard)
  @CheckPlanLimit('max_usuarios')
  create(
    @CurrentClinica() clinicaId: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(clinicaId, createUserDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TURNOS_ONLY)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, clinicaId, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.TURNOS_ONLY)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.usersService.remove(id, clinicaId);
  }
}
