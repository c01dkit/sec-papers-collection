export const AwardService = {
    async getAward() {
        let fullDataPath;
        if (process.env.NODE_ENV === 'production') {
            fullDataPath = 'https://raw.githubusercontent.com/c01dkit/sec-papers-collection/main/src/assets/data/awards.json?v=20260315'
        } else {
            fullDataPath = '../src/assets/data/data.json'
        }
        const res = await fetch(fullDataPath);
        if (!res.ok) {
            throw new Error(`Failed to fetch awards: ${res.status}`);
        }
        return await res.json();
    }
};