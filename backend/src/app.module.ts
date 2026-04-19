import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { databaseConfig } from './config/database.config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ClinicaTenantGuard } from './common/guards/clinica-tenant.guard';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { AuthModule } from './modules/auth/auth.module';
import { ClinicasModule } from './modules/clinicas/clinicas.module';
import { UsersModule } from './modules/users/users.module';
import { PacientesModule } from './modules/pacientes/pacientes.module';
import { TurnosModule } from './modules/turnos/turnos.module';
import { HistorialMedicoModule } from './modules/historial-medico/historial-medico.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { ProveedoresModule } from './modules/proveedores/proveedores.module';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TratamientosModule } from './modules/tratamientos/tratamientos.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { PlansModule } from './modules/plans/plans.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { AdminModule } from './modules/admin/admin.module';
import { AgentModule } from './modules/agent/agent.module';
import { ChatModule } from './modules/chat/chat.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { HorariosProfesionalModule } from './modules/horarios-profesional/horarios-profesional.module';
import { LeadsModule } from './modules/leads/leads.module';
import { SucursalesModule } from './modules/sucursales/sucursales.module';
import { ArchivosMedicosModule } from './modules/archivos-medicos/archivos-medicos.module';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { FeatureFlagGuard } from './common/guards/feature-flag.guard';
import { CommonModule } from './common/common.module';
import { BillingModule } from './modules/billing/billing.module';
import { ClinicaMpModule } from './modules/clinica-mp/clinica-mp.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ObrasSocialesModule } from './modules/obras-sociales/obras-sociales.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync(databaseConfig),
    CommonModule,
    AuthModule,
    ClinicasModule,
    UsersModule,
    PacientesModule,
    TurnosModule,
    HistorialMedicoModule,
    PagosModule,
    InventarioModule,
    ProveedoresModule,
    CategoriasModule,
    DashboardModule,
    TratamientosModule,
    NotificacionesModule,
    PlansModule,
    SubscriptionsModule,
    AdminModule,
    AgentModule,
    ChatModule,
    TicketsModule,
    HorariosProfesionalModule,
    LeadsModule,
    SucursalesModule,
    ArchivosMedicosModule,
    BillingModule,
    ClinicaMpModule,
    ReportsModule,
    ObrasSocialesModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ClinicaTenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: FeatureFlagGuard,
    },
  ],
})
export class AppModule {}
