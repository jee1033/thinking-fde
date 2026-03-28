import './style.css'

const products = [
  {
    name: 'Foundry',
    desc: 'Ontology 기반 데이터 통합 플랫폼',
    modules: ['Ontology', 'Pipeline Builder', 'Workshop', 'OSDK'],
  },
  {
    name: 'AIP',
    desc: 'LLM 기반 AI 플랫폼',
    modules: ['AIP Logic', 'AIP Assist'],
  },
  {
    name: 'Gotham',
    desc: '인텔리전스 분석 및 운영 플랫폼',
    modules: ['Graph Analysis', 'Operations'],
  },
]

document.querySelector('#app').innerHTML = `
  <header>
    <h1>Thinking FDE</h1>
    <p class="subtitle">팔란티어 제품군 프로토타이핑 & 연구</p>
  </header>

  <main>
    <div class="cards">
      ${products
        .map(
          (p) => `
        <div class="card">
          <h2>${p.name}</h2>
          <p>${p.desc}</p>
          <ul>
            ${p.modules.map((m) => `<li>${m}</li>`).join('')}
          </ul>
        </div>
      `,
        )
        .join('')}
    </div>
  </main>

  <footer>
    <p>연구/학습 목적 프로젝트 &mdash; 팔란티어의 실제 코드나 API를 포함하지 않습니다</p>
  </footer>
`
