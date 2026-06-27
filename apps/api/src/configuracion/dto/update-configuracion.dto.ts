import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const CLAVES_PERMITIDAS = new Set([
  'impuesto.iva.tasa',
  'impuesto.timbres.tasa',
  'comision.credito.pct',
  'comision.credito.fijo',
  'comision.debito.pct',
  'comision.debito.fijo',
  'pagos.dias_aviso',
  'pagos.dias_gracia',
  'smtp.host',
  'smtp.port',
  'smtp.secure',
  'smtp.user',
  'smtp.pass',
  'smtp.from',
]);

export class ConfigEntryDto {
  @IsString()
  clave!: string;

  @IsString()
  valor!: string;

  esValida() {
    return CLAVES_PERMITIDAS.has(this.clave);
  }
}

export class UpdateConfiguracionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigEntryDto)
  entries!: ConfigEntryDto[];
}

export { CLAVES_PERMITIDAS };
