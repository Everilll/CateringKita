import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryVendorDto) {
    const { city, minRating } = query;

    // Get vendors with optional filters
    const vendors = await this.prisma.vendors.findMany({
      where: {
        is_active: true,
        ...(city && { city }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            menus: true,
            orders: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Calculate average rating and filter by minRating
    const vendorsWithRating = vendors
      .map((vendor) => {
        const avgRating =
          vendor.reviews.length > 0
            ? vendor.reviews.reduce((sum, r) => sum + r.rating, 0) / vendor.reviews.length
            : 0;

        return {
          id: vendor.id,
          user_id: vendor.user_id,
          name: vendor.name,
          description: vendor.description,
          address: vendor.address,
          city: vendor.city,
          phone: vendor.phone,
          image_url: vendor.image_url,
          is_active: vendor.is_active,
          created_at: vendor.created_at,
          updated_at: vendor.updated_at,
          user: vendor.user,
          avgRating: Number(avgRating.toFixed(1)),
          totalReviews: vendor.reviews.length,
          totalMenus: vendor._count.menus,
          totalOrders: vendor._count.orders,
        };
      })
      .filter((vendor) => !minRating || vendor.avgRating >= minRating);

    return {
      data: vendorsWithRating,
      total: vendorsWithRating.length,
    };
  }

  async findOne(id: number) {
    const vendor = await this.prisma.vendors.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        menus: {
          where: {
            available: true,
          },
          include: {
            category: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
        reviews: {
          include: {
            customer: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            menus: true,
            orders: true,
            reviews: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor dengan ID ${id} tidak ditemukan`);
    }

    // Calculate average rating
    const avgRating =
      vendor.reviews.length > 0
        ? vendor.reviews.reduce((sum, r) => sum + r.rating, 0) / vendor.reviews.length
        : 0;

    // Format reviews
    const formattedReviews = vendor.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      customerName: review.customer.user.name,
    }));

    return {
      ...vendor,
      avgRating: Number(avgRating.toFixed(1)),
      totalReviews: vendor._count.reviews,
      reviews: formattedReviews,
    };
  }

  async update(userId: number, updateVendorDto: UpdateVendorDto) {
    // Find vendor by user_id
    const vendor = await this.prisma.vendors.findUnique({
      where: { user_id: userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile tidak ditemukan');
    }

    // Update vendor
    const updatedVendor = await this.prisma.vendors.update({
      where: { id: vendor.id },
      data: updateVendorDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return {
      message: 'Vendor berhasil diupdate',
      data: updatedVendor,
    };
  }

  async remove(id: number) {
    // Check if vendor exists
    const vendor = await this.prisma.vendors.findUnique({
      where: { id },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor dengan ID ${id} tidak ditemukan`);
    }

    // Delete vendor (will cascade to related data)
    await this.prisma.vendors.delete({
      where: { id },
    });

    return {
      message: 'Vendor berhasil dihapus',
    };
  }

  async findVendorMenus(id: number) {
    // Check if vendor exists
    const vendor = await this.prisma.vendors.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor dengan ID ${id} tidak ditemukan`);
    }

    const menus = await this.prisma.menus.findMany({
      where: {
        vendor_id: id,
      },
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      vendor: vendor,
      data: menus,
      total: menus.length,
    };
  }

  async findVendorOrders(userId: number) {
    // Find vendor by user_id
    const vendor = await this.prisma.vendors.findUnique({
      where: { user_id: userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile tidak ditemukan');
    }

    // Get orders
    const orders = await this.prisma.orders.findMany({
      where: {
        vendor_id: vendor.id,
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        order_items: {
          include: {
            menu: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Calculate statistics
    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === 'pending').length,
      confirmedOrders: orders.filter((o) => o.status === 'confirmed').length,
      preparingOrders: orders.filter((o) => o.status === 'preparing').length,
      readyOrders: orders.filter((o) => o.status === 'ready').length,
      onDeliveryOrders: orders.filter((o) => o.status === 'on_delivery').length,
      deliveredOrders: orders.filter((o) => o.status === 'delivered').length,
      cancelledOrders: orders.filter((o) => o.status === 'cancelled').length,
      totalRevenue: orders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + Number(o.total), 0),
    };

    return {
      vendor: {
        id: vendor.id,
        name: vendor.name,
      },
      statistics: stats,
      data: orders,
    };
  }
}
