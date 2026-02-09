import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const customers = await this.prisma.customers.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { orders: true, reviews: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      data: customers.map((c) => ({
        id: c.id,
        user_id: c.user_id,
        phone: c.phone,
        address: c.address,
        city: c.city,
        created_at: c.created_at,
        updated_at: c.updated_at,
        user: c.user,
        totalOrders: c._count.orders,
        totalReviews: c._count.reviews,
      })),
      total: customers.length,
    };
  }

  async findOne(id: number, userId: number, role: string) {
    const customer = await this.prisma.customers.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        orders: {
          orderBy: { created_at: 'desc' },
          take: 10,
          include: {
            vendor: { select: { id: true, name: true } },
          },
        },
        reviews: {
          orderBy: { created_at: 'desc' },
          take: 10,
          include: {
            vendor: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { orders: true, reviews: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer dengan ID ${id} tidak ditemukan`);
    }

    // Customer can only see their own profile, admin can see all
    if (role === 'CUSTOMER' && customer.user_id !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke data customer ini');
    }

    return { data: customer };
  }

  async update(userId: number, updateCustomerDto: UpdateCustomerDto) {
    // Find customer by user_id
    const customer = await this.prisma.customers.findUnique({
      where: { user_id: userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile tidak ditemukan');
    }

    const updated = await this.prisma.customers.update({
      where: { id: customer.id },
      data: updateCustomerDto,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      message: 'Customer berhasil diupdate',
      data: updated,
    };
  }

  async removeSelf(userId: number) {
    const customer = await this.prisma.customers.findUnique({
      where: { user_id: userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile tidak ditemukan');
    }

    // Delete user (cascades to customer)
    await this.prisma.users.delete({
      where: { id: userId },
    });

    return {
      message: 'Account berhasil dihapus',
    };
  }

  async remove(id: number) {
    const customer = await this.prisma.customers.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!customer) {
      throw new NotFoundException(`Customer dengan ID ${id} tidak ditemukan`);
    }

    // Delete user (cascades to customer)
    await this.prisma.users.delete({
      where: { id: customer.user_id },
    });

    return {
      message: 'Customer berhasil dihapus',
    };
  }
}
