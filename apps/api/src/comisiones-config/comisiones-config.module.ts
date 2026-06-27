import { Module } from '@nestjs/common';
import { ComisionesConfigController } from './comisiones-config.controller';
import { ComisionesConfigService } from './comisiones-config.service';

@Module({
  controllers: [ComisionesConfigController],
  providers: [ComisionesConfigService],
})
export class ComisionesConfigModule {}
