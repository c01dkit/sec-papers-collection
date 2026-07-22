import { CDN_DATA_BASE } from './cdn';

export const AwardService = {
    async getAward() {
        if (import.meta.env.PROD) {
            const res = await fetch(`${CDN_DATA_BASE}/awards.json?v=20260606`);
            if (!res.ok) {
                throw new Error(`Failed to fetch awards: ${res.status}`);
            }
            return await res.json();
        } else {
            const data = await import('@/assets/data/awards.json');
            return data.default;
        }
    }
};
