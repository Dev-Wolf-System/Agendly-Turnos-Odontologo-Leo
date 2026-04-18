import { IsString, IsOptional, IsBoolean, IsUrl, MinLength } from 'class-validator';

export class UpsertClinicaMpDto {
  @IsString()
  @MinLength(10)
  access_token: string;

  @IsOptional()
  @IsString()
  public_key?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  webhook_url?: string;

  @IsOptional()
  @IsBoolean()
  webhook_activo?: boolean;
}
