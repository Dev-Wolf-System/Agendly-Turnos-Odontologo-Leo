import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../../modules/subscriptions/entities/subscription.entity';
import { EstadoSubscription } from '../enums/estado-subscription.enum';

interface CacheEntry {
  features: Record<string, boolean>;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

@Injectable()
export class FeatureFlagService {
  private cache = new Map<string, CacheEntry>();

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
  ) {}

  async getFeaturesForClinica(clinicaId: string): Promise<Record<string, boolean>> {
    const cached = this.cache.get(clinicaId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.features;
    }

    const subscription = await this.subscriptionRepo.findOne({
      where: { clinica_id: clinicaId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });

    if (!subscription || !subscription.plan) {
      return {};
    }

    const estadosActivos = [
      EstadoSubscription.ACTIVA,
    ];

    if (!estadosActivos.includes(subscription.estado)) {
      return {};
    }

    const features = subscription.plan.features ?? {};

    this.cache.set(clinicaId, {
      features,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return features;
  }

  async isEnabled(clinicaId: string, featureKey: string): Promise<boolean> {
    const features = await this.getFeaturesForClinica(clinicaId);
    return features[featureKey] === true;
  }

  invalidateCache(clinicaId: string): void {
    this.cache.delete(clinicaId);
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}
