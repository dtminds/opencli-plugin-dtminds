import { cli, Strategy } from '@jackwener/opencli/registry';
import type { IPage } from '@jackwener/opencli/types';

interface UserPackageInfo {
  packageId: number;
  platform: number;
  packageSort: number;
  packageIsTrial: boolean;
  name: string;
  endTime: number;
}

interface PackageButton {
  openPackage: boolean;
  renewalPackage: boolean;
  upgradePackage: boolean;
  delayPackage: boolean;
}

interface UserOperateButtonTO {
  packageButtonTOMap: Record<string, PackageButton>;
}

interface Search {
  uid: number;
  account: string;
  corpId: number;
  workCorpId: string;
  shopId: number;
  bytedanceShopId: number;
  companyName: string;
  companyAlias: string;
  secrecy: number;
  province: number;
  city: number;
  address: string;
  sellerWorkUserId: number;
  seller: string;
  weChatCorpName: string;
  source: number;
  createTime: string;
  followUpPeople: string;
  followUpPeopleWorkUserId: number;
  userPackageInfos: UserPackageInfo[];
  status: number;
  loginTime: number;
  industryId: number;
  industryName: string;
  userIndustryId: number;
  followWorkUserId: number;
  followWorkUser: string;
  implementStatus: number;
  channelStatus: number;
  addFansStatus: number;
  miniappStatus: number;
  implementStage: number;
  authStatus: number;
  userOperateButtonTO: UserOperateButtonTO;
  sops: unknown[];
  dealProblemControl: number;
}

cli({
  site: 'dtminds',
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
    { name: 'status', type: 'string', default: '', help: '状态筛选（1:正常, 0:已禁用）' },
    { name: 'packageIds', type: 'string', default: '', help: '套餐ID，多个用逗号分隔（如: 15,16）' },
    { name: 'followUpPeopleWorkUserIds', type: 'string', default: '', help: '跟进人workUserId，多个用逗号分隔（如: 180377,180378）' },
    { name: 'platformPackageQueryMap', type: 'string', default: '', help: '套餐平台查询条件，格式: 平台ID:套餐状态:过期开始时间:过期结束时间，多个平台用逗号分隔 示例: 1:1:2026-04-05 00:00:00:2026-05-31 23:59:59,2:1::,3::2026-04-01 00:00:00:2026-04-04 23:59:59' },
  ],
  columns: [
    'uid',
    'companyAlias',
    'companyName',
    'account',
    'corpId',
    'shopId',
    'bytedanceShopId',
    'workCorpId',
    'sellerWorkUserId',
    'seller',
    'followWorkUserId',
    'followWorkUser',
    'followUpPeopleWorkUserId',
    'followUpPeople',
    'industryId',
    'industryName',
    'status',
    'packageInfos',
    'createTime',
    'loginTime',
  ],
  func: async (page: IPage, kwargs: Record<string, unknown>) => {
    // 构建 platformPackageQueryMap
    const platformPackageQueryMap: Record<string, Record<string, string>> = {};
    const platformPackageQueryMapStr = (kwargs.platformPackageQueryMap as string) ?? '';
    if (platformPackageQueryMapStr) {
      const platforms = platformPackageQueryMapStr.split(',');
      for (const p of platforms) {
        const parts = p.split(':');
        const platformId = parts[0];
        if (platformId) {
          const condition: Record<string, string> = {};
          if (parts[1]) condition.status = parts[1];
          if (parts[2]) condition.expireStartTime = parts[2];
          if (parts[3]) condition.expireEndTime = parts[3];
          if (Object.keys(condition).length > 0) {
            platformPackageQueryMap[platformId] = condition;
          }
        }
      }
    }

    // 解析逗号分隔的数组参数
    const parseArrayParam = (val: unknown): number[] | undefined => {
      if (!val || typeof val !== 'string' || val.trim() === '') return undefined;
      const nums = val.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
      return nums.length > 0 ? nums : undefined;
    };

    const body = {
      companyAlias: kwargs.companyAlias ?? '',
      status: kwargs.status ? String(kwargs.status) : undefined,
      packageIds: parseArrayParam(kwargs.packageIds),
      followUpPeopleWorkUserIds: parseArrayParam(kwargs.followUpPeopleWorkUserIds),
      platformPackageQueryMap: Object.keys(platformPackageQueryMap).length > 0 ? platformPackageQueryMap : undefined,
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

    const formatDate = (ts: number) => {
      const d = new Date(ts * 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const records = (result.list ?? []) as Search[];
    return records.map((r) => ({
      uid: r.uid,
      companyAlias: r.companyAlias || '',
      companyName: r.companyName || '',
      account: r.account || '',
      corpId: r.corpId,
      shopId: r.shopId,
      bytedanceShopId: r.bytedanceShopId,
      workCorpId: r.workCorpId || '',
      sellerWorkUserId: r.sellerWorkUserId || '',
      seller: r.seller || '',
      followWorkUserId: r.followWorkUserId || '',
      followWorkUser: r.followWorkUser || '',
      followUpPeopleWorkUserId: r.followUpPeopleWorkUserId || '',
      followUpPeople: r.followUpPeople || '',
      industryId: r.industryId || '',
      industryName: r.industryName || '',
      status: r.status === 1 ? '正常' : r.status === 0 ? '已禁用' : '未知',
      packageInfos: (r.userPackageInfos || [])
        .map((p) => {
          const platformMap: Record<number, string> = { 1: '星云有客', 2: '幸运粉丝通', 3: '星云微氪' };
          const platform = platformMap[p.platform] || '其他';
          const expireDate = p.endTime ? formatDate(p.endTime) : '无期限';
          const type = p.packageIsTrial ? '试用套餐' : '正式套餐';
          return `${platform}-${p.name}-${type}-到期时间:${expireDate}`;
        })
        .join('; ') || '',
      createTime: r.createTime || '',
      loginTime: r.loginTime ? formatDate(r.loginTime) : '',
    }));
  },
});
