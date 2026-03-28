/**
 * Mock Data Layer
 * Ontology: Object Types - Seller, Contract
 * Ontology: Link Types - Seller ↔ Contract
 */

// 오늘 날짜 기준으로 상대 날짜 생성
const today = new Date();
const d = (daysOffset) => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

/** @type {import('./ontology.js').SellerData[]} */
export const sellers = [
  { id: 'S001', name: '뷰티하우스', category: '뷰티', status: '활성', joinDate: '2023-03-15', lastSaleDate: d(-2), monthlySales: 45200000 },
  { id: 'S002', name: '스킨랩코리아', category: '뷰티', status: '활성', joinDate: '2023-06-01', lastSaleDate: d(-5), monthlySales: 32800000 },
  { id: 'S003', name: '오가닉팜', category: '식품', status: '활성', joinDate: '2022-11-20', lastSaleDate: d(-1), monthlySales: 67500000 },
  { id: 'S004', name: '맛있는제과', category: '식품', status: '활성', joinDate: '2023-01-10', lastSaleDate: d(-3), monthlySales: 28900000 },
  { id: 'S005', name: '홈리빙스토어', category: '리빙', status: '활성', joinDate: '2023-04-22', lastSaleDate: d(-7), monthlySales: 19300000 },
  { id: 'S006', name: '코지홈데코', category: '리빙', status: '휴면', joinDate: '2022-08-15', lastSaleDate: d(-120), monthlySales: 2100000 },
  { id: 'S007', name: '패션위크', category: '패션', status: '활성', joinDate: '2023-02-28', lastSaleDate: d(-4), monthlySales: 51600000 },
  { id: 'S008', name: '스타일온', category: '패션', status: '휴면', joinDate: '2022-09-10', lastSaleDate: d(-95), monthlySales: 3200000 },
  { id: 'S009', name: '건강한하루', category: '식품', status: '활성', joinDate: '2023-07-01', lastSaleDate: d(-2), monthlySales: 41200000 },
  { id: 'S010', name: '프레시가든', category: '식품', status: '해지', joinDate: '2022-05-10', lastSaleDate: d(-200), monthlySales: 0 },
  { id: 'S011', name: '럭셔리뷰티', category: '뷰티', status: '활성', joinDate: '2023-08-15', lastSaleDate: d(-1), monthlySales: 78300000 },
  { id: 'S012', name: '데일리룩', category: '패션', status: '활성', joinDate: '2023-05-20', lastSaleDate: d(-6), monthlySales: 22700000 },
  { id: 'S013', name: '인테리어플러스', category: '리빙', status: '휴면', joinDate: '2022-12-01', lastSaleDate: d(-110), monthlySales: 1500000 },
  { id: 'S014', name: '네이처푸드', category: '식품', status: '활성', joinDate: '2023-09-01', lastSaleDate: d(-3), monthlySales: 35600000 },
  { id: 'S015', name: '트렌드샵', category: '패션', status: '해지', joinDate: '2022-07-20', lastSaleDate: d(-180), monthlySales: 0 },
];

/** @type {import('./ontology.js').ContractData[]} */
export const contracts = [
  { id: 'C001', sellerId: 'S001', commissionRate: 12, startDate: '2024-04-01', endDate: d(15), status: '진행중' },
  { id: 'C002', sellerId: 'S002', commissionRate: 10, startDate: '2024-06-01', endDate: d(25), status: '만료예정' },
  { id: 'C003', sellerId: 'S003', commissionRate: 8, startDate: '2024-01-01', endDate: d(55), status: '진행중' },
  { id: 'C004', sellerId: 'S004', commissionRate: 11, startDate: '2024-03-15', endDate: d(10), status: '만료예정' },
  { id: 'C005', sellerId: 'S005', commissionRate: 9, startDate: '2024-05-01', endDate: d(75), status: '진행중' },
  { id: 'C006', sellerId: 'S006', commissionRate: 13, startDate: '2023-08-01', endDate: d(-10), status: '종료' },
  { id: 'C007', sellerId: 'S007', commissionRate: 10, startDate: '2024-03-01', endDate: d(20), status: '만료예정' },
  { id: 'C008', sellerId: 'S008', commissionRate: 14, startDate: '2023-09-01', endDate: d(8), status: '갱신대기' },
  { id: 'C009', sellerId: 'S009', commissionRate: 7, startDate: '2024-07-01', endDate: d(85), status: '진행중' },
  { id: 'C010', sellerId: 'S010', commissionRate: 12, startDate: '2023-01-01', endDate: d(-60), status: '종료' },
  { id: 'C011', sellerId: 'S011', commissionRate: 9, startDate: '2024-08-01', endDate: d(40), status: '진행중' },
  { id: 'C012', sellerId: 'S012', commissionRate: 11, startDate: '2024-05-15', endDate: d(65), status: '진행중' },
  { id: 'C013', sellerId: 'S013', commissionRate: 15, startDate: '2023-12-01', endDate: d(5), status: '갱신대기' },
  { id: 'C014', sellerId: 'S014', commissionRate: 8, startDate: '2024-09-01', endDate: d(50), status: '진행중' },
  { id: 'C015', sellerId: 'S015', commissionRate: 13, startDate: '2023-04-01', endDate: d(-90), status: '종료' },
];
