import { Module } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Weather, WeatherSchema } from './weather.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Weather.name, schema: WeatherSchema }]),
  ],
  providers: [WeatherService],
})
export class WeatherModule {}
