import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { QueryMenuDto } from './dto/query-menu.dto';
import { CreateMenuRatingDto } from './dto/create-menu-rating.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  // Get all menus (public) with filters
  @Get()
  findAll(@Query() query: QueryMenuDto) {
    return this.menusService.findAll(query);
  }

  // Get menu detail (public)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.findOne(id);
  }

  // Get menu ratings (public)
  @Get(':id/ratings')
  findMenuRatings(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.findMenuRatings(id);
  }

  // Create or update my menu rating (customer only)
  @Post(':id/ratings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  rateMenu(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateMenuRatingDto,
  ) {
    return this.menusService.rateMenu(userId, id, dto);
  }

  // Create menu (vendor only)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  create(
    @CurrentUser('id') userId: number,
    @Body() createMenuDto: CreateMenuDto,
  ) {
    return this.menusService.create(userId, createMenuDto);
  }

  // Update menu (vendor only)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() updateMenuDto: UpdateMenuDto,
  ) {
    return this.menusService.update(id, userId, updateMenuDto);
  }

  // Delete menu (vendor only)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.menusService.remove(id, userId);
  }

  // Toggle available (vendor only)
  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  toggleAvailable(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.menusService.toggleAvailable(id, userId);
  }
}
