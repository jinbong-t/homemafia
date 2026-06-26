

// === iframe ID → section ID 매핑 ===
const IFRAME_TO_SECTION = {
  "s-start": "sec-screen01",
  "s-setup": "sec-screen01",
  "s-stage1": "sec-screen02",
  "s-paper1": "sec-paper1",
  "s-stage2": "sec-screen03",
  "s-paper2": "sec-paper2",
  "s-stage3": "sec-screen04",
  "s-paper3": "sec-paper3",
  "s-stage4": "sec-screen05",
  "s-stage5": "sec-screen06",
  "s-vote": "sec-screen07"
};

// === 화면 전환 유틸 ===
const SECTIONS = ["sec-screen01","sec-screen02","sec-paper1","sec-screen03","sec-paper2","sec-screen04","sec-paper3","sec-screen05","sec-screen06","sec-screen07"];
let currentIdx = 0;
var WSA_GROUP = '';

function showSection(id) {
    SECTIONS.forEach(s => {
        document.getElementById(s).style.display = 'none';
    });
    document.getElementById(id).style.display = 'block';
    currentIdx = SECTIONS.indexOf(id);
    window.scrollTo(0, 0);
    
    // 해당 섹션의 init 함수 호출
    const initFn = 'init_' + id.replace(/-/g, '_');
    if (typeof window[initFn] === 'function') {
        window[initFn]();
    }
}

// gotoScreen 브릿지: 원본 iframe ID로 호출되면 section ID로 변환
function gotoScreen(iframeId) {
    var sectionId = IFRAME_TO_SECTION[iframeId];
    if (!sectionId) {
        console.error('알 수 없는 화면:', iframeId);
        return;
    }
    
    // 's-setup'은 screen01 내부 화면이므로 특별 처리
    if (iframeId === 's-setup') {
        // sec-screen01이 보이고 있어야 하므로 먼저 보이게 하고
        showSection('sec-screen01');
        // 내부 goToSetup_internal 호출
        if (typeof window.goToSetup_internal === 'function') {
            window.goToSetup_internal();
        }
        return;
    }
    
    showSection(sectionId);
}

function goNext() {
    if (currentIdx < SECTIONS.length - 1) {
        showSection(SECTIONS[currentIdx + 1]);
    }
}

function goPrev() {
    if (currentIdx > 0) {
        showSection(SECTIONS[currentIdx - 1]);
    }
}

// 첫 화면 init
document.addEventListener('DOMContentLoaded', function() {
    const initFn = 'init_' + SECTIONS[0].replace(/-/g, '_');
    if (typeof window[initFn] === 'function') {
        window[initFn]();
    }
});


// === screen01_start.html ===
function init_sec_screen01() {

var PARAGRAPHS = [
  "나는 지금 너희가 있는 시간보다 10년 뒤에 살고 있어. 그리고 솔직히 말할게 — 나는 꽤 많이 실패했어.",
  "처음엔 라면이랑 편의점 도시락으로 버텼어. 한 달쯤 지나니까 몸이 이상했어. 알고 보니 단백질을 거의 못 먹고 있었던 거야.",
  "자취방 구할 때 월세만 봤어. 북향 반지하, 창문 없음. 여름에 곰팡이가 피어서 옷이랑 책이 다 망가졌어.",
  "알바 첫 월급 받고 기분 좋아서 막 썼어. 그 달 카드값 연체됐고 신용점수 깎였어.",
  "부모님이랑 싸웠을 때 \"당신들은 왜 맨날 그래요!\"라고 했어. 그게 나 전달법이 아니라는 거, 그때는 몰랐어.",
  "25살에 처음으로 내 인생을 설계해봤어. 근데 진짜 빠를수록 좋아. 지금 중학생이면 — 지금이 딱 시작할 때야.",
  "그래서 이 기록을 암호로 잠가서 과거로 보냈어. 5개 금고를 열면 내 실패들이 조각조각 나와."
];
var SPEED = 36;
var timer = null, skipMode = false, rendered = "";
var fullText = PARAGRAPHS.join("\n\n");
var area, scr2;

/* ── 스파클 ── */
function sparkle() {
  for(var i=0;i<10;i++) {
    (function(i){ setTimeout(function(){
      var s=document.createElement('span');
      s.textContent='✦';
      s.style.cssText='position:fixed;left:'+(15+Math.random()*70)+'%;top:'+(15+Math.random()*60)+'%;font-size:'+(10+Math.random()*14)+'px;color:#f9a8d4;pointer-events:none;z-index:999;animation:spar .9s forwards';
      document.body.appendChild(s);
      setTimeout(function(){s.remove();},900);
    },i*65); })(i);
  }
}

/* ── SCREEN 1 → 2 ── */
function openLetter() {
  sparkle();
  setTimeout(function(){
    document.getElementById('scr-intro').classList.add('hide');
    scr2 = document.getElementById('scr-letter');
    area = document.getElementById('typing-area');
    scr2.classList.add('active');
    scr2.scrollTop = 0;
    document.getElementById('skip-btn').classList.add('show');
    rendered=''; skipMode=false;
    typeNext();
  },350);
}

/* ── 타이핑 ── */
function typeNext(){
  if(skipMode) return;
  if(rendered.length >= fullText.length){ finishTyping(); return; }
  var ch = fullText[rendered.length];
  rendered += ch;
  area.innerHTML = rendered.replace(/\n\n/g,'<br><br>') + '<span class="cursor"></span>';
  document.getElementById('prog-label').textContent = Math.round(rendered.length/fullText.length*100)+'%';
  scr2.scrollTop = scr2.scrollHeight;
  var d = SPEED;
  if(rendered.endsWith('\n\n')) d=520;
  else if('!.?'.includes(ch)) d=190;
  else if(ch===',') d=90;
  timer = setTimeout(typeNext, d);
}

function skipTyping(){
  skipMode=true; if(timer) clearTimeout(timer);
  area.innerHTML = fullText.replace(/\n\n/g,'<br><br>');
  finishTyping();
}

function finishTyping(){
  document.getElementById('skip-btn').classList.remove('show');
  document.getElementById('prog-label').textContent='';
  /* 타이핑 카드 → 완성 편지지 교체 */
  var tc=document.getElementById('typing-card');
  var fl=document.getElementById('full-letter');
  tc.style.opacity='0';
  setTimeout(function(){
    tc.style.display='none';
    fl.style.display='block';
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      fl.classList.add('show');
    }); });
  },420);
  setTimeout(function(){ document.getElementById('warning-card').classList.add('on'); scr2.scrollTop=scr2.scrollHeight; },1000);
  setTimeout(function(){ document.getElementById('letter-cta').classList.add('on'); scr2.scrollTop=scr2.scrollHeight; },1600);
}

/* ── SCREEN 2 → 1 (뒤로) ── */
function goBack(){
  skipMode=true; if(timer) clearTimeout(timer);
  scr2.classList.remove('active');
  document.getElementById('scr-intro').classList.remove('hide');
  document.getElementById('skip-btn').classList.remove('show');
  /* 초기화 */
  document.getElementById('typing-card').style.display='block';
  document.getElementById('typing-card').style.opacity='1';
  var fl=document.getElementById('full-letter');
  fl.classList.remove('show'); fl.style.display='none'; fl.style.opacity='0'; fl.style.transform='scale(0.97)';
  document.getElementById('warning-card').classList.remove('on');
  document.getElementById('letter-cta').classList.remove('on');
  area.innerHTML=''; rendered='';
}

/* ── SCREEN 2 → 3 ── */
function goToSetup(){
  scr2.classList.remove('active');
  {gotoScreen('s-setup');}
  setTimeout(function(){ document.getElementById('group-input').focus(); },400);
}

/* ── 조 입력 ── */
function onGroupInput(){
  var v = document.getElementById('group-input').value.trim();
  document.getElementById('btn-go').disabled = v.length === 0;
}
function setGroup(name){
  document.getElementById('group-input').value = name;
  onGroupInput();
}
function startMission(){
  var v = document.getElementById('group-input').value.trim();
  if(!v) return;
  /* 여기서 STAGE 1으로 이동 */
  window.GROUP_NAME = v;
  {window.WSA_GROUP=v;gotoScreen('s-stage1');}
}


window.goToSetup_internal = function(){
  var setup=document.getElementById('scr-setup');
  var intro=document.getElementById('scr-intro');
  var letter=document.getElementById('scr-letter');
  if(intro)intro.classList.add('hide');
  if(letter)letter.classList.remove('active');
  if(setup)setup.classList.add('active');
};


    // === 글로벌 스코프 노출 ===
    window.sparkle = sparkle;
    window.openLetter = openLetter;
    window.typeNext = typeNext;
    window.skipTyping = skipTyping;
    window.finishTyping = finishTyping;
    window.goBack = goBack;
    window.goToSetup = goToSetup;
    window.onGroupInput = onGroupInput;
    window.setGroup = setGroup;
    window.startMission = startMission;
}
// === screen02_stage1.html ===
function init_sec_screen02() {

var ANSWERS = { a1:'4', a2:'2', a3:'3' };
var CORRECT = {
  a1:'✅ 정답! 비타민은 에너지를 직접 생성하지 않는다. 3대 에너지 영양소는 탄수화물·단백질·지방뿐이다. → 코드 첫째: 4',
  a2:'✅ 정답! 1,400 ÷ 2,000 × 100 = 70%. 십의 자리 = 7 → 코드 둘째: 7 (항상 고정)',
  a3:'✅ 정답! 의무표시 9가지 중 영양성분표에 없는 것은 나트륨이다. → 코드 셋째: 3'
};
var WRONG = {
  a1:'❌ 파일 4개의 공통 표현 "에너지를 직접 생성"이 각 파일에서 정말 맞는 말인지 다시 따져봐라.',
  a2:'❌ 어떤 수치를 어떤 기준으로 나눠야 하는지 다시 확인하라. 칼륨은 계산에 사용하지 않는다.',
  a3:'❌ 식품위생법 의무표시 9가지와 현재 영양성분표에 있는 항목들을 비교해봐라. 9가지 중 뭐가 빠졌는가?'
};

var wrongCount = { a1:0, a2:0, a3:0 };
var selected = {};

function pickOpt(qid, idx, val, el) {
  if(selected[qid] === '__correct__') return;
  selected[qid] = val;

  var opts = document.querySelectorAll('#opts-'+qid+' .opt');
  opts.forEach(function(o){ o.className='opt'; o.disabled=false; });
  el.className = 'opt selected';

  var fb = document.getElementById('fb-'+qid);

  if(val === ANSWERS[qid]) {
    fb.className = 'feedback ok';
    fb.textContent = CORRECT[qid];
    selected[qid] = '__correct__';
    opts.forEach(function(o){ o.disabled=true; });
    el.className = 'opt correct';
  } else {
    wrongCount[qid]++;
    fb.className = 'feedback ng';
    fb.textContent = WRONG[qid];
    el.className = 'opt wrong';
    // 1번 틀리면 힌트 등장
    if(wrongCount[qid] >= 1) {
      document.getElementById('hint-'+qid).classList.add('show');
    }
  }
  updateCode();
}

function updateCode() {
  var a1 = selected['a1']==='__correct__' ? '4' : '—';
  var a2 = selected['a2']==='__correct__' ? '7' : '—';
  var a3 = selected['a3']==='__correct__' ? '3' : '—';

  var b1=document.getElementById('cb1'), b2=document.getElementById('cb2'), b3=document.getElementById('cb3');
  b1.textContent=a1; b1.className='code-box'+(a1!=='—'?' filled':'');
  b2.textContent=a2; b2.className='code-box'+(a2!=='—'?' filled':'');
  b3.textContent=a3; b3.className='code-box'+(a3!=='—'?' filled':'');

  var allDone = a1!=='—' && a2!=='—' && a3!=='—';
  document.getElementById('btn-submit').disabled = !allDone;
  if(allDone) {
    document.getElementById('frag-reveal').classList.add('show');
    setTimeout(function(){
      document.getElementById('frag-reveal').scrollIntoView({behavior:'smooth',block:'center'});
    },300);
  }
}

function submitStage() {
  gotoScreen('s-paper1');
}


    // === 글로벌 스코프 노출 ===
    window.pickOpt = pickOpt;
    window.updateCode = updateCode;
    window.submitStage = submitStage;
}
// === paper1_stage1.html ===
function init_sec_paper1() {

var solved=false;
function nxt(el,id){if(el.value.length===1)document.getElementById(id).focus();}
function check(){
  var a=document.getElementById('c1').value.trim();
  var b=document.getElementById('c2').value.trim();
  var c=document.getElementById('c3').value.trim();
  if(!a||!b||!c){alert('3자리를 모두 입력하세요.');return;}
  var pop=document.getElementById('pop');
  if(a==='1'&&b==='3'&&c==='5'){
    solved=true; pop.className='popup ok';
    document.getElementById('pi').textContent='✅';
    document.getElementById('pt').textContent='정답! 코드 1 — 3 — 5';
    document.getElementById('ps').innerHTML='<strong>① 탄수화물 = 1</strong><br><strong>② 지방 = 3</strong><br><strong>③ 철분 → 무기질 = 5</strong><br><br>코드를 기록하고 STAGE 2로!';
    document.getElementById('pb').textContent='▶ STAGE 2 주거로 이동';
  } else {
    pop.className='popup ng';
    document.getElementById('pi').textContent='❌';
    document.getElementById('pt').textContent='틀렸다. 다시 확인하라.';
    document.getElementById('ps').innerHTML='① 뇌에 포도당 공급 → 탄수화물<br>② 1g당 9kcal → 지방<br>③ 철분 → <strong>무기질</strong> (단백질 아님!)';
    document.getElementById('pb').textContent='다시 시도';
  }
  document.getElementById('ov').classList.add('show');
}
function closeOv(e){if(e.target===document.getElementById('ov'))document.getElementById('ov').classList.remove('show');}
function popAct(){if(solved)gotoScreen('s-stage2'); document.getElementById('ov').classList.remove('show');}


    // === 글로벌 스코프 노출 ===
    window.nxt = nxt;
    window.check = check;
    window.closeOv = closeOv;
    window.popAct = popAct;
}
// === screen03_stage2.html ===
function init_sec_screen03() {

var ANSWERS = {b1:'2', b2:'2', b3:'2'};
var CORRECT = {
  b1:'✅ 정답! 방 B. 월세 28만원으로 가장 저렴했지만 북향·지하·창문 없음·습도 82%로 3년 연속 곰팡이가 발생했다. 이사 비용이 6개월치 월세(168만원)를 초과했다. → 코드 첫째: 2',
  b2:'✅ 정답! 항목 3. 항목 1·2·4·5는 교과서의 주거 기능에 해당한다. 항목 3은 주거의 기능이 아닌 사회적 의미(과시·경쟁)다. → 코드 둘째: 3',
  b3:'✅ 정답! 방안 3. 암막 커튼은 채광을 차단해 낮에도 조명이 필요하게 만든다. 시각적으로도 좁아 보이게 해 공간 활용 목적에 어긋난다. → 코드 셋째: 3'
};
var WRONG = {
  b1:'❌ 조건을 다시 읽어봐라. 월세가 저렴하고 이사 비용이 6개월치 이상 든 방은?',
  b2:'❌ 항목 1·2·4·5가 주거 기능에 해당하는지 다시 확인하라. 기능과 사회적 의미의 차이는?',
  b3:'❌ 방안 3 그림을 다시 봐라. X 표시와 조명 아이콘이 무엇을 의미하는지 생각해봐라.'
};
var wrongCount = {b1:0, b2:0, b3:0};
var selected = {};

function pickOpt(qid, val, el) {
  if(selected[qid] === '__correct__') return;
  selected[qid] = val;
  var opts = document.querySelectorAll('#opts-' + qid + ' .opt');
  opts.forEach(function(o){ o.className='opt'; o.disabled=false; });
  el.className = 'opt selected';
  var fb = document.getElementById('fb-' + qid);
  if(val === ANSWERS[qid]) {
    fb.className = 'feedback ok';
    fb.textContent = CORRECT[qid];
    selected[qid] = '__correct__';
    opts.forEach(function(o){ o.disabled=true; });
    el.className = 'opt correct';
  } else {
    wrongCount[qid]++;
    fb.className = 'feedback ng';
    fb.textContent = WRONG[qid];
    el.className = 'opt wrong';
    if(wrongCount[qid] >= 1) {
      document.getElementById('hint-' + qid).classList.add('show');
    }
  }
  updateCode();
}

function updateCode() {
  var codes = {
    b1: selected['b1']==='__correct__' ? '2' : '—',
    b2: selected['b2']==='__correct__' ? '3' : '—',
    b3: selected['b3']==='__correct__' ? '3' : '—'
  };
  var b1=document.getElementById('cb1'), b2=document.getElementById('cb2'), b3=document.getElementById('cb3');
  b1.textContent=codes.b1; b1.className='code-box'+(codes.b1!=='—'?' filled':'');
  b2.textContent=codes.b2; b2.className='code-box'+(codes.b2!=='—'?' filled':'');
  b3.textContent=codes.b3; b3.className='code-box'+(codes.b3!=='—'?' filled':'');
  var allDone = codes.b1!=='—' && codes.b2!=='—' && codes.b3!=='—';
  document.getElementById('btn-submit').disabled = !allDone;
  if(allDone) {
    document.getElementById('frag-reveal').classList.add('show');
    setTimeout(function(){
      document.getElementById('frag-reveal').scrollIntoView({behavior:'smooth',block:'center'});
    }, 300);
  }
}

function submitStage() {
  gotoScreen('s-paper2');
}


    // === 글로벌 스코프 노출 ===
    window.pickOpt = pickOpt;
    window.updateCode = updateCode;
    window.submitStage = submitStage;
}
// === paper2_stage2.html ===
function init_sec_paper2() {

// 8쌍 데이터 — 이미지(이모지) + 이름
var PAIRS = [
  {id:1, emoji:'☀️', name:'채광',    desc:'햇빛이 들어오는 정도'},
  {id:2, emoji:'💨', name:'통풍',    desc:'바람이 잘 통하는 구조'},
  {id:3, emoji:'🌡️', name:'온도',    desc:'쾌적한 실내 온기'},
  {id:4, emoji:'💧', name:'습도',    desc:'적정 수분 유지'},
  {id:5, emoji:'🍄', name:'곰팡이',  desc:'과습 시 발생'},
  {id:6, emoji:'🧭', name:'방향',    desc:'남향·북향·동향·서향'},
  {id:7, emoji:'🏢', name:'층수',    desc:'건물 내 위치'},
  {id:8, emoji:'🪟', name:'창문',    desc:'채광·통풍의 핵심'},
];

var flipped = [], matched = 0, tries = 0, locked = false;

function shuffle(arr){
  var a=arr.slice();
  for(var i=a.length-1;i>0;i--){
    var j=Math.floor(Math.random()*(i+1));
    var t=a[i];a[i]=a[j];a[j]=t;
  }
  return a;
}

function initGame(){
  flipped=[]; matched=0; tries=0; locked=false;
  document.getElementById('matched-count').textContent='0';
  document.getElementById('try-count').textContent='0';
  document.getElementById('ov').classList.remove('show');

  // 카드 16장 생성 (이미지 카드 8 + 이름 카드 8)
  var cards=[];
  PAIRS.forEach(function(p){
    cards.push({pairId:p.id, type:'img', emoji:p.emoji, name:p.name});
    cards.push({pairId:p.id, type:'name', emoji:p.emoji, name:p.name});
  });
  cards=shuffle(cards);

  var grid=document.getElementById('card-grid');
  grid.innerHTML='';
  cards.forEach(function(c,i){
    var div=document.createElement('div');
    div.className='card';
    div.dataset.pair=c.pairId;
    div.dataset.type=c.type;
    div.dataset.idx=i;
    div.innerHTML=
      '<div class="card-inner">'+
        '<div class="card-face card-back"><div class="card-back-icon">🌿</div></div>'+
        '<div class="card-face card-front '+(c.type==='img'?'img-card':'name-card')+'">'+
          '<div class="card-emoji">'+c.emoji+'</div>'+
          '<div class="card-name">'+c.name+'</div>'+
        '</div>'+
      '</div>';
    div.addEventListener('click',function(){flipCard(this);});
    grid.appendChild(div);
  });
}

function flipCard(card){
  if(locked) return;
  if(card.classList.contains('flipped')) return;
  if(card.classList.contains('matched')) return;
  if(flipped.length>=2) return;

  card.classList.add('flipped');
  flipped.push(card);

  if(flipped.length===2){
    locked=true;
    tries++;
    document.getElementById('try-count').textContent=tries;
    checkMatch();
  }
}

function checkMatch(){
  var a=flipped[0], b=flipped[1];
  var sameId=a.dataset.pair===b.dataset.pair;
  var diffType=a.dataset.type!==b.dataset.type;

  if(sameId && diffType){
    // 정답!
    setTimeout(function(){
      a.classList.add('matched');
      b.classList.add('matched');
      matched++;
      document.getElementById('matched-count').textContent=matched;
      flipped=[];
      locked=false;
      if(matched===PAIRS.length) setTimeout(showClear, 600);
    },300);
  } else {
    // 오답 — 뒤집기
    setTimeout(function(){
      a.classList.remove('flipped');
      b.classList.remove('flipped');
      flipped=[];
      locked=false;
    },900);
  }
}

function showClear(){
  // 파티클
  var icons=['🏠','🌿','⭐','✨','💚'];
  for(var i=0;i<24;i++){
    (function(i){setTimeout(function(){
      var p=document.createElement('div');
      p.className='particle';
      p.textContent=icons[Math.floor(Math.random()*icons.length)];
      p.style.cssText='left:'+(5+Math.random()*90)+'vw;top:-20px;animation-duration:'+(1.8+Math.random()*1.5)+'s';
      document.body.appendChild(p);
      setTimeout(function(){p.remove();},3500);
    },i*80);})(i);
  }
  document.getElementById('pop-sub').innerHTML=
    tries+'번 시도로 모든 쌍을 맞췄다!<br><strong>주거 요소 마스터!</strong><br><br>다음 단계로 이동하라.';
  document.getElementById('ov').classList.add('show');
}

function goNext(){
  document.getElementById('ov').classList.remove('show');
  gotoScreen('s-stage3');
}

// 시작
initGame();


    // === 글로벌 스코프 노출 ===
    window.shuffle = shuffle;
    window.initGame = initGame;
    window.flipCard = flipCard;
    window.checkMatch = checkMatch;
    window.showClear = showClear;
    window.goNext = goNext;
}
// === screen04_stage3.html ===
function init_sec_screen04() {

var ANS = {c1:'1', c2:'2', c3:'3', c4:'3'};
var MAP = {c1:'h', c2:'o', c3:'m', c4:'e'};
var OK = {
  c1:'✅ H — Happiness. N·B·R은 방법이고, 목적은 삶의 진정한 행복·만족 향상이다.',
  c2:'✅ O — Ombudsman. 한국소비자원·분쟁조정위원회만 법적 구속력 있는 결정을 내린다.',
  c3:'✅ M — Money management. 계획(B)만으로 부족하고 실행·점검까지 포함한 전체 관리가 필요하다.',
  c4:'✅ E — Exchange. 소비자분쟁해결기준에서 교환은 보상 범위에 명시적으로 포함된다.'
};
var NG = {
  c1:'❌ N·B·R은 합리적 소비의 수단이다. 왜 그렇게 소비해야 하는지 — 그 목적은?',
  c2:'❌ 법적 효력이 있는 공식 분쟁 조정 기관은 하나뿐이다. 표를 다시 봐라.',
  c3:'❌ B는 계획만 세우는 것. 실행하고 점검까지 포함하는 더 큰 개념은?',
  c4:'❌ 위 표에서 실제 보상 범위에 교환이 포함돼 있는지 확인해봐라.'
};
var wrongs = {c1:0, c2:0, c3:0, c4:0};
var sel = {};

function pick(qid, val, letter, el) {
  if(sel[qid] === '__ok__') return;
  sel[qid] = val;
  var opts = document.querySelectorAll('#opts-' + qid + ' .opt');
  opts.forEach(function(o){ o.className='opt'; o.disabled=false; });
  el.className = 'opt selected';
  var fb = document.getElementById('fb-' + qid);
  if(val === ANS[qid]) {
    fb.className='feedback ok'; fb.textContent=OK[qid];
    sel[qid]='__ok__';
    opts.forEach(function(o){ o.disabled=true; });
    el.className='opt correct';
    var k = MAP[qid];
    document.getElementById('ht-'+k).classList.add('on');
    document.getElementById('ql-'+k).classList.add('on');
    document.getElementById('hf-'+k).classList.add('on');
  } else {
    wrongs[qid]++;
    fb.className='feedback ng'; fb.textContent=NG[qid];
    el.className='opt wrong';
    if(wrongs[qid]>=1) document.getElementById('hint-'+qid).classList.add('show');
  }
  checkDone();
}

function checkDone() {
  var done = sel.c1==='__ok__' && sel.c2==='__ok__' && sel.c3==='__ok__' && sel.c4==='__ok__';
  document.getElementById('btn-submit').disabled = !done;
  if(done) {
    document.getElementById('frag-reveal').classList.add('show');
    setTimeout(function(){
      document.getElementById('frag-reveal').scrollIntoView({behavior:'smooth',block:'center'});
    }, 300);
  }
}

function submitStage() {
  gotoScreen('s-paper3');
}


    // === 글로벌 스코프 노출 ===
    window.pick = pick;
    window.checkDone = checkDone;
    window.submitStage = submitStage;
}
// === paper3_stage3.html ===
function init_sec_paper3() {

var curFloor = null, solved = false;

// 버튼 생성
var fg = document.getElementById('fgrid');
for (var i = 1; i <= 30; i++) {
  (function(n) {
    var btn = document.createElement('button');
    btn.className = 'fb';
    btn.textContent = n;
    btn.id = 'fb' + n;
    btn.addEventListener('click', function() { pressFloor(n); });
    fg.appendChild(btn);
  })(i);
}

function pressFloor(n) {
  // 이전 해제
  if (curFloor) {
    var prev = document.getElementById('fb' + curFloor);
    if (prev) prev.classList.remove('lit');
  }
  curFloor = n;
  document.getElementById('fb' + n).classList.add('lit');
  document.getElementById('edisp').textContent = n < 10 ? '0' + n : n;
  document.getElementById('dot1').classList.add('on');
  setTimeout(function() { doCheck(n); }, 500);
}

function adjFloor(d) {
  var next = Math.max(1, Math.min(30, (curFloor || 1) + d));
  pressFloor(next);
}

function doCheck(n) {
  var pop = document.getElementById('pop');
  document.getElementById('ptbl').style.display = 'none';
  document.getElementById('pb2').style.display = 'none';

  if (n === 27) {
    solved = true;
    pop.className = 'popup ok';
    document.getElementById('pi').textContent = '✅';
    document.getElementById('pt').textContent = '27층 — 정답!';
    document.getElementById('ps').innerHTML = '3+0+6+6+8+1+1+2+0 = <strong>27</strong><br><br>문이 열린다! STAGE 4로 이동하라.';
    document.getElementById('pb1').className = 'pop-btn go';
    document.getElementById('pb1').textContent = '▶ STAGE 4 가족으로 이동';
    document.getElementById('dot2').classList.add('on');
    document.getElementById('dot3').classList.add('on');
  } else if (n === 25) {
    pop.className = 'popup warn';
    document.getElementById('pi').textContent = '⚠️';
    document.getElementById('pt').textContent = '거의 다 왔다!';
    document.getElementById('ps').innerHTML = '진봉쌤 생일을 <strong>11</strong>만 계산했지?<br>날짜 20일까지 포함하면<br>1120 → 1+1+2+0 = 4<br>다시 더해봐라!';
    document.getElementById('pb1').className = 'pop-btn ret';
    document.getElementById('pb1').textContent = '다시 계산';
    document.getElementById('pb2').style.display = 'block';
    document.getElementById('pb2').className = 'pop-btn hnt';
    document.getElementById('pb2').textContent = '💡 계산표 보기';
  } else {
    pop.className = 'popup ng';
    document.getElementById('pi').textContent = '❌';
    document.getElementById('pt').textContent = n + '층 — 틀렸다';
    document.getElementById('ps').innerHTML = '각 줄의 숫자를 찾아서<br>모든 자릿수를 분리해 더해라.';
    document.getElementById('pb1').className = 'pop-btn ret';
    document.getElementById('pb1').textContent = '다시 시도';
    document.getElementById('pb2').style.display = 'block';
    document.getElementById('pb2').className = 'pop-btn hnt';
    document.getElementById('pb2').textContent = '💡 계산표 보기';
  }
  document.getElementById('ov').classList.add('show');
}

function ctrlAct(t) {
  if (t === 'open') {
    alert(solved ? '🚪 문이 열립니다! STAGE 4로 이동!' : '🚪 먼저 정확한 층수를 눌러주세요.');
  } else if (t === 'close') {
    alert('🚪 문이 닫힙니다.');
  } else {
    alert('🔔 삑— 비상벨!

힌트: 각 줄에서 숫자를 찾아
모든 자릿수를 분리해서 더해보세요.');
  }
}

function closeOv(e) { if (e.target === document.getElementById('ov')) document.getElementById('ov').classList.remove('show'); }
function popA1() { document.getElementById('ov').classList.remove('show'); if (solved) gotoScreen('s-stage4'); }
function popA2() { document.getElementById('ptbl').style.display = 'table'; document.getElementById('pb2').style.display = 'none'; }


    // === 글로벌 스코프 노출 ===
    window.pressFloor = pressFloor;
    window.adjFloor = adjFloor;
    window.doCheck = doCheck;
    window.ctrlAct = ctrlAct;
    window.closeOv = closeOv;
    window.popA1 = popA1;
    window.popA2 = popA2;
}
// === screen05_stage4.html ===
function init_sec_screen05() {

var ANS = {d1:'2', d2:'2', d3:'2'};
var OK = {
  d1:'✅ 맞아! 둘 다 "너는~" "엄마는~"으로 상대를 먼저 지목해 비난했다. 나 전달법 없이 감정만 폭발하면 대화가 싸움이 된다.',
  d2:'✅ 정답! ②번. "엄마는 무섭고 걱정된다" = 감정의 주인이 엄마(나)다. ①③④는 모두 상대 비난·비교·협박이 섞여 있다.',
  d3:'✅ 정답! ②번. "저는 깜짝 놀라고 집중이 흐트러져서 힘들어요" = 상대 비난 없이 나의 감정과 상황만 전달. ①④는 지적, ③은 감정이 없다.'
};
var NG = {
  d1:'❌ 대화에서 엄마와 내가 각각 어떤 주어로 말했는지 다시 봐라. "너는~"과 "엄마는~"이 핵심이다.',
  d2:'❌ 나 전달법은 감정의 주인이 "나(엄마)"여야 한다. 상대를 비교하거나 협박하는 말은 나 전달법이 아니다.',
  d3:'❌ ①은 여전히 지적, ③은 나의 감정이 없다, ④는 규칙 요구다. "나는 이런 상황에서 이런 감정"을 담은 것을 찾아라.'
};
var wrongs = {d1:0,d2:0,d3:0};
var sel = {};
var solved = 0;

function pick(qid, val, el){
  if(sel[qid]==='__ok__') return;
  sel[qid]=val;
  var opts=document.querySelectorAll('#opts-'+qid+' .opt');
  opts.forEach(function(o){o.className='opt';o.disabled=false;});
  el.className='opt selected';
  var fb=document.getElementById('fb-'+qid);
  var num={d1:1,d2:2,d3:3}[qid];
  if(val===ANS[qid]){
    fb.className='feedback ok';fb.textContent=OK[qid];
    sel[qid]='__ok__';
    opts.forEach(function(o){o.disabled=true;});
    el.className='opt correct';
    document.getElementById('qs'+num).classList.add('done');
    solved++;
    if(solved===3){
      // 파티클
      var icons=['🎉','⭐','🪙','✨','💜'];
      for(var i=0;i<18;i++){
        (function(i){setTimeout(function(){
          var p=document.createElement('div');
          p.className='popup-confetti';
          p.textContent=icons[Math.floor(Math.random()*icons.length)];
          p.style.cssText='position:fixed;left:'+(10+Math.random()*80)+'%;top:-20px;font-size:'+(14+Math.random()*12)+'px;animation-duration:'+(1.5+Math.random()*1.5)+'s;z-index:501;pointer-events:none';
          document.body.appendChild(p);
          setTimeout(function(){p.remove();},3000);
        },i*80);})(i);
      }
      setTimeout(function(){
        document.getElementById('done-popup').classList.add('show');
      },400);
      setTimeout(function(){
        document.getElementById('frag-reveal').classList.add('show');
        document.getElementById('teacher-wait').classList.add('show');
      },600);
    }
  } else {
    wrongs[qid]++;
    fb.className='feedback ng';fb.textContent=NG[qid];
    el.className='opt wrong';
    if(wrongs[qid]>=1) document.getElementById('hint-'+qid).classList.add('show');
  }
}

function onPass(){
  document.getElementById('teacher-wait').style.display='none';
  document.getElementById('pass-banner').classList.add('show');
  document.getElementById('btn-next').classList.add('show');
  setTimeout(function(){
    document.getElementById('btn-next').scrollIntoView({behavior:'smooth',block:'center'});
  },300);
}

function closePopup(){
  document.getElementById('done-popup').classList.remove('show');
  setTimeout(function(){
    document.getElementById('teacher-wait').scrollIntoView({behavior:'smooth',block:'start'});
  },200);
}

function goNext(){
  gotoScreen('s-stage5');
}


    // === 글로벌 스코프 노출 ===
    window.pick = pick;
    window.onPass = onPass;
    window.closePopup = closePopup;
    window.goNext = goNext;
}
// === screen06_stage5.html ===
function init_sec_screen06() {

var ANS = {e1:'4', e2:'2', e3:'3'};
var OK = {
  e1:'✅ 정답! 4번 최연우. 1번=재무X, 2번=건강+관계X, 3번=진로X. 4번만 4개 영역 모두 균형이다.',
  e2:'✅ 정답! 복리. 단리라면 2배 근처여야 하는데 실제 3.1배 → 이자에 이자가 붙는 복리 효과로만 설명된다.',
  e3:'✅ 정답! 후보 3. 자기탐색 없는 조기 결정 = E-1 최연우와 정반대. 후보 1·2·4·5는 모두 탐색·습관·관계로 유용하다.'
};
var NG = {
  e1:'❌ 한 영역만 보지 마라. 4개 영역 모두에서 심각한 결함이 없는 사람을 찾아라.',
  e2:'❌ 단리라면 납입액 2배 → 자산도 2배 근처여야 한다. 3.1배는 단리로 설명이 안 된다.',
  e3:'❌ E-1의 최연우 핵심 강점이 무엇이었는지 기억해라. 그것과 정반대인 후보가 마피아 삽입이다.'
};
var wrongs = {e1:0, e2:0, e3:0};
var sel = {};
var solvedCount = 0;

function pick(qid, val, el) {
  if(sel[qid]==='__ok__') return;
  sel[qid] = val;
  var opts = document.querySelectorAll('#opts-'+qid+' .opt');
  opts.forEach(function(o){o.className='opt';o.disabled=false;});
  el.className='opt selected';
  var fb = document.getElementById('fb-'+qid);
  var qnum = {e1:1,e2:2,e3:3}[qid];

  if(val===ANS[qid]){
    fb.className='feedback ok'; fb.textContent=OK[qid];
    sel[qid]='__ok__';
    opts.forEach(function(o){o.disabled=true;});
    el.className='opt correct';
    document.getElementById('qs'+qnum).classList.add('done');
    solvedCount++;
    updateProgress();
    if(solvedCount===3) setTimeout(issueCert, 600);
  } else {
    wrongs[qid]++;
    fb.className='feedback ng'; fb.textContent=NG[qid];
    el.className='opt wrong';
    if(wrongs[qid]>=1) document.getElementById('hint-'+qid).classList.add('show');
  }
}

function updateProgress(){
  var pct = (solvedCount/3)*100;
  document.getElementById('prog-fill').style.width = pct+'%';
  document.getElementById('prog-label').textContent = solvedCount+' / 3 해결';
  if(solvedCount===3){
    document.getElementById('cert-preview').style.background='rgba(74,222,128,0.1)';
    document.getElementById('cert-preview').style.borderColor='rgba(74,222,128,0.3)';
    document.querySelector('.cert-lock-icon').textContent='🔓';
    document.querySelector('.cert-title').textContent='WSA 정요원 자격증 — 발급 중!';
  }
}

function issueCert(){
  // 자격증 날짜
  var today = new Date();
  var y=today.getFullYear(), m=today.getMonth()+1, d=today.getDate();
  document.getElementById('cert-date').textContent = y+'년 '+m+'월 '+d+'일';

  document.getElementById('cert-issue').classList.add('show');
  setTimeout(function(){
    document.getElementById('cert-issue').scrollIntoView({behavior:'smooth',block:'start'});
  },300);

  // 파티클
  var colors=['#fbbf24','#f9a8d4','#86efac','#93c5fd','#c084fc','#fb923c'];
  for(var i=0;i<30;i++){
    (function(i){setTimeout(function(){
      var p=document.createElement('div');
      p.className='particle';
      p.textContent=['⭐','✨','🎉','💫','🌟'][Math.floor(Math.random()*5)];
      p.style.cssText='left:'+(Math.random()*100)+'vw;font-size:'+(12+Math.random()*16)+'px;animation-duration:'+(2+Math.random()*2)+'s;animation-delay:0s';
      document.body.appendChild(p);
      setTimeout(function(){p.remove();},4000);
    },i*100);})(i);
  }
}

function goVote(){
  gotoScreen('s-vote');
}


    // === 글로벌 스코프 노출 ===
    window.pick = pick;
    window.updateProgress = updateProgress;
    window.issueCert = issueCert;
    window.goVote = goVote;
}
// === screen07_vote.html ===
function init_sec_screen07() {

var voteTarget = null;
var lifeChoice = null;
var timerInterval = null;
var seconds = 120;

// 타이머 시작
function startTimer(){
  timerInterval = setInterval(function(){
    seconds--;
    var m = Math.floor(seconds/60);
    var s = seconds%60;
    var el = document.getElementById('timer');
    el.textContent = m+':'+(s<10?'0':'')+s;
    if(seconds<=30) el.classList.add('urgent');
    if(seconds<=0){
      clearInterval(timerInterval);
      el.textContent='0:00';
      document.getElementById('timer-wrap').style.borderColor='rgba(239,68,68,.5)';
      // 시간 초과 시 자동 비활성화
      if(!voteTarget) {
        document.getElementById('btn-confirm').disabled=true;
        document.getElementById('btn-confirm').textContent='⏱ 시간 초과';
      }
    }
  },1000);
}
startTimer();

function selectVote(num, el){
  if(document.getElementById('vote-done').classList.contains('show')) return;
  voteTarget = num;
  document.querySelectorAll('.vote-btn').forEach(function(b){b.classList.remove('selected');});
  el.classList.add('selected');
  document.getElementById('btn-confirm').disabled = false;
}

function confirmVote(){
  if(!voteTarget) return;
  clearInterval(timerInterval);

  // 투표 버튼 잠금
  document.querySelectorAll('.vote-btn').forEach(function(b){b.classList.add('disabled-btn');b.style.pointerEvents='none';});
  document.getElementById('btn-confirm').style.display='none';
  document.getElementById('timer-wrap').style.display='none';

  document.getElementById('vote-done').classList.add('show');

  setTimeout(function(){
    document.getElementById('life-section').classList.add('show');
    document.getElementById('life-section').scrollIntoView({behavior:'smooth',block:'start'});
  }, 800);
}

function selectLife(el, choice){
  lifeChoice = choice;
  document.querySelectorAll('.life-btn').forEach(function(b){b.classList.remove('selected');});
  el.classList.add('selected');
  document.getElementById('btn-life').disabled = false;
}

function finishLife(){
  if(!lifeChoice) return;
  document.getElementById('life-section').style.display='none';
  document.getElementById('ending').classList.add('show');
  setTimeout(function(){
    document.getElementById('ending').scrollIntoView({behavior:'smooth',block:'center'});
  },300);
}


    // === 글로벌 스코프 노출 ===
    window.startTimer = startTimer;
    window.selectVote = selectVote;
    window.confirmVote = confirmVote;
    window.selectLife = selectLife;
    window.finishLife = finishLife;
}

