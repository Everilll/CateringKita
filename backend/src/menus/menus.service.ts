import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { QueryMenuDto } from './dto/query-menu.dto';
import { CreateMenuRatingDto } from './dto/create-menu-rating.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createMenuDto: CreateMenuDto) {
    // Find vendor by user_id
    const vendor = await this.prisma.vendors.findUnique({
      where: { user_id: userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile tidak ditemukan');
    }

    // Validate category if provided
    if (createMenuDto.categoryId) {
      const category = await this.prisma.categories.findUnique({
        where: { id: createMenuDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Kategori dengan ID ${createMenuDto.categoryId} tidak ditemukan`);
      }
    }

    const { categoryId, ...rest } = createMenuDto;

    const menu = await this.prisma.menus.create({
      data: {
        ...rest,
        vendor_id: vendor.id,
        category_id: categoryId ?? null,
      },
      include: {
        vendor: { select: { id: true, name: true } },
        category: true,
      },
    });

    return {
      message: 'Menu berhasil dibuat',
      data: menu,
    };
  }

  async findAll(query: QueryMenuDto) {
    const { vendorId, categoryId, minPrice, maxPrice, search } = query;

    const menus = await this.prisma.menus.findMany({
      where: {
        ...(vendorId && { vendor_id: vendorId }),
        ...(categoryId && { category_id: categoryId }),
        ...(search && {
          name: { contains: search },
        }),
        ...((minPrice !== undefined || maxPrice !== undefined) && {
          price: {
            ...(minPrice !== undefined && { gte: minPrice }),
            ...(maxPrice !== undefined && { lte: maxPrice }),
          },
        }),
      },
      include: {
        vendor: { select: { id: true, name: true, city: true } },
        category: { select: { id: true, name: true } },
        menu_ratings: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formattedMenus = menus.map((menu) => {
      const avgRating =
        menu.menu_ratings.length > 0
          ? menu.menu_ratings.reduce((sum, row) => sum + row.rating, 0) / menu.menu_ratings.length
          : 0;

      return {
        ...menu,
        avgRating: Number(avgRating.toFixed(1)),
        totalRatings: menu.menu_ratings.length,
      };
    });

    return {
      data: formattedMenus,
      total: formattedMenus.length,
    };
  }

  async findOne(id: number) {
    const menu = await this.prisma.menus.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            phone: true,
            image_url: true,
            banner_url: true,
          },
        },
        category: true,
        menu_ratings: {
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
      },
    });

    if (!menu) {
      throw new NotFoundException(`Menu dengan ID ${id} tidak ditemukan`);
    }

    const avgRating =
      menu.menu_ratings.length > 0
        ? menu.menu_ratings.reduce((sum, row) => sum + row.rating, 0) / menu.menu_ratings.length
        : 0;

    return {
      data: {
        ...menu,
        avgRating: Number(avgRating.toFixed(1)),
        totalRatings: menu.menu_ratings.length,
        ratings: menu.menu_ratings.map((row) => ({
          id: row.id,
          rating: row.rating,
          comment: row.comment,
          created_at: row.created_at,
          customerName: row.customer.user.name,
        })),
      },
    };
  }

  async update(id: number, userId: number, updateMenuDto: UpdateMenuDto) {
    const menu = await this.prisma.menus.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!menu) {
      throw new NotFoundException(`Menu dengan ID ${id} tidak ditemukan`);
    }

    // Check ownership
    if (menu.vendor.user_id !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengupdate menu ini');
    }

    // Validate category if provided
    if (updateMenuDto.categoryId) {
      const category = await this.prisma.categories.findUnique({
        where: { id: updateMenuDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Kategori dengan ID ${updateMenuDto.categoryId} tidak ditemukan`);
      }
    }

    const { categoryId, ...rest } = updateMenuDto;

    const updated = await this.prisma.menus.update({
      where: { id },
      data: {
        ...rest,
        ...(categoryId !== undefined && { category_id: categoryId }),
      },
      include: {
        vendor: { select: { id: true, name: true } },
        category: true,
      },
    });

    return {
      message: 'Menu berhasil diupdate',
      data: updated,
    };
  }

  async remove(id: number, userId: number) {
    const menu = await this.prisma.menus.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!menu) {
      throw new NotFoundException(`Menu dengan ID ${id} tidak ditemukan`);
    }

    // Check ownership
    if (menu.vendor.user_id !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus menu ini');
    }

    await this.prisma.menus.delete({
      where: { id },
    });

    return {
      message: 'Menu berhasil dihapus',
    };
  }

  async toggleAvailable(id: number, userId: number) {
    const menu = await this.prisma.menus.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!menu) {
      throw new NotFoundException(`Menu dengan ID ${id} tidak ditemukan`);
    }

    // Check ownership
    if (menu.vendor.user_id !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah status menu ini');
    }

    const updated = await this.prisma.menus.update({
      where: { id },
      data: { available: !menu.available },
      include: {
        vendor: { select: { id: true, name: true } },
        category: true,
      },
    });

    return {
      message: `Menu berhasil di-${updated.available ? 'aktifkan' : 'nonaktifkan'}`,
      data: updated,
    };
  }

  async findMenuRatings(menuId: number) {
    const menu = await this.prisma.menus.findUnique({
      where: { id: menuId },
      select: { id: true, name: true },
    });

    if (!menu) {
      throw new NotFoundException(`Menu dengan ID ${menuId} tidak ditemukan`);
    }

    const ratings = await this.prisma.menu_ratings.findMany({
      where: { menu_id: menuId },
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
      orderBy: { created_at: 'desc' },
    });

    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, row) => sum + row.rating, 0) / ratings.length
        : 0;

    return {
      menu,
      avgRating: Number(avgRating.toFixed(1)),
      totalRatings: ratings.length,
      data: ratings.map((row) => ({
        id: row.id,
        rating: row.rating,
        comment: row.comment,
        created_at: row.created_at,
        customerName: row.customer.user.name,
      })),
    };
  }

  async rateMenu(userId: number, menuId: number, dto: CreateMenuRatingDto) {
    const customer = await this.prisma.customers.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile tidak ditemukan');
    }

    const menu = await this.prisma.menus.findUnique({
      where: { id: menuId },
      select: { id: true, name: true },
    });

    if (!menu) {
      throw new NotFoundException(`Menu dengan ID ${menuId} tidak ditemukan`);
    }

    const rating = await this.prisma.menu_ratings.upsert({
      where: {
        customer_id_menu_id: {
          customer_id: customer.id,
          menu_id: menuId,
        },
      },
      update: {
        rating: dto.rating,
        comment: dto.comment,
      },
      create: {
        customer_id: customer.id,
        menu_id: menuId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    return {
      message: `Rating menu ${menu.name} berhasil disimpan`,
      data: rating,
    };
  }
}
