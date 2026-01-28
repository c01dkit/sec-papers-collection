export const AboutService = {
    updateTimelineData(locale = 'en') {
        const data = {
            en: [
                { status: 'v0.3.8', date: '2026-01-28',  content: ['Add SOSP 01-25', 'Add ASPLOS 15-25', 'Update conference categories and display trends by categories'] },
                { status: 'v0.3.7', date: '2026-01-07',  content: ['Add FSE 15-25, including short papers', 'Update CCS 15-25, only includes research papers'] },
                { status: 'v0.3.6', date: '2025-12-16',  content: ['Update CCS 25 and USENIX 25 Awards', 'Add paper count and status in `Home`'] },
                { status: 'v0.3.5', date: '2025-09-24',  content: ['Update USENIX Sec 25 (Cycle 2) and ACM CCS 25 (Cycle 2)'] },
                { status: 'v0.3.4', date: '2025-07-16',  content: ['Beautify `Awards` page', 'Adjust the position of cyber begging', 'Fix several translation error'] },
                { status: 'v0.3.3', date: '2025-07-02',  content: ['✨ Add multiple languages support', 'Add new category `Reputation`', 'Update submission timeline and add last sync remark', 'Other normal fixes'] },
                { status: 'v0.3.2', date: '2025-04-27',  content: ['Update abstract for CCS 24', 'Update cycle 2 for ICSE 2025', 'Update ISSTA 2025', 'Update cycle 2 for oakland 2025 (only titles currently)'] },
                { status: 'v0.3.1', date: '2025-03-04',  content: ['✨ Add paper awards', 'Fix paper/search load error in local development mode', 'Fix incomplete abstract for NDSS', 'Update NDSS-2025 (Fall Cycle)', 'Add afdian support plan in Chinese'] },
                { status: 'v0.3.0', date: '2025-01-21',  content: ['✨ Add paper submission timeline', 'Received the first support!', 'Add custom primary color support', 'Add dark mode support',  'Fix left sidebar following'] },
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
            ],
            zh: [
                { status: 'v0.3.8', date: '2026-01-28',  content: ['添加SOSP 01-25论文', '添加ASPLOS 15-25论文', '更新会议论文分组、录用趋势分组展示'] },
                { status: 'v0.3.7', date: '2026-01-07',  content: ['添加FSE 15-25论文（包括短论文）', '更新CCS 15-25状态，仅保留长论文'] },
                { status: 'v0.3.6', date: '2025-12-16',  content: ['更新CCS 25与USENIX 25获奖论文', '在`首页`增加了会议论文数量统计及统计状态汇总'] },
                { status: 'v0.3.5', date: '2025-09-24',  content: ['更新 USENIX Sec 25 第二轮和ACM CCS 25第二轮'] },
                { status: 'v0.3.4', date: '2025-07-16',  content: ['美化`获奖论文`页面展示形式', '调整赛博乞讨位置，从`首页`移至`关于`页', '修复少量文本翻译错误'] },
                { status: 'v0.3.3', date: '2025-07-02',  content: ['✨ 添加多语种支持','增加新分类`名望`', '更新提交时间线并添加最后同步备注', '其他常规修复'] },
                { status: 'v0.3.2', date: '2025-04-27',  content: ['更新 CCS 24 摘要', '更新 ICSE 2025 第二轮', '更新 ISSTA 2025', '更新 Oakland 2025 第二轮（目前仅标题）'] },
                { status: 'v0.3.1', date: '2025-03-04',  content: ['✨ 添加论文奖项', '修复本地开发模式论文搜索加载错误', '修复 NDSS 摘要不完整问题', '更新 NDSS-2025（秋季周期）', '添加爱发电支持计划（中文）'] },
                { status: 'v0.3.0', date: '2025-01-21',  content: ['✨ 添加论文提交时间线', '收到第一笔赞助！', '添加自定义主色调支持', '添加深色模式支持', '修复左侧边栏跟随'] },
                { status: 'v0.2.4', date: '2024-11-21',  content: ['更新 NDSS-2025（夏季周期）', '更新 ICSE-2025', '更新 Oakland-2025（第一轮）'] },
                { status: 'v0.2.3', date: '2024-10-11',  content: ['✨ 在"查看摘要"中添加摘要支持', '移除无用的 websocket 模块', '修复论文总数统计不一致问题'] },
                { status: 'v0.2.2', date: '2024-09-16',  content: ['支持 xplore 和 ACM 数据集分析器', '更新 ACM CCS 15~23 论文链接', '更新 ISSTA 和 ICSE 所有论文链接', '更新 IEEE S&P 所有论文链接', '调整反馈和接受位置', '支持通过 Google 表单反馈'] },
                { status: 'v0.2.1', date: '2024-09-03',  content: ['重写 main.py 以便更好理解', '添加支付宝和微信赞助二维码', '添加背景颜色', '支持一键自动标题复制', '支持更快加载（两阶段加载）在鸟瞰图中'] },
                { status: 'v0.2.0 里程碑', date: '2024-09-01',  content: ['使用 Vue3 重构网站', '归档之前的 mkdocs 版本', '开放 vue 版本的部分源代码', '添加 paypal 赞助链接'] },
                { status: 'v0.1.7', date: '2024-08-21',  content: ['更新 USENIX Sec-2024 (227->419) 和 ISSTA-2024 (42->143)'] },
                { status: 'v0.1.6', date: '2024-07-17',  content: ['更好的搜索：页面现在会滚动到搜索的论文并高亮显示链接'] },
                { status: 'v0.1.5', date: '2024-07-10',  content: ['添加已接受论文增长图表', '在页脚添加页面访问量支持', '合并 icse_2015-1 和 icse_2015-2'] },
                { status: 'v0.1.4', date: '2024-05-09',  content: ['添加 ISSTA-2024, USENIX Sec-2024-秋季周期', '现在支持使用相同 xpath 的多个 url'] },
                { status: 'v0.1.3', date: '2024-05-02',  content: ['添加 NDSS-2024, S&P-2024, USENIX Sec-2024-夏季周期', '更新 ICSE-2024'] },
                { status: 'v0.1.2', date: '2023-06-19',  content: ['添加 ICSE 和 ISSTA 支持', '更新 Oakland 2023'] },
                { status: 'v0.1.1', date: '2023-06-19',  content: ['添加 ICSE 和 ISSTA 支持', '更新 Oakland 2023'] },
                { status: 'v0.1.0', date: '2023-05-15',  content: ['首次发布 sec.c01dkit.com', '使用 mkdocs 作为网站生成器'] },
            ]
        };
        return data[locale] || data.en;
    },

    sponsorData() {
        return[
            { name: '爱发电用户_a3458', amount: '20 RMB', date: '2025-12-02', comment: '很有帮助的网站！（如果可以的话，希望之后可以再多加一些软工那边的会议）'},
            { name: 'cy', amount: '66 RMB', date: '2025-01-21', comment: ''},
            { name: 'k*j', amount: '20 RMB', date: '2025-01-21', comment: '感谢开发的secpaper网站，省了不少时间'},
        ]
    },

    getUpdateTimelineData(locale = 'en') {
        return Promise.resolve(this.updateTimelineData(locale));
    },

    getSponsorData() {
        return Promise.resolve(this.sponsorData());
    }
}