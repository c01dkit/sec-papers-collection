export const SubmissionTimelineService = {
    async getSubmissionTimeline() {
        let fullDataPath;
        if (process.env.NODE_ENV === 'production') {
            fullDataPath = 'https://raw.githubusercontent.com/c01dkit/sec-papers-collection/main/src/assets/data/submission-timeline.json?v=20260315'
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