import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    // Check duplicate name
    const existing = await this.prisma.categories.findFirst({
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new ConflictException(`Kategori '${createCategoryDto.name}' sudah ada`);
    }

    const category = await this.prisma.categories.create({
      data: createCategoryDto,
    });

    return {
      message: 'Kategori berhasil dibuat',
      data: category,
    };
  }

  async findAll() {
    const categories = await this.prisma.categories.findMany({
      include: {
        _count: {
          select: { menus: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      data: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        created_at: cat.created_at,
        totalMenus: cat._count.menus,
      })),
      total: categories.length,
    };
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.prisma.categories.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Kategori dengan ID ${id} tidak ditemukan`);
    }

    // Check duplicate name if name is being updated
    if (updateCategoryDto.name) {
      const existing = await this.prisma.categories.findFirst({
        where: {
          name: updateCategoryDto.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(`Kategori '${updateCategoryDto.name}' sudah ada`);
      }
    }

    const updated = await this.prisma.categories.update({
      where: { id },
      data: updateCategoryDto,
    });

    return {
      message: 'Kategori berhasil diupdate',
      data: updated,
    };
  }

  async remove(id: number) {
    const category = await this.prisma.categories.findUnique({
      where: { id },
      include: {
        _count: { select: { menus: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Kategori dengan ID ${id} tidak ditemukan`);
    }

    if (category._count.menus > 0) {
      throw new ConflictException(
        `Kategori tidak bisa dihapus karena masih memiliki ${category._count.menus} menu`,
      );
    }

    await this.prisma.categories.delete({
      where: { id },
    });

    return {
      message: 'Kategori berhasil dihapus',
    };
  }
}
