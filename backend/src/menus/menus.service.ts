import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { QueryMenuDto } from './dto/query-menu.dto';
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
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      data: menus,
      total: menus.length,
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
          },
        },
        category: true,
      },
    });

    if (!menu) {
      throw new NotFoundException(`Menu dengan ID ${id} tidak ditemukan`);
    }

    return { data: menu };
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
}
