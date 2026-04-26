import { Controller, Post, Get, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Public, CurrentUser, ApiKeyAuth } from '../../common/decorators';

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

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'Si el email existe, recibirás un link para restablecer tu contraseña.' };
  }

  /**
   * Migra todos los usuarios sin supabase_uid a Supabase Auth.
   * Protegido por AGENT_API_KEY (header x-api-key).
   * Solo debe ejecutarse una vez en producción.
   */
  @ApiKeyAuth()
  @Post('admin/migrate-users')
  async migrateUsers() {
    return this.authService.migrateAllUsersToSupabase();
  }
}
