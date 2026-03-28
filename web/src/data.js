/**
 * Mock Data Layer
 * Ontology: Object Types - Seller, Contract, Settlement, SalesRecord, Product, Approval, LegalNotice, Dispute
 * Ontology: Link Types - Seller ↔ Contract, Seller ↔ Settlement, etc.
 */

// 오늘 날짜 기준으로 상대 날짜 생성
const today = new Date();
const d = (daysOffset) => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

// 과거 월 기준 period 생성
const period = (monthsAgo) => {
  const date = new Date(today);
  date.setMonth(date.getMonth() - monthsAgo);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/** @type {import('./ontology.js').SellerData[]} */
export const sellers = [
  { id: 'S001', name: '뷰티하우스', category: '뷰티', status: '활성', joinDate: '2023-03-15', lastSaleDate: d(-2), monthlySales: 45200000, unsettledAmount: 0, contactEmail: 'beauty@beautyhouse.co.kr', businessNumber: '123-45-67890' },
  { id: 'S002', name: '스킨랩코리아', category: '뷰티', status: '활성', joinDate: '2023-06-01', lastSaleDate: d(-5), monthlySales: 32800000, unsettledAmount: 4200000, contactEmail: 'info@skinlab.kr', businessNumber: '234-56-78901' },
  { id: 'S003', name: '오가닉팜', category: '식품', status: '활성', joinDate: '2022-11-20', lastSaleDate: d(-1), monthlySales: 67500000, unsettledAmount: 0, contactEmail: 'farm@organicfarm.kr', businessNumber: '345-67-89012' },
  { id: 'S004', name: '맛있는제과', category: '식품', status: '활성', joinDate: '2023-01-10', lastSaleDate: d(-3), monthlySales: 28900000, unsettledAmount: 1500000, contactEmail: 'hello@tastysnack.kr', businessNumber: '456-78-90123' },
  { id: 'S005', name: '홈리빙스토어', category: '리빙', status: '활성', joinDate: '2023-04-22', lastSaleDate: d(-7), monthlySales: 19300000, unsettledAmount: 0, contactEmail: 'cs@homeliving.kr', businessNumber: '567-89-01234' },
  { id: 'S006', name: '코지홈데코', category: '리빙', status: '휴면', joinDate: '2022-08-15', lastSaleDate: d(-120), monthlySales: 2100000, unsettledAmount: 890000, contactEmail: 'deco@cozyhome.kr', businessNumber: '678-90-12345' },
  { id: 'S007', name: '패션위크', category: '패션', status: '활성', joinDate: '2023-02-28', lastSaleDate: d(-4), monthlySales: 51600000, unsettledAmount: 0, contactEmail: 'shop@fashionweek.kr', businessNumber: '789-01-23456' },
  { id: 'S008', name: '스타일온', category: '패션', status: '휴면', joinDate: '2022-09-10', lastSaleDate: d(-95), monthlySales: 3200000, unsettledAmount: 2300000, contactEmail: 'style@styleon.kr', businessNumber: '890-12-34567' },
  { id: 'S009', name: '건강한하루', category: '식품', status: '활성', joinDate: '2023-07-01', lastSaleDate: d(-2), monthlySales: 41200000, unsettledAmount: 0, contactEmail: 'health@healthyday.kr', businessNumber: '901-23-45678' },
  { id: 'S010', name: '프레시가든', category: '식품', status: '해지', joinDate: '2022-05-10', lastSaleDate: d(-200), monthlySales: 0, unsettledAmount: 0, contactEmail: 'fresh@freshgarden.kr', businessNumber: '012-34-56789' },
  { id: 'S011', name: '럭셔리뷰티', category: '뷰티', status: '활성', joinDate: '2023-08-15', lastSaleDate: d(-1), monthlySales: 78300000, unsettledAmount: 0, contactEmail: 'luxury@luxurybeauty.kr', businessNumber: '135-79-24680' },
  { id: 'S012', name: '데일리룩', category: '패션', status: '활성', joinDate: '2023-05-20', lastSaleDate: d(-6), monthlySales: 22700000, unsettledAmount: 0, contactEmail: 'look@dailylook.kr', businessNumber: '246-80-13579' },
  { id: 'S013', name: '인테리어플러스', category: '리빙', status: '휴면', joinDate: '2022-12-01', lastSaleDate: d(-110), monthlySales: 1500000, unsettledAmount: 560000, contactEmail: 'plus@interiorplus.kr', businessNumber: '357-91-24680' },
  { id: 'S014', name: '네이처푸드', category: '식품', status: '활성', joinDate: '2023-09-01', lastSaleDate: d(-3), monthlySales: 35600000, unsettledAmount: 0, contactEmail: 'nature@naturefood.kr', businessNumber: '468-02-35791' },
  { id: 'S015', name: '트렌드샵', category: '패션', status: '해지', joinDate: '2022-07-20', lastSaleDate: d(-180), monthlySales: 0, unsettledAmount: 0, contactEmail: 'trend@trendshop.kr', businessNumber: '579-13-46802' },
];

/** @type {import('./ontology.js').ContractData[]} */
export const contracts = [
  { id: 'C001', sellerId: 'S001', type: '위탁판매', commissionRate: 12, startDate: '2024-04-01', endDate: d(15), status: '진행중', autoRenewal: true, penaltyClause: false, minCommitment: 30000000 },
  { id: 'C002', sellerId: 'S002', type: '위탁판매', commissionRate: 10, startDate: '2024-06-01', endDate: d(25), status: '만료예정', autoRenewal: false, penaltyClause: true, minCommitment: 20000000 },
  { id: 'C003', sellerId: 'S003', type: '혼합', commissionRate: 8, startDate: '2024-01-01', endDate: d(55), status: '진행중', autoRenewal: true, penaltyClause: false, minCommitment: 50000000 },
  { id: 'C004', sellerId: 'S004', type: '위탁판매', commissionRate: 11, startDate: '2024-03-15', endDate: d(10), status: '만료예정', autoRenewal: false, penaltyClause: false, minCommitment: 15000000 },
  { id: 'C005', sellerId: 'S005', type: '위탁판매', commissionRate: 9, startDate: '2024-05-01', endDate: d(75), status: '진행중', autoRenewal: true, penaltyClause: false, minCommitment: 10000000 },
  { id: 'C006', sellerId: 'S006', type: '위탁판매', commissionRate: 13, startDate: '2023-08-01', endDate: d(-10), status: '종료', autoRenewal: false, penaltyClause: true, minCommitment: 5000000 },
  { id: 'C007', sellerId: 'S007', type: '혼합', commissionRate: 10, startDate: '2024-03-01', endDate: d(20), status: '만료예정', autoRenewal: true, penaltyClause: false, minCommitment: 40000000 },
  { id: 'C008', sellerId: 'S008', type: '위탁판매', commissionRate: 14, startDate: '2023-09-01', endDate: d(8), status: '갱신대기', autoRenewal: false, penaltyClause: true, minCommitment: 5000000 },
  { id: 'C009', sellerId: 'S009', type: '직매입', commissionRate: 7, startDate: '2024-07-01', endDate: d(85), status: '진행중', autoRenewal: true, penaltyClause: false, minCommitment: 30000000 },
  { id: 'C010', sellerId: 'S010', type: '위탁판매', commissionRate: 12, startDate: '2023-01-01', endDate: d(-60), status: '종료', autoRenewal: false, penaltyClause: false, minCommitment: 10000000 },
  { id: 'C011', sellerId: 'S011', type: '혼합', commissionRate: 9, startDate: '2024-08-01', endDate: d(40), status: '진행중', autoRenewal: true, penaltyClause: false, minCommitment: 60000000 },
  { id: 'C012', sellerId: 'S012', type: '위탁판매', commissionRate: 11, startDate: '2024-05-15', endDate: d(65), status: '진행중', autoRenewal: false, penaltyClause: false, minCommitment: 15000000 },
  { id: 'C013', sellerId: 'S013', type: '위탁판매', commissionRate: 15, startDate: '2023-12-01', endDate: d(5), status: '갱신대기', autoRenewal: false, penaltyClause: true, minCommitment: 3000000 },
  { id: 'C014', sellerId: 'S014', type: '직매입', commissionRate: 8, startDate: '2024-09-01', endDate: d(50), status: '진행중', autoRenewal: true, penaltyClause: false, minCommitment: 25000000 },
  { id: 'C015', sellerId: 'S015', type: '위탁판매', commissionRate: 13, startDate: '2023-04-01', endDate: d(-90), status: '종료', autoRenewal: false, penaltyClause: false, minCommitment: 8000000 },
];

/** @type {import('./ontology.js').SettlementData[]} */
export const settlements = [
  // S001 뷰티하우스 - 3건 (모두 정산완료)
  { id: 'ST001', sellerId: 'S001', period: period(1), totalSales: 45200000, commissionAmount: 5424000, netAmount: 39776000, status: '정산완료', settledDate: d(-5) },
  { id: 'ST002', sellerId: 'S001', period: period(2), totalSales: 43800000, commissionAmount: 5256000, netAmount: 38544000, status: '정산완료', settledDate: d(-35) },
  // S002 스킨랩코리아 - 3건 (1건 미정산)
  { id: 'ST003', sellerId: 'S002', period: period(1), totalSales: 32800000, commissionAmount: 3280000, netAmount: 29520000, status: '미정산', settledDate: '' },
  { id: 'ST004', sellerId: 'S002', period: period(2), totalSales: 30500000, commissionAmount: 3050000, netAmount: 27450000, status: '정산완료', settledDate: d(-32) },
  { id: 'ST005', sellerId: 'S002', period: period(3), totalSales: 28900000, commissionAmount: 2890000, netAmount: 26010000, status: '정산완료', settledDate: d(-63) },
  // S003 오가닉팜 - 2건
  { id: 'ST006', sellerId: 'S003', period: period(1), totalSales: 67500000, commissionAmount: 5400000, netAmount: 62100000, status: '정산완료', settledDate: d(-4) },
  { id: 'ST007', sellerId: 'S003', period: period(2), totalSales: 65200000, commissionAmount: 5216000, netAmount: 59984000, status: '정산완료', settledDate: d(-34) },
  // S004 맛있는제과 - 2건 (1건 미정산)
  { id: 'ST008', sellerId: 'S004', period: period(1), totalSales: 28900000, commissionAmount: 3179000, netAmount: 25721000, status: '미정산', settledDate: '' },
  { id: 'ST009', sellerId: 'S004', period: period(2), totalSales: 27100000, commissionAmount: 2981000, netAmount: 24119000, status: '정산완료', settledDate: d(-33) },
  // S005 홈리빙스토어 - 2건
  { id: 'ST010', sellerId: 'S005', period: period(1), totalSales: 19300000, commissionAmount: 1737000, netAmount: 17563000, status: '정산완료', settledDate: d(-6) },
  { id: 'ST011', sellerId: 'S005', period: period(2), totalSales: 18500000, commissionAmount: 1665000, netAmount: 16835000, status: '정산완료', settledDate: d(-37) },
  // S006 코지홈데코 - 2건 (1건 미정산)
  { id: 'ST012', sellerId: 'S006', period: period(4), totalSales: 2100000, commissionAmount: 273000, netAmount: 1827000, status: '미정산', settledDate: '' },
  { id: 'ST013', sellerId: 'S006', period: period(5), totalSales: 3400000, commissionAmount: 442000, netAmount: 2958000, status: '정산완료', settledDate: d(-120) },
  // S007 패션위크 - 2건
  { id: 'ST014', sellerId: 'S007', period: period(1), totalSales: 51600000, commissionAmount: 5160000, netAmount: 46440000, status: '정산완료', settledDate: d(-3) },
  { id: 'ST015', sellerId: 'S007', period: period(2), totalSales: 49800000, commissionAmount: 4980000, netAmount: 44820000, status: '정산완료', settledDate: d(-33) },
  // S008 스타일온 - 2건 (1건 분쟁중)
  { id: 'ST016', sellerId: 'S008', period: period(3), totalSales: 3200000, commissionAmount: 448000, netAmount: 2752000, status: '분쟁중', settledDate: '' },
  { id: 'ST017', sellerId: 'S008', period: period(4), totalSales: 4100000, commissionAmount: 574000, netAmount: 3526000, status: '정산완료', settledDate: d(-95) },
  // S009 건강한하루 - 2건
  { id: 'ST018', sellerId: 'S009', period: period(1), totalSales: 41200000, commissionAmount: 2884000, netAmount: 38316000, status: '정산완료', settledDate: d(-4) },
  { id: 'ST019', sellerId: 'S009', period: period(2), totalSales: 39500000, commissionAmount: 2765000, netAmount: 36735000, status: '정산완료', settledDate: d(-35) },
  // S011 럭셔리뷰티 - 2건
  { id: 'ST020', sellerId: 'S011', period: period(1), totalSales: 78300000, commissionAmount: 7047000, netAmount: 71253000, status: '정산완료', settledDate: d(-2) },
  { id: 'ST021', sellerId: 'S011', period: period(2), totalSales: 75600000, commissionAmount: 6804000, netAmount: 68796000, status: '정산완료', settledDate: d(-32) },
  // S012 데일리룩 - 2건
  { id: 'ST022', sellerId: 'S012', period: period(1), totalSales: 22700000, commissionAmount: 2497000, netAmount: 20203000, status: '정산완료', settledDate: d(-5) },
  { id: 'ST023', sellerId: 'S012', period: period(2), totalSales: 21800000, commissionAmount: 2398000, netAmount: 19402000, status: '정산완료', settledDate: d(-36) },
  // S013 인테리어플러스 - 2건 (1건 미정산)
  { id: 'ST024', sellerId: 'S013', period: period(4), totalSales: 1500000, commissionAmount: 225000, netAmount: 1275000, status: '미정산', settledDate: '' },
  { id: 'ST025', sellerId: 'S013', period: period(5), totalSales: 2800000, commissionAmount: 420000, netAmount: 2380000, status: '정산완료', settledDate: d(-130) },
  // S014 네이처푸드 - 2건
  { id: 'ST026', sellerId: 'S014', period: period(1), totalSales: 35600000, commissionAmount: 2848000, netAmount: 32752000, status: '정산완료', settledDate: d(-3) },
  { id: 'ST027', sellerId: 'S014', period: period(2), totalSales: 33200000, commissionAmount: 2656000, netAmount: 30544000, status: '정산완료', settledDate: d(-34) },
  // S010 프레시가든 - 1건 (해지 전)
  { id: 'ST028', sellerId: 'S010', period: period(7), totalSales: 8500000, commissionAmount: 1020000, netAmount: 7480000, status: '정산완료', settledDate: d(-180) },
  // S015 트렌드샵 - 1건 (해지 전)
  { id: 'ST029', sellerId: 'S015', period: period(6), totalSales: 6200000, commissionAmount: 806000, netAmount: 5394000, status: '정산완료', settledDate: d(-150) },
  // S004 추가 미정산
  { id: 'ST030', sellerId: 'S004', period: period(3), totalSales: 25800000, commissionAmount: 2838000, netAmount: 22962000, status: '정산완료', settledDate: d(-64) },
];

/** @type {import('./ontology.js').SalesRecordData[]} */
export const salesRecords = [
  // S001 뷰티하우스
  { id: 'SR001', sellerId: 'S001', period: period(1), totalAmount: 45200000, orderCount: 1230, returnCount: 45, returnRate: 3.7 },
  { id: 'SR002', sellerId: 'S001', period: period(2), totalAmount: 43800000, orderCount: 1180, returnCount: 38, returnRate: 3.2 },
  // S002 스킨랩코리아
  { id: 'SR003', sellerId: 'S002', period: period(1), totalAmount: 32800000, orderCount: 890, returnCount: 62, returnRate: 7.0 },
  { id: 'SR004', sellerId: 'S002', period: period(2), totalAmount: 30500000, orderCount: 820, returnCount: 41, returnRate: 5.0 },
  // S003 오가닉팜
  { id: 'SR005', sellerId: 'S003', period: period(1), totalAmount: 67500000, orderCount: 2150, returnCount: 32, returnRate: 1.5 },
  { id: 'SR006', sellerId: 'S003', period: period(2), totalAmount: 65200000, orderCount: 2080, returnCount: 29, returnRate: 1.4 },
  // S004 맛있는제과
  { id: 'SR007', sellerId: 'S004', period: period(1), totalAmount: 28900000, orderCount: 950, returnCount: 28, returnRate: 2.9 },
  { id: 'SR008', sellerId: 'S004', period: period(2), totalAmount: 27100000, orderCount: 880, returnCount: 22, returnRate: 2.5 },
  // S005 홈리빙스토어
  { id: 'SR009', sellerId: 'S005', period: period(1), totalAmount: 19300000, orderCount: 410, returnCount: 35, returnRate: 8.5 },
  { id: 'SR010', sellerId: 'S005', period: period(2), totalAmount: 18500000, orderCount: 390, returnCount: 28, returnRate: 7.2 },
  // S007 패션위크
  { id: 'SR011', sellerId: 'S007', period: period(1), totalAmount: 51600000, orderCount: 1580, returnCount: 142, returnRate: 9.0 },
  { id: 'SR012', sellerId: 'S007', period: period(2), totalAmount: 49800000, orderCount: 1520, returnCount: 122, returnRate: 8.0 },
  // S009 건강한하루
  { id: 'SR013', sellerId: 'S009', period: period(1), totalAmount: 41200000, orderCount: 1350, returnCount: 27, returnRate: 2.0 },
  { id: 'SR014', sellerId: 'S009', period: period(2), totalAmount: 39500000, orderCount: 1280, returnCount: 19, returnRate: 1.5 },
  // S011 럭셔리뷰티
  { id: 'SR015', sellerId: 'S011', period: period(1), totalAmount: 78300000, orderCount: 980, returnCount: 15, returnRate: 1.5 },
  { id: 'SR016', sellerId: 'S011', period: period(2), totalAmount: 75600000, orderCount: 950, returnCount: 12, returnRate: 1.3 },
  // S012 데일리룩
  { id: 'SR017', sellerId: 'S012', period: period(1), totalAmount: 22700000, orderCount: 680, returnCount: 78, returnRate: 11.5 },
  { id: 'SR018', sellerId: 'S012', period: period(2), totalAmount: 21800000, orderCount: 650, returnCount: 52, returnRate: 8.0 },
  // S014 네이처푸드
  { id: 'SR019', sellerId: 'S014', period: period(1), totalAmount: 35600000, orderCount: 1100, returnCount: 22, returnRate: 2.0 },
  { id: 'SR020', sellerId: 'S014', period: period(2), totalAmount: 33200000, orderCount: 1020, returnCount: 18, returnRate: 1.8 },
];

/** @type {import('./ontology.js').ProductData[]} */
export const products = [
  // S001 뷰티하우스
  { id: 'P001', sellerId: 'S001', name: '수분크림 500ml', price: 32000, status: '판매중', category: '스킨케어', registeredDate: '2023-05-10' },
  { id: 'P002', sellerId: 'S001', name: '비타민C 세럼', price: 28000, status: '판매중', category: '스킨케어', registeredDate: '2023-08-20' },
  // S002 스킨랩코리아
  { id: 'P003', sellerId: 'S002', name: '히알루론산 앰플', price: 45000, status: '판매중', category: '앰플', registeredDate: '2023-07-15' },
  { id: 'P004', sellerId: 'S002', name: '선크림 SPF50+', price: 22000, status: '품절', category: '선케어', registeredDate: '2023-09-01' },
  // S003 오가닉팜
  { id: 'P005', sellerId: 'S003', name: '유기농 사과즙 30포', price: 35000, status: '판매중', category: '건강즙', registeredDate: '2022-12-01' },
  { id: 'P006', sellerId: 'S003', name: '유기농 양배추즙 30포', price: 32000, status: '판매중', category: '건강즙', registeredDate: '2023-02-15' },
  { id: 'P007', sellerId: 'S003', name: '유기농 당근주스 1L', price: 12000, status: '판매중', category: '주스', registeredDate: '2023-06-10' },
  // S004 맛있는제과
  { id: 'P008', sellerId: 'S004', name: '수제 쿠키 세트', price: 18000, status: '판매중', category: '쿠키', registeredDate: '2023-03-20' },
  // S005 홈리빙스토어
  { id: 'P009', sellerId: 'S005', name: '무선 테이블 램프', price: 45000, status: '판매중', category: '조명', registeredDate: '2023-05-30' },
  { id: 'P010', sellerId: 'S005', name: '캔들 홀더 세트', price: 28000, status: '판매중', category: '인테리어', registeredDate: '2023-07-22' },
  // S007 패션위크
  { id: 'P011', sellerId: 'S007', name: '오버사이즈 블레이저', price: 89000, status: '판매중', category: '아우터', registeredDate: '2023-09-01' },
  { id: 'P012', sellerId: 'S007', name: '와이드 데님 팬츠', price: 65000, status: '판매중', category: '하의', registeredDate: '2023-10-15' },
  { id: 'P013', sellerId: 'S007', name: '캐시미어 니트', price: 120000, status: '품절', category: '상의', registeredDate: '2023-11-01' },
  // S009 건강한하루
  { id: 'P014', sellerId: 'S009', name: '프로바이오틱스 60캡슐', price: 42000, status: '판매중', category: '건강식품', registeredDate: '2023-08-10' },
  { id: 'P015', sellerId: 'S009', name: '오메가3 90캡슐', price: 38000, status: '판매중', category: '건강식품', registeredDate: '2023-09-05' },
  // S011 럭셔리뷰티
  { id: 'P016', sellerId: 'S011', name: '프리미엄 에센스 50ml', price: 98000, status: '판매중', category: '에센스', registeredDate: '2023-09-20' },
  { id: 'P017', sellerId: 'S011', name: '안티에이징 크림', price: 150000, status: '판매중', category: '스킨케어', registeredDate: '2023-10-10' },
  // S012 데일리룩
  { id: 'P018', sellerId: 'S012', name: '데일리 티셔츠 3팩', price: 35000, status: '판매중', category: '상의', registeredDate: '2023-06-15' },
  { id: 'P019', sellerId: 'S012', name: '슬랙스 팬츠', price: 42000, status: '판매중지', category: '하의', registeredDate: '2023-07-20' },
  // S013 인테리어플러스
  { id: 'P020', sellerId: 'S013', name: '벽걸이 선반', price: 55000, status: '판매중지', category: '가구', registeredDate: '2023-01-10' },
  // S014 네이처푸드
  { id: 'P021', sellerId: 'S014', name: '곱창김 세트', price: 15000, status: '판매중', category: '김/반찬', registeredDate: '2023-10-01' },
  { id: 'P022', sellerId: 'S014', name: '들기름 500ml', price: 22000, status: '판매중', category: '식용유', registeredDate: '2023-10-15' },
  // S006 코지홈데코
  { id: 'P023', sellerId: 'S006', name: '아로마 디퓨저', price: 38000, status: '판매중지', category: '방향제', registeredDate: '2022-10-01' },
  // S008 스타일온
  { id: 'P024', sellerId: 'S008', name: '트렌치 코트', price: 110000, status: '판매중지', category: '아우터', registeredDate: '2022-11-15' },
  { id: 'P025', sellerId: 'S008', name: '체크 셔츠', price: 45000, status: '판매중지', category: '상의', registeredDate: '2023-01-20' },
];

/** @type {import('./ontology.js').ApprovalData[]} */
export const approvals = [
  { id: 'AP001', contractId: 'C006', type: '해지', status: '승인', requestedBy: '김담당', approvedBy: '이팀장', requestedDate: d(-30), completedDate: d(-28), reason: '판매자 휴면 장기화 (120일 이상 판매 없음)' },
  { id: 'AP002', contractId: 'C008', type: '갱신', status: '대기', requestedBy: '박담당', approvedBy: '', requestedDate: d(-5), completedDate: '', reason: '판매자 갱신 요청, 수수료율 조정 검토 필요' },
  { id: 'AP003', contractId: 'C013', type: '해지', status: '대기', requestedBy: '최담당', approvedBy: '', requestedDate: d(-3), completedDate: '', reason: '판매자 휴면 110일, 미정산 존재' },
  { id: 'AP004', contractId: 'C010', type: '해지', status: '승인', requestedBy: '김담당', approvedBy: '이팀장', requestedDate: d(-90), completedDate: d(-88), reason: '판매자 매출 저조 및 장기 미활동' },
  { id: 'AP005', contractId: 'C002', type: '수수료변경', status: '반려', requestedBy: '정담당', approvedBy: '이팀장', requestedDate: d(-15), completedDate: d(-12), reason: '수수료 8%로 인하 요청 - 등급 기준 미달' },
];

/** @type {import('./ontology.js').LegalNoticeData[]} */
export const legalNotices = [
  { id: 'LN001', contractId: 'C006', type: '해지통보', sentDate: d(-25), receivedDate: d(-22), status: '수신확인' },
  { id: 'LN002', contractId: 'C010', type: '해지통보', sentDate: d(-85), receivedDate: d(-82), status: '수신확인' },
  { id: 'LN003', contractId: 'C013', type: '해지통보', sentDate: '', receivedDate: '', status: '발송준비' },
];

/** @type {import('./ontology.js').DisputeData[]} */
export const disputes = [
  { id: 'DP001', contractId: 'C010', sellerId: 'S010', reason: '매출 저조 판정 기준에 대한 이의', filedDate: d(-80), status: '기각', resolvedDate: d(-65), resolution: '계약 조건 검토 결과 해지 기준 충족 확인' },
  { id: 'DP002', contractId: 'C008', sellerId: 'S008', reason: '정산 금액 산출 오류 주장', filedDate: d(-20), status: '검토중', resolvedDate: '', resolution: '' },
  { id: 'DP003', contractId: 'C006', sellerId: 'S006', reason: '해지 통보 절차 미흡 주장', filedDate: d(-18), status: '접수', resolvedDate: '', resolution: '' },
];
