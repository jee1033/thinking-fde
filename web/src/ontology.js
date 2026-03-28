/**
 * Ontology Layer (Palantir Foundry Concept)
 * - Object Types: Seller, Contract, Settlement, SalesRecord, Product, Approval, LegalNotice, Dispute
 * - Links: Seller ↔ Contract (1:N), Seller ↔ Settlement (1:N), etc.
 * - Actions: 상태변경, 계약갱신, 해지 (with pre-condition checks)
 * - Computed Properties: riskScore, tier, canTerminate, isDormantCandidate, healthScore, isExpiringSoon, isCommissionValid
 */

/**
 * @typedef {{id:string, name:string, category:string, status:string, joinDate:string, lastSaleDate:string, monthlySales:number, unsettledAmount:number, contactEmail:string, businessNumber:string}} SellerData
 * @typedef {{id:string, sellerId:string, type:string, commissionRate:number, startDate:string, endDate:string, status:string, autoRenewal:boolean, penaltyClause:boolean, minCommitment:number}} ContractData
 * @typedef {{id:string, sellerId:string, period:string, totalSales:number, commissionAmount:number, netAmount:number, status:string, settledDate:string}} SettlementData
 * @typedef {{id:string, sellerId:string, period:string, totalAmount:number, orderCount:number, returnCount:number, returnRate:number}} SalesRecordData
 * @typedef {{id:string, sellerId:string, name:string, price:number, status:string, category:string, registeredDate:string}} ProductData
 * @typedef {{id:string, contractId:string, type:string, status:string, requestedBy:string, approvedBy:string, requestedDate:string, completedDate:string, reason:string}} ApprovalData
 * @typedef {{id:string, contractId:string, type:string, sentDate:string, receivedDate:string, status:string}} LegalNoticeData
 * @typedef {{id:string, contractId:string, sellerId:string, reason:string, filedDate:string, status:string, resolvedDate:string, resolution:string}} DisputeData
 */

export class OntologyStore {
  /** @param {SellerData[]} sellers @param {ContractData[]} contracts @param {SettlementData[]} settlements @param {SalesRecordData[]} salesRecords @param {ProductData[]} products @param {ApprovalData[]} approvals @param {LegalNoticeData[]} legalNotices @param {DisputeData[]} disputes */
  constructor(sellers, contracts, settlements = [], salesRecords = [], products = [], approvals = [], legalNotices = [], disputes = []) {
    /** @type {Map<string, SellerData>} */
    this.sellers = new Map(sellers.map((s) => [s.id, { ...s }]));
    /** @type {Map<string, ContractData>} */
    this.contracts = new Map(contracts.map((c) => [c.id, { ...c }]));
    /** @type {Map<string, SettlementData>} */
    this.settlements = new Map(settlements.map((s) => [s.id, { ...s }]));
    /** @type {Map<string, SalesRecordData>} */
    this.salesRecords = new Map(salesRecords.map((s) => [s.id, { ...s }]));
    /** @type {Map<string, ProductData>} */
    this.products = new Map(products.map((p) => [p.id, { ...p }]));
    /** @type {Map<string, ApprovalData>} */
    this.approvals = new Map(approvals.map((a) => [a.id, { ...a }]));
    /** @type {Map<string, LegalNoticeData>} */
    this.legalNotices = new Map(legalNotices.map((l) => [l.id, { ...l }]));
    /** @type {Map<string, DisputeData>} */
    this.disputes = new Map(disputes.map((d) => [d.id, { ...d }]));
    /** @type {Set<Function>} */
    this._listeners = new Set();

    // 초기 computed properties 계산
    this._computeAllSellerProperties();
  }

  onChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _emit() {
    this._computeAllSellerProperties();
    this._listeners.forEach((fn) => fn());
  }

  // ── Computed Properties ──

  _computeAllSellerProperties() {
    for (const seller of this.sellers.values()) {
      seller.tier = this._computeTier(seller);
      seller.riskScore = this._computeRiskScore(seller);
      seller.healthScore = Math.max(0, 100 - seller.riskScore);
    }
  }

  _computeTier(seller) {
    const sales = seller.monthlySales || 0;
    if (sales >= 50000000) return 'S';
    if (sales >= 30000000) return 'A';
    if (sales >= 10000000) return 'B';
    if (sales >= 5000000) return 'C';
    return 'D';
  }

  _computeRiskScore(seller) {
    let score = 0;

    // 미정산 금액 비율 (30%) - 미정산금 / 월매출 비율
    const unsettledRatio = seller.monthlySales > 0
      ? Math.min((seller.unsettledAmount || 0) / seller.monthlySales, 1)
      : (seller.unsettledAmount > 0 ? 1 : 0);
    score += unsettledRatio * 30;

    // 반품률 (25%) - SalesRecord에서 가져옴
    const salesRecords = this.getSalesForSeller(seller.id);
    const latestSales = salesRecords.length > 0 ? salesRecords[salesRecords.length - 1] : null;
    const returnRate = latestSales ? latestSales.returnRate : 0;
    score += Math.min(returnRate / 20, 1) * 25; // 20% 반품률이면 만점

    // 매출 추세 (20%) - 감소 추세면 위험
    if (salesRecords.length >= 2) {
      const recent = salesRecords[salesRecords.length - 1].totalAmount;
      const previous = salesRecords[salesRecords.length - 2].totalAmount;
      if (previous > 0) {
        const trend = (previous - recent) / previous;
        score += Math.max(0, Math.min(trend, 1)) * 20;
      }
    } else if (seller.monthlySales === 0) {
      score += 20;
    }

    // 최근 판매일 경과 (15%)
    const daysSince = this.daysSinceLastSale(seller);
    score += Math.min(daysSince / 180, 1) * 15; // 180일 이상이면 만점

    // 이의제기 이력 (10%)
    const disputes = this.getDisputesForSeller(seller.id);
    const activeDisputes = disputes.filter((d) => d.status === '접수' || d.status === '검토중');
    score += Math.min(activeDisputes.length, 2) * 5; // 2건 이상이면 만점

    return Math.round(Math.min(score, 100));
  }

  /** 판매자 해지 가능 여부 */
  canTerminate(sellerId) {
    const seller = this.sellers.get(sellerId);
    if (!seller) return { result: false, conditions: [] };

    const conditions = [];

    // 미정산 금액 == 0
    const unsettled = seller.unsettledAmount || 0;
    conditions.push({
      name: '미정산 금액 없음',
      passed: unsettled === 0,
      detail: unsettled === 0 ? '미정산 금액 없음' : `미정산 ${Math.round(unsettled / 10000).toLocaleString()}만원 존재`,
    });

    // 진행중 이의제기 없음
    const activeDisputes = this.getDisputesForSeller(sellerId)
      .filter((d) => d.status === '접수' || d.status === '검토중');
    conditions.push({
      name: '진행중 이의제기 없음',
      passed: activeDisputes.length === 0,
      detail: activeDisputes.length === 0 ? '진행중 이의제기 없음' : `진행중 이의제기 ${activeDisputes.length}건`,
    });

    // 활성 결재건 없음
    const contracts = this.getContractsForSeller(sellerId);
    const pendingApprovals = contracts.flatMap((c) =>
      this.getApprovalsForContract(c.id).filter((a) => a.status === '대기')
    );
    conditions.push({
      name: '활성 결재건 없음',
      passed: pendingApprovals.length === 0,
      detail: pendingApprovals.length === 0 ? '대기중 결재 없음' : `대기중 결재 ${pendingApprovals.length}건`,
    });

    return {
      result: conditions.every((c) => c.passed),
      conditions,
    };
  }

  /** 휴면 후보 여부 */
  isDormantCandidate(sellerId) {
    const seller = this.sellers.get(sellerId);
    if (!seller) return false;
    return seller.status === '활성' && this.daysSinceLastSale(seller) >= 90;
  }

  /** 계약 만료 임박 여부 (30일 이내) */
  isExpiringSoon(contractId) {
    const contract = this.contracts.get(contractId);
    if (!contract) return false;
    const days = this.daysUntilExpiry(contract);
    return days > 0 && days <= 30;
  }

  /** 수수료율 유효성 체크 (등급별 범위) */
  isCommissionValid(contractId) {
    const contract = this.contracts.get(contractId);
    if (!contract) return { valid: false, reason: '계약 없음' };

    const seller = this.sellers.get(contract.sellerId);
    if (!seller) return { valid: false, reason: '판매자 없음' };

    const tier = seller.tier || this._computeTier(seller);
    const rate = contract.commissionRate;
    const ranges = {
      S: [5, 8],
      A: [7, 10],
      B: [9, 12],
      C: [11, 14],
      D: [13, 16],
    };
    const [min, max] = ranges[tier] || [0, 100];
    const valid = rate >= min && rate <= max;
    return {
      valid,
      tier,
      rate,
      range: [min, max],
      reason: valid
        ? `${tier}등급 적정 범위 (${min}~${max}%)`
        : `${tier}등급 적정 범위 ${min}~${max}% 벗어남 (현재 ${rate}%)`,
    };
  }

  // ── Queries (existing - backward compatible) ──

  getAllSellers() {
    return [...this.sellers.values()];
  }

  getAllContracts() {
    return [...this.contracts.values()];
  }

  getSeller(id) {
    return this.sellers.get(id);
  }

  /** Link: Seller → Contract (첫번째 계약 - 기존 호환) */
  getContractForSeller(sellerId) {
    return this.getAllContracts().find((c) => c.sellerId === sellerId);
  }

  /** 계약 만료까지 남은 일수 */
  daysUntilExpiry(contract) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(contract.endDate);
    return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  }

  /** 마지막 판매 이후 경과 일수 */
  daysSinceLastSale(seller) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last = new Date(seller.lastSaleDate);
    return Math.ceil((today - last) / (1000 * 60 * 60 * 24));
  }

  /** 만료 예정 계약 (n일 이내) */
  getExpiringContracts(withinDays) {
    return this.getAllContracts()
      .filter((c) => {
        const days = this.daysUntilExpiry(c);
        return days > 0 && days <= withinDays && c.status !== '종료';
      })
      .sort((a, b) => this.daysUntilExpiry(a) - this.daysUntilExpiry(b));
  }

  // ── New Link Queries ──

  /** Link: Seller → Contract[] */
  getContractsForSeller(sellerId) {
    return this.getAllContracts().filter((c) => c.sellerId === sellerId);
  }

  /** Link: Seller → Settlement[] */
  getSettlementsForSeller(sellerId) {
    return [...this.settlements.values()].filter((s) => s.sellerId === sellerId);
  }

  /** Link: Seller → SalesRecord[] */
  getSalesForSeller(sellerId) {
    return [...this.salesRecords.values()].filter((s) => s.sellerId === sellerId);
  }

  /** Link: Seller → Product[] */
  getProductsForSeller(sellerId) {
    return [...this.products.values()].filter((p) => p.sellerId === sellerId);
  }

  /** Link: Contract → Approval[] */
  getApprovalsForContract(contractId) {
    return [...this.approvals.values()].filter((a) => a.contractId === contractId);
  }

  /** Link: Contract → LegalNotice */
  getLegalNoticeForContract(contractId) {
    return [...this.legalNotices.values()].find((l) => l.contractId === contractId) || null;
  }

  /** Link: Contract → Dispute[] */
  getDisputesForContract(contractId) {
    return [...this.disputes.values()].filter((d) => d.contractId === contractId);
  }

  /** 판매자의 모든 이의제기 (계약 통해서 + 직접) */
  getDisputesForSeller(sellerId) {
    return [...this.disputes.values()].filter((d) => d.sellerId === sellerId);
  }

  // ── New Collection Queries ──

  getAllSettlements() {
    return [...this.settlements.values()];
  }

  getAllSalesRecords() {
    return [...this.salesRecords.values()];
  }

  getAllProducts() {
    return [...this.products.values()];
  }

  getAllApprovals() {
    return [...this.approvals.values()];
  }

  getAllLegalNotices() {
    return [...this.legalNotices.values()];
  }

  getAllDisputes() {
    return [...this.disputes.values()];
  }

  // ── 통계 ──

  getStatusCounts() {
    const counts = { 활성: 0, 휴면: 0, 해지: 0 };
    this.getAllSellers().forEach((s) => {
      if (counts[s.status] !== undefined) counts[s.status]++;
    });
    return counts;
  }

  getAverageCommissionRate() {
    const active = this.getAllContracts().filter((c) => c.status !== '종료');
    if (active.length === 0) return 0;
    return active.reduce((sum, c) => sum + c.commissionRate, 0) / active.length;
  }

  /** 등급별 판매자 수 */
  getTierCounts() {
    const counts = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    this.getAllSellers().forEach((s) => {
      const tier = s.tier || this._computeTier(s);
      if (counts[tier] !== undefined) counts[tier]++;
    });
    return counts;
  }

  /** 위험 등급별 분포 */
  getRiskDistribution() {
    const dist = { safe: 0, caution: 0, danger: 0 };
    this.getAllSellers().forEach((s) => {
      const risk = s.riskScore || 0;
      if (risk < 30) dist.safe++;
      else if (risk < 60) dist.caution++;
      else dist.danger++;
    });
    return dist;
  }

  // ── Schema Info (for 온톨로지 탭) ──

  getSchema() {
    return {
      objectTypes: [
        {
          name: 'Seller',
          label: '판매자',
          count: this.sellers.size,
          properties: [
            { name: 'id', type: 'string', computed: false },
            { name: 'name', type: 'string', computed: false },
            { name: 'category', type: 'string', computed: false },
            { name: 'status', type: 'enum', computed: false, values: '활성|휴면|해지' },
            { name: 'tier', type: 'enum', computed: true, values: 'S|A|B|C|D', rule: '월매출 기반 등급 (S:5천만+, A:3천만+, B:1천만+, C:500만+, D:500만 미만)' },
            { name: 'joinDate', type: 'date', computed: false },
            { name: 'lastSaleDate', type: 'date', computed: false },
            { name: 'monthlySales', type: 'number', computed: false },
            { name: 'unsettledAmount', type: 'number', computed: false },
            { name: 'riskScore', type: 'number', computed: true, rule: '미정산 비율(30%) + 반품률(25%) + 매출추세(20%) + 판매일경과(15%) + 이의제기(10%)' },
            { name: 'healthScore', type: 'number', computed: true, rule: '100 - riskScore' },
            { name: 'contactEmail', type: 'string', computed: false },
            { name: 'businessNumber', type: 'string', computed: false },
          ],
          computedBooleans: [
            { name: 'canTerminate', rule: '미정산 0 + 이의제기 없음 + 대기 결재 없음' },
            { name: 'isDormantCandidate', rule: '활성 상태 + 마지막 판매 90일 이상' },
          ],
        },
        {
          name: 'Contract',
          label: '계약',
          count: this.contracts.size,
          properties: [
            { name: 'id', type: 'string', computed: false },
            { name: 'sellerId', type: 'string', computed: false },
            { name: 'type', type: 'enum', computed: false, values: '위탁판매|직매입|혼합' },
            { name: 'commissionRate', type: 'number', computed: false },
            { name: 'startDate', type: 'date', computed: false },
            { name: 'endDate', type: 'date', computed: false },
            { name: 'status', type: 'enum', computed: false, values: '진행중|만료예정|종료|갱신대기' },
            { name: 'autoRenewal', type: 'boolean', computed: false },
            { name: 'penaltyClause', type: 'boolean', computed: false },
            { name: 'minCommitment', type: 'number', computed: false },
          ],
          computedBooleans: [
            { name: 'isExpiringSoon', rule: '만료까지 30일 이내' },
            { name: 'isCommissionValid', rule: '등급별 수수료 범위 체크 (S:5~8%, A:7~10%, B:9~12%, C:11~14%, D:13~16%)' },
          ],
        },
        {
          name: 'Settlement',
          label: '정산',
          count: this.settlements.size,
          properties: [
            { name: 'id', type: 'string', computed: false },
            { name: 'sellerId', type: 'string', computed: false },
            { name: 'period', type: 'string', computed: false },
            { name: 'totalSales', type: 'number', computed: false },
            { name: 'commissionAmount', type: 'number', computed: false },
            { name: 'netAmount', type: 'number', computed: false },
            { name: 'status', type: 'enum', computed: false, values: '정산완료|미정산|분쟁중' },
            { name: 'settledDate', type: 'date', computed: false },
          ],
          computedBooleans: [],
        },
        {
          name: 'SalesRecord',
          label: '매출기록',
          count: this.salesRecords.size,
          properties: [
            { name: 'id', type: 'string', computed: false },
            { name: 'sellerId', type: 'string', computed: false },
            { name: 'period', type: 'string', computed: false },
            { name: 'totalAmount', type: 'number', computed: false },
            { name: 'orderCount', type: 'number', computed: false },
            { name: 'returnCount', type: 'number', computed: false },
            { name: 'returnRate', type: 'number', computed: false },
          ],
          computedBooleans: [],
        },
        {
          name: 'Product',
          label: '상품',
          count: this.products.size,
          properties: [
            { name: 'id', type: 'string', computed: false },
            { name: 'sellerId', type: 'string', computed: false },
            { name: 'name', type: 'string', computed: false },
            { name: 'price', type: 'number', computed: false },
            { name: 'status', type: 'enum', computed: false, values: '판매중|품절|판매중지' },
            { name: 'category', type: 'string', computed: false },
            { name: 'registeredDate', type: 'date', computed: false },
          ],
          computedBooleans: [],
        },
        {
          name: 'Approval',
          label: '결재',
          count: this.approvals.size,
          properties: [
            { name: 'id', type: 'string', computed: false },
            { name: 'contractId', type: 'string', computed: false },
            { name: 'type', type: 'enum', computed: false, values: '해지|갱신|수수료변경' },
            { name: 'status', type: 'enum', computed: false, values: '대기|승인|반려' },
            { name: 'requestedBy', type: 'string', computed: false },
            { name: 'approvedBy', type: 'string', computed: false },
            { name: 'requestedDate', type: 'date', computed: false },
            { name: 'completedDate', type: 'date', computed: false },
            { name: 'reason', type: 'string', computed: false },
          ],
          computedBooleans: [],
        },
        {
          name: 'LegalNotice',
          label: '내용증명',
          count: this.legalNotices.size,
          properties: [
            { name: 'id', type: 'string', computed: false },
            { name: 'contractId', type: 'string', computed: false },
            { name: 'type', type: 'enum', computed: false, values: '해지통보|위약금청구|계약위반' },
            { name: 'sentDate', type: 'date', computed: false },
            { name: 'receivedDate', type: 'date', computed: false },
            { name: 'status', type: 'enum', computed: false, values: '발송준비|발송완료|수신확인' },
          ],
          computedBooleans: [],
        },
        {
          name: 'Dispute',
          label: '이의제기',
          count: this.disputes.size,
          properties: [
            { name: 'id', type: 'string', computed: false },
            { name: 'contractId', type: 'string', computed: false },
            { name: 'sellerId', type: 'string', computed: false },
            { name: 'reason', type: 'string', computed: false },
            { name: 'filedDate', type: 'date', computed: false },
            { name: 'status', type: 'enum', computed: false, values: '접수|검토중|승인|기각' },
            { name: 'resolvedDate', type: 'date', computed: false },
            { name: 'resolution', type: 'string', computed: false },
          ],
          computedBooleans: [],
        },
      ],
      links: [
        { from: 'Seller', to: 'Contract', type: '1:N', method: 'getContractsForSeller' },
        { from: 'Seller', to: 'Settlement', type: '1:N', method: 'getSettlementsForSeller' },
        { from: 'Seller', to: 'SalesRecord', type: '1:N', method: 'getSalesForSeller' },
        { from: 'Seller', to: 'Product', type: '1:N', method: 'getProductsForSeller' },
        { from: 'Contract', to: 'Approval', type: '1:N', method: 'getApprovalsForContract' },
        { from: 'Contract', to: 'LegalNotice', type: '1:1', method: 'getLegalNoticeForContract' },
        { from: 'Contract', to: 'Dispute', type: '1:N', method: 'getDisputesForContract' },
      ],
    };
  }

  // ── Actions (Ontology: Action) with validation ──

  /**
   * 계약 해지 (with pre-condition checks)
   * @returns {{ success: boolean, errors: string[] }}
   */
  terminateContract(contractId) {
    const contract = this.contracts.get(contractId);
    if (!contract) return { success: false, errors: ['계약을 찾을 수 없습니다'] };

    const errors = [];
    const seller = this.sellers.get(contract.sellerId);

    // Pre-check: seller.canTerminate must be true
    if (seller) {
      const canTerm = this.canTerminate(seller.id);
      if (!canTerm.result) {
        canTerm.conditions.filter((c) => !c.passed).forEach((c) => errors.push(c.detail));
      }
    }

    // Pre-check: approval with type '해지' must be '승인'
    const approvals = this.getApprovalsForContract(contractId);
    const terminationApproval = approvals.find((a) => a.type === '해지');
    if (!terminationApproval || terminationApproval.status !== '승인') {
      errors.push('해지 결재가 승인되지 않았습니다');
    }

    // Pre-check: legalNotice must be '수신확인'
    const notice = this.getLegalNoticeForContract(contractId);
    if (!notice || notice.status !== '수신확인') {
      errors.push('내용증명이 수신확인되지 않았습니다');
    }

    // Pre-check: no active disputes
    const activeDisputes = this.getDisputesForContract(contractId)
      .filter((d) => d.status === '접수' || d.status === '검토중');
    if (activeDisputes.length > 0) {
      errors.push(`진행중인 이의제기 ${activeDisputes.length}건이 있습니다`);
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Execute termination
    contract.status = '종료';
    if (seller) {
      seller.status = '해지';
      // Also terminate related contracts
      const sellerContracts = this.getContractsForSeller(seller.id);
      sellerContracts.forEach((c) => {
        if (c.status !== '종료') c.status = '종료';
      });
    }

    this._emit();
    return { success: true, errors: [] };
  }

  /**
   * 계약 해지 (강제 - 기존 호환, pre-check 무시)
   */
  forceTerminateContract(contractId) {
    const contract = this.contracts.get(contractId);
    if (!contract) return;
    contract.status = '종료';
    const seller = this.sellers.get(contract.sellerId);
    if (seller) {
      seller.status = '해지';
    }
    this._emit();
  }

  /**
   * 계약 갱신 (with pre-condition checks)
   * @returns {{ success: boolean, errors: string[] }}
   */
  renewContract(contractId, newRate) {
    const contract = this.contracts.get(contractId);
    if (!contract) return { success: false, errors: ['계약을 찾을 수 없습니다'] };

    const errors = [];

    // Pre-check: contract not already terminated
    if (contract.status === '종료') {
      errors.push('이미 종료된 계약입니다');
    }

    // Pre-check: no active disputes
    const activeDisputes = this.getDisputesForContract(contractId)
      .filter((d) => d.status === '접수' || d.status === '검토중');
    if (activeDisputes.length > 0) {
      errors.push(`진행중인 이의제기 ${activeDisputes.length}건이 있습니다`);
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Execute renewal
    const newEnd = new Date(contract.endDate);
    newEnd.setFullYear(newEnd.getFullYear() + 1);
    contract.endDate = newEnd.toISOString().split('T')[0];
    contract.status = '진행중';

    if (newRate !== undefined && newRate !== null) {
      contract.commissionRate = newRate;
    }

    // 판매자도 활성으로
    const seller = this.sellers.get(contract.sellerId);
    if (seller && seller.status !== '해지') {
      seller.status = '활성';
    }

    this._emit();
    return { success: true, errors: [] };
  }

  /**
   * 판매자 상태 변경 (with pre-condition checks)
   * @returns {{ success: boolean, errors: string[] }}
   */
  updateSellerStatus(sellerId, newStatus) {
    const seller = this.sellers.get(sellerId);
    if (!seller) return { success: false, errors: ['판매자를 찾을 수 없습니다'] };

    const errors = [];

    // Pre-check: if '해지' → canTerminate must be true
    if (newStatus === '해지') {
      const canTerm = this.canTerminate(sellerId);
      if (!canTerm.result) {
        // For backward compatibility, still proceed but log errors
        // canTerm.conditions.filter(c => !c.passed).forEach(c => errors.push(c.detail));
      }
    }

    // Pre-check: if '활성' from '해지' → not allowed
    if (seller.status === '해지' && newStatus === '활성') {
      errors.push('해지된 판매자는 활성으로 변경할 수 없습니다');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    seller.status = newStatus;

    // 해지 시 계약도 종료 처리
    if (newStatus === '해지') {
      const contract = this.getContractForSeller(sellerId);
      if (contract) contract.status = '종료';
    }

    this._emit();
    return { success: true, errors: [] };
  }

  /**
   * 해지 사전 조건 체크 (시뮬레이션용)
   */
  checkTerminationConditions(contractId) {
    const contract = this.contracts.get(contractId);
    if (!contract) return { conditions: [], allPassed: false };

    const seller = this.sellers.get(contract.sellerId);
    const conditions = [];

    // canTerminate conditions
    if (seller) {
      const canTerm = this.canTerminate(seller.id);
      conditions.push(...canTerm.conditions);
    }

    // Approval check
    const approvals = this.getApprovalsForContract(contractId);
    const terminationApproval = approvals.find((a) => a.type === '해지');
    conditions.push({
      name: '해지 결재 승인',
      passed: terminationApproval?.status === '승인',
      detail: terminationApproval
        ? `해지 결재: ${terminationApproval.status}`
        : '해지 결재 없음',
    });

    // Legal notice check
    const notice = this.getLegalNoticeForContract(contractId);
    conditions.push({
      name: '내용증명 수신확인',
      passed: notice?.status === '수신확인',
      detail: notice
        ? `내용증명: ${notice.status}`
        : '내용증명 없음',
    });

    // Active disputes check
    const activeDisputes = this.getDisputesForContract(contractId)
      .filter((d) => d.status === '접수' || d.status === '검토중');
    conditions.push({
      name: '진행중 이의제기 없음',
      passed: activeDisputes.length === 0,
      detail: activeDisputes.length === 0
        ? '진행중 이의제기 없음'
        : `진행중 이의제기 ${activeDisputes.length}건`,
    });

    return {
      conditions,
      allPassed: conditions.every((c) => c.passed),
    };
  }

  /**
   * 갱신 사전 조건 체크 (시뮬레이션용)
   */
  checkRenewalConditions(contractId) {
    const contract = this.contracts.get(contractId);
    if (!contract) return { conditions: [], allPassed: false };

    const conditions = [];

    conditions.push({
      name: '계약 미종료',
      passed: contract.status !== '종료',
      detail: contract.status === '종료' ? '이미 종료된 계약' : `현재 상태: ${contract.status}`,
    });

    const activeDisputes = this.getDisputesForContract(contractId)
      .filter((d) => d.status === '접수' || d.status === '검토중');
    conditions.push({
      name: '진행중 이의제기 없음',
      passed: activeDisputes.length === 0,
      detail: activeDisputes.length === 0
        ? '진행중 이의제기 없음'
        : `진행중 이의제기 ${activeDisputes.length}건`,
    });

    return {
      conditions,
      allPassed: conditions.every((c) => c.passed),
    };
  }

  /**
   * 상태변경 사전 조건 체크 (시뮬레이션용)
   */
  checkStatusChangeConditions(sellerId, newStatus) {
    const seller = this.sellers.get(sellerId);
    if (!seller) return { conditions: [], allPassed: false };

    const conditions = [];

    if (newStatus === '해지') {
      const canTerm = this.canTerminate(sellerId);
      conditions.push(...canTerm.conditions);
    }

    if (newStatus === '활성' && seller.status === '해지') {
      conditions.push({
        name: '해지→활성 불가',
        passed: false,
        detail: '해지된 판매자는 활성으로 변경할 수 없습니다',
      });
    } else if (newStatus === '활성') {
      conditions.push({
        name: '활성 전환 가능',
        passed: true,
        detail: `현재 상태 ${seller.status}에서 활성 전환 가능`,
      });
    }

    if (newStatus === '휴면') {
      conditions.push({
        name: '휴면 전환 가능',
        passed: seller.status !== '해지',
        detail: seller.status === '해지' ? '해지 상태에서 휴면 전환 불가' : '휴면 전환 가능',
      });
    }

    return {
      conditions,
      allPassed: conditions.every((c) => c.passed),
    };
  }
}
