import { CDN_DATA_BASE } from './cdn';

export const SubmissionTimelineService = {
    async getSubmissionTimeline() {
        if (import.meta.env.PROD) {
            const res = await fetch(`${CDN_DATA_BASE}/submission-timeline.json?v=20260416`);
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