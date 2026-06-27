import { IsUUID, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PlanDto } from './plan-financiamiento.dto';

export class SimularVentaDto {
  @IsUUID()
  loteId!: string;

  @IsInt()
  @Min(0)
  enganche!: number; // centavos

  @ValidateNested()
  @Type(() => PlanDto)
  plan!: PlanDto;
}
