import { Module } from '@nestjs/common';
import { ImpuestosConfigController } from './impuestos-config.controller';
import { ImpuestosConfigService } from './impuestos-config.service';

@Module({
  controllers: [ImpuestosConfigController],
  providers: [ImpuestosConfigService],
})
export class ImpuestosConfigModule {}
