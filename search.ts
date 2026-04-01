import { cli, Strategy } from '@jackwener/opencli/registry';
import type { IPage } from '@jackwener/opencli/types';

interface Search {
  uid: number;
  companyAlias: string;
  account: string;
  seller: string;
}

cli({
  site: 'iyouke',
  name: 'search',
  description: '搜索用户信息',
  domain: 'boss.dtminds.com',
  strategy: Strategy.HEADER,
  navigateBefore: 'https://boss.dtminds.com',
  browser: true,
  args: [
    { name: 'companyAlias', type: 'string', default: '', help: '品牌名称（模糊搜索）' },
    { name: 'page', type: 'int', default: 1, help: '页码' },
    { name: 'pageSize', type: 'int', default: 10, help: '每页数量' },
  ],
  columns: ['uid', 'companyAlias', 'account', 'seller'],
  func: async (page: IPage, kwargs: Record<string, unknown>) => {
    const body = {
      companyAlias: kwargs.companyAlias ?? '',
      platformPackageQueryMap: {},
      page: kwargs.page ?? 1,
      pageSize: kwargs.pageSize ?? 10,
    };

    const result = await page.evaluate(`
      (async () => {
        const getCookie = (name) => {
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? decodeURIComponent(match[2]) : '';
        };
        const token = getCookie('access_token') || '';
        const body = ${JSON.stringify(body)};
        const res = await fetch('https://scrm-api.iyouke.com/admin/user/list', {
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

    const records = (result.list ?? []) as Search[];
    return records.map((r) => ({
      uid: r.uid,
      companyAlias: r.companyAlias || '',
      account: r.account || '',
      seller: r.seller || '',
    }));
  },
});
