import { Controller, Post, Get, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Public, CurrentUser } from '../../common/decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  getMe(
    @CurrentUser()
    user: { userId: string; clinicaId: string; role: string; email: string },
  ) {
    return this.authService.getMe(user.userId);
  }

  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Migra todos los usuarios sin supabase_uid a Supabase Auth.
   * Devuelve un link de reset de contraseña por usuario.
   * Solo debe ejecutarse una vez en producción (superadmin).
   */
  @Post('admin/migrate-users')
  async migrateUsers(
    @CurrentUser()
    user: { userId: string; role: string },
  ) {
    if (user.role !== 'SUPERADMIN') {
      return { error: 'No autorizado' };
    }
    return this.authService.migrateAllUsersToSupabase();
  }
}
