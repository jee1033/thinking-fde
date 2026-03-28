import './style.css';
import { sellers, contracts } from './data.js';
import { OntologyStore } from './ontology.js';
import { runAIPRules, applySuggestion } from './aip-logic.js';
import { TerminationWorkflowEngine } from './workflow.js';
import { legacySystems, legacySteps, LegacySimulation } from './legacy.js';

// ── Ontology Store 초기화 ──
const store = new OntologyStore(sellers, contracts);
const workflowEngine = new TerminationWorkflowEngine(store);
const legacySim = new LegacySimulation();

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

function stepStatusClass(status) {
  const map = { '대기': 'step-waiting', '진행중': 'step-active', '완료': 'step-done', '차단': 'step-blocked', '건너뜀': 'step-skipped' };
  return map[status] || '';
}

function stepStatusIcon(status) {
  const map = { '대기': '○', '진행중': '◉', '완료': '✓', '차단': '!', '건너뜀': '—' };
  return map[status] || '○';
}

// ── 현재 탭 상태 ──
let activeTab = 'dashboard';

// ── 렌더링 ──
function render() {
  const app = document.querySelector('#app');

  app.innerHTML = `
    <header>
      <div class="header-inner">
        <h1>Amazon 판매자 관리</h1>
        <p class="subtitle">위탁판매 계약 관리 대시보드</p>
        <span class="concept-tag">Workshop: Dashboard</span>
      </div>
      <nav class="tab-bar">
        <button class="tab-btn ${activeTab === 'legacy' ? 'active' : ''}" data-tab="legacy">기존 시스템</button>
        <button class="tab-btn ${activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">대시보드</button>
        <button class="tab-btn ${activeTab === 'workflow' ? 'active' : ''}" data-tab="workflow">해지 워크플로우</button>
      </nav>
    </header>

    <main>
      ${activeTab === 'legacy' ? renderLegacyTab() : activeTab === 'dashboard' ? renderDashboard() : renderWorkflowTab()}
    </main>

    <footer>
      <p>Thinking FDE — 팔란티어 개념 기반 프로토타입 (연구/학습 목적)</p>
    </footer>
  `;

  bindEvents();
}

// ── 대시보드 탭 ──
function renderDashboard() {
  const statusCounts = store.getStatusCounts();
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const avgCommission = store.getAverageCommissionRate();
  const expiringContracts = store.getExpiringContracts(90);
  const allSellers = store.getAllSellers();
  const suggestions = runAIPRules(store);

  return `
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
  `;
}

// ── 워크플로우 탭 ──
function renderWorkflowTab() {
  const workflows = workflowEngine.getAll();
  const terminableSellers = store.getAllSellers().filter(
    (s) => s.status !== '해지' && !workflows.some((wf) => wf.sellerId === s.id && wf.status === '진행중')
  );

  return `
    <section class="section">
      <div class="section-header">
        <h2>해지 워크플로우</h2>
        <span class="concept-tag">Foundry: Pipeline</span>
      </div>

      <!-- 워크플로우 흐름도 -->
      <div class="wf-flow-diagram">
        <div class="wf-flow-step">
          <div class="wf-flow-icon">1</div>
          <div class="wf-flow-label">해지 대상<br>선정</div>
        </div>
        <div class="wf-flow-arrow">→</div>
        <div class="wf-flow-step">
          <div class="wf-flow-icon">2</div>
          <div class="wf-flow-label">미정산<br>확인/정산</div>
        </div>
        <div class="wf-flow-arrow">→</div>
        <div class="wf-flow-step">
          <div class="wf-flow-icon">3</div>
          <div class="wf-flow-label">전자결재<br>승인</div>
        </div>
        <div class="wf-flow-arrow">→</div>
        <div class="wf-flow-step">
          <div class="wf-flow-icon">4</div>
          <div class="wf-flow-label">내용증명<br>발송</div>
        </div>
        <div class="wf-flow-arrow">→</div>
        <div class="wf-flow-step">
          <div class="wf-flow-icon">5</div>
          <div class="wf-flow-label">이의제기<br>대기 (30일)</div>
        </div>
        <div class="wf-flow-arrow">→</div>
        <div class="wf-flow-step">
          <div class="wf-flow-icon">6</div>
          <div class="wf-flow-label">해지<br>확정</div>
        </div>
      </div>

      <!-- 새 워크플로우 시작 -->
      <div class="wf-start-section">
        <h3>해지 프로세스 시작</h3>
        <div class="wf-seller-select">
          ${terminableSellers.length > 0 ? `
            <select id="wf-seller-select">
              <option value="">판매자 선택...</option>
              ${terminableSellers.map((s) => {
                const contract = store.getContractForSeller(s.id);
                const unsettled = s.unsettledAmount || 0;
                return `<option value="${s.id}" data-contract="${contract?.id || ''}">${s.name} (${s.category}) — ${s.status} ${unsettled > 0 ? `| 미정산 ${fmtWon(unsettled)}` : '| 미정산 없음'}</option>`;
              }).join('')}
            </select>
            <button class="btn btn-danger" id="wf-start-btn">해지 프로세스 시작</button>
          ` : '<p class="empty-msg">해지 가능한 판매자가 없습니다.</p>'}
        </div>
      </div>
    </section>

    <!-- 진행 중인 워크플로우 -->
    ${workflows.length > 0 ? `
    <section class="section">
      <div class="section-header">
        <h2>진행 중인 워크플로우 (${workflows.filter((w) => w.status === '진행중').length}건)</h2>
      </div>
      <div class="wf-list">
        ${workflows.map((wf) => renderWorkflowCard(wf)).join('')}
      </div>
    </section>
    ` : ''}
  `;
}

function renderWorkflowCard(wf) {
  const seller = store.getSeller(wf.sellerId);
  if (!seller) return '';

  const progressPct = Math.round((wf.steps.filter((s) => s.status === '완료').length / wf.steps.length) * 100);
  const currentStep = wf.steps[wf.currentStep];
  const isBlocked = currentStep?.status === '차단';

  return `
    <div class="wf-card ${wf.status === '완료' ? 'wf-completed' : ''} ${wf.status === '중단' ? 'wf-cancelled' : ''} ${isBlocked ? 'wf-blocked' : ''}">
      <div class="wf-card-header">
        <div>
          <span class="wf-id">${wf.id}</span>
          <span class="badge ${statusBadgeClass(seller.status)}">${seller.status}</span>
          <span class="wf-status-badge wf-status-${wf.status === '진행중' ? 'active' : wf.status === '완료' ? 'done' : 'cancelled'}">${wf.status}</span>
        </div>
        <span class="wf-seller-name">${seller.name} <span class="cat-tag">${seller.category}</span></span>
      </div>

      <!-- Progress bar -->
      <div class="wf-progress">
        <div class="wf-progress-bar" style="width: ${progressPct}%"></div>
        <span class="wf-progress-label">${progressPct}%</span>
      </div>

      <!-- Steps -->
      <div class="wf-steps">
        ${wf.steps.map((step, i) => `
          <div class="wf-step ${stepStatusClass(step.status)} ${i === wf.currentStep && wf.status === '진행중' ? 'wf-step-current' : ''}">
            <div class="wf-step-indicator">
              <span class="wf-step-icon ${stepStatusClass(step.status)}">${stepStatusIcon(step.status)}</span>
              ${i < wf.steps.length - 1 ? '<div class="wf-step-line"></div>' : ''}
            </div>
            <div class="wf-step-content">
              <div class="wf-step-name">${step.name}</div>
              <div class="wf-step-desc">${step.description}</div>
              ${step.blockedReason ? `<div class="wf-step-blocked-reason">${step.blockedReason}</div>` : ''}
              ${step.completedAt ? `<div class="wf-step-date">${step.completedAt} 완료</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Actions -->
      ${wf.status === '진행중' ? `
      <div class="wf-actions">
        ${isBlocked && wf.currentStep === 1 ? `
          <button class="btn btn-primary" data-wf-action="settle" data-wf-id="${wf.id}">정산 완료 처리</button>
        ` : ''}
        ${currentStep?.status === '진행중' && wf.currentStep === 2 ? `
          <button class="btn btn-primary" data-wf-action="approve" data-wf-id="${wf.id}">전자결재 승인</button>
        ` : ''}
        ${currentStep?.status === '진행중' && wf.currentStep === 3 ? `
          <button class="btn btn-primary" data-wf-action="approve" data-wf-id="${wf.id}">내용증명 발송 완료</button>
        ` : ''}
        ${currentStep?.status === '진행중' && wf.currentStep === 4 ? `
          <button class="btn btn-primary" data-wf-action="dispute-ok" data-wf-id="${wf.id}">이의 없음 (기간 만료)</button>
          <button class="btn btn-warning" data-wf-action="dispute-raise" data-wf-id="${wf.id}">이의제기 접수</button>
        ` : ''}
        ${currentStep?.status === '진행중' && wf.currentStep === 5 ? `
          <button class="btn btn-danger" data-wf-action="finalize" data-wf-id="${wf.id}">해지 확정</button>
        ` : ''}
        <button class="btn btn-muted" data-wf-action="cancel" data-wf-id="${wf.id}">프로세스 중단</button>
      </div>
      ` : ''}
    </div>
  `;
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
  const unsettled = seller.unsettledAmount || 0;
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
        ${unsettled > 0 ? `<span class="unsettled-badge">미정산 ${fmtWon(unsettled)}</span>` : ''}
      </div>
      <div class="seller-actions">
        ${seller.status === '활성' ? `
          <button class="btn btn-dormant" data-action="dormant" data-id="${seller.id}">휴면전환</button>
          <button class="btn btn-terminate" data-action="terminate" data-id="${seller.id}">해지</button>
        ` : ''}
        ${seller.status === '휴면' ? `
          <button class="btn btn-activate" data-action="activate" data-id="${seller.id}">활성전환</button>
          <button class="btn btn-terminate" data-action="terminate" data-id="${seller.id}">해지</button>
        ` : ''}
        ${isTerminated ? '<span class="text-muted">해지 완료</span>' : ''}
        ${contract && !isTerminated ? `<button class="btn btn-renew" data-action="renew" data-cid="${contract.id}">계약갱신</button>` : ''}
      </div>
    </div>
  `;
}

function renderSuggestion(s, index) {
  const seller = store.getSeller(s.sellerId);
  return `
    <div class="suggestion-item">
      <span class="sug-type ${suggestionTypeClass(s.type)}">${s.type}</span>
      <span class="sug-seller">${seller?.name || s.sellerId}</span>
      <span class="sug-reason">${s.reason}</span>
      <button class="btn btn-sm btn-primary" data-sug-index="${index}">적용</button>
    </div>
  `;
}

// ── 레거시 시스템 탭 ──
function renderLegacyTab() {
  const isStarted = legacySim.isStarted();
  const isComplete = legacySim.isComplete();

  return `
    <section class="section">
      <div class="section-header">
        <h2>기존 운영 시스템</h2>
        <span class="concept-tag">Before Palantir</span>
      </div>
      <p class="legacy-intro">해지 프로세스를 처리하기 위해 담당자가 접속해야 하는 시스템들입니다.</p>

      <!-- 시스템 맵 -->
      <div class="legacy-systems">
        ${legacySystems.map((sys) => `
          <div class="legacy-sys-card ${legacySim.activeSystem === sys.id ? 'legacy-sys-active' : ''} ${legacySim.completedSteps.some((i) => legacySteps[i]?.system === sys.id) ? 'legacy-sys-done' : ''}">
            <div class="legacy-sys-icon" style="background: ${sys.color}">${sys.icon}</div>
            <div class="legacy-sys-info">
              <div class="legacy-sys-name">${sys.name}</div>
              <div class="legacy-sys-desc">${sys.description}</div>
              <div class="legacy-sys-url">${sys.url}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- 해지 프로세스 시뮬레이션 -->
    <section class="section">
      <div class="section-header">
        <h2>해지 프로세스 시뮬레이션</h2>
        <span class="concept-tag">As-Is Flow</span>
      </div>

      ${!isStarted ? `
        <div class="legacy-start">
          <p>"코지홈데코" 판매자의 해지를 기존 시스템으로 처리해봅니다.</p>
          <button class="btn btn-primary" id="legacy-start-btn">시뮬레이션 시작</button>
        </div>
      ` : ''}

      ${isStarted ? `
        <div class="legacy-process">
          <!-- 단계 목록 -->
          <div class="legacy-steps">
            ${legacySteps.map((step, i) => {
              const isCurrent = i === legacySim.currentStep;
              const isDone = legacySim.completedSteps.includes(i);
              const sys = legacySystems.find((s) => s.id === step.system);
              return `
                <div class="legacy-step ${isCurrent ? 'legacy-step-current' : ''} ${isDone ? 'legacy-step-done' : ''}">
                  <div class="legacy-step-header">
                    <span class="legacy-step-num ${isDone ? 'done' : isCurrent ? 'current' : ''}">${isDone ? '✓' : step.step}</span>
                    <span class="legacy-step-title">${step.title}</span>
                    <span class="legacy-sys-tag" style="border-color: ${sys.color}; color: ${sys.color}">${sys.name}</span>
                  </div>

                  ${isCurrent || isDone ? `
                    <div class="legacy-step-detail">
                      <div class="legacy-actions-list">
                        ${step.actions.map((a) => `<div class="legacy-action-item">${a}</div>`).join('')}
                      </div>
                      <div class="legacy-step-meta">
                        <div class="legacy-pain"><strong>Pain Point:</strong> ${step.pain}</div>
                        <div class="legacy-time"><strong>소요 시간:</strong> ${step.time}</div>
                      </div>
                    </div>
                  ` : ''}

                  ${isCurrent && !isComplete ? `
                    <div class="legacy-step-action">
                      <button class="btn btn-primary" data-legacy-action="complete">이 단계 완료 → 다음 시스템으로</button>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>

          ${isComplete ? `
            <div class="legacy-complete">
              <div class="legacy-complete-header">프로세스 완료</div>
              <div class="legacy-complete-summary">
                <div class="legacy-stat">
                  <div class="legacy-stat-value">6개</div>
                  <div class="legacy-stat-label">사용 시스템</div>
                </div>
                <div class="legacy-stat">
                  <div class="legacy-stat-value">5~7주</div>
                  <div class="legacy-stat-label">총 소요기간</div>
                </div>
                <div class="legacy-stat">
                  <div class="legacy-stat-value">3~4명</div>
                  <div class="legacy-stat-label">관련 담당자</div>
                </div>
                <div class="legacy-stat">
                  <div class="legacy-stat-value">수작업</div>
                  <div class="legacy-stat-label">이력 관리</div>
                </div>
              </div>
              <div class="legacy-vs">
                <div class="legacy-vs-title">vs. Palantir 적용 시</div>
                <div class="legacy-complete-summary">
                  <div class="legacy-stat legacy-stat-new">
                    <div class="legacy-stat-value">1개</div>
                    <div class="legacy-stat-label">Workshop 대시보드</div>
                  </div>
                  <div class="legacy-stat legacy-stat-new">
                    <div class="legacy-stat-value">1~2일</div>
                    <div class="legacy-stat-label">총 소요기간</div>
                  </div>
                  <div class="legacy-stat legacy-stat-new">
                    <div class="legacy-stat-value">1명</div>
                    <div class="legacy-stat-label">담당자</div>
                  </div>
                  <div class="legacy-stat legacy-stat-new">
                    <div class="legacy-stat-value">자동</div>
                    <div class="legacy-stat-label">이력 관리</div>
                  </div>
                </div>
              </div>
              <button class="btn btn-muted" id="legacy-reset-btn">시뮬레이션 초기화</button>
              <button class="btn btn-primary" id="legacy-goto-wf-btn">Palantir 워크플로우 보기 →</button>
            </div>
          ` : ''}

          <!-- 활동 로그 -->
          <div class="legacy-log">
            <div class="legacy-log-title">활동 로그</div>
            ${legacySim.logs.map((l) => `
              <div class="legacy-log-entry">
                <span class="legacy-log-time">${l.time}</span>
                <span class="legacy-log-msg">${l.msg}</span>
              </div>
            `).reverse().join('')}
          </div>
        </div>
      ` : ''}
    </section>
  `;
}

// ── 이벤트 바인딩 ──
function bindEvents() {
  // 탭 전환
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      render();
    });
  });

  // 필터
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('#expiry-tbody tr').forEach((row) => {
        const days = parseInt(row.dataset.days);
        row.style.display = filter === 'all' || days <= parseInt(filter) ? '' : 'none';
      });
    });
  });

  // 판매자 상태 변경
  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const cid = btn.dataset.cid;
      if (action === 'dormant') store.updateSellerStatus(id, '휴면');
      else if (action === 'activate') store.updateSellerStatus(id, '활성');
      else if (action === 'terminate') store.updateSellerStatus(id, '해지');
      else if (action === 'renew' && cid) store.renewContract(cid);
      render();
    });
  });

  // AIP 제안 적용
  document.querySelectorAll('[data-sug-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const suggestions = runAIPRules(store);
      const idx = parseInt(btn.dataset.sugIndex);
      if (suggestions[idx]) {
        applySuggestion(store, suggestions[idx]);
        render();
      }
    });
  });

  // AIP 전체 적용
  const runAllBtn = document.getElementById('run-all-btn');
  if (runAllBtn) {
    runAllBtn.addEventListener('click', () => {
      const suggestions = runAIPRules(store);
      suggestions.forEach((s) => applySuggestion(store, s));
      render();
    });
  }

  // 워크플로우: 시작
  const wfStartBtn = document.getElementById('wf-start-btn');
  if (wfStartBtn) {
    wfStartBtn.addEventListener('click', () => {
      const select = document.getElementById('wf-seller-select');
      const sellerId = select.value;
      const contractId = select.selectedOptions[0]?.dataset.contract;
      if (!sellerId || !contractId) return;
      workflowEngine.createWorkflow(sellerId, contractId);
      render();
    });
  }

  // 레거시: 시작
  const legacyStartBtn = document.getElementById('legacy-start-btn');
  if (legacyStartBtn) {
    legacyStartBtn.addEventListener('click', () => { legacySim.start(); render(); });
  }

  // 레거시: 단계 완료
  document.querySelectorAll('[data-legacy-action="complete"]').forEach((btn) => {
    btn.addEventListener('click', () => { legacySim.completeCurrentStep(); render(); });
  });

  // 레거시: 초기화
  const legacyResetBtn = document.getElementById('legacy-reset-btn');
  if (legacyResetBtn) {
    legacyResetBtn.addEventListener('click', () => { legacySim.reset(); render(); });
  }

  // 레거시: 워크플로우로 이동
  const legacyGotoBtn = document.getElementById('legacy-goto-wf-btn');
  if (legacyGotoBtn) {
    legacyGotoBtn.addEventListener('click', () => { activeTab = 'workflow'; render(); });
  }

  // 워크플로우: 액션
  document.querySelectorAll('[data-wf-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.wfAction;
      const wfId = btn.dataset.wfId;
      if (action === 'settle') workflowEngine.resolveSettlement(wfId);
      else if (action === 'approve') workflowEngine.approveStep(wfId);
      else if (action === 'dispute-ok') workflowEngine.completeDispute(wfId, false);
      else if (action === 'dispute-raise') workflowEngine.completeDispute(wfId, true);
      else if (action === 'finalize') workflowEngine.finalizeTermination(wfId);
      else if (action === 'cancel') workflowEngine.cancelWorkflow(wfId);
      render();
    });
  });
}

// ── 초기 렌더링 ──
render();
