import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Weather } from './weather.schema';

@Injectable()
export class WeatherService {
  constructor(
    @InjectModel(Weather.name)
    private readonly weatherModel: Model<Weather>,
  ) {}

  async create(data: any): Promise<Weather> {
    const created = new this.weatherModel(data);
    return created.save();
  }

  async findAll() {
    return this.weatherModel.find().sort({ createdAt: -1 }).exec();
  }
}
