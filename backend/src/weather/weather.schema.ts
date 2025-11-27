import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Weather extends Document {
  @Prop({ required: true })
  city: string;

  @Prop({ required: false })
  timestamp_utc: string;

  @Prop()
  temperature_c: number;

  @Prop()
  humidity_pct: number;

  @Prop()
  wind_speed_kmh: number;

  @Prop()
  condition_text: string;

  @Prop()
  rain_probability_pct: number;
}

export const WeatherSchema = SchemaFactory.createForClass(Weather);
