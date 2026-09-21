import { Module } from '@nestjs/common';
import { PunchChainService } from './punch-chain.service';
import { PunchesController } from './punches.controller';
import { PunchesService } from './punches.service';

@Module({
  controllers: [PunchesController],
  providers: [PunchesService, PunchChainService],
  exports: [PunchesService, PunchChainService],
})
export class PunchesModule {}
