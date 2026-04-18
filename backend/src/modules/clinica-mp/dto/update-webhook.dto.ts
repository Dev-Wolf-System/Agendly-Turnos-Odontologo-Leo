import { IsOptional, IsBoolean, IsUrl, IsString } from 'class-validator';

export class UpdateWebhookDto {
  @IsOptional()
  @IsUrl({ require_tld: false })
  webhook_url?: string;

  @IsOptional()
  @IsBoolean()
  webhook_activo?: boolean;

  @IsOptional()
  @IsString()
  access_token?: string;
}
