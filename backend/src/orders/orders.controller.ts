import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Create order (customer only)
  @Post()
  @Roles('CUSTOMER')
  create(
    @CurrentUser('id') userId: number,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(userId, createOrderDto);
  }

  // Get my orders (customer/vendor)
  @Get()
  @Roles('CUSTOMER', 'VENDOR')
  findAll(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
  ) {
    return this.ordersService.findAll(userId, role);
  }

  // Get order detail
  @Get(':id')
  @Roles('CUSTOMER', 'VENDOR', 'ADMIN')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
  ) {
    return this.ordersService.findOne(id, userId, role);
  }

  // Update order status (vendor only)
  @Patch(':id/status')
  @Roles('VENDOR')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, userId, dto);
  }

  // Cancel order (customer/vendor)
  @Delete(':id')
  @Roles('CUSTOMER', 'VENDOR')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
  ) {
    return this.ordersService.cancel(id, userId, role);
  }
}
