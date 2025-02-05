export const AboutService = {
    updateTimelineData() {
        return [
            { status: 'v0.3.0', date: '2025-01-21',  content: ['Received the first support!', 'Add custom primary color support', 'Add dark mode support', '✨ Add paper submission timeline', 'Fix left sidebar following'] },
            { status: 'v0.2.4', date: '2024-11-21',  content: ['Update NDSS-2025 (Summer Cycle)','Update ICSE-2025', 'Update Oakland-2025 (First Round)'] },
            { status: 'v0.2.3', date: '2024-10-11',  content: ['✨ Add abstract support in "View Abstract".','Remove useless websocket module.','Fix the inconsistency of total papers number count.'] },
            { status: 'v0.2.2', date: '2024-09-16',  content: ['Support analyzer for xplore and ACM dataset.','Update paper links for ACM CCS 15~23.','Update all paper links for ISSTA and ICSE.','Update all paper links for IEEE S&P.','Adjust feedback and acceptance positions.','Support feedback via Google form.'] },
            { status: 'v0.2.1', date: '2024-09-03',  content: ['Rewrite main.py for better understanding.','Add ali and wechat sponsor QR code.', 'Add background color.','Support one-click auto title copy.','Support quicker load (two-phase load) in Birdview.'] },
            { status: 'v0.2.0 Milestone', date: '2024-09-01',  content: ['Reconstruct the website with Vue3.', 'Archive previous mkdocs version.', 'Open partial source code of the vue version.', 'Add paypal sponsor link.'] },
            { status: 'v0.1.7', date: '2024-08-21',  content: ['Update USENIX Sec-2024 (227->419) and ISSTA-2024 (42->143).'] },
            { status: 'v0.1.6', date: '2024-07-17',  content: ['Better search: now the page will scroll to the paper under search and highlight the url link.'] },
            { status: 'v0.1.5', date: '2024-07-10',  content: ['Add accepted-paper growth figures.','Add page view support in footer.','Merge icse_2015-1 and icse_2015-2.'] },
            { status: 'v0.1.4', date: '2024-05-09',  content: ['Add ISSTA-2024, USENIX Sec-2024-Fall cycle.','Support multiple urls with the same xpath now.'] },
            { status: 'v0.1.3', date: '2024-05-02',  content: ['Add NDSS-2024, S&P-2024, USENIX Sec-2024-Summer cycle.','Update ICSE-2024.'] },
            { status: 'v0.1.2', date: '2023-06-19',  content: ['Add ICSE and ISSTA support.','Update Oakland 2023.'] },
            { status: 'v0.1.1', date: '2023-06-19',  content: ['Add ICSE and ISSTA support.', 'Update Oakland 2023.'] },
            { status: 'v0.1.0', date: '2023-05-15',  content: ['First time to publish sec.c01dkit.com.','Use mkdocs as website generator.'] },
        ]
    },

    sponsorData() {
        return[
            { name: 'cy', amount: '66', date: '2025-01-21', comment: ''},
            { name: 'k*j', amount: '20', date: '2025-01-21', comment: '感谢开发的secpaper网站，省了不少时间'},
        ]
    },

    getUpdateTimelineData() {
        return Promise.resolve(this.updateTimelineData());
    },

    getSponsorData() {
        return Promise.resolve(this.sponsorData());
    }
}