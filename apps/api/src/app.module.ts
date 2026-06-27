import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { ClientesModule } from './clientes/clientes.module';
import { LotesModule } from './lotes/lotes.module';
import { VentasModule } from './ventas/ventas.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { ImpuestosConfigModule } from './impuestos-config/impuestos-config.module';
import { ComisionesConfigModule } from './comisiones-config/comisiones-config.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PagosModule } from './pagos/pagos.module';
import { VendedoresModule } from './vendedores/vendedores.module';
import { ReservasModule } from './reservas/reservas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    ProyectosModule,
    ClientesModule,
    LotesModule,
    VentasModule,
    ConfiguracionModule,
    ImpuestosConfigModule,
    ComisionesConfigModule,
    DashboardModule,
    PagosModule,
    VendedoresModule,
    ReservasModule,
  ],
})
export class AppModule {}
