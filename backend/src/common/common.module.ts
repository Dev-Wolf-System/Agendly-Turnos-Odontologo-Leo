import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../modules/subscriptions/entities/subscription.entity';
import { User } from '../modules/users/entities/user.entity';
import { Paciente } from '../modules/pacientes/entities/paciente.entity';
import { FeatureFlagService } from './services/feature-flag.service';
import { SupabaseService } from './services/supabase.service';
import { PlanLimitGuard } from './guards/plan-limit.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Subscription, User, Paciente])],
  providers: [FeatureFlagService, SupabaseService, PlanLimitGuard],
  exports: [FeatureFlagService, SupabaseService, PlanLimitGuard, TypeOrmModule],
})
export class CommonModule {}
