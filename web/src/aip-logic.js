/**
 * AIP Logic Layer (Palantir AIP Concept)
 * 자동화 규칙 엔진 시뮬레이션
 * - 규칙 기반 판매자/계약 상태 추천
 */

/**
 * @typedef {'휴면전환'|'자동갱신'|'해지권고'} SuggestionType
 * @typedef {{type: SuggestionType, sellerId: string, contractId?: string, reason: string}} Suggestion
 */

/**
 * AIP Logic 규칙을 실행하여 제안 목록 생성
 * @param {import('./ontology.js').OntologyStore} store
 * @returns {Suggestion[]}
 */
export function runAIPRules(store) {
  /** @type {Suggestion[]} */
  const suggestions = [];

  for (const seller of store.getAllSellers()) {
    if (seller.status === '해지') continue;

    const contract = store.getContractForSeller(seller.id);
    const daysSinceSale = store.daysSinceLastSale(seller);
    const daysToExpiry = contract ? store.daysUntilExpiry(contract) : Infinity;

    // 규칙 1: 90일 이상 판매 없음 → 휴면 전환 제안
    if (seller.status === '활성' && daysSinceSale >= 90) {
      suggestions.push({
        type: '휴면전환',
        sellerId: seller.id,
        reason: `${daysSinceSale}일간 판매 실적 없음`,
      });
    }

    // 규칙 2: 30일 내 만료 + 매출 양호(월 2천만 이상) → 자동 갱신
    if (contract && daysToExpiry > 0 && daysToExpiry <= 30 && seller.monthlySales >= 20000000) {
      suggestions.push({
        type: '자동갱신',
        sellerId: seller.id,
        contractId: contract.id,
        reason: `만료 ${daysToExpiry}일 전, 월 매출 ${(seller.monthlySales / 10000).toLocaleString()}만원`,
      });
    }

    // 규칙 3: 30일 내 만료 + 매출 저조(월 500만 미만) → 해지 권고
    if (contract && daysToExpiry > 0 && daysToExpiry <= 30 && seller.monthlySales < 5000000) {
      suggestions.push({
        type: '해지권고',
        sellerId: seller.id,
        contractId: contract.id,
        reason: `만료 ${daysToExpiry}일 전, 월 매출 ${(seller.monthlySales / 10000).toLocaleString()}만원 (저조)`,
      });
    }
  }

  return suggestions;
}

/**
 * 제안 적용
 * @param {import('./ontology.js').OntologyStore} store
 * @param {Suggestion} suggestion
 */
export function applySuggestion(store, suggestion) {
  switch (suggestion.type) {
    case '휴면전환':
      store.updateSellerStatus(suggestion.sellerId, '휴면');
      break;
    case '자동갱신':
      if (suggestion.contractId) store.renewContract(suggestion.contractId);
      break;
    case '해지권고':
      if (suggestion.contractId) store.terminateContract(suggestion.contractId);
      break;
  }
}
