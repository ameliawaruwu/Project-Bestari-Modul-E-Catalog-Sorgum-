import { BannerSlide } from '../types/admin';
import { formatDate } from '../utils/formatDate';

/**
 * Map raw banner row (dari BE) -> BannerSlide (FE).
 * Satu sumber kebenaran — dipakai di hydrate & refresh banners.
 */
export function mapBannerRow(b: any): BannerSlide {
  return {
    id: String(b.id),
    title: b.title,
    titleEn: b.title_en || undefined,
    uploadDate: formatDate(b.created_at, 'short'),
    targetLink: b.target_link || '',
    image: b.image_url || '',
    active: !!b.is_active,
  };
}
