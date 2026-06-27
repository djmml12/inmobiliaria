import { Module } from '@nestjs/common';
import { VendedoresService } from './vendedores.service';
import { VendedoresController } from './vendedores.controller';

@Module({
  controllers: [VendedoresController],
  providers: [VendedoresService],
})
export class VendedoresModule {}
