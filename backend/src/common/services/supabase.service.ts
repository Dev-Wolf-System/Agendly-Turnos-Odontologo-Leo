import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!url || !serviceRoleKey) {
      throw new Error(
        'SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos',
      );
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
