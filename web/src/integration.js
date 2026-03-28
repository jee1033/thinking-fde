/**
 * 연동 아키텍처 (Integration Architecture)
 *
 * Palantir Foundry가 레거시 시스템과 어떻게 연동되는지 시각화합니다.
 * - Connector: 각 레거시 시스템과의 연동 방식
 * - WorkflowIntegration: 워크플로우 단계별 데이터 흐름
 */

/** 레거시 시스템별 커넥터 정의 */
const connectors = [
  {
    id: 'admin',
    system: '어드민 백오피스',
    type: 'REST API',
    direction: 'read-write',
    priority: 1,
    ontologyMapping: {
      read: ['Seller.status', 'Seller.name', 'Seller.category', 'Contract.status'],
      write: ['Seller.status → 상태 변경 API', 'Contract.status → 계약 종료 API'],
    },
    endpoint: 'admin-api.internal.amazon.co.kr/v2',
    syncInterval: '실시간',
    status: 'connected',
  },
  {
    id: 'settlement',
    system: '정산 시스템',
    type: 'DB Sync (PostgreSQL)',
    direction: 'read',
    priority: 1,
    ontologyMapping: {
      read: ['Seller.unsettledAmount', 'Settlement.history', 'Settlement.lastDate'],
      write: [],
    },
    endpoint: 'settlement-db.internal:5432/settlement',
    syncInterval: '매 1시간',
    status: 'connected',
  },
  {
    id: 'bi',
    system: 'BI 대시보드',
    type: '불필요 (Ontology 대체)',
    direction: 'none',
    priority: null,
    ontologyMapping: { read: [], write: [] },
    endpoint: '-',
    syncInterval: '-',
    status: 'replaced',
  },
  {
    id: 'approval',
    system: '그룹웨어 전자결재',
    type: 'REST API',
    direction: 'read-write',
    priority: 2,
    ontologyMapping: {
      read: ['Approval.status', 'Approval.approver', 'Approval.date'],
      write: ['Approval.create → 기안 자동 생성', 'Approval.notify → 결재 알림'],
    },
    endpoint: 'groupware-api.amazon.co.kr/approval/v1',
    syncInterval: '실시간 (Webhook)',
    status: 'syncing',
  },
  {
    id: 'legal',
    system: '법무 요청 (Jira)',
    type: 'REST API (Jira Cloud)',
    direction: 'read-write',
    priority: 2,
    ontologyMapping: {
      read: ['LegalRequest.ticketId', 'LegalRequest.status', 'LegalRequest.sentDate'],
      write: ['LegalRequest.create → 티켓 자동 생성', 'LegalRequest.attach → 근거자료 첨부'],
    },
    endpoint: 'amazon.atlassian.net/rest/api/3',
    syncInterval: '실시간 (Webhook)',
    status: 'pending',
  },
  {
    id: 'cs',
    system: 'CS 시스템',
    type: 'DB Sync (MySQL)',
    direction: 'read',
    priority: 3,
    ontologyMapping: {
      read: ['Dispute.sellerId', 'Dispute.reason', 'Dispute.filedDate', 'Dispute.status'],
      write: [],
    },
    endpoint: 'cs-db.internal:3306/cs_system',
    syncInterval: '매 30분',
    status: 'pending',
  },
];

/** 워크플로우 단계별 연동 정보 */
const workflowIntegrations = [
  {
    step: '해지 대상 선정',
    sources: ['admin', 'settlement'],
    targets: [],
    dataFlow: 'Ontology에서 판매자 상태 + 매출 + 미정산 통합 조회',
    automationLevel: '자동 (AIP Logic)',
  },
  {
    step: '미정산 확인/정산',
    sources: ['settlement'],
    targets: ['settlement'],
    dataFlow: '정산 DB에서 미정산 금액 실시간 조회, 정산 완료 시 자동 감지',
    automationLevel: '반자동 (정산 완료 자동 감지)',
  },
  {
    step: '전자결재 승인',
    sources: [],
    targets: ['approval'],
    dataFlow: '그룹웨어 API로 기안 자동 생성 (판매자 정보 + 근거 자동 첨부)',
    automationLevel: '반자동 (기안 자동 생성, 승인은 사람)',
  },
  {
    step: '내용증명 발송',
    sources: [],
    targets: ['legal'],
    dataFlow: 'Jira 티켓 자동 생성 (판매자 정보 + 해지 근거 + 결재 결과 첨부)',
    automationLevel: '반자동 (티켓 자동, 발송은 법무팀)',
  },
  {
    step: '이의제기 대기',
    sources: ['cs'],
    targets: [],
    dataFlow: 'CS DB에서 이의제기 접수 자동 감지, 30일 타이머 자동 관리',
    automationLevel: '자동 (감지 + 타이머)',
  },
  {
    step: '해지 확정',
    sources: [],
    targets: ['admin'],
    dataFlow: '어드민 API로 판매자 상태 해지 처리, 계약 종료 자동 반영',
    automationLevel: '자동 (워크플로우 완료 시)',
  },
];

/** 연동 모니터 클래스 */
class IntegrationMonitor {
  constructor() {
    // 상태를 변경 가능하도록 로컬 복사본 유지
    this._connectors = connectors.map((c) => ({ ...c }));
  }

  /** 우선순위별 커넥터 조회 */
  getByPriority(n) {
    return this._connectors.filter((c) => c.priority === n);
  }

  /** 연결된 커넥터 조회 */
  getConnected() {
    return this._connectors.filter((c) => c.status === 'connected');
  }

  /** 상태 순환 토글 (시뮬레이션용) */
  toggleStatus(id) {
    const connector = this._connectors.find((c) => c.id === id);
    if (!connector || connector.status === 'replaced') return;

    const cycle = ['connected', 'syncing', 'error', 'pending'];
    const idx = cycle.indexOf(connector.status);
    connector.status = cycle[(idx + 1) % cycle.length];
    return connector;
  }

  /** 워크플로우 단계에 대한 연동 정보 조회 */
  getFlowForStep(stepName) {
    return workflowIntegrations.find((w) => w.step === stepName) || null;
  }

  /** 모든 커넥터 조회 */
  getAll() {
    return this._connectors;
  }
}

export { connectors, workflowIntegrations, IntegrationMonitor };
