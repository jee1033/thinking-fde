import './style.css';
import { sellers, contracts } from './data.js';
import { OntologyStore } from './ontology.js';
import { runAIPRules, applySuggestion } from './aip-logic.js';

// ── Ontology Store 초기화 ──
const store = new OntologyStore(sellers, contracts);

// ── 유틸 ──
const fmt = (n) => n.toLocaleString('ko-KR');
const fmtWon = (n) => `${fmt(Math.round(n / 10000))}만원`;
const fmtDate = (d) => d; // YYYY-MM-DD 그대로

function urgencyClass(days) {
  if (days <= 30) return 'urgency-red';
  if (days <= 60) return 'urgency-yellow';
  return 'urgency-green';
}

function urgencyLabel(days) {
  if (days <= 30) return '긴급';
  if (days <= 60) return '주의';
  return '여유';
}

function statusBadgeClass(status) {
  const map = { 활성: 'badge-active', 휴면: 'badge-dormant', 해지: 'badge-terminated' };
  return map[status] || '';
}

function contractStatusClass(status) {
  const map = { 진행중: 'cstatus-active', 만료예정: 'cstatus-expiring', 종료: 'cstatus-ended', 갱신대기: 'cstatus-pending' };
  return map[status] || '';
}

function suggestionTypeClass(type) {
  const map = { 휴면전환: 'sug-dormant', 자동갱신: 'sug-renew', 해지권고: 'sug-terminate' };
  return map[type] || '';
}

// ── 렌더링 ──
function render() {
  const app = document.querySelector('#app');
  const statusCounts = store.getStatusCounts();
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const avgCommission = store.getAverageCommissionRate();
  const expiringContracts = store.getExpiringContracts(90);
  const allSellers = store.getAllSellers();
  const suggestions = runAIPRules(store);

  app.innerHTML = `
    <header>
      <div class="header-inner">
        <h1>카카오톡 선물하기</h1>
        <p class="subtitle">판매자 계약 관리 대시보드</p>
        <span class="concept-tag">Workshop: Dashboard</span>
      </div>
    </header>

    <main>
      <!-- 판매자 풀 현황 -->
      <section class="section" id="summary">
        <div class="section-header">
          <h2>판매자 풀 현황</h2>
          <span class="concept-tag">Ontology: Object</span>
        </div>
        <div class="summary-cards">
          <div class="summary-card summary-total">
            <div class="summary-value">${total}</div>
            <div class="summary-label">전체 판매자</div>
          </div>
          <div class="summary-card summary-active">
            <div class="summary-value">${statusCounts['활성']}</div>
            <div class="summary-label">활성 <span class="summary-pct">${total ? Math.round((statusCounts['활성'] / total) * 100) : 0}%</span></div>
          </div>
          <div class="summary-card summary-dormant">
            <div class="summary-value">${statusCounts['휴면']}</div>
            <div class="summary-label">휴면 <span class="summary-pct">${total ? Math.round((statusCounts['휴면'] / total) * 100) : 0}%</span></div>
          </div>
          <div class="summary-card summary-terminated">
            <div class="summary-value">${statusCounts['해지']}</div>
            <div class="summary-label">해지 <span class="summary-pct">${total ? Math.round((statusCounts['해지'] / total) * 100) : 0}%</span></div>
          </div>
          <div class="summary-card summary-commission">
            <div class="summary-value">${avgCommission.toFixed(1)}%</div>
            <div class="summary-label">평균 수수료율</div>
          </div>
        </div>
      </section>

      <!-- 계약 만료 관리 -->
      <section class="section" id="expiry">
        <div class="section-header">
          <h2>계약 만료 관리</h2>
          <span class="concept-tag">Workshop: Widget</span>
        </div>
        <div class="filter-bar">
          <button class="filter-btn active" data-filter="all">전체</button>
          <button class="filter-btn filter-red" data-filter="30">30일 이내</button>
          <button class="filter-btn filter-yellow" data-filter="60">60일 이내</button>
          <button class="filter-btn filter-green" data-filter="90">90일 이내</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>긴급도</th>
                <th>판매자명</th>
                <th>카테고리</th>
                <th>수수료율</th>
                <th>계약시작일</th>
                <th>계약종료일</th>
                <th>상태</th>
                <th>최근매출</th>
              </tr>
            </thead>
            <tbody id="expiry-tbody">
              ${renderExpiryRows(expiringContracts)}
            </tbody>
          </table>
          ${expiringContracts.length === 0 ? '<p class="empty-msg">만료 예정 계약이 없습니다.</p>' : ''}
        </div>
      </section>

      <!-- 판매자 상태 관리 -->
      <section class="section" id="sellers">
        <div class="section-header">
          <h2>판매자 상태 관리</h2>
          <span class="concept-tag">Ontology: Action</span>
        </div>
        <div class="seller-list">
          ${allSellers.map((s) => renderSellerCard(s)).join('')}
        </div>
      </section>

      <!-- AIP Logic -->
      <section class="section" id="aip">
        <div class="section-header">
          <h2>자동화 규칙 시뮬레이션</h2>
          <span class="concept-tag">AIP Logic</span>
        </div>
        <div class="aip-rules">
          <div class="rule-info">
            <div class="rule-item"><span class="rule-icon sug-dormant">D</span> 90일 이상 판매 없음 → 휴면 전환</div>
            <div class="rule-item"><span class="rule-icon sug-renew">R</span> 30일 내 만료 + 매출 양호 → 자동 갱신</div>
            <div class="rule-item"><span class="rule-icon sug-terminate">T</span> 30일 내 만료 + 매출 저조 → 해지 권고</div>
          </div>
          ${suggestions.length > 0 ? `
          <div class="suggestion-list">
            ${suggestions.map((s, i) => renderSuggestion(s, i)).join('')}
          </div>
          <button class="btn btn-primary btn-run-all" id="run-all-btn">규칙 실행 (${suggestions.length}건 모두 적용)</button>
          ` : '<p class="empty-msg">현재 적용할 자동화 규칙이 없습니다.</p>'}
        </div>
      </section>
    </main>

    <footer>
      <p>Thinking FDE &mdash; 팔란티어 개념 기반 프로토타입 (연구/학습 목적)</p>
    </footer>
  `;

  bindEvents();
}

function renderExpiryRows(contractsList) {
  return contractsList.map((c) => {
    const seller = store.getSeller(c.sellerId);
    if (!seller) return '';
    const days = store.daysUntilExpiry(c);
    return `
      <tr class="${urgencyClass(days)}" data-days="${days}">
        <td><span class="urgency-badge ${urgencyClass(days)}">${urgencyLabel(days)} (${days}일)</span></td>
        <td>${seller.name}</td>
        <td><span class="cat-tag">${seller.category}</span></td>
        <td>${c.commissionRate}%</td>
        <td>${fmtDate(c.startDate)}</td>
        <td>${fmtDate(c.endDate)}</td>
        <td><span class="contract-status ${contractStatusClass(c.status)}">${c.status}</span></td>
        <td class="text-right">${fmtWon(seller.monthlySales)}</td>
      </tr>
    `;
  }).join('');
}

function renderSellerCard(seller) {
  const contract = store.getContractForSeller(seller.id);
  const isTerminated = seller.status === '해지';
  return `
    <div class="seller-card ${isTerminated ? 'seller-terminated' : ''}">
      <div class="seller-info">
        <div class="seller-name">${seller.name}</div>
        <span class="badge ${statusBadgeClass(seller.status)}">${seller.status}</span>
        <span class="cat-tag">${seller.category}</span>
      </div>
      <div class="seller-meta">
        <span>월 매출: ${fmtWon(seller.monthlySales)}</span>
        <span>수수료: ${contract ? contract.commissionRate + '%' : '-'}</span>
        <span>최근판매: ${fmtDate(seller.lastSaleDate)}</span>
      </div>
      <div class="seller-actions">
        ${seller.status === '활성' ? `<button class="btn btn-sm btn-dormant" data-action="dormant" data-id="${seller.id}">휴면전환</button>` : ''}
        ${seller.status === '휴면' ? `<button class="btn btn-sm btn-activate" data-action="activate" data-id="${seller.id}">활성전환</button>` : ''}
        ${!isTerminated ? `<button class="btn btn-sm btn-terminate" data-action="terminate" data-id="${seller.id}">해지</button>` : ''}
        ${contract && !isTerminated && contract.status !== '종료' ? `<button class="btn btn-sm btn-renew" data-action="renew" data-cid="${contract.id}">계약갱신</button>` : ''}
      </div>
    </div>
  `;
}

function renderSuggestion(suggestion, index) {
  const seller = store.getSeller(suggestion.sellerId);
  return `
    <div class="suggestion-item">
      <span class="sug-type ${suggestionTypeClass(suggestion.type)}">${suggestion.type}</span>
      <span class="sug-seller">${seller ? seller.name : suggestion.sellerId}</span>
      <span class="sug-reason">${suggestion.reason}</span>
      <button class="btn btn-sm btn-apply" data-sug-index="${index}">적용</button>
    </div>
  `;
}

// ── 이벤트 바인딩 ──
function bindEvents() {
  // 필터 버튼
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      const rows = document.querySelectorAll('#expiry-tbody tr');
      rows.forEach((row) => {
        const days = parseInt(row.dataset.days);
        if (filter === 'all') {
          row.style.display = '';
        } else {
          row.style.display = days <= parseInt(filter) ? '' : 'none';
        }
      });
    });
  });

  // 판매자 액션 버튼
  document.querySelectorAll('.seller-actions .btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const sellerId = btn.dataset.id;
      const contractId = btn.dataset.cid;

      switch (action) {
        case 'dormant':
          store.updateSellerStatus(sellerId, '휴면');
          break;
        case 'activate':
          store.updateSellerStatus(sellerId, '활성');
          break;
        case 'terminate':
          store.updateSellerStatus(sellerId, '해지');
          break;
        case 'renew':
          store.renewContract(contractId);
          break;
      }
      render();
    });
  });

  // AIP 개별 적용
  const suggestions = runAIPRules(store);
  document.querySelectorAll('.btn-apply').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.sugIndex);
      if (suggestions[idx]) {
        applySuggestion(store, suggestions[idx]);
        render();
      }
    });
  });

  // AIP 전체 실행
  const runAllBtn = document.getElementById('run-all-btn');
  if (runAllBtn) {
    runAllBtn.addEventListener('click', () => {
      suggestions.forEach((s) => applySuggestion(store, s));
      render();
    });
  }
}

// ── 초기 렌더 ──
render();
