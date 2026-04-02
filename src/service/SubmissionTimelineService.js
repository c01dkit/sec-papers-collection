export const SubmissionTimelineService = {
    async getSubmissionTimeline() {
        if (import.meta.env.PROD) {
            const res = await fetch('https://raw.githubusercontent.com/c01dkit/sec-papers-collection/main/src/assets/data/submission-timeline.json?v=20260315');
            if (!res.ok) {
                throw new Error(`Failed to fetch submission timeline: ${res.status}`);
            }
            return await res.json();
        } else {
            const data = await import('@/assets/data/submission-timeline.json');
            return data.default;
        }
    }
};