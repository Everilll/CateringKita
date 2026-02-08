import { 
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  ValidateIf,
  Matches
} from 'class-validator';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR'
}

export class RegisterDto {
  @IsEmail({}, { message: 'Email tidak valid' })
  @IsNotEmpty({ message: 'Email wajib diisi' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
    {
      message: 'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter spesial'
    }
  )
  @IsNotEmpty({ message: 'Password wajib diisi' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama wajib diisi' })
  name: string;

  @IsEnum(UserRole, { message: 'Role harus USER atau VENDOR' })
  @IsNotEmpty({ message: 'Role wajib diisi' })
  role: UserRole;

  // Customer fields
  @ValidateIf(o => o.role === UserRole.CUSTOMER)
  @IsString()
  @IsNotEmpty({ message: 'Nomor telepon wajib diisi untuk customer' })
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  // Vendor fields
  @ValidateIf(o => o.role === UserRole.VENDOR)
  @IsString()
  @IsNotEmpty({ message: 'Nama vendor wajib diisi' })
  vendor_name?: string;

  @ValidateIf(o => o.role === UserRole.VENDOR)
  @IsString()
  @IsNotEmpty({ message: 'Alamat vendor wajib diisi' })
  vendor_address?: string;

  @ValidateIf(o => o.role === UserRole.VENDOR)
  @IsString()
  @IsNotEmpty({ message: 'Kota vendor wajib diisi' })
  vendor_city?: string;

  @ValidateIf(o => o.role === UserRole.VENDOR)
  @IsString()
  @IsNotEmpty({ message: 'Telepon vendor wajib diisi' })
  vendor_phone?: string;

  @IsString()
  @IsOptional()
  description?: string;
}