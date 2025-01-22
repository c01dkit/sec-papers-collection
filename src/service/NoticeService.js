export const NoticeService = {
    getData() {
        return [
            {date:'2024-12-04',title:'服务器重启通知',content:'G10服务器显卡资源泄露，计划今晚20:00重启服务器。'},
            {date:'2024-11-17',title:'服务器可用性变更通知',content:'F3服务器恢复为原先Linux系统。'},
            {date:'2024-10-18',title:'扩容通知',content:'G10服务器加装4块机械硬盘，服务器在/storage下扩容21T存储空间。使用时，请先在该目录创建和用户名相同的文件夹，用于存放数据。'},
            {date:'2024-09-12',title:'服务器可用性变更通知',content:'因实验需要，F3、F7服务器临时切换为Windows系统，预计11月上旬恢复。'},
            {date:'2024-08-12',title:'宕机通知',content:'G8服务器硬盘损坏，目前无法使用。'},
        ]
    },

    getNoticeData() {
        return Promise.resolve(this.getData());
    }
};