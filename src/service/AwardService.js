export const AwardService = {
    async getAward() {
        if (import.meta.env.PROD) {
            const res = await fetch('https://raw.githubusercontent.com/c01dkit/sec-papers-collection/main/src/assets/data/awards.json?v=20260315');
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