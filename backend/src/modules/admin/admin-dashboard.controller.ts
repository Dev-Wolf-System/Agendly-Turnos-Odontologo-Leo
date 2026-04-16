import { Controller, Get, UseGuards } from '@nestjs/common';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { AdminService } from './admin.service';

@Controller('admin/dashboard')
@UseGuards(SuperAdminGuard)
export class AdminDashboardController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  getKPIs() {
    return this.adminService.getDashboardKPIs();
  }

  @Get('trends')
  getTrends() {
    return this.adminService.getDashboardTrends();
  }
}
