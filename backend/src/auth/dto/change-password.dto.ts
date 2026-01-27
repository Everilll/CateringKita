import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Password lama wajib diisi' })
  old_password: string;

  @IsString()
  @MinLength(8, { message: 'Password baru minimal 8 karakter' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
    {
      message: 'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter spesial'
    }
  )
  @IsNotEmpty({ message: 'Password baru wajib diisi' })
  new_password: string;
}