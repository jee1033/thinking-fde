/**
 * Pipeline Layer (Palantir Foundry: Pipeline Builder concept)
 * 커넥터 → Ontology → Workflow → UI 데이터 흐름 관리
 */

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timestamp() {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export class DataPipeline {
  constructor(connectorManager, ontologyStore, aipRunner) {
    this.connectorManager = connectorManager;
    this.store = ontologyStore;
    this.aipRunner = aipRunner;
    this.status = 'idle'; // idle → running → completed → error
    this.stages = [
      { name: 'Extract', description: '레거시 시스템에서 데이터 추출', status: 'idle', progress: 0 },
      { name: 'Transform', description: 'Ontology 모델로 변환', status: 'idle', progress: 0 },
      { name: 'Load', description: 'Ontology Store에 적재', status: 'idle', progress: 0 },
      { name: 'Enrich', description: 'AIP Logic 규칙 실행', status: 'idle', progress: 0 },
    ];
    this.logs = [];
    this.runCount = 0;
    this._onUpdate = null;
  }

  set onUpdate(fn) { this._onUpdate = fn; }

  _log(msg, level = 'info') {
    this.logs.push({ time: timestamp(), source: 'Pipeline', msg, level });
    if (this.logs.length > 100) this.logs.shift();
  }

  _notify() {
    if (this._onUpdate) this._onUpdate();
  }

  async run() {
    if (this.status === 'running') return;
    this.status = 'running';
    this.runCount++;
    this._log(`파이프라인 실행 시작 (${this.runCount}회차)`, 'info');

    // Reset stages
    for (const stage of this.stages) {
      stage.status = 'idle';
      stage.progress = 0;
    }
    this._notify();

    try {
      // Stage 1: Extract
      await this._runStage(0, async () => {
        this._log('커넥터에서 데이터 추출 시작...', 'info');
        await this.connectorManager.syncAll();
        this._log('모든 커넥터 데이터 추출 완료', 'success');
      });

      // Stage 2: Transform
      await this._runStage(1, async () => {
        this._log('Ontology 모델로 데이터 변환 중...', 'info');
        await delay(600);
        // Simulate transformation
        const adminData = this.connectorManager.getConnector('admin')?.data;
        const settlementData = this.connectorManager.getConnector('settlement')?.data;
        if (adminData) {
          this._log(`판매자 ${adminData.sellers?.length || 0}건, 계약 ${adminData.contracts?.length || 0}건 변환`, 'info');
        }
        if (settlementData) {
          this._log(`미정산 ${settlementData.unsettled?.length || 0}건 변환`, 'info');
        }
        this._log('데이터 변환 완료', 'success');
      });

      // Stage 3: Load
      await this._runStage(2, async () => {
        this._log('Ontology Store에 데이터 적재 중...', 'info');
        await delay(400);
        const sellerCount = this.store.getAllSellers().length;
        const contractCount = this.store.getAllContracts().length;
        this._log(`Ontology Store 업데이트: Sellers ${sellerCount}, Contracts ${contractCount}`, 'success');
      });

      // Stage 4: Enrich
      await this._runStage(3, async () => {
        this._log('AIP Logic 규칙 실행 중...', 'info');
        await delay(500);
        if (this.aipRunner) {
          const suggestions = this.aipRunner(this.store);
          this._log(`AIP 규칙 실행 완료: ${suggestions.length}건 제안 생성`, 'success');
        } else {
          this._log('AIP 규칙 실행 완료', 'success');
        }
      });

      this.status = 'completed';
      this._log(`파이프라인 실행 완료 (${this.runCount}회차)`, 'success');
    } catch (e) {
      this.status = 'error';
      this._log(`파이프라인 오류: ${e.message}`, 'error');
    }

    this._notify();
  }

  async _runStage(index, fn) {
    const stage = this.stages[index];
    stage.status = 'running';
    stage.progress = 0;
    this._notify();

    // Animate progress
    const progressInterval = setInterval(() => {
      if (stage.progress < 90) {
        stage.progress += 10 + Math.random() * 15;
        if (stage.progress > 90) stage.progress = 90;
        this._notify();
      }
    }, 150);

    await fn();

    clearInterval(progressInterval);
    stage.progress = 100;
    stage.status = 'completed';
    this._notify();
    await delay(200);
  }

  getProgress() {
    const completed = this.stages.filter((s) => s.status === 'completed').length;
    const running = this.stages.findIndex((s) => s.status === 'running');
    return {
      percentage: Math.round((completed / this.stages.length) * 100),
      currentStage: running >= 0 ? running : completed >= this.stages.length ? this.stages.length - 1 : -1,
      stages: this.stages.map((s) => ({ ...s })),
    };
  }

  getLogs() {
    return [...this.logs];
  }
}
