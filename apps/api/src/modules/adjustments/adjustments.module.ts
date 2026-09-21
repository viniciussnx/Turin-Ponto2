import { Module } from '@nestjs/common';
import { PunchesModule } from '../punches/punches.module';
import { AdjustmentsController } from './adjustments.controller';
import { AdjustmentsService } from './adjustments.service';

@Module({
  imports: [PunchesModule],
  controllers: [AdjustmentsController],
  providers: [AdjustmentsService],
  exports: [AdjustmentsService],
})
export class AdjustmentsModule {}
