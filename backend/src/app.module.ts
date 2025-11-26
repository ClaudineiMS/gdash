import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // torna o .env disponível em toda a aplicação
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
