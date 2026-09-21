import { Module } from '@nestjs/common';
import { EmployeeSyncService } from './employee-sync.service';
import { SyncController } from './sync.controller';

@Module({
  controllers: [SyncController],
  providers: [EmployeeSyncService],
  exports: [EmployeeSyncService],
})
export class SyncModule {}
