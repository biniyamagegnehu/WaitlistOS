import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { PublicWaitlistsService } from './public-waitlists.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('w')
export class PublicWaitlistsController {
  constructor(private readonly publicWaitlistsService: PublicWaitlistsService) {}

  @Public()
  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  findBySlug(@Param('slug') slug: string) {
    return this.publicWaitlistsService.findBySlug(slug);
  }
}
