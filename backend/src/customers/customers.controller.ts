import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // Get all customers (admin only)
  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.customersService.findAll();
  }

  // Get customer detail
  @Get(':id')
  @Roles('CUSTOMER', 'ADMIN')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: string,
  ) {
    return this.customersService.findOne(id, userId, role);
  }

  // Update customer profile (owner only)
  @Patch()
  @Roles('CUSTOMER')
  update(
    @CurrentUser('id') userId: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(userId, updateCustomerDto);
  }

  // Delete own account (customer)
  @Delete()
  @Roles('CUSTOMER')
  removeSelf(@CurrentUser('id') userId: number) {
    return this.customersService.removeSelf(userId);
  }

  // Delete customer by ID (admin only)
  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.remove(id);
  }
}
