export const SubmissionTimelineService = {
    getData() {
        return [
            {
                publication: 'IEEE S&P 2025',
                timezone: '23:59:59 AoE (UTC-12)',
                url: 'https://sp2025.ieee-security.org/cfpapers.html',
                date: 'May 12-15, 2025',
                place: 'The Hyatt Regency San Francisco, San Francisco, CA, USA',
                cycles: [
                    {
                        name: 'Cycle 1',
                        ddls: [
                            {value:'1', stage:'Paper submission deadline', date:'2024-06-06'},
                            {value:'2', stage:'Early-reject notification', date:'2024-07-22'},
                            {value:'3', stage:'Rebuttal period (interactive)', date:'2024-08-19 ~ 2024-08-30'},
                            {value:'4', stage:'Rebuttal text due', date:'2024-08-26'},
                            {value:'5', stage:'Acceptance notification', date:'2024-09-09'},
                            {value:'6', stage:'Camera-ready deadline', date:'2024-10-18'},
                        ]
                    },
                    {
                        name: 'Cycle 2',
                        ddls: [
                            {value:'1', stage:'Paper submission deadline', date:'2024-11-14'},
                            {value:'2', stage:'Early-reject notification', date:'2025-01-20'},
                            {value:'3', stage:'Rebuttal period (interactive)', date:'2025-02-17 ~ 2025-02-28'},
                            {value:'4', stage:'Rebuttal text due', date:'2025-02-24'},
                            {value:'5', stage:'Acceptance notification', date:'2025-03-10'},
                            {value:'6', stage:'Camera-ready deadline', date:'2025-04-18'},
                        ]
                    }
                ]
            },
            {
                publication: 'IEEE S&P 2026',
                timezone: '23:59:59 AoE (UTC-12)',
                url: 'https://sp2026.ieee-security.org/cfpapers.html',
                date: 'May 18-21, 2026',
                place: 'The Hilton San Francisco Union Square, San Francisco, CA, USA',
                cycles: [
                    {
                        name: 'Cycle 1',
                        ddls: [
                            {value:'1', stage:'Paper submission deadline', date:'2025-06-05'},
                            {value:'2', stage:'Early-reject notification', date:'2025-07-21'},
                            {value:'3', stage:'Rebuttal period (interactive)', date:'2025-08-18 ~ 2025-08-29'},
                            {value:'4', stage:'Rebuttal text due', date:'2025-08-25'},
                            {value:'5', stage:'Acceptance notification', date:'2025-09-09'},
                            {value:'6', stage:'Camera-ready deadline', date:'2025-10-17'},
                        ]
                    },
                    {
                        name: 'Cycle 2',
                        ddls: [
                            {value:'1', stage:'Paper submission deadline', date:'2025-11-13'},
                            {value:'2', stage:'Early-reject notification', date:'2026-01-19'},
                            {value:'3', stage:'Rebuttal period (interactive)', date:'2026-02-16 ~ 2026-02-27'},
                            {value:'4', stage:'Rebuttal text due', date:'2026-02-23'},
                            {value:'5', stage:'Acceptance notification', date:'2026-03-19'},
                            {value:'6', stage:'Camera-ready deadline', date:'2026-04-17'},
                        ]
                    }
                ]
            },
            {
                publication: "USENIX Security 2025",
                timezone: "Not clearly specified",
                url: 'https://www.usenix.org/conference/usenixsecurity25/call-for-papers',
                date: 'August 13-15, 2025',
                place: 'Seattle Convention Center in Seattle, WA, USA',
                cycles: [
                    {
                        name: 'Cycle 1',
                        ddls: [
                            {value: "1", stage: "Paper submission deadline", date: "2024-09-04"},
                            {value: "2", stage: "Early-reject notification", date: "2024-10-15"},
                            {value: "3", stage: "Rebuttal period", date: "2024-11-18 ~ 2024-11-25"},
                            {value: "4", stage: "Notification to authors", date: "2024-12-11"},
                            {value: "5", stage: "Shepherding/revision period", date: "2024-12-12 ~ 2025-01-16"},
                            {value: "6", stage: "Artifacts due for availability verification", date: "2025-01-16"},
                            {value: "7", stage: "Shepherding/revision author notification", date: "2025-01-23"},
                            {value: "8", stage: "Final papers due", date: "2025-01-30"}
                        ]
                    },
                    {
                        name: 'Cycle 2',
                        ddls: [
                            {value: "1", stage: "Paper submission deadline", date: "2025-01-22"},
                            {value: "2", stage: "Early-reject notification", date: "2025-03-04"},
                            {value: "3", stage: "Rebuttal period", date: "2025-04-07 ~ 2025-04-14"},
                            {value: "4", stage: "Notification to authors", date: "2025-04-30"},
                            {value: "5", stage: "Shepherding/revision period", date: "2025-05-01 ~ 2025-05-29"},
                            {value: "6", stage: "Artifacts due for availability verification", date: "2025-05-29"},
                            {value: "7", stage: "Shepherding/revision author notification", date: "2025-06-05"},
                            {value: "8", stage: "Final papers due", date: "2025-06-12" }
                        ]
                    }
                ]
            },
            {
                publication: 'CCS 2025',
                timezone: '11:59 PM AoE (UTC-12)',
                url: 'https://www.sigsac.org/ccs/CCS2025/call-for-papers/',
                date: 'October 13-17, 2025',
                place: 'Taipei, Taiwan, China',
                cycles: [
                    {
                        name: 'Cycle 1',
                        ddls: [
                            {value:'1', stage:'Abstract submission deadline', date:'2025-01-02'},
                            {value:'2', stage:'Full paper submission deadline', date:'2025-01-09'},
                            {value:'3', stage:'Notification of early-rejection papers', date:'2025-02-10'},
                            {value:'4', stage:'Author rebuttal period', date:'2025-03-03'},
                            {value:'5', stage:'Rebuttal deadline', date:'2025-03-06'},
                            {value:'6', stage:'Author notification', date:'2025-03-28'},
                        ]
                    },
                    {
                        name: 'Cycle 2',
                        ddls: [
                            {value:'1', stage:'Abstract submission deadline', date:'2025-04-07'},
                            {value:'2', stage:'Full paper submission deadline', date:'2025-04-14'},
                            {value:'3', stage:'Notification of early-rejection papers', date:'2025-05-16'},
                            {value:'4', stage:'Author rebuttal period', date:'2025-06-05'},
                            {value:'5', stage:'Rebuttal deadline', date:'2025-06-08'},
                            {value:'6', stage:'Author notification', date:'2025-07-01'},
                        ]
                    }
                ]
            },
            {
                publication: "NDSS 2025",
                timezone: "11:59 PM AoE (UTC-12)",
                url: "https://www.ndss-symposium.org/ndss2025/submissions/call-for-papers/",
                date: 'February 24-28',
                place: 'Wyndham San Diego Bayside, San Diego, California, USA',
                cycles: [
                    {
                        name: 'Summer Cycle',
                        ddls: [
                            {value: '1', stage: "Paper submission deadline", date: "2024-04-17"},
                            {value: '2', stage: "Early reject/Round 2 notification and Round 1 reviews", date: "2024-05-21"},
                            {value: '3', stage: "Author rebuttal", date: "2024-06-10 ~ 2024-06-13"},
                            {value: '4', stage: "Interactive discussion with reviewers", date: "2024-06-10 ~ 2024-06-18"},
                            {value: '5', stage: "Author notification", date: "2024-06-20"},
                            {value: '6', stage: "Resubmission of Major Revision papers, Minor Revision decision", date: "2024-08-07"},
                            {value: '7', stage: "Author notification for Major Revision", date: "2024-08-29"},
                            {value: '8', stage: "Camera Ready deadline", date: "2024-09-12"}
                        ]
                    },
                    {
                        name: 'Fall Cycle',
                        ddls: [
                            {value: '1', stage: "Paper submission deadline", date: "2024-07-10"},
                            {value: '2', stage: "Early reject/Round 2 notification and Round 1 reviews", date: "2024-08-20"},
                            {value: '3', stage: "Author rebuttal", date: "2024-09-09 ~ 2024-09-13"},
                            {value: '4', stage: "Interactive discussion with reviewers", date: "2024-09-09 ~ 2024-09-17"},
                            {value: '5', stage: "Author notification", date: "2024-09-19"},
                            {value: '6', stage: "Resubmission of Major Revision papers, Minor Revision decision", date: "2024-10-30"},
                            {value: '7', stage: "Author notification for Major Revision", date: "2024-11-21"},
                            {value: '8', stage: "Camera Ready deadline", date: "2024-12-05"}
                        ]
                    }
                ]
            }

        ]
    },

    getSubmissionTimeline() {
        return Promise.resolve(this.getData())
    }
}