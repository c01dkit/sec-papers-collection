export const SubmissionTimelineService = {
    getData() {
        return [
            {
                publication: 'IEEE S&P 2026',
                timezone: '23:59:59 AoE (UTC-12)',
                url: 'https://sp2026.ieee-security.org/cfpapers.html',
                update: '2025-07-02',
                date: 'May 18-21, 2026',
                place: 'The Hilton San Francisco Union Square, San Francisco, CA, USA',
                cycles: [
                    {
                        name: 'Cycle 1',
                        ddls: [
                            {value:'1', stage:'Abstract registration deadline', date:'2025-05-29'},
                            {value:'2', stage:'Paper submission deadline', date:'2025-06-05'},
                            {value:'3', stage:'Early-reject notification', date:'2025-07-21'},
                            {value:'4', stage:'Rebuttal period (interactive)', date:'2025-08-18 ~ 2025-08-29'},
                            {value:'5', stage:'Rebuttal text due', date:'2025-08-25'},
                            {value:'6', stage:'Acceptance notification', date:'2025-09-09'},
                            {value:'7', stage:'Camera-ready deadline', date:'2025-10-17'},
                        ]
                    },
                    {
                        name: 'Cycle 2',
                        ddls: [
                            {value:'1', stage:'Abstract registration deadline', date:'2025-11-06'},
                            {value:'2', stage:'Paper submission deadline', date:'2025-11-13'},
                            {value:'3', stage:'Early-reject notification', date:'2026-01-19'},
                            {value:'4', stage:'Rebuttal period (interactive)', date:'2026-02-16 ~ 2026-02-27'},
                            {value:'5', stage:'Rebuttal text due', date:'2026-02-23'},
                            {value:'6', stage:'Acceptance notification', date:'2026-03-19'},
                            {value:'7', stage:'Camera-ready deadline', date:'2026-04-17'},
                        ]
                    }
                ]
            },
            {
                publication: "USENIX Security 2026",
                timezone: "Not clearly specified",
                url: 'https://www.usenix.org/conference/usenixsecurity26',
                update: '2025-07-29',
                date: 'August 12–14, 2026',
                place: 'Baltimore Marriott Waterfront in Baltimore, MD, USA',
                cycles: [
                    {
                        name: 'Cycle 1',
                        ddls: [
                            {value: "1", stage: "Mandatory registration", date: "2025-08-19"},
                            {value: "2", stage: "Paper submissions", date: "2025-08-26"},
                            {value: "3", stage: "Early reject notification", date: "2025-10-07"},
                            {value: "4", stage: "Rebuttal period", date: "2025-11-06 ~ 2025-11-13"},
                            {value: "5", stage: "Notification to authors", date: "2025-12-04"},
                            {value: "6", stage: "Shepherded approval due", date: "2025-12-18"},
                            {value: "7", stage: "Final papers due", date: "2026-01-15"}
                        ]
                    },
                    {
                        name: 'Cycle 2',
                        ddls: [
                            {value: "1", stage: "Mandatory registration", date: "2026-01-29"},
                            {value: "2", stage: "Paper submissions", date: "2026-02-05"},
                            {value: "3", stage: "Early reject notification", date: "2026-03-17"},
                            {value: "4", stage: "Rebuttal period", date: "2026-04-16 ~ 2026-04-23"},
                            {value: "5", stage: "Notification to authors", date: "2026-05-14"},
                            {value: "6", stage: "Shepherded approval due", date: "2026-05-28"},
                            {value: "7", stage: "Final papers due", date: "2026-06-11"}
                        ]
                    }
                ]
            },
            {
                publication: 'CCS 2026',
                timezone: '11:59 PM AoE (UTC-12)',
                url: 'https://www.sigsac.org/ccs/CCS2026/call-for/call-for-papers.html',
                update: '2025-12-07',
                date: 'November 15-19, 2026',
                place: 'The World Forum, The Hague, The Netherlands.',
                cycles: [
                    {
                        name: 'Cycle 1',
                        ddls: [
                            {value:'1', stage:'Abstract submission deadline', date:'2026-01-07'},
                            {value:'2', stage:'Full paper submission deadline', date:'2026-01-14'},
                            {value:'3', stage:'Notification of early-rejection papers', date:'2026-02-20'},
                            {value:'4', stage:'Author rebuttal period', date:'2026-03-17 ~ 2026-03-20'},
                            {value:'5', stage:'Rebuttal deadline', date:'2026-03-20'},
                            {value:'6', stage:'Author notification', date:'2026-04-09'},
                            {value:'7', stage:'Minor revision approval deadline', date:'2026-06-05'},
                            {value:'8', stage:'Camera ready deadline', date:'2026-08-21'},
                        ]
                    },
                    {
                        name: 'Cycle 2',
                        ddls: [
                            {value:'1', stage:'Abstract submission deadline', date:'2026-04-22'},
                            {value:'2', stage:'Full paper submission deadline', date:'2026-04-29'},
                            {value:'3', stage:'Notification of early-rejection papers', date:'2026-06-03'},
                            {value:'4', stage:'Author rebuttal period', date:'2026-06-29 ~ 2026-07-01'},
                            {value:'5', stage:'Rebuttal deadline', date:'2026-07-01'},
                            {value:'6', stage:'Author notification', date:'2026-07-17'},
                            {value:'7', stage:'Minor revision approval deadline', date:'2026-09-06'},
                            {value:'8', stage:'Camera ready deadline', date:'2026-09-17'},
                        ]
                    }
                ]
            },
            {
                publication: "NDSS 2026",
                timezone: "11:59 PM AoE (UTC-12)",
                url: "https://www.ndss-symposium.org/ndss2026/submissions/call-for-papers/",
                update: '2025-07-02',
                date: 'February 23-27',
                place: 'San Diego, California, USA',
                cycles: [
                    {
                        name: 'Summer Cycle',
                        ddls: [
                            // {value: '1', stage: "Title and abstract registration deadline (mandatory)", date: "2025-04-16"},
                            {value: '1', stage: "Paper submission deadline", date: "2025-04-23"},
                            {value: '2', stage: "Early reject/Round 2 notification and Round 1 reviews", date: "2025-05-28"},
                            {value: '3', stage: "Author rebuttal", date: "2025-06-18 ~ 2025-06-20"},
                            {value: '4', stage: "Interactive discussion with reviewers", date: "2025-06-18 ~ 2025-06-25"},
                            {value: '5', stage: "Author notification", date: "2025-07-02"},
                            {value: '6', stage: "Resubmission of Major Revision papers, Minor Revision decision", date: "2025-07-30"},
                            {value: '7', stage: "Author notification for Major Revision", date: "2025-08-13"},
                            {value: '8', stage: "Camera Ready deadline", date: "2025-09-10"}
                        ]
                    },
                    {
                        name: 'Fall Cycle',
                        ddls: [
                            // {value: '1', stage: "Title and abstract registration deadline (mandatory)", date: "2025-07-30"},
                            {value: '1', stage: "Paper submission deadline", date: "2025-08-06"},
                            {value: '2', stage: "Early reject/Round 2 notification and Round 1 reviews", date: "2025-09-17"},
                            {value: '3', stage: "Author rebuttal", date: "2025-10-08 ~ 2025-10-10"},
                            {value: '4', stage: "Interactive discussion with reviewers", date: "2025-10-08 ~ 2025-10-15"},
                            {value: '5', stage: "Author notification", date: "2025-10-22"},
                            {value: '6', stage: "Resubmission of Major Revision papers, Minor Revision decision", date: "2025-11-19"},
                            {value: '7', stage: "Author notification for Major Revision", date: "2025-12-03"},
                            {value: '8', stage: "Camera Ready deadline", date: "2025-12-17"}
                        ]
                    }
                ]
            },
        ]
    },

    getSubmissionTimeline() {
        return Promise.resolve(this.getData())
    }
}