import { IsIn } from 'class-validator';

export class ActualizarDiaPagoDto {
  @IsIn([1, 15])
  diaPago!: 1 | 15;
}
