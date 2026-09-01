/**
 * Bitigey Matematik & Geometri Zeka Stüdyosu
 * Master Engine by Tunahan Haksever
 */

// ==========================================
// 1. SOUND SYNTHESIZER (Web Audio API)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
  }
  playTone(freq, type = 'sine', duration = 0.15, gain = 0.1) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      g.gain.setValueAtTime(gain, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio not permitted without interaction
    }
  }
  correct() {
    this.playTone(587.33, 'sine', 0.1, 0.12); // D5
    setTimeout(() => this.playTone(880, 'triangle', 0.2, 0.15), 100); // A5
  }
  wrong() {
    this.playTone(220, 'sawtooth', 0.2, 0.15);
  }
  click() {
    this.playTone(440, 'sine', 0.05, 0.05);
  }
}
const sfx = new SoundFX();

// ==========================================
// 2. TAB SWITCHING
// ==========================================
document.querySelectorAll('.nav-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    sfx.click();
    document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    const target = document.getElementById(`tab-${tabId}`);
    if (target) target.classList.add('active');

    // Trigger canvas redraw if geometry tab activated
    if (tabId === 'geometry') {
      setTimeout(drawGeometryCanvas, 50);
    }
  });
});

// ==========================================
// 3. MODULE 1: 4 İŞLEM & HIZLI HESAPLAMA
// ==========================================
const ArithmeticTrainer = {
  currentQuestion: null,
  correctCount: 0,
  streak: 0,
  bestStreak: parseInt(localStorage.getItem('bitigey_best_streak') || '0', 10),
  timeLeft: 15,
  maxTime: 15,
  timerInterval: null,

  init() {
    document.getElementById('stat-best').innerText = this.bestStreak;
    this.bindEvents();
    this.nextQuestion();
  },

  bindEvents() {
    const input = document.getElementById('trainer-user-input');
    const submitBtn = document.getElementById('btn-submit-answer');
    const opSelect = document.getElementById('arithmetic-op-select');
    const diffSelect = document.getElementById('arithmetic-diff-select');

    submitBtn.addEventListener('click', () => this.checkAnswer());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.checkAnswer();
    });

    opSelect.addEventListener('change', () => this.nextQuestion());
    diffSelect.addEventListener('change', () => this.nextQuestion());

    // Virtual keypad buttons
    document.querySelectorAll('.virtual-keypad .key-btn[data-key]').forEach(k => {
      k.addEventListener('click', () => {
        sfx.click();
        input.value += k.getAttribute('data-key');
      });
    });
    document.getElementById('key-clear').addEventListener('click', () => {
      sfx.click();
      input.value = '';
    });
    document.getElementById('key-enter').addEventListener('click', () => {
      this.checkAnswer();
    });
  },

  generateQuestion() {
    const opType = document.getElementById('arithmetic-op-select').value;
    const diff = document.getElementById('arithmetic-diff-select').value;

    let range = 10;
    if (diff === 'medium') range = 25;
    if (diff === 'hard') range = 60;
    if (diff === 'genius') range = 120;

    let chosenOp = opType;
    if (opType === 'all') {
      const ops = ['+', '-', '*', '/'];
      chosenOp = ops[Math.floor(Math.random() * ops.length)];
    }

    if (opType === 'priority') {
      // a + b * c
      const a = Math.floor(Math.random() * 15) + 1;
      const b = Math.floor(Math.random() * 8) + 2;
      const c = Math.floor(Math.random() * 6) + 2;
      return {
        text: `${a} + ${b} × ${c} = ?`,
        answer: a + (b * c)
      };
    }

    let num1, num2, answer, symbol;

    if (chosenOp === '+') {
      num1 = Math.floor(Math.random() * range) + 2;
      num2 = Math.floor(Math.random() * range) + 2;
      answer = num1 + num2;
      symbol = '+';
    } else if (chosenOp === '-') {
      num1 = Math.floor(Math.random() * range) + 10;
      num2 = Math.floor(Math.random() * (num1 - 2)) + 1;
      answer = num1 - num2;
      symbol = '-';
    } else if (chosenOp === '*') {
      const multRange = diff === 'easy' ? 9 : (diff === 'medium' ? 14 : 20);
      num1 = Math.floor(Math.random() * multRange) + 2;
      num2 = Math.floor(Math.random() * 12) + 2;
      answer = num1 * num2;
      symbol = '×';
    } else { // Bölme (Tam bölünebilir)
      const divisorRange = diff === 'easy' ? 9 : 14;
      num2 = Math.floor(Math.random() * divisorRange) + 2;
      answer = Math.floor(Math.random() * 12) + 1;
      num1 = num2 * answer;
      symbol = '÷';
    }

    return {
      text: `${num1} ${symbol} ${num2} = ?`,
      answer: answer
    };
  },

  nextQuestion() {
    clearInterval(this.timerInterval);
    this.currentQuestion = this.generateQuestion();
    document.getElementById('math-question').innerText = this.currentQuestion.text;
    const input = document.getElementById('trainer-user-input');
    input.value = '';
    input.focus();

    // Reset and start timer
    const diff = document.getElementById('arithmetic-diff-select').value;
    this.maxTime = diff === 'genius' ? 8 : (diff === 'hard' ? 10 : 15);
    this.timeLeft = this.maxTime;
    this.updateTimerUI();

    this.timerInterval = setInterval(() => {
      this.timeLeft -= 0.1;
      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.onTimeUp();
      } else {
        this.updateTimerUI();
      }
    }, 100);
  },

  updateTimerUI() {
    const pct = Math.max(0, (this.timeLeft / this.maxTime) * 100);
    document.getElementById('math-timer-bar').style.width = `${pct}%`;
    document.getElementById('stat-timer').innerText = `${Math.ceil(this.timeLeft)}s`;
  },

  checkAnswer() {
    const input = document.getElementById('trainer-user-input');
    const val = parseInt(input.value.trim(), 10);
    if (isNaN(val)) return;

    if (val === this.currentQuestion.answer) {
      sfx.correct();
      this.correctCount++;
      this.streak++;
      if (this.streak > this.bestStreak) {
        this.bestStreak = this.streak;
        localStorage.setItem('bitigey_best_streak', this.bestStreak.toString());
      }
    } else {
      sfx.wrong();
      this.streak = 0;
    }

    this.updateDashboard();
    this.nextQuestion();
  },

  onTimeUp() {
    sfx.wrong();
    this.streak = 0;
    this.updateDashboard();
    this.nextQuestion();
  },

  updateDashboard() {
    document.getElementById('stat-correct').innerText = this.correctCount;
    document.getElementById('stat-streak').innerText = `🔥 ${this.streak}`;
    document.getElementById('stat-best').innerText = this.bestStreak;
  }
};

// ==========================================
// 4. MODULE 2: ADIM ADIM DENKLEM & CEBİR
// ==========================================
const AlgebraSolver = {
  activeType: 'linear',

  init() {
    this.renderForm();
    this.bindEvents();
    this.solve();
  },

  bindEvents() {
    document.querySelectorAll('.eq-pill[data-eq]').forEach(pill => {
      pill.addEventListener('click', () => {
        sfx.click();
        document.querySelectorAll('.eq-pill[data-eq]').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeType = pill.getAttribute('data-eq');
        this.renderForm();
        this.solve();
      });
    });

    document.getElementById('btn-solve-algebra').addEventListener('click', () => {
      sfx.click();
      this.solve();
    });
  },

  renderForm() {
    const container = document.getElementById('algebra-form-container');
    if (this.activeType === 'linear') {
      container.innerHTML = `
        <div class="input-row">
          <div class="field-box">
            <label>x Katsayısı (a)</label>
            <input type="number" id="alg-a" value="3">
          </div>
          <span style="font-size:1.4rem; font-weight:800;">x +</span>
          <div class="field-box">
            <label>Sabit Sayı (b)</label>
            <input type="number" id="alg-b" value="6">
          </div>
          <span style="font-size:1.4rem; font-weight:800;">=</span>
          <div class="field-box">
            <label>Eşitlik Değeri (c)</label>
            <input type="number" id="alg-c" value="21">
          </div>
        </div>
      `;
    } else if (this.activeType === 'quadratic') {
      container.innerHTML = `
        <div class="input-row">
          <div class="field-box">
            <label>x² Katsayısı (a)</label>
            <input type="number" id="alg-a" value="1">
          </div>
          <span style="font-size:1.4rem; font-weight:800;">x² +</span>
          <div class="field-box">
            <label>x Katsayısı (b)</label>
            <input type="number" id="alg-b" value="-5">
          </div>
          <span style="font-size:1.4rem; font-weight:800;">x +</span>
          <div class="field-box">
            <label>Sabit Terim (c)</label>
            <input type="number" id="alg-c" value="6">
          </div>
          <span style="font-size:1.4rem; font-weight:800;">= 0</span>
        </div>
      `;
    } else if (this.activeType === 'system') {
      container.innerHTML = `
        <div class="input-row">
          <div class="field-box"><label>1. Denklem (a₁)</label><input type="number" id="sys-a1" value="2"></div>
          <span style="font-weight:800;">x +</span>
          <div class="field-box"><label>(b₁)</label><input type="number" id="sys-b1" value="3"></div>
          <span style="font-weight:800;">y =</span>
          <div class="field-box"><label>(c₁)</label><input type="number" id="sys-c1" value="12"></div>
        </div>
        <div class="input-row">
          <div class="field-box"><label>2. Denklem (a₂)</label><input type="number" id="sys-a2" value="1"></div>
          <span style="font-weight:800;">x -</span>
          <div class="field-box"><label>(b₂)</label><input type="number" id="sys-b2" value="1"></div>
          <span style="font-weight:800;">y =</span>
          <div class="field-box"><label>(c₂)</label><input type="number" id="sys-c2" value="1"></div>
        </div>
      `;
    } else if (this.activeType === 'abs') {
      container.innerHTML = `
        <div class="input-row">
          <span style="font-size:1.6rem; font-weight:800;">|</span>
          <div class="field-box"><label>a Katsayısı</label><input type="number" id="alg-a" value="2"></div>
          <span style="font-weight:800;">x +</span>
          <div class="field-box"><label>b Sayısı</label><input type="number" id="alg-b" value="-4"></div>
          <span style="font-size:1.6rem; font-weight:800;">| =</span>
          <div class="field-box"><label>Sonuç (c)</label><input type="number" id="alg-c" value="10"></div>
        </div>
      `;
    } else if (this.activeType === 'inequality') {
      container.innerHTML = `
        <div class="input-row">
          <div class="field-box"><label>a Katsayısı</label><input type="number" id="alg-a" value="-2"></div>
          <span style="font-weight:800;">x +</span>
          <div class="field-box"><label>b Sayısı</label><input type="number" id="alg-b" value="4"></div>
          <span style="font-weight:800;">≤</span>
          <div class="field-box"><label>c Sayısı</label><input type="number" id="alg-c" value="10"></div>
        </div>
      `;
    } else if (this.activeType === 'factoring') {
      container.innerHTML = `
        <div class="input-row">
          <div class="field-box"><label>1. Terimin Karesi (a²)</label><input type="number" id="alg-a" value="25"></div>
          <span style="font-weight:800;">x² -</span>
          <div class="field-box"><label>2. Terimin Karesi (b²)</label><input type="number" id="alg-b" value="36"></div>
          <span style="font-weight:800;">y²</span>
        </div>
      `;
    }
  },

  solve() {
    const output = document.getElementById('algebra-solution-output');
    let stepsHtml = '';

    if (this.activeType === 'linear') {
      const a = parseFloat(document.getElementById('alg-a')?.value || '1');
      const b = parseFloat(document.getElementById('alg-b')?.value || '0');
      const c = parseFloat(document.getElementById('alg-c')?.value || '0');

      if (a === 0) {
        output.innerHTML = `<div class="step-card" style="border-left-color: var(--accent-rose);"><p>x'in katsayısı (a) 0 olamaz!</p></div>`;
        return;
      }

      const diff = c - b;
      const x = diff / a;

      stepsHtml = `
        <div class="step-card">
          <div class="step-header">
            <span class="step-num">Adım 1: Sabit Terimi Karşıya Geçir</span>
            <span class="step-rule">Toplama / Çıkarma Kuralı</span>
          </div>
          <div class="step-math">${a}x + (${b}) = ${c} &nbsp;➔&nbsp; ${a}x = ${c} - (${b})</div>
          <div class="step-explanation">Eşitliğin solundaki sabit sayı (${b}), işaret değiştirerek sağ tarafa atılır: <strong>${a}x = ${diff}</strong></div>
        </div>

        <div class="step-card">
          <div class="step-header">
            <span class="step-num">Adım 2: x'in Katsayısına Böl</span>
            <span class="step-rule">Bölme Kuralı</span>
          </div>
          <div class="step-math">x = \\frac{${diff}}{${a}}</div>
          <div class="step-explanation">Bilinmeyeni (x) yalnız bırakmak için her iki taraf da ${a} sayısına bölünür.</div>
        </div>

        <div class="result-box-highlight">
          <div class="res-title">Çözüm Kümesi (Kök)</div>
          <div class="res-val">x = ${Number.isInteger(x) ? x : x.toFixed(2)}</div>
        </div>
      `;
    } else if (this.activeType === 'quadratic') {
      const a = parseFloat(document.getElementById('alg-a')?.value || '1');
      const b = parseFloat(document.getElementById('alg-b')?.value || '0');
      const c = parseFloat(document.getElementById('alg-c')?.value || '0');

      const delta = (b * b) - (4 * a * c);

      stepsHtml = `
        <div class="step-card">
          <div class="step-header">
            <span class="step-num">Adım 1: Diskriminantı (Δ) Hesapla</span>
            <span class="step-rule">Δ = b² - 4ac</span>
          </div>
          <div class="step-math">Δ = (${b})² - 4 · (${a}) · (${c}) = ${b*b} - (${4*a*c}) = ${delta}</div>
          <div class="step-explanation">
            ${delta > 0 ? 'Δ > 0 olduğundan denklemin <strong>2 farklı gerçek kökü</strong> vardır.' : (delta === 0 ? 'Δ = 0 olduğundan denklemin <strong>çakışık (tek) bir kökü</strong> vardır.' : 'Δ < 0 olduğundan denklemin <strong>gerçek sayılarda kökü yoktur (karmaşık kökler)</strong>.')}
          </div>
        </div>
      `;

      if (delta >= 0) {
        const sqrtDelta = Math.sqrt(delta);
        const x1 = (-b + sqrtDelta) / (2 * a);
        const x2 = (-b - sqrtDelta) / (2 * a);

        stepsHtml += `
          <div class="step-card">
            <div class="step-header">
              <span class="step-num">Adım 2: Kök Formülünü Uygula</span>
              <span class="step-rule">x₁,₂ = (-b ± √Δ) / 2a</span>
            </div>
            <div class="step-math">x₁ = \\frac{-(${b}) + \\sqrt{${delta}}}{2 · ${a}} = ${Number.isInteger(x1) ? x1 : x1.toFixed(2)}</div>
            <div class="step-math">x₂ = \\frac{-(${b}) - \\sqrt{${delta}}}{2 · ${a}} = ${Number.isInteger(x2) ? x2 : x2.toFixed(2)}</div>
          </div>

          <div class="result-box-highlight">
            <div class="res-title">Çözüm Kümesi (ÇK)</div>
            <div class="res-val">{ ${Number.isInteger(x1)?x1:x1.toFixed(2)}, ${Number.isInteger(x2)?x2:x2.toFixed(2)} }</div>
          </div>
        `;
      } else {
        stepsHtml += `
          <div class="result-box-highlight" style="border-color: var(--accent-rose);">
            <div class="res-title">Gerçek Kök Yok</div>
            <div class="res-val">Ç.K. = ∅ (Boş Küme)</div>
          </div>
        `;
      }
    } else if (this.activeType === 'abs') {
      const a = parseFloat(document.getElementById('alg-a')?.value || '1');
      const b = parseFloat(document.getElementById('alg-b')?.value || '0');
      const c = parseFloat(document.getElementById('alg-c')?.value || '0');

      if (c < 0) {
        stepsHtml = `
          <div class="step-card" style="border-left-color: var(--accent-rose);">
            <div class="step-header"><span class="step-num">Mutlak Değer Kuralı</span></div>
            <div class="step-explanation">Bir mutlak değer ifadesi hiçbir zaman negatif bir sayıya eşit olamaz (|x| ≥ 0).</div>
          </div>
          <div class="result-box-highlight" style="border-color: var(--accent-rose);">
            <div class="res-title">Çözüm Kümesi</div>
            <div class="res-val">Ç.K. = ∅</div>
          </div>
        `;
      } else {
        const x1 = (c - b) / a;
        const x2 = (-c - b) / a;

        stepsHtml = `
          <div class="step-card">
            <div class="step-header">
              <span class="step-num">Adım 1: İki Durumu İncele</span>
              <span class="step-rule">|u| = c ➔ u = c veya u = -c</span>
            </div>
            <div class="step-math">1. Durum: ${a}x + (${b}) = ${c} &nbsp;➔&nbsp; x₁ = ${Number.isInteger(x1)?x1:x1.toFixed(2)}</div>
            <div class="step-math">2. Durum: ${a}x + (${b}) = -${c} &nbsp;➔&nbsp; x₂ = ${Number.isInteger(x2)?x2:x2.toFixed(2)}</div>
          </div>

          <div class="result-box-highlight">
            <div class="res-title">Çözüm Kümesi</div>
            <div class="res-val">{ ${Number.isInteger(x1)?x1:x1.toFixed(2)}, ${Number.isInteger(x2)?x2:x2.toFixed(2)} }</div>
          </div>
        `;
      }
    } else if (this.activeType === 'factoring') {
      const a2 = parseFloat(document.getElementById('alg-a')?.value || '25');
      const b2 = parseFloat(document.getElementById('alg-b')?.value || '36');

      const aVal = Math.sqrt(a2);
      const bVal = Math.sqrt(b2);

      stepsHtml = `
        <div class="step-card">
          <div class="step-header">
            <span class="step-num">Adım 1: İki Kare Farkı Özdeşliği</span>
            <span class="step-rule">A² - B² = (A - B)(A + B)</span>
          </div>
          <div class="step-math">(${aVal}x)² - (${bVal}y)²</div>
          <div class="step-explanation">Kare kökleri alınarak çarpanlara ayrılır: <strong>A = ${aVal}x</strong> ve <strong>B = ${bVal}y</strong></div>
        </div>

        <div class="result-box-highlight">
          <div class="res-title">Çarpanlarına Ayrılmış Hali</div>
          <div class="res-val">(${aVal}x - ${bVal}y)(${aVal}x + ${bVal}y)</div>
        </div>
      `;
    }

    output.innerHTML = stepsHtml;
  }
};

// ==========================================
// 5. MODULE 3: PROBLEM ÇÖZME ATÖLYESİ
// ==========================================
const ProblemWorkshop = {
  problems: [
    {
      id: 1,
      category: 'sayi',
      categoryName: 'Sayı & Kesir Problemleri',
      statement: 'Bir sınıftaki öğrenciler sıralara 2\'şer 2\'şer oturursa 4 öğrenci ayakta kalıyor. 3\'er 3\'er otururlarsa 2 sıra boş kalıyor. Buna göre bu sınıfta kaç öğrenci vardır?',
      options: ['24', '28', '32', '36'],
      correctIndex: 1,
      tactics: 'Sıra sayısına "x" diyerek toplam öğrenci sayısını iki farklı durumda birbirine eşitleyin.',
      step1: 'Sıra sayısı = <strong>x</strong> olsun.',
      step2: '1. Durum Öğrenci Sayısı: <strong>2x + 4</strong><br>2. Durum Öğrenci Sayısı: <strong>3(x - 2)</strong>',
      step3: '2x + 4 = 3x - 6 &nbsp;➔&nbsp; x = 10 (Sıra sayısı)<br>Toplam Öğrenci = 2(10) + 4 = <strong>28 öğrenci</strong>.'
    },
    {
      id: 2,
      category: 'yas',
      categoryName: 'Yaş Problemleri',
      statement: 'Bir babanın yaşı, oğlunun yaşının 4 katıdır. 6 yıl sonra babanın yaşı oğlunun yaşının 3 katı olacağına göre, oğlunun bugünkü yaşı kaçtır?',
      options: ['8', '10', '12', '14'],
      correctIndex: 2,
      tactics: 'Zaman geçtikçe her iki kişinin yaşına da geçen yıl sayısı (+6) eklenir.',
      step1: 'Oğul = <strong>x</strong>, Baba = <strong>4x</strong>',
      step2: '6 yıl sonra: Oğul = <strong>x + 6</strong>, Baba = <strong>4x + 6</strong>',
      step3: '4x + 6 = 3(x + 6) &nbsp;➔&nbsp; 4x + 6 = 3x + 18 &nbsp;➔&nbsp; <strong>x = 12</strong> (Oğul).'
    },
    {
      id: 3,
      category: 'hiz',
      categoryName: 'Hız & Hareket Problemleri',
      statement: 'A ve B şehirleri arasındaki mesafe 420 km\'dir. Hızı saatte 80 km olan bir araç ile saatte 60 km olan başka bir araç aynı anda birbirlerine doğru yola çıkarsa kaç saat sonra karşılaşırlar?',
      options: ['2.5 saat', '3 saat', '3.5 saat', '4 saat'],
      correctIndex: 1,
      tactics: 'Birbirine doğru hareket eden araçların hızları toplanır: Yol = (V₁ + V₂) × t',
      step1: 'Toplam Hız = 80 + 60 = <strong>140 km/s</strong>',
      step2: 'Mesafe = <strong>420 km</strong>',
      step3: 't = Yol / Toplam Hız = 420 / 140 = <strong>3 saat</strong>.'
    },
    {
      id: 4,
      category: 'yuzde',
      categoryName: 'Yüzde & Kâr-Zarar',
      statement: 'Maliyeti 400 TL olan bir ceket %25 kâr ile satılırken satış fiyatı üzerinden %10 indirim uygulanıyor. Son satış fiyatı kaç TL\'dir?',
      options: ['420 TL', '450 TL', '460 TL', '480 TL'],
      correctIndex: 1,
      tactics: 'Önce karlı satış fiyatını bulun, ardından bu fiyat üzerinden indirim hesaplayın.',
      step1: '%25 Kâr: 400 × 1.25 = <strong>500 TL</strong> (İlk etiket fiyatı)',
      step2: '%10 İndirim: 500 × 0.10 = 50 TL indirim.',
      step3: 'Son Fiyat = 500 - 50 = <strong>450 TL</strong>.'
    },
    {
      id: 5,
      category: 'karisim',
      categoryName: 'Karışım Problemleri',
      statement: 'Şeker oranı %20 olan 60 gramlık şekerli su karışımı ile şeker oranı %40 olan 40 gramlık şekerli su karıştırılırsa yeni karışımın şeker oranı yüzde kaç olur?',
      options: ['%26', '%28', '%30', '%32'],
      correctIndex: 1,
      tactics: 'Saf Madde Toplamı / Toplam Karışım Miktarı formülünü kullanın.',
      step1: '1. Karışım Şeker: 60 × 0.20 = <strong>12 gr</strong><br>2. Karışım Şeker: 40 × 0.40 = <strong>16 gr</strong>',
      step2: 'Toplam Şeker = 12 + 16 = 28 gr, Toplam Ağırlık = 60 + 40 = 100 gr',
      step3: 'Yeni Oran = (28 / 100) × 100 = <strong>%28</strong>.'
    }
  ],
  currentIndex: 0,

  init() {
    this.renderProblem();
    this.bindEvents();
  },

  bindEvents() {
    document.querySelectorAll('#problem-category-filters .eq-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        sfx.click();
        document.querySelectorAll('#problem-category-filters .eq-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const cat = pill.getAttribute('data-cat');
        const filtered = cat === 'all' ? this.problems : this.problems.filter(p => p.category === cat);
        if (filtered.length > 0) {
          this.currentIndex = this.problems.indexOf(filtered[0]);
          this.renderProblem();
        }
      });
    });
  },

  renderProblem() {
    const p = this.problems[this.currentIndex];
    const container = document.getElementById('problem-active-box');

    container.innerHTML = `
      <div class="problem-card">
        <div class="glass-card-header" style="margin-bottom: 0;">
          <span class="badge badge-gold problem-category-badge">${p.categoryName}</span>
          <span style="font-size:0.8rem; color:var(--text-muted);">Soru ${this.currentIndex + 1} / ${this.problems.length}</span>
        </div>

        <div class="problem-statement">${p.statement}</div>

        <div class="problem-options-grid">
          ${p.options.map((opt, idx) => `
            <button class="option-btn" data-opt-idx="${idx}">
              <span class="opt-letter">${['A', 'B', 'C', 'D'][idx]}</span>
              <span>${opt}</span>
            </button>
          `).join('')}
        </div>

        <!-- Solution Breakdown Box -->
        <div id="problem-solution-area" class="problem-solution-box">
          <div style="font-size:0.9rem; font-weight:800; color:var(--primary); margin-bottom:12px;">
            💡 Nasıl Çözülür? (Adım Adım Çözüm Yolu)
          </div>
          <div style="font-size:0.85rem; color:var(--accent-gold); margin-bottom:8px;">
            <strong>Taktik & İpucu:</strong> ${p.tactics}
          </div>
          <div class="solution-container">
            <div class="step-card"><div class="step-num">Adım 1: Değişkenleri Belirle</div><div class="step-explanation">${p.step1}</div></div>
            <div class="step-card"><div class="step-num">Adım 2: Denklemi Kur</div><div class="step-explanation">${p.step2}</div></div>
            <div class="step-card"><div class="step-num">Adım 3: Sonuca Ulaş</div><div class="step-explanation">${p.step3}</div></div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
          <button id="btn-toggle-solution" class="btn-solve" style="background:rgba(255,255,255,0.08); color:#fff; box-shadow:none;">
            👁️ Çözümü Göster
          </button>
          <button id="btn-next-problem" class="btn-solve">
            <span>Sıradaki Soru ➔</span>
          </button>
        </div>
      </div>
    `;

    // Option clicks
    container.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedIdx = parseInt(btn.getAttribute('data-opt-idx'), 10);
        if (selectedIdx === p.correctIndex) {
          sfx.correct();
          btn.classList.add('correct');
        } else {
          sfx.wrong();
          btn.classList.add('wrong');
          // Highlight correct
          container.querySelector(`.option-btn[data-opt-idx="${p.correctIndex}"]`)?.classList.add('correct');
        }
        document.getElementById('problem-solution-area').classList.add('visible');
      });
    });

    document.getElementById('btn-toggle-solution').addEventListener('click', () => {
      sfx.click();
      document.getElementById('problem-solution-area').classList.toggle('visible');
    });

    document.getElementById('btn-next-problem').addEventListener('click', () => {
      sfx.click();
      this.currentIndex = (this.currentIndex + 1) % this.problems.length;
      this.renderProblem();
    });
  }
};

// ==========================================
// 6. MODULE 4: CANLI GEOMETRİ LABORATUVARI
// ==========================================
let activeGeoType = 'triangle';

function initGeometry() {
  document.querySelectorAll('.eq-pill[data-geo]').forEach(pill => {
    pill.addEventListener('click', () => {
      sfx.click();
      document.querySelectorAll('.eq-pill[data-geo]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeGeoType = pill.getAttribute('data-geo');
      renderGeoInputs();
      drawGeometryCanvas();
    });
  });

  renderGeoInputs();
  drawGeometryCanvas();
}

function renderGeoInputs() {
  const container = document.getElementById('geo-inputs-container');
  if (activeGeoType === 'triangle') {
    container.innerHTML = `
      <div class="field-box"><label>Dik Kenar a (cm)</label><input type="number" id="geo-a" value="6" min="1"></div>
      <div class="field-box" style="margin-top:8px;"><label>Dik Kenar b (cm)</label><input type="number" id="geo-b" value="8" min="1"></div>
    `;
  } else if (activeGeoType === 'special-triangle') {
    container.innerHTML = `
      <div class="field-box">
        <label>Özel Üçgen Tipi</label>
        <select id="geo-special-type" class="trainer-input" style="font-size:0.9rem; padding:8px;">
          <option value="30-60-90">30° - 60° - 90° Üçgeni</option>
          <option value="45-45-90">45° - 45° - 90° Üçgeni</option>
        </select>
      </div>
      <div class="field-box" style="margin-top:8px;"><label>Temel Kenar k (cm)</label><input type="number" id="geo-k" value="5" min="1"></div>
    `;
  } else if (activeGeoType === 'circle') {
    container.innerHTML = `
      <div class="field-box"><label>Yarıçap r (cm)</label><input type="number" id="geo-r" value="7" min="1"></div>
      <div class="field-box" style="margin-top:8px;"><label>Dilim Açısı α (derece)</label><input type="number" id="geo-alpha" value="60" min="1" max="360"></div>
    `;
  } else if (activeGeoType === 'quad') {
    container.innerHTML = `
      <div class="field-box"><label>Alt Taban a (cm)</label><input type="number" id="geo-qa" value="12" min="1"></div>
      <div class="field-box" style="margin-top:8px;"><label>Üst Taban c (cm)</label><input type="number" id="geo-qc" value="6" min="1"></div>
      <div class="field-box" style="margin-top:8px;"><label>Yükseklik h (cm)</label><input type="number" id="geo-qh" value="5" min="1"></div>
    `;
  } else if (activeGeoType === 'analytic') {
    container.innerHTML = `
      <div class="input-row">
        <div class="field-box"><label>A Noktası (x₁)</label><input type="number" id="geo-x1" value="2"></div>
        <div class="field-box"><label>(y₁)</label><input type="number" id="geo-y1" value="3"></div>
      </div>
      <div class="input-row">
        <div class="field-box"><label>B Noktası (x₂)</label><input type="number" id="geo-x2" value="8"></div>
        <div class="field-box"><label>(y₂)</label><input type="number" id="geo-y2" value="11"></div>
      </div>
    `;
  }

  container.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', drawGeometryCanvas);
  });
}

function drawGeometryCanvas() {
  const canvas = document.getElementById('geoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Clear Canvas
  ctx.clearRect(0, 0, w, h);

  // Background Grid Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  const resultsBox = document.getElementById('geo-results-box');
  const summaryBox = document.getElementById('geo-live-summary');

  if (activeGeoType === 'triangle') {
    const a = parseFloat(document.getElementById('geo-a')?.value || '6');
    const b = parseFloat(document.getElementById('geo-b')?.value || '8');
    const c = Math.sqrt(a * a + b * b);
    const area = (a * b) / 2;

    // Draw Triangle
    const scale = Math.min(220 / Math.max(a, b), 25);
    const ox = 120, oy = 280;
    const ax = ox, ay = oy - (a * scale);
    const bx = ox + (b * scale), by = oy;

    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right angle symbol
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(ox, oy - 15, 15, 15);

    // Labels
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Outfit';
    ctx.fillText(`a = ${a} cm`, ox - 65, (oy + ay) / 2);
    ctx.fillText(`b = ${b} cm`, (ox + bx) / 2 - 20, oy + 25);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`c = ${c.toFixed(2)} cm (Hipotenüs)`, (ax + bx) / 2 + 10, (ay + by) / 2 - 10);

    summaryBox.innerHTML = `📐 Pisagor: c² = a² + b² &nbsp;|&nbsp; Hipotenüs = <strong>${c.toFixed(2)} cm</strong> &nbsp;|&nbsp; Alan = <strong>${area} cm²</strong>`;
    resultsBox.innerHTML = `
      <div class="step-card">
        <div class="step-header"><span class="step-num">Pisagor Teoremi</span><span class="step-rule">c = √(a² + b²)</span></div>
        <div class="step-math">c = \\sqrt{${a}² + ${b}²} = \\sqrt{${a*a + b*b}} = ${c.toFixed(2)} \\text{ cm}</div>
        <div class="step-explanation">Dik kenarların kareleri toplamı hipotenüsün karesine eşittir.</div>
      </div>
      <div class="step-card">
        <div class="step-header"><span class="step-num">Üçgende Alan</span><span class="step-rule">A = (a · b) / 2</span></div>
        <div class="step-math">\\text{Alan} = \\frac{${a} · ${b}}{2} = ${area} \\text{ cm}²</div>
      </div>
    `;
  } else if (activeGeoType === 'circle') {
    const r = parseFloat(document.getElementById('geo-r')?.value || '7');
    const alpha = parseFloat(document.getElementById('geo-alpha')?.value || '60');
    const area = Math.PI * r * r;
    const perimeter = 2 * Math.PI * r;
    const sectorArea = (alpha / 360) * area;

    const cx = w / 2, cy = h / 2;
    const drawR = Math.min(130, r * 14);

    // Circle
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, drawR, 0, Math.PI * 2);
    ctx.stroke();

    // Sector
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, drawR, 0, (alpha * Math.PI) / 180);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    summaryBox.innerHTML = `⭕ Çevre = <strong>${perimeter.toFixed(2)} cm</strong> &nbsp;|&nbsp; Alan = <strong>${area.toFixed(2)} cm²</strong> &nbsp;|&nbsp; Dilim Alanı (${alpha}°) = <strong>${sectorArea.toFixed(2)} cm²</strong>`;
    resultsBox.innerHTML = `
      <div class="step-card">
        <div class="step-header"><span class="step-num">Daire Alanı</span><span class="step-rule">A = π · r²</span></div>
        <div class="step-math">A = \\pi · (${r})² = ${area.toFixed(2)} \\text{ cm}²</div>
      </div>
      <div class="step-card">
        <div class="step-header"><span class="step-num">Daire Dilimi Alanı</span><span class="step-rule">A_{dilim} = (α / 360) · π r²</span></div>
        <div class="step-math">A_{dilim} = \\frac{${alpha}}{360} · \\pi · ${r}² = ${sectorArea.toFixed(2)} \\text{ cm}²</div>
      </div>
    `;
  } else if (activeGeoType === 'special-triangle') {
    const type = document.getElementById('geo-special-type')?.value || '30-60-90';
    const k = parseFloat(document.getElementById('geo-k')?.value || '5');

    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;

    if (type === '30-60-90') {
      const side30 = k;
      const side60 = k * Math.sqrt(3);
      const hyp = 2 * k;
      const area = (side30 * side60) / 2;

      const ox = 100, oy = 280;
      const ax = ox, ay = oy - (side60 * 16);
      const bx = ox + (side30 * 16), by = oy;

      ctx.beginPath();
      ctx.moveTo(ox, oy); ctx.lineTo(ax, ay); ctx.lineTo(bx, by); ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Outfit';
      ctx.fillText(`30° karşısı: ${k} cm (k)`, (ox + bx) / 2 - 20, oy + 25);
      ctx.fillText(`60° karşısı: ${(side60).toFixed(2)} cm (k√3)`, ox - 85, (oy + ay) / 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`90° karşısı (Hipotenüs): ${hyp} cm (2k)`, (ax + bx) / 2 + 10, (ay + by) / 2 - 10);

      summaryBox.innerHTML = `📐 30°-60°-90°: 30° karşısı <strong>${k} cm</strong> | 60° karşısı <strong>${(side60).toFixed(2)} cm</strong> | 90° karşısı <strong>${hyp} cm</strong>`;
      resultsBox.innerHTML = `
        <div class="step-card">
          <div class="step-header"><span class="step-num">30°-60°-90° Kuralı</span><span class="step-rule">k, k√3, 2k</span></div>
          <div class="step-math">30^\\circ \\rightarrow k = ${k}, \\quad 60^\\circ \\rightarrow k\\sqrt{3} = ${(side60).toFixed(2)}, \\quad 90^\\circ \\rightarrow 2k = ${hyp}</div>
          <div class="step-explanation">Alan = (k · k√3) / 2 = <strong>${area.toFixed(2)} cm²</strong></div>
        </div>
      `;
    } else {
      const side = k;
      const hyp = k * Math.sqrt(2);
      const area = (k * k) / 2;

      const ox = 120, oy = 280;
      const ax = ox, ay = oy - (k * 18);
      const bx = ox + (k * 18), by = oy;

      ctx.beginPath();
      ctx.moveTo(ox, oy); ctx.lineTo(ax, ay); ctx.lineTo(bx, by); ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Outfit';
      ctx.fillText(`45° karşısı: ${k} cm (k)`, (ox + bx) / 2 - 20, oy + 25);
      ctx.fillText(`45° karşısı: ${k} cm (k)`, ox - 75, (oy + ay) / 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`Hipotenüs: ${(hyp).toFixed(2)} cm (k√2)`, (ax + bx) / 2 + 10, (ay + by) / 2 - 10);

      summaryBox.innerHTML = `📐 45°-45°-90° İkizkenar Dik Üçgen: Dik Kenarlar = <strong>${k} cm</strong> | Hipotenüs = <strong>${(hyp).toFixed(2)} cm</strong>`;
      resultsBox.innerHTML = `
        <div class="step-card">
          <div class="step-header"><span class="step-num">45°-45°-90° Kuralı</span><span class="step-rule">k, k, k√2</span></div>
          <div class="step-math">\\text{Hipotenüs} = k\\sqrt{2} = ${k} \\cdot \\sqrt{2} = ${(hyp).toFixed(2)} \\text{ cm}</div>
          <div class="step-explanation">Alan = (k · k) / 2 = <strong>${area.toFixed(2)} cm²</strong></div>
        </div>
      `;
    }
  } else if (activeGeoType === 'quad') {
    const a = parseFloat(document.getElementById('geo-qa')?.value || '12');
    const c = parseFloat(document.getElementById('geo-qc')?.value || '6');
    const h = parseFloat(document.getElementById('geo-qh')?.value || '5');
    const area = ((a + c) / 2) * h;

    const ox = 80, oy = 270;
    const scale = 18;
    const p1 = { x: ox, y: oy };
    const p2 = { x: ox + a * scale, y: oy };
    const p3 = { x: ox + ((a - c) / 2 + c) * scale, y: oy - h * scale };
    const p4 = { x: ox + ((a - c) / 2) * scale, y: oy - h * scale };

    ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Height dashed line
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(p4.x, p4.y);
    ctx.lineTo(p4.x, oy);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Outfit';
    ctx.fillText(`Alt Taban a = ${a} cm`, (p1.x + p2.x) / 2 - 40, oy + 25);
    ctx.fillText(`Üst Taban c = ${c} cm`, (p4.x + p3.x) / 2 - 40, p4.y - 12);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`h = ${h} cm`, p4.x + 8, (oy + p4.y) / 2);

    summaryBox.innerHTML = `🔷 Yamuk Alanı = ((Alt Taban + Üst Taban) / 2) · h = <strong>${area.toFixed(2)} cm²</strong>`;
    resultsBox.innerHTML = `
      <div class="step-card">
        <div class="step-header"><span class="step-num">Yamuk Alan Formülü</span><span class="step-rule">A = ((a + c) / 2) · h</span></div>
        <div class="step-math">A = \\frac{${a} + ${c}}{2} \\cdot ${h} = \\frac{${a+c}}{2} \\cdot ${h} = ${area.toFixed(2)} \\text{ cm}²</div>
      </div>
    `;
  } else if (activeGeoType === 'analytic') {
    const x1 = parseFloat(document.getElementById('geo-x1')?.value || '2');
    const y1 = parseFloat(document.getElementById('geo-y1')?.value || '3');
    const x2 = parseFloat(document.getElementById('geo-x2')?.value || '8');
    const y2 = parseFloat(document.getElementById('geo-y2')?.value || '11');

    const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const slope = x2 !== x1 ? (y2 - y1) / (x2 - x1) : 0;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Coordinate grid axes
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, h - 40); ctx.lineTo(w - 20, h - 40); // X Axis
    ctx.moveTo(40, h - 40); ctx.lineTo(40, 20); // Y Axis
    ctx.stroke();

    const scale = 18;
    const pA = { x: 40 + x1 * scale, y: (h - 40) - y1 * scale };
    const pB = { x: 40 + x2 * scale, y: (h - 40) - y2 * scale };

    // Line segment
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.stroke();

    // Points
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(pA.x, pA.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(pB.x, pB.y, 6, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Outfit';
    ctx.fillText(`A(${x1}, ${y1})`, pA.x + 10, pA.y - 10);
    ctx.fillText(`B(${x2}, ${y2})`, pB.x + 10, pB.y - 10);

    summaryBox.innerHTML = `📍 Uzaklık = <strong>${dist.toFixed(2)} br</strong> &nbsp;|&nbsp; Eğim (m) = <strong>${slope.toFixed(2)}</strong> &nbsp;|&nbsp; Orta Nokta = <strong>(${midX}, ${midY})</strong>`;
    resultsBox.innerHTML = `
      <div class="step-card">
        <div class="step-header"><span class="step-num">İki Nokta Arası Uzaklık</span><span class="step-rule">d = √((x₂-x₁)² + (y₂-y₁)²)</span></div>
        <div class="step-math">d = \\sqrt{(${x2}-${x1})² + (${y2}-${y1})²} = \\sqrt{${Math.pow(x2-x1,2)} + ${Math.pow(y2-y1,2)}} = ${dist.toFixed(2)}</div>
      </div>
      <div class="step-card">
        <div class="step-header"><span class="step-num">Eğim (m)</span><span class="step-rule">m = (y₂ - y₁) / (x₂ - x₁)</span></div>
        <div class="step-math">m = \\frac{${y2} - ${y1}}{${x2} - ${x1}} = ${slope.toFixed(2)}</div>
      </div>
    `;
  }
}

// ==========================================
// 7. MODULE 5: MATEMATİKSEL ZEKA OYUNLARI
// ==========================================
const PuzzleMaster = {
  puzzles: [
    {
      seq: [2, 5, 10, 17, 26],
      answer: 37,
      hint: 'Kural: n² + 1 (1²+1=2, 2²+1=5, 3²+1=10, 4²+1=17, 5²+1=26, 6²+1=37)'
    },
    {
      seq: [3, 6, 12, 24, 48],
      answer: 96,
      hint: 'Kural: Her adımda 2 ile çarpılıyor (×2)'
    },
    {
      seq: [1, 1, 2, 3, 5, 8, 13],
      answer: 21,
      hint: 'Kural: Fibonacci Dizisi (Önceki iki sayının toplamı: 8 + 13 = 21)'
    }
  ],
  currentIdx: 0,

  init() {
    this.render();
  },

  render() {
    const p = this.puzzles[this.currentIdx];
    const container = document.getElementById('puzzle-active-container');
    container.innerHTML = `
      <div class="math-arena-box">
        <div style="font-size:0.85rem; color:var(--accent-gold); font-weight:700; margin-bottom:12px;">
          🧩 Sayı Dizisindeki Sıradaki Sayıyı Bulun:
        </div>
        <div class="question-expression" style="font-size:2.2rem; color:var(--primary);">
          ${p.seq.join(', ')}, &nbsp;<span style="color:var(--accent-gold);">?</span>
        </div>

        <div class="trainer-input-wrapper">
          <input type="number" id="puzzle-user-input" class="trainer-input" placeholder="Cevap..." autofocus>
          <button id="btn-submit-puzzle" class="btn-solve">Kontrol</button>
        </div>

        <div id="puzzle-feedback" style="margin-top:16px; font-weight:700;"></div>
      </div>
    `;

    document.getElementById('btn-submit-puzzle').addEventListener('click', () => {
      const val = parseInt(document.getElementById('puzzle-user-input').value, 10);
      const fb = document.getElementById('puzzle-feedback');
      if (val === p.answer) {
        sfx.correct();
        fb.innerHTML = `<span style="color:var(--accent-emerald);">🎉 Tebrikler Doğru!</span><br><small style="color:var(--text-muted);">${p.hint}</small>`;
        setTimeout(() => {
          this.currentIdx = (this.currentIdx + 1) % this.puzzles.length;
          this.render();
        }, 2200);
      } else {
        sfx.wrong();
        fb.innerHTML = `<span style="color:var(--accent-rose);">❌ Tekrar Deneyin!</span>`;
      }
    });
  }
};

// ==========================================
// 8. MODULE 6: FORMÜL KÜTÜPHANESİ
// ==========================================
const FormulaLibrary = {
  formulas: [
    { title: 'Pisagor Bağıntısı', math: 'a² + b² = c²', desc: 'Dik üçgende hipotenüs uzunluğunun karesi dik kenarların kareleri toplamına eşittir.' },
    { title: '2. Derece Kök Bulma (Delta)', math: 'Δ = b² - 4ac \\quad x_{1,2} = \\frac{-b \\pm \\sqrt{Δ}}{2a}', desc: 'Kuadratik denklemlerde köklerin varlığı ve çözümü.' },
    { title: 'İki Kare Farkı', math: 'a² - b² = (a - b)(a + b)', desc: 'En çok kullanılan çarpanlara ayırma özdeşliği.' },
    { title: 'Dairenin Alanı ve Çevresi', math: 'Alan = \\pi r² \\quad Çevre = 2\\pi r', desc: 'r yarıçaplı tam dairenin alanı ve çemberin çevre formülü.' },
    { title: 'Hız, Yol ve Zaman', math: 'x = v \\cdot t \\quad (Yol = Hız \\times Zaman)', desc: 'Tüm hareket ve hız problemlerinin ana denklemi.' },
    { title: 'Karışım Yüzdesi', math: '\\text{Yüzde} = \\frac{\\text{Saf Madde}}{\\text{Toplam Karışım}} \\times 100', desc: 'Şeker, tuz ve alkol karışımlarında yeni oran hesabı.' }
  ],

  init() {
    this.render(this.formulas);
    document.getElementById('formula-search-input')?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = this.formulas.filter(f => f.title.toLowerCase().includes(query) || f.desc.toLowerCase().includes(query));
      this.render(filtered);
    });
  },

  render(list) {
    const container = document.getElementById('formulas-grid-container');
    container.innerHTML = list.map(f => `
      <div class="formula-card">
        <div class="formula-name">${f.title}</div>
        <div class="formula-math">${f.math}</div>
        <div class="formula-desc">${f.desc}</div>
      </div>
    `).join('');
  }
};

// ==========================================
// BOOTSTRAP INITIALIZATION
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  ArithmeticTrainer.init();
  AlgebraSolver.init();
  ProblemWorkshop.init();
  initGeometry();
  PuzzleMaster.init();
  FormulaLibrary.init();
});
