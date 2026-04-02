import { cli, Strategy } from '@jackwener/opencli/registry';
import type { IPage } from '@jackwener/opencli/types';

interface SystemTypeDuration {
  platform: number;
  startTime: number;
  endTime: number;
}

const BIZ_STATUS_MAP: Record<number, string> = {
  0: '草稿',
  1: '审批中',
  2: '审核通过未归档',
  3: '已归档',
  4: '审批不通过',
  5: '已撤销',
};

const ORDER_STATUS_MAP: Record<number, string> = {
  0: '审批中',
  1: '审批通过,待分配跟进人',
  2: '审批不通过',
  3: '已完成',
  4: '已取消',
  5: '已撤销',
};

const OUR_CORP_FULL_NAME_MAP: Record<number, string> = {
  1: '杭州星云智慧科技有限公司',
  2: '杭州星云咨询管理有限公司',
  3: '杭州星云有客科技有限公司',
  4: '星瓴科技（香港）有限公司',
  5: '杭州星云数字科技有限公司',
};

const CONTRACT_TYPE_MAP: Record<number, string> = {
  1: '标准化合同-新签',
  2: '标准化合同-续费',
  3: '标准化合同-增购',
};

function formatDate(timestamp: number): string {
  if (!timestamp) return '-';
  const d = new Date(timestamp * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

interface CrmContract {
  id: number;
  orderId: number;
  type: number;
  contractNum: string;
  corpFullName: string;
  ourCorpFullName: number;
  orderNum: string;
  uid: number;
  corpName: string;
  productCount: number;
  contractAmt: number;
  attachment: string;
  bizStatus: number;
  allowOrderStatus: number;
  contractOrderStatus: number;
  orderStatus: number;
  startTime: number;
  endTime: number;
  signTime: number;
  serviceDuration: number;
  systemTypeDurations: SystemTypeDuration[];
  submitWorkUserId: number;
  submitWorkUserName: string;
  wxApprovalNum: string;
  createTime: number;
}

cli({
  site: 'dtminds',
  name: 'crm-contract',
  description: '获取CRM合同列表',
  domain: 'scrm-api.iyouke.com',
  strategy: Strategy.HEADER,
  navigateBefore: 'https://boss.dtminds.com',
  browser: true,
  args: [
    { name: 'page', type: 'int', default: 1, help: '页码' },
    { name: 'pageSize', type: 'int', default: 10, help: '每页条数' },
    { name: 'contractNum', type: 'string', default: '', help: '合同编号' },
    { name: 'corpFullName', type: 'string', default: '', help: '签约主体' },
    { name: 'orderNum', type: 'string', default: '', help: '订单号' },
    { name: 'bizStatus', type: 'int', default: null, help: '合同状态：0、草稿 1、审批中 2、审核通过未归档 3、已归档 4、审批不通过 5、已撤销' },
    { name: 'crmProductIds', type: 'string', default: null, help: '产品IDS数组，多个用逗号分隔，如：[1,2]' },
    { name: 'timeType', type: 'int', default: null, help: '时间类型：1、合同开始时间 2、合同结束时间' },
    { name: 'startTime', type: 'int', default: null, help: '开始时间戳' },
    { name: 'endTime', type: 'int', default: null, help: '结束时间戳' },
  ],
  columns: ['id', 'contractNum', 'corpFullName', 'contractAmt', 'bizStatus', 'startTime', 'endTime', 'submitWorkUserName'],
  func: async (page: IPage, kwargs: Record<string, unknown>) => {
    const crmProductIdsStr = (kwargs.crmProductIds as string) || '';
    const crmProductIds = crmProductIdsStr
      ? crmProductIdsStr.split(',').map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id))
      : [];

    const body: Record<string, unknown> = {
      page: kwargs.page ?? 1,
      pageSize: kwargs.pageSize ?? 10,
      contractNum: kwargs.contractNum || '',
      corpFullName: kwargs.corpFullName || '',
      orderNum: kwargs.orderNum || '',
      crmProductIds,
    };

    if (kwargs.bizStatus != null) {
      body.bizStatus = kwargs.bizStatus;
    }
    if (kwargs.timeType != null) {
      body.timeType = kwargs.timeType;
    }
    if (kwargs.startTime != null) {
      body.startTime = kwargs.startTime;
    }
    if (kwargs.endTime != null) {
      body.endTime = kwargs.endTime;
    }

    const result = await page.evaluate(`
      (async () => {
        const getCookie = (name) => {
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? decodeURIComponent(match[2]) : '';
        };
        const token = getCookie('access_token') || '';
        const body = ${JSON.stringify(body)};
        const res = await fetch('https://scrm-api.iyouke.com/admin/crm-contract/list', {
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

    const records = (result.list ?? []) as CrmContract[];
    return records.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      type: `${r.type}-${CONTRACT_TYPE_MAP[r.type] ?? '未知'}`,
      contractNum: r.contractNum,
      corpFullName: r.corpFullName,
      ourCorpFullName: `${OUR_CORP_FULL_NAME_MAP[r.ourCorpFullName] ?? '未知'}`,
      orderNum: r.orderNum,
      uid: r.uid,
      corpName: r.corpName,
      productCount: r.productCount,
      contractAmt: r.contractAmt,
      attachment: r.attachment,
      bizStatus: `${BIZ_STATUS_MAP[r.bizStatus] ?? '未知'}`,
      allowOrderStatus: r.allowOrderStatus,
      contractOrderStatus: r.contractOrderStatus,
      orderStatus: `${ORDER_STATUS_MAP[r.orderStatus] ?? '未知'}`,
      startTime: formatDate(r.startTime),
      endTime: formatDate(r.endTime),
      signTime: formatDate(r.signTime),
      serviceDuration: r.serviceDuration,
      submitWorkUserId: r.submitWorkUserId,
      submitWorkUserName: r.submitWorkUserName,
      wxApprovalNum: r.wxApprovalNum,
      createTime: formatDate(r.createTime),
    }));
  },
});
