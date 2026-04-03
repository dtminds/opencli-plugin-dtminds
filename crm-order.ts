import { cli, Strategy } from '@jackwener/opencli/registry';
import type { IPage } from '@jackwener/opencli/types';

const BIZ_STATUS_MAP: Record<number, string> = {
  0: '审批中',
  1: '审批通过待分配跟进人',
  2: '已驳回',
  3: '已通过',
  4: '已取消',
  5: '已撤销',
};

const INVOICE_STATUS_MAP: Record<number, string> = {
  '-1': '未开票',
  0: '申请开票中',
  1: '已开票',
};

const PAY_STATUS_MAP: Record<number, string> = {
  '-2': '无需回款',
  '-1': '未回款',
  0: '部分回款',
  1: '全部回款',
};

const IMPL_STATUS_MAP: Record<number, string> = {
  '-1': '未实施',
  0: '部分实施',
  1: '全部实施',
};

function formatDatetime(timestamp: number): string {
  if (!timestamp) return '-';
  const d = new Date(timestamp * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

interface CrmOrder {
  id: number;
  signCompanyName: string;
  corpFullName: string;
  orderNum: string;
  uid: number;
  productCount: number;
  orderAmt: number;
  contractNum: string;
  contractId: number;
  bizStatus: number;
  followWorkUserName: string;
  invoiceStatus: number;
  payStatus: number;
  implStatus: number;
  submitWorkUserName: string;
  orderTime: number;
  wxApprovalNum: string;
  orderVersion: number;
}

cli({
  site: 'dtminds',
  name: 'crm-order',
  description: '获取CRM订单列表',
  domain: 'scrm-api.iyouke.com',
  strategy: Strategy.HEADER,
  navigateBefore: 'https://boss.dtminds.com',
  browser: true,
  args: [
    { name: 'page', type: 'int', default: 1, help: '页码' },
    { name: 'pageSize', type: 'int', default: 10, help: '每页条数' },
    { name: 'uid', type: 'int', default: 0, help: '用户UID' },
    { name: 'contractNum', type: 'string', default: '', help: '合同编号' },
    { name: 'corpFullName', type: 'string', default: '', help: '企业全称' },
    { name: 'orderNum', type: 'string', default: '', help: '订单号' },
    { name: 'wxApprovalNum', type: 'string', default: '', help: '企业微信审批编号' },
    { name: 'crmPayDetailPaySubject', type: 'string', default: '', help: '客户打款-付款主体' },
    { name: 'bizStatus', type: 'int', default: null, help: '订单状态：0、审批中 1、审批通过待分配跟进人 2、已驳回 3、已通过 4、已取消 5、已撤销' },
    { name: 'invoiceStatus', type: 'int', default: null, help: '开票状态：-1、未开票 0、申请开票中 1、已开票' },
    { name: 'payStatus', type: 'int', default: null, help: '回款状态：-2、无需回款 -1、未回款 0、部分回款 1、全部回款' },
    { name: 'crmProductIds', type: 'string', default: null, help: '产品IDS数组，多个用逗号分隔，如：[1,2]' },
    { name: 'orderStartTime', type: 'int', default: null, help: '下单开始时间戳' },
    { name: 'orderEndTime', type: 'int', default: null, help: '下单结束时间戳' },
    { name: 'crmPayDetailPayTimeStart', type: 'string', default: null, help: '客户打款-付款日期-开始时间，格式：2026-03-01 00:00:00' },
    { name: 'crmPayDetailPayTimeEnd', type: 'string', default: null, help: '客户打款-付款日期-结束时间，格式：2026-03-31 23:59:59' },
  ],
  columns: ['id', 'orderNum', 'corpFullName', 'signCompanyName', 'orderAmt', 'bizStatus', 'invoiceStatus', 'payStatus', 'implStatus', 'orderTime', 'followWorkUserName'],
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
      wxApprovalNum: kwargs.wxApprovalNum || '',
      crmPayDetailPaySubject: kwargs.crmPayDetailPaySubject || '',
      crmProductIds,
    };

    if (kwargs.bizStatus != null) {
      body.bizStatus = kwargs.bizStatus;
    }
    if (kwargs.invoiceStatus != null) {
      body.invoiceStatus = kwargs.invoiceStatus;
    }
    if (kwargs.payStatus != null) {
      body.payStatus = kwargs.payStatus;
    }
    if (kwargs.orderStartTime != null) {
      body.orderStartTime = kwargs.orderStartTime;
    }
    if (kwargs.orderEndTime != null) {
      body.orderEndTime = kwargs.orderEndTime;
    }
    if (kwargs.crmPayDetailPayTimeStart != null) {
      body.crmPayDetailPayTimeStart = kwargs.crmPayDetailPayTimeStart;
    }
    if (kwargs.crmPayDetailPayTimeEnd != null) {
      body.crmPayDetailPayTimeEnd = kwargs.crmPayDetailPayTimeEnd;
    }
    if (kwargs.uid != null && kwargs.uid !== 0) {
      body.uid = kwargs.uid;
    }

    const result = await page.evaluate(`
      (async () => {
        const getCookie = (name) => {
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? decodeURIComponent(match[2]) : '';
        };
        const token = getCookie('access_token') || '';
        const body = ${JSON.stringify(body)};
        const res = await fetch('https://scrm-api.iyouke.com/admin/crm-order/list', {
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

    const records = (result.list ?? []) as CrmOrder[];
    return records.map((r) => ({
      id: r.id,
      contractId: r.contractId,
      orderNum: r.orderNum,
      corpFullName: r.corpFullName,
      signCompanyName: r.signCompanyName,
      orderAmt: r.orderAmt,
      contractNum: r.contractNum,
      uid: r.uid,
      productCount: r.productCount,
      bizStatus: `${BIZ_STATUS_MAP[r.bizStatus] ?? '未知'}`,
      invoiceStatus: `${INVOICE_STATUS_MAP[r.invoiceStatus] ?? '未知'}`,
      payStatus: `${PAY_STATUS_MAP[r.payStatus] ?? '未知'}`,
      implStatus: `${IMPL_STATUS_MAP[r.implStatus] ?? '未知'}`,
      followWorkUserName: r.followWorkUserName,
      submitWorkUserName: r.submitWorkUserName,
      orderTime: formatDatetime(r.orderTime),
      wxApprovalNum: r.wxApprovalNum,
    }));
  },
});