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

interface AccountAsset {
  icon: string;
  name: string;
  unit: string;
  balance: string;
}

interface CdpData {
  syncOrder: number;
  syncOrderQuota: number;
  tenantCount: number;
  shopCount: number;
  syncUnionidShopCount: number;
  platformCount: number;
  syncStartTime: string;
  syncEndTime: string;
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

interface TenantDetail {
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
  workUserNum: number;
  externalContactNum: number;
  externalChatNum: number;
  industryId: number;
  industryName: string;
  userIndustryId: number;
  accountAssets: AccountAsset[];
  followWorkUserId: number;
  followWorkUser: string;
  implementStatus: number;
  channelStatus: number;
  addFansStatus: number;
  miniappStatus: number;
  implementStage: number;
  authStatus: number;
  cdpData: CdpData;
  userOperateButtonTO: UserOperateButtonTO;
  sops: unknown[];
  dealProblemControl: number;
}

cli({
  site: 'dtminds',
  name: 'tenant-detail',
  description: '查询用户详情',
  domain: 'boss.dtminds.com',
  strategy: Strategy.HEADER,
  navigateBefore: 'https://boss.dtminds.com',
  browser: true,
  args: [
    { name: 'uid', type: 'int', required: true, help: '用户UID' },
  ],
  columns: [
    'uid',
    'companyAlias',
    'companyName',
    'address',
    'account',
    'corpId',
    'shopId',
    'bytedanceShopId',
    'workCorpId',
    'sellerWorkUserId',
    'seller',
    'weChatCorpName',
    'source',
    'followWorkUserId',
    'followWorkUser',
    'followUpPeopleWorkUserId',
    'followUpPeople',
    'industryId',
    'industryName',
    'status',
    'packageInfos',
    'workUserNum',
    'externalContactNum',
    'externalChatNum',
    'accountAssets',
    'cdpData',
    'userOperateButtonTO',
    'implementStatus',
    'channelStatus',
    'addFansStatus',
    'miniappStatus',
    'implementStage',
    'authStatus',
    'createTime',
    'loginTime',
  ],
  func: async (page: IPage, kwargs: Record<string, unknown>) => {
    const body = {
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
        const res = await fetch('https://scrm-api.iyouke.com/admin/user/user-detail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          return { error: 'HTTP ' + res.status, data: null };
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

    const r = result.data as TenantDetail;
    return [{
      uid: r.uid,
      companyAlias: r.companyAlias || '',
      companyName: r.companyName || '',
      address: r.address || '',
      account: r.account || '',
      corpId: r.corpId,
      shopId: r.shopId,
      bytedanceShopId: r.bytedanceShopId,
      workCorpId: r.workCorpId || '',
      sellerWorkUserId: r.sellerWorkUserId || '',
      seller: r.seller || '',
      weChatCorpName: r.weChatCorpName || '',
      source: r.source === 1 ? '官网自助注册' : r.source === 2 ? '后台录入' : r.source === 3 ? '渠道插件' : '未知',
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
      workUserNum: r.workUserNum || '',
      externalContactNum: r.externalContactNum || '',
      externalChatNum: r.externalChatNum || '',
      accountAssets: (r.accountAssets || [])
        .map((a) => `${a.name}:${a.balance}${a.unit}`)
        .join('; ') || '',
      cdpData: r.cdpData ? `已同步订单数:${r.cdpData.syncOrder},可同步订单数：${r.cdpData.syncOrderQuota},可添加达人数:${r.cdpData.tenantCount},可添加店铺数:${r.cdpData.shopCount},可添加小程序数:${r.cdpData.syncUnionidShopCount},可添加渠道数:${r.cdpData.platformCount},同步时间:${r.cdpData.syncStartTime}~${r.cdpData.syncEndTime}` : '',
      userOperateButtonTO: JSON.stringify(r.userOperateButtonTO || {}),
      implementStatus: r.implementStatus === 0 ? '实施中' : r.implementStatus === 1 ? '已实施' : '未知',
      channelStatus: r.channelStatus === 0 ? '不需要' : r.channelStatus === 1 ? '未授权' : r.channelStatus === 2 ? '已授权' : '未知',
      addFansStatus: r.addFansStatus === 0 ? '有需要还没配置' : r.addFansStatus === 1 ? '已完成一项配置' : r.addFansStatus === 2 ? '已完成2项及以上配置' : r.addFansStatus === 3 ? '不需要' : r.addFansStatus === 4 ? '问题客户' : '未知',
      miniappStatus: r.miniappStatus === 0 ? '未上线' : r.miniappStatus === 1 ? '已上线未装修' : r.miniappStatus === 2 ? '已上线装修待提升' : r.miniappStatus === 3 ? '已上线装修良好' : '未知',
      implementStage: r.implementStage === 0 ? '账号开通待培训' : r.implementStage === 1 ? '完成1次培训' : r.implementStage === 2 ? '完成2次培训' : r.implementStage === 3 ? '完成培训待验收' : '未知',
      authStatus: r.authStatus === 0 ? '不需要' : r.authStatus === 1 ? '有需求暂未认证' : r.authStatus === 2 ? '认证中' : r.authStatus === 3 ? '已完成' : r.authStatus === 4 ? '问题客户' : '未知',
      createTime: r.createTime || '',
      loginTime: r.loginTime ? formatDate(r.loginTime) : '',
    }];
  },
});
