/**
 * 해지 워크플로우 (Palantir Foundry: Pipeline Concept)
 *
 * 워크플로우 단계:
 * 1. 해지 대상 선정
 * 2. 미정산 금액 확인 → 정산 요청
 * 3. 전자결재 승인 (담당자 → 팀장)
 * 4. 내용증명 발송
 * 5. 이의제기 대기 (30일)
 * 6. 해지 확정
 */

/**
 * @typedef {'대기'|'진행중'|'완료'|'차단'|'건너뜀'} StepStatus
 * @typedef {{
 *   id: string,
 *   sellerId: string,
 *   contractId: string,
 *   currentStep: number,
 *   steps: WorkflowStep[],
 *   createdAt: string,
 *   status: '진행중'|'완료'|'중단'
 * }} TerminationWorkflow
 *
 * @typedef {{
 *   name: string,
 *   status: StepStatus,
 *   description: string,
 *   blockedReason?: string,
 *   completedAt?: string
 * }} WorkflowStep
 */

const STEP_TEMPLATES = [
  { name: '해지 대상 선정', description: 'AIP 규칙 또는 담당자 판단으로 해지 대상 선정' },
  { name: '미정산 금액 확인', description: '미정산 금액 조회 및 판매자에게 정산 요청' },
  { name: '전자결재 승인', description: '담당자 → 팀장 승인 프로세스' },
  { name: '내용증명 발송', description: '판매자에게 계약 해지 내용증명 발송' },
  { name: '이의제기 대기', description: '판매자 이의제기 기간 (30일)' },
  { name: '해지 확정', description: '계약 종료 및 판매자 상태 해지 처리' },
];

export class TerminationWorkflowEngine {
  constructor(store) {
    this.store = store;
    /** @type {Map<string, TerminationWorkflow>} */
    this.workflows = new Map();
  }

  /** 새 해지 워크플로우 생성 */
  createWorkflow(sellerId, contractId) {
    const id = `WF-${Date.now()}`;
    const workflow = {
      id,
      sellerId,
      contractId,
      currentStep: 0,
      status: '진행중',
      createdAt: new Date().toISOString().split('T')[0],
      steps: STEP_TEMPLATES.map((t) => ({
        ...t,
        status: '대기',
      })),
    };

    // 첫 번째 단계 자동 완료 (대상 선정)
    workflow.steps[0].status = '완료';
    workflow.steps[0].completedAt = workflow.createdAt;

    // 두 번째 단계: 미정산 확인
    const seller = this.store.getSeller(sellerId);
    const unsettled = seller?.unsettledAmount || 0;
    if (unsettled > 0) {
      workflow.steps[1].status = '차단';
      workflow.steps[1].blockedReason = `미정산 금액 ${(unsettled / 10000).toLocaleString()}만원 — 정산 완료 필요`;
      workflow.currentStep = 1;
    } else {
      workflow.steps[1].status = '완료';
      workflow.steps[1].completedAt = workflow.createdAt;
      workflow.steps[2].status = '진행중';
      workflow.currentStep = 2;
    }

    this.workflows.set(id, workflow);
    return workflow;
  }

  /** 미정산 정산 완료 처리 */
  resolveSettlement(workflowId) {
    const wf = this.workflows.get(workflowId);
    if (!wf || wf.steps[1].status !== '차단') return;

    const seller = this.store.getSeller(wf.sellerId);
    if (seller) seller.unsettledAmount = 0;

    wf.steps[1].status = '완료';
    wf.steps[1].completedAt = new Date().toISOString().split('T')[0];
    wf.steps[2].status = '진행중';
    wf.currentStep = 2;
  }

  /** 전자결재 승인 */
  approveStep(workflowId) {
    const wf = this.workflows.get(workflowId);
    if (!wf) return;

    const step = wf.steps[wf.currentStep];
    if (step.status !== '진행중') return;

    step.status = '완료';
    step.completedAt = new Date().toISOString().split('T')[0];

    // 다음 단계로
    if (wf.currentStep < wf.steps.length - 1) {
      wf.currentStep++;
      const nextStep = wf.steps[wf.currentStep];

      // 이의제기 단계: 자동으로 진행중 설정
      if (nextStep.name === '이의제기 대기') {
        nextStep.status = '진행중';
        nextStep.description = '판매자 이의제기 기간 (30일) — 기간 내 이의 없으면 자동 확정';
      } else {
        nextStep.status = '진행중';
      }
    }
  }

  /** 이의제기 기간 완료 → 해지 확정 */
  completeDispute(workflowId, hasDispute = false) {
    const wf = this.workflows.get(workflowId);
    if (!wf) return;

    const disputeStep = wf.steps[4]; // 이의제기 대기
    if (disputeStep.status !== '진행중') return;

    if (hasDispute) {
      wf.status = '중단';
      disputeStep.status = '차단';
      disputeStep.blockedReason = '판매자 이의제기 접수 — 검토 필요';
      return;
    }

    disputeStep.status = '완료';
    disputeStep.completedAt = new Date().toISOString().split('T')[0];

    // 최종 해지 확정
    wf.currentStep = 5;
    wf.steps[5].status = '진행중';
  }

  /** 해지 확정 실행 */
  finalizeTermination(workflowId) {
    const wf = this.workflows.get(workflowId);
    if (!wf || wf.steps[5].status !== '진행중') return;

    wf.steps[5].status = '완료';
    wf.steps[5].completedAt = new Date().toISOString().split('T')[0];
    wf.status = '완료';

    // Ontology 상태 반영
    this.store.forceTerminateContract(wf.contractId);
  }

  /** 워크플로우 중단 */
  cancelWorkflow(workflowId) {
    const wf = this.workflows.get(workflowId);
    if (!wf || wf.status === '완료') return;
    wf.status = '중단';
  }

  getAll() {
    return [...this.workflows.values()];
  }

  get(id) {
    return this.workflows.get(id);
  }
}
