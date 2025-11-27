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

  async exportCsv(): Promise<string> {
    const rows = await this.weatherModel.find().lean().exec();

    if (rows.length === 0) {
      return 'temperature,humidity,wind_speed,sky,created_at';
    }

    const headers = Object.keys(rows[0]);

    // Remover campos internos do Mongo (_id, __v)
    const filteredHeaders = headers.filter(
      (h) => h !== '_id' && h !== '__v' && h !== 'createdAt' && h !== 'updatedAt'
    );

    const csvRows: string[] = [];

    // Header da tabela
    csvRows.push(filteredHeaders.join(','));

    // Linhas
    for (const row of rows) {
      const line = filteredHeaders
        .map((h) => {
          let value = row[h];

          if (value === undefined || value === null) return '';

          // Para datas
          if (value instanceof Date) {
            return value.toISOString();
          }

          // Sanitizar vírgulas e quebras de linha
          value = String(value).replace(/,/g, ';').replace(/\n/g, ' ');

          return value;
        })
        .join(',');

      csvRows.push(line);
    }

    return csvRows.join('\n');
  }
}
