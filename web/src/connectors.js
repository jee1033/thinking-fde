/**
 * Connector Layer (Palantir Foundry: Data Connection Manager)
 * 각 레거시 시스템에 대한 커넥터 어댑터
 * - 데이터 페칭 시뮬레이션 (async + delay)
 * - 상태 관리 (connected/syncing/error/disconnected)
 * - 이벤트 로깅
 */

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timestamp() {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

class BaseConnector {
  constructor(id, name, type, endpoint) {
    this.id = id;
    this.name = name;
    this.type = type; // 'REST API' | 'DB Sync'
    this.endpoint = endpoint;
    this.status = 'disconnected'; // disconnected → connecting → connected → syncing → error
    this.lastSync = null;
    this.syncCount = 0;
    this.logs = [];
    this.data = null;
  }

  async connect() {
    this.status = 'connecting';
    this._log(`${this.name} 연결 시도중...`, 'info');
    await delay(300 + Math.random() * 400);
    this.status = 'connected';
    this._log(`${this.name} 연결 완료`, 'success');
  }

  async sync() {
    if (this.status !== 'connected' && this.status !== 'syncing') {
      this._log(`${this.name} 동기화 불가 (상태: ${this.status})`, 'error');
      return null;
    }
    this.status = 'syncing';
    this._log(`${this.name} 데이터 동기화 시작...`, 'info');
    try {
      const result = await this._fetchData();
      this.data = result;
      this.lastSync = timestamp();
      this.syncCount++;
      this.status = 'connected';
      this._log(`${this.name} 동기화 완료 (${this.syncCount}회)`, 'success');
      return result;
    } catch (e) {
      this.status = 'error';
      this._log(`${this.name} 동기화 실패: ${e.message}`, 'error');
      return null;
    }
  }

  async _fetchData() {
    await delay(500);
    return {};
  }

  async push(action, payload) {
    this._log(`${this.name} push 미지원`, 'error');
  }

  disconnect() {
    this.status = 'disconnected';
    this.data = null;
    this._log(`${this.name} 연결 해제`, 'info');
  }

  _log(msg, level = 'info') {
    this.logs.push({ time: timestamp(), source: this.name, msg, level });
    if (this.logs.length > 100) this.logs.shift();
  }
}

class AdminConnector extends BaseConnector {
  constructor() {
    super('admin', '어드민 백오피스', 'REST API', 'admin-api.internal.amazon.co.kr/v2');
  }

  async _fetchData() {
    await delay(500);
    return {
      sellers: [
        { id: 'S001', name: '뷰티하우스', status: '활성', category: '뷰티' },
        { id: 'S006', name: '코지홈데코', status: '휴면', category: '리빙' },
        { id: 'S008', name: '스타일온', status: '휴면', category: '패션' },
      ],
      contracts: [
        { id: 'C001', sellerId: 'S001', status: '진행중' },
        { id: 'C006', sellerId: 'S006', status: '종료' },
      ],
    };
  }

  async push(action, payload) {
    this._log(`어드민 push: ${action} (${JSON.stringify(payload)})`, 'info');
    await delay(300);
    this._log(`어드민 push 완료: ${action}`, 'success');
  }
}

class SettlementConnector extends BaseConnector {
  constructor() {
    super('settlement', '정산 시스템', 'DB Sync', 'settlement-db.internal:5432/settlement');
  }

  async _fetchData() {
    await delay(800);
    return {
      unsettled: [
        { sellerId: 'S002', amount: 4200000 },
        { sellerId: 'S006', amount: 890000 },
        { sellerId: 'S008', amount: 2300000 },
        { sellerId: 'S013', amount: 560000 },
      ],
      history: [
        { sellerId: 'S001', settledDate: '2024-12-01', amount: 12000000 },
        { sellerId: 'S003', settledDate: '2024-12-01', amount: 8500000 },
      ],
    };
  }

  async push() {
    this._log('정산 시스템은 읽기 전용입니다', 'error');
  }
}

class ApprovalConnector extends BaseConnector {
  constructor() {
    super('approval', '그룹웨어 전자결재', 'REST API', 'groupware-api.amazon.co.kr/approval/v1');
  }

  async _fetchData() {
    await delay(600);
    return {
      pendingApprovals: 2,
      recentApproval: { id: 'APR-2024-0312', status: '승인완료', date: '2024-12-15' },
    };
  }

  async push(action, payload) {
    this._log(`전자결재 push: ${action}`, 'info');
    await delay(400);
    this._log(`전자결재 push 완료: ${action}`, 'success');
  }
}

class JiraConnector extends BaseConnector {
  constructor() {
    super('jira', '법무 요청 (Jira)', 'REST API', 'amazon.atlassian.net/rest/api/3');
  }

  async _fetchData() {
    await delay(700);
    return {
      openTickets: 3,
      recentTicket: { key: 'LEGAL-1045', status: '발송완료', sentDate: '2024-12-10' },
    };
  }

  async push(action, payload) {
    this._log(`Jira push: ${action}`, 'info');
    await delay(500);
    this._log(`Jira push 완료: ${action}`, 'success');
  }
}

class CSConnector extends BaseConnector {
  constructor() {
    super('cs', 'CS 시스템', 'DB Sync', 'cs-db.internal:3306/cs_system');
  }

  async _fetchData() {
    await delay(500);
    return {
      disputes: [
        { sellerId: 'S010', reason: '계약 조건 이의', filedDate: '2024-11-20', status: '처리완료' },
      ],
      activeDisputes: 0,
    };
  }

  async push() {
    this._log('CS 시스템은 읽기 전용입니다', 'error');
  }
}

export class ConnectorManager {
  constructor() {
    this.connectors = [
      new AdminConnector(),
      new SettlementConnector(),
      new ApprovalConnector(),
      new JiraConnector(),
      new CSConnector(),
    ];
    this._onStatusChange = null;
    this._onSync = null;
    this._onLog = null;
  }

  set onStatusChange(fn) { this._onStatusChange = fn; }
  set onSync(fn) { this._onSync = fn; }
  set onLog(fn) { this._onLog = fn; }

  async connectAll() {
    for (const c of this.connectors) {
      await c.connect();
      this._notify('statusChange', c);
      this._notify('log', c.logs[c.logs.length - 1]);
      await delay(200);
    }
  }

  async syncAll() {
    const results = {};
    for (const c of this.connectors) {
      if (c.status === 'connected' || c.status === 'syncing') {
        this._notify('statusChange', c);
        const data = await c.sync();
        results[c.id] = data;
        this._notify('sync', { connector: c, data });
        this._notify('log', c.logs[c.logs.length - 1]);
      }
    }
    return results;
  }

  getStatus() {
    return this.connectors.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      endpoint: c.endpoint,
      status: c.status,
      lastSync: c.lastSync,
      syncCount: c.syncCount,
    }));
  }

  getLogs() {
    const all = [];
    for (const c of this.connectors) {
      all.push(...c.logs);
    }
    return all.sort((a, b) => a.time.localeCompare(b.time));
  }

  getConnector(id) {
    return this.connectors.find((c) => c.id === id);
  }

  _notify(type, data) {
    if (type === 'statusChange' && this._onStatusChange) this._onStatusChange(data);
    if (type === 'sync' && this._onSync) this._onSync(data);
    if (type === 'log' && this._onLog) this._onLog(data);
  }
}
