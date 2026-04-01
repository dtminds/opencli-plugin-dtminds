import { cli, Strategy } from '@jackwener/opencli/registry';
import type { IPage } from '@jackwener/opencli/types';

interface FollowRecord {
  id: number;
  content: string;
  images: string;
  files: string;
  addTime: number;
  workUserName: string;
  recordType: number;
}

cli({
  site: 'iyouke',
  name: 'follow-record',
  description: '获取跟进记录列表',
  domain: 'scrm-api.iyouke.com',
  strategy: Strategy.HEADER,
  navigateBefore: 'https://boss.dtminds.com',
  browser: true,
  args: [
    { name: 'uid', type: 'int', required: true, help: '用户UID' },
    { name: 'page', type: 'int', default: 1, help: '页码' },
    { name: 'pageSize', type: 'int', default: 10, help: '每页条数' },
    { name: 'recordType', type: 'int', default: 0, help: '记录类型' },
  ],
  columns: ['id', 'workUserName', 'addTime', 'recordType', 'content'],
  func: async (page: IPage, kwargs: Record<string, unknown>) => {
    const body = {
      page: kwargs.page ?? 1,
      pageSize: kwargs.pageSize ?? 10,
      recordType: kwargs.recordType ?? 0,
      uid: kwargs.uid,
    };

    const result = await page.evaluate(`
      (async () => {
        const getCookie = (name) => {
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? decodeURIComponent(match[2]) : '';
        };
        const token = getCookie('access_token') || '';
        const body = ${JSON.stringify(body)};
        const res = await fetch('https://scrm-api.iyouke.com/admin/user/follow-record-list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          return { error: 'HTTP ' + res.status, list: [], count: 0 };
        }

        return res.json();
      })()
    `);

    if (!result || result.error !== 0) {
      throw new Error(`API错误: ${result?.error ?? '未知错误'}`);
    }

    const records = (result.list ?? []) as FollowRecord[];
    return records.map((r) => ({
      id: r.id,
      content: r.content.replaceAll('\n', ' ').slice(0, 100),
      images: r.images,
      files: r.files,
      addTime: new Date(r.addTime * 1000).toLocaleString('zh-CN'),
      workUserName: r.workUserName,
      recordType: r.recordType,
    }));
  },
});
