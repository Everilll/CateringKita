import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';

// Valid status transitions for vendor
const STATUS_FLOW: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'on_delivery',
  on_delivery: 'delivered',
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createOrderDto: CreateOrderDto) {
    // Find customer by user_id
    const customer = await this.prisma.customers.findUnique({
      where: { user_id: userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile tidak ditemukan');
    }

    // Validate vendor exists
    const vendor = await this.prisma.vendors.findUnique({
      where: { id: createOrderDto.vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor tidak ditemukan');
    }

    if (!vendor.is_active) {
      throw new BadRequestException('Vendor sedang tidak aktif');
    }

    // Validate all menus belong to the vendor and are available
    const menuIds = createOrderDto.items.map((item) => item.menuId);
    const menus = await this.prisma.menus.findMany({
      where: {
        id: { in: menuIds },
        vendor_id: vendor.id,
      },
    });

    if (menus.length !== menuIds.length) {
      throw new BadRequestException('Beberapa menu tidak ditemukan atau bukan milik vendor ini');
    }

    const unavailable = menus.filter((m) => !m.available);
    if (unavailable.length > 0) {
      throw new BadRequestException(
        `Menu tidak tersedia: ${unavailable.map((m) => m.name).join(', ')}`,
      );
    }

    // Calculate totals
    const orderItems = createOrderDto.items.map((item) => {
      const menu = menus.find((m) => m.id === item.menuId)!;
      const subtotal = Number(menu.price) * item.quantity;
      return {
        menu_id: item.menuId,
        quantity: item.quantity,
        price: menu.price,
        subtotal,
      };
    });

    const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const deliveryFee = createOrderDto.delivery_fee ?? 0;

    // Create order with items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.orders.create({
        data: {
          customer_id: customer.id,
          vendor_id: vendor.id,
          total: total + deliveryFee,
          delivery_fee: deliveryFee,
          notes: createOrderDto.notes,
          order_items: {
            create: orderItems,
          },
        },
        include: {
          order_items: {
            include: {
              menu: { select: { id: true, name: true, image_url: true } },
            },
          },
          vendor: { select: { id: true, name: true } },
        },
      });

      return created;
    });

    return {
      message: 'Order berhasil dibuat',
      data: order,
    };
  }

  async findAll(userId: number, role: string) {
    let whereClause = {};

    if (role === 'CUSTOMER') {
      const customer = await this.prisma.customers.findUnique({
        where: { user_id: userId },
      });
      if (!customer) {
        throw new NotFoundException('Customer profile tidak ditemukan');
      }
      whereClause = { customer_id: customer.id };
    } else if (role === 'VENDOR') {
      const vendor = await this.prisma.vendors.findUnique({
        where: { user_id: userId },
      });
      if (!vendor) {
        throw new NotFoundException('Vendor profile tidak ditemukan');
      }
      whereClause = { vendor_id: vendor.id };
    }

    const orders = await this.prisma.orders.findMany({
      where: whereClause,
      include: {
        customer: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        vendor: { select: { id: true, name: true } },
        order_items: {
          include: {
            menu: { select: { id: true, name: true, image_url: true } },
          },
        },
        payment: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      data: orders,
      total: orders.length,
    };
  }

  async findOne(id: number, userId: number, role: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            user_id: true,
            address: true,
            phone: true,
          },
        },
        order_items: {
          include: {
            menu: {
              select: { id: true, name: true, price: true, image_url: true },
            },
          },
        },
        payment: true,
        review: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order dengan ID ${id} tidak ditemukan`);
    }

    // Check access: customer owns order, vendor owns order, or admin
    if (role === 'CUSTOMER' && order.customer.user.id !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke order ini');
    }
    if (role === 'VENDOR' && order.vendor.user_id !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke order ini');
    }

    return { data: order };
  }

  async updateStatus(id: number, userId: number, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.orders.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!order) {
      throw new NotFoundException(`Order dengan ID ${id} tidak ditemukan`);
    }

    // Only vendor owner can update status
    if (order.vendor.user_id !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah status order ini');
    }

    // Validate status flow
    const expectedNext = STATUS_FLOW[order.status];
    if (!expectedNext) {
      throw new BadRequestException(`Order dengan status '${order.status}' tidak bisa diubah`);
    }
    if (dto.status !== expectedNext) {
      throw new BadRequestException(
        `Status tidak valid. Dari '${order.status}' hanya bisa ke '${expectedNext}'`,
      );
    }

    const updated = await this.prisma.orders.update({
      where: { id },
      data: { status: dto.status },
      include: {
        customer: {
          include: { user: { select: { name: true, email: true } } },
        },
        vendor: { select: { id: true, name: true } },
        order_items: {
          include: {
            menu: { select: { id: true, name: true } },
          },
        },
      },
    });

    return {
      message: `Status order berhasil diubah ke '${dto.status}'`,
      data: updated,
    };
  }

  async cancel(id: number, userId: number, role: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id },
      include: {
        customer: { include: { user: true } },
        vendor: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order dengan ID ${id} tidak ditemukan`);
    }

    // Check access
    if (role === 'CUSTOMER' && order.customer.user.id !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk membatalkan order ini');
    }
    if (role === 'VENDOR' && order.vendor.user_id !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk membatalkan order ini');
    }

    // Customer can only cancel if pending
    if (role === 'CUSTOMER' && order.status !== 'pending') {
      throw new BadRequestException(
        'Order hanya bisa dibatalkan jika masih berstatus pending',
      );
    }

    // Vendor can cancel if pending or confirmed
    if (role === 'VENDOR' && !['pending', 'confirmed'].includes(order.status)) {
      throw new BadRequestException(
        'Order hanya bisa dibatalkan jika berstatus pending atau confirmed',
      );
    }

    const updated = await this.prisma.orders.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return {
      message: 'Order berhasil dibatalkan',
      data: updated,
    };
  }
}
