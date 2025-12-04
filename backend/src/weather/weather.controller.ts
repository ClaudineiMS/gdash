import { Body, Controller, Get, Post, Res, Query, ParseIntPipe, Param } from '@nestjs/common';
import { WeatherService } from './weather.service';
import type { Response } from 'express';
import dayjs from 'dayjs';
@Controller('weather')
export class WeatherController {
  constructor(private weatherService: WeatherService) { }

  @Get('day-range')
  async getByDayRange(@Query('start') start: string, @Query('end') end: string) {
    return this.weatherService.getByDayRange(new Date(start), new Date(end));
  }

  @Get('latest')
  async latest() {
    return this.weatherService.findLatest();
  }

  @Get('history')
  async getHistory(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
  ) {
    return this.weatherService.getPaginatedHistory(page, limit);
  }

  @Post()
  async create(@Body() body: any) {
    return this.weatherService.create(body);
  }

  @Get()
  async list() {
    return this.weatherService.findAll();
  }

  @Get('export.csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.weatherService.exportCsv();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="weather.csv"');

    return res.send(csv);
  }

  @Get('export.xlsx')
  async exportXlsx(@Res() res: Response) {
    const file = await this.weatherService.exportXlsx();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="weather.xlsx"',
    );

    return res.send(file);
  }
}
