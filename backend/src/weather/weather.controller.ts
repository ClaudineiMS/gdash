import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { WeatherService } from './weather.service';
import type { Response } from 'express';

@Controller('weather')
export class WeatherController {
  constructor(private weatherService: WeatherService) {}

  @Post()
  async create(@Body() body: any) {
    return this.weatherService.create(body);
  }

  @Get()
  async list() {
    return this.weatherService.findAll();
  }

  //export.csv
  @Get('export.csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.weatherService.exportCsv();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="weather.csv"');

    return res.send(csv);
  }
}
