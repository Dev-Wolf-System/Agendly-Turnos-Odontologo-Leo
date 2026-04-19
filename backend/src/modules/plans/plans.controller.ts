import { Controller, Get } from '@nestjs/common';
import { PlansService } from './plans.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  /** Público — devuelve planes activos con show_in_landing=true para landing page */
  @Public()
  @Get()
  findActive() {
    return this.plansService.findAllForLanding();
  }
}
