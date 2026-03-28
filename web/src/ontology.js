/**
 * Ontology Layer (Palantir Foundry Concept)
 * - Object Types: Seller, Contract
 * - Link: Seller ↔ Contract (1:N)
 * - Actions: 상태변경, 계약갱신, 해지
 */

/**
 * @typedef {{id:string, name:string, category:string, status:string, joinDate:string, lastSaleDate:string, monthlySales:number}} SellerData
 * @typedef {{id:string, sellerId:string, commissionRate:number, startDate:string, endDate:string, status:string}} ContractData
 */

export class OntologyStore {
  /** @param {SellerData[]} sellers @param {ContractData[]} contracts */
  constructor(sellers, contracts) {
    /** @type {Map<string, SellerData>} */
    this.sellers = new Map(sellers.map((s) => [s.id, { ...s }]));
    /** @type {Map<string, ContractData>} */
    this.contracts = new Map(contracts.map((c) => [c.id, { ...c }]));
    /** @type {Set<Function>} */
    this._listeners = new Set();
  }

  onChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _emit() {
    this._listeners.forEach((fn) => fn());
  }

  // ── Queries ──

  getAllSellers() {
    return [...this.sellers.values()];
  }

  getAllContracts() {
    return [...this.contracts.values()];
  }

  getSeller(id) {
    return this.sellers.get(id);
  }

  /** Link: Seller → Contract */
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

  // ── Actions (Ontology: Action) ──

  updateSellerStatus(sellerId, newStatus) {
    const seller = this.sellers.get(sellerId);
    if (!seller) return;
    seller.status = newStatus;

    // 해지 시 계약도 종료 처리
    if (newStatus === '해지') {
      const contract = this.getContractForSeller(sellerId);
      if (contract) contract.status = '종료';
    }

    this._emit();
  }

  renewContract(contractId) {
    const contract = this.contracts.get(contractId);
    if (!contract) return;

    const newEnd = new Date(contract.endDate);
    newEnd.setFullYear(newEnd.getFullYear() + 1);
    contract.endDate = newEnd.toISOString().split('T')[0];
    contract.status = '진행중';

    // 판매자도 활성으로
    const seller = this.sellers.get(contract.sellerId);
    if (seller && seller.status !== '해지') {
      seller.status = '활성';
    }

    this._emit();
  }

  terminateContract(contractId) {
    const contract = this.contracts.get(contractId);
    if (!contract) return;
    contract.status = '종료';
    this.updateSellerStatus(contract.sellerId, '해지');
  }
}
