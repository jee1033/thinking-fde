/**
 * 레거시 시스템 시뮬레이션
 *
 * 기존 운영 환경에서 해지 프로세스를 처리할 때
 * 담당자가 거쳐야 하는 시스템들을 시뮬레이션합니다.
 *
 * 시스템 목록:
 * 1. 어드민 백오피스 - 판매자 조회/상태 관리
 * 2. 정산 시스템 - 미정산 조회
 * 3. BI 대시보드 - 매출 데이터 엑셀 추출
 * 4. 그룹웨어 전자결재 - 기안 작성/승인
 * 5. 법무 요청 (지라) - 내용증명 발송 요청
 * 6. CS 시스템 - 이의제기 접수 확인
 */

/** 레거시 시스템 정의 */
export const legacySystems = [
  {
    id: 'admin',
    name: '어드민 백오피스',
    icon: 'A',
    color: '#6366f1',
    description: '판매자 정보 조회 및 상태 변경',
    url: 'admin.internal.amazon.co.kr',
  },
  {
    id: 'settlement',
    name: '정산 시스템',
    icon: 'S',
    color: '#059669',
    description: '판매자별 정산 내역 및 미정산 금액 조회',
    url: 'settlement.internal.amazon.co.kr',
  },
  {
    id: 'bi',
    name: 'BI 대시보드',
    icon: 'B',
    color: '#0891b2',
    description: '매출 데이터 조회 및 엑셀 다운로드',
    url: 'bi.internal.amazon.co.kr (Redash)',
  },
  {
    id: 'approval',
    name: '그룹웨어 전자결재',
    icon: 'G',
    color: '#d97706',
    description: '해지 기안 작성 및 결재 요청',
    url: 'groupware.amazon.co.kr',
  },
  {
    id: 'legal',
    name: '법무 요청 (Jira)',
    icon: 'J',
    color: '#dc2626',
    description: '내용증명 발송 요청 티켓 생성',
    url: 'jira.amazon.co.kr/LEGAL',
  },
  {
    id: 'cs',
    name: 'CS 시스템',
    icon: 'C',
    color: '#7c3aed',
    description: '판매자 이의제기 접수 내역 확인',
    url: 'cs.internal.amazon.co.kr',
  },
];

/** 레거시 해지 프로세스 단계 */
export const legacySteps = [
  {
    step: 1,
    title: 'BI에서 매출 저조 판매자 추출',
    system: 'bi',
    actions: ['BI 대시보드 접속', '매출 저조 판매자 쿼리 실행', '엑셀 다운로드', '수동으로 해지 대상 선별'],
    pain: '매번 쿼리를 수동 실행, 기준이 사람마다 다름',
    time: '30분~1시간',
  },
  {
    step: 2,
    title: '어드민에서 판매자 상태 확인',
    system: 'admin',
    actions: ['어드민 백오피스 접속', '판매자 ID로 검색', '현재 상태 및 계약 정보 확인', '엑셀에 정보 취합'],
    pain: '판매자별 하나씩 조회해야 함, 계약 정보는 별도 메뉴',
    time: '판매자당 5분',
  },
  {
    step: 3,
    title: '정산 시스템에서 미정산 확인',
    system: 'settlement',
    actions: ['정산 시스템 접속 (별도 로그인)', '판매자별 미정산 금액 조회', '미정산 있으면 정산팀에 슬랙 요청', '정산 완료 회신 대기'],
    pain: '시스템 간 데이터 연결 없음, 슬랙 회신 대기 수일 소요',
    time: '1~5일 (정산 완료 대기)',
  },
  {
    step: 4,
    title: '전자결재 기안 작성',
    system: 'approval',
    actions: ['그룹웨어 접속', '해지 기안 양식 작성 (판매자 정보 수동 입력)', '근거 자료 엑셀 첨부', '팀장 결재 요청'],
    pain: '어드민/정산/BI 데이터를 복사해서 기안에 붙여넣기',
    time: '기안 30분 + 승인 대기 1~3일',
  },
  {
    step: 5,
    title: '법무팀에 내용증명 요청',
    system: 'legal',
    actions: ['Jira에 LEGAL 프로젝트 티켓 생성', '판매자 정보 및 해지 근거 기술', '법무팀 검토 및 내용증명 작성', '발송 완료 확인'],
    pain: '지라 티켓이 밀려 있으면 대기 시간 길어짐',
    time: '3~7일',
  },
  {
    step: 6,
    title: '이의제기 기간 관리',
    system: 'cs',
    actions: ['구글 캘린더에 30일 후 리마인더 등록', '기간 중 CS 시스템에서 이의제기 접수 여부 수시 확인', '이의 없으면 어드민에서 수동 해지 처리', '엑셀에 해지 이력 기록'],
    pain: '캘린더 알림 놓치면 처리 지연, 이력이 엑셀에만 존재',
    time: '30일 + 수동 확인',
  },
];

/** 레거시 시뮬레이션 상태 */
export class LegacySimulation {
  constructor() {
    this.currentStep = -1; // -1 = 시작 전
    this.activeSystem = null;
    this.completedSteps = [];
    this.logs = [];
    this.totalElapsed = 0;
  }

  start() {
    this.currentStep = 0;
    this.activeSystem = legacySteps[0].system;
    this.completedSteps = [];
    this.logs = [];
    this.totalElapsed = 0;
    this._addLog('해지 프로세스 시작 — BI 대시보드로 이동합니다');
  }

  /** 현재 단계의 시스템 열기 */
  openSystem(systemId) {
    this.activeSystem = systemId;
    const sys = legacySystems.find((s) => s.id === systemId);
    this._addLog(`${sys.name} 접속 (${sys.url})`);
  }

  /** 현재 단계 완료 */
  completeCurrentStep() {
    if (this.currentStep < 0 || this.currentStep >= legacySteps.length) return;

    const step = legacySteps[this.currentStep];
    this.completedSteps.push(this.currentStep);
    this._addLog(`[${step.title}] 완료 — 소요: ${step.time}`);

    if (this.currentStep < legacySteps.length - 1) {
      this.currentStep++;
      const nextStep = legacySteps[this.currentStep];
      this.activeSystem = nextStep.system;
      const nextSys = legacySystems.find((s) => s.id === nextStep.system);
      this._addLog(`다음 시스템으로 이동: ${nextSys.name} (${nextSys.url})`);
    } else {
      this.currentStep = legacySteps.length; // 완료
      this.activeSystem = null;
      this._addLog('해지 프로세스 완료 — 총 소요시간: 약 5~7주');
    }
  }

  isComplete() {
    return this.currentStep >= legacySteps.length;
  }

  isStarted() {
    return this.currentStep >= 0;
  }

  reset() {
    this.currentStep = -1;
    this.activeSystem = null;
    this.completedSteps = [];
    this.logs = [];
  }

  _addLog(msg) {
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.logs.push({ time: now, msg });
  }
}
