import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DatabaseMaintenanceService } from './database-maintenance.service';
import { DatabaseMaintenanceController } from './database-maintenance.controller';

@Global()
@Module({
  controllers: [DatabaseMaintenanceController],
  providers: [PrismaService, DatabaseMaintenanceService],
  exports: [PrismaService, DatabaseMaintenanceService],
})
export class PrismaModule {}

