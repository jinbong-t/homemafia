/**
 * 방탈출 게임 HTML 파일 합치기 스크립트 🎮 (Node.js 버전)
 * 순서: screen01_start → screen02_stage1 → paper1_stage1 → screen03_stage2 → 
 *       paper2_stage2 → screen04_stage3 → paper3_stage3 → screen05_stage4 → screen06_stage5 → screen07_vote
 */

const fs = require('fs');
const path = require('path');

// 합칠 파일 순서 (screen05_stage4 포함!)
const FILES = [
    'screen01_start.html',
    'screen02_stage1.html',
    'paper1_stage1.html',
    'screen03_stage2.html',
    'paper2_stage2.html',
    'screen04_stage3.html',
    'paper3_stage3.html',
    'screen05_stage4.html',
    'screen06_stage5.html',
    'screen07_vote.html',
];

// 각 화면의 section ID
const SECTION_IDS = [
    'sec-screen01',
    'sec-screen02',
    'sec-paper1',
    'sec-screen03',
    'sec-paper2',
    'sec-screen04',
    'sec-paper3',
    'sec-screen05',
    'sec-screen06',
    'sec-screen07',
];

// iframe ID → section ID 매핑 (원본 iframe 기반 네비게이션을 위한 브릿지)
const IFRAME_TO_SECTION = {
    's-start':  'sec-screen01',
    's-setup':  'sec-screen01',  // setup은 screen01 안에 있음
    's-stage1': 'sec-screen02',
    's-paper1': 'sec-paper1',
    's-stage2': 'sec-screen03',
    's-paper2': 'sec-paper2',
    's-stage3': 'sec-screen04',
    's-paper3': 'sec-paper3',
    's-stage4': 'sec-screen05',
    's-stage5': 'sec-screen06',
    's-vote':   'sec-screen07',
};

const BASE_DIR = __dirname;

function extractStyle(html) {
    const m = html.match(/<style>([\s\S]*?)<\/style>/);
    return m ? m[1] : '';
}

function extractBody(html) {
    const m = html.match(/<body>([\s\S]*?)<\/body>/);
    return m ? m[1].trim() : '';
}

function extractBodyContentAndScript(html) {
    const body = extractBody(html);
    const scripts = [];
    const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
    let match;
    while ((match = scriptRegex.exec(body)) !== null) {
        scripts.push(match[1]);
    }
    const content = body.replace(/<script>[\s\S]*?<\/script>/g, '').trim();
    return { content, script: scripts.join('\n') };
}

/**
 * 스크립트 내의 window.parent.gotoScreen('xxx') 호출을
 * showSection('sec-xxx') 로 변환
 */
function rewriteNavigation(script, secId) {
    let result = script;
    
    // 1. window.parent.WSA_GROUP → window.WSA_GROUP
    result = result.replace(/window\.parent\.WSA_GROUP/g, 'window.WSA_GROUP');
    
    // 2. if(window.parent&&window.parent.gotoScreen){...}else{...} → {...} (else 제거)
    // 중괄호 블록이 있는 if-else 패턴
    result = result.replace(
        /if\s*\(\s*window\.parent\s*&&\s*window\.parent\.gotoScreen\s*\)\s*\{([^}]*)\}\s*else\s*\{[^}]*\}/g,
        '{$1}'
    );
    
    // 3. if(window.parent&&window.parent.gotoScreen){...} → {...}
    result = result.replace(
        /if\s*\(\s*window\.parent\s*&&\s*window\.parent\.gotoScreen\s*\)\s*\{/g,
        '{'
    );
    
    // 4. if(window.parent&&window.parent.gotoScreen) (중괄호 없는 형태) → 제거
    result = result.replace(
        /if\s*\(\s*window\.parent\s*&&\s*window\.parent\.gotoScreen\s*\)/g,
        ''
    );
    
    // 5. window.parent.gotoScreen → gotoScreen
    result = result.replace(/window\.parent\.gotoScreen/g, 'gotoScreen');
    
    // 6. 남아있는 window.parent && gotoScreen 조건 제거
    result = result.replace(
        /if\s*\(\s*window\.parent\s*&&\s*gotoScreen\s*\)\s*\{([^}]*)\}\s*else\s*\{[^}]*\}/g,
        '{$1}'
    );
    result = result.replace(
        /if\s*\(\s*window\.parent\s*&&\s*gotoScreen\s*\)\s*\{/g,
        '{'
    );
    result = result.replace(
        ''
    );
    
    // 7. document.getElementById('xxx') → document.querySelector('#sec-xxx #xxx')
    if (secId) {
        result = result.replace(/document\.getElementById\((.*?)\)/g, `document.querySelector('#${secId} #' + ($1))`);
    }
    
    return result;
}

function scopeCss(css, sectionId) {
    const lines = css.split('\n');
    const result = [];
    let inKeyframes = false;
    let braceDepth = 0;
    
    for (const line of lines) {
        const stripped = line.trim();
        
        if (!stripped) {
            result.push(line);
            continue;
        }
        
        // @keyframes 블록 추적
        if (stripped.startsWith('@keyframes') || stripped.startsWith('@font-face')) {
            inKeyframes = true;
            braceDepth = 0;
            result.push(line);
            if (stripped.includes('{')) braceDepth++;
            if (stripped.includes('}')) braceDepth--;
            if (braceDepth <= 0) inKeyframes = false;
            continue;
        }
        
        if (inKeyframes) {
            result.push(line);
            if (stripped.includes('{')) braceDepth++;
            if (stripped.includes('}')) braceDepth--;
            if (braceDepth <= 0) inKeyframes = false;
            continue;
        }
        
        // @media는 그대로
        if (stripped.startsWith('@media')) {
            result.push(line);
            continue;
        }
        
        // 중괄호 닫기
        if (stripped === '}') {
            result.push(line);
            continue;
        }
        
        // 선택자 라인 감지
        if (stripped.includes('{')) {
            const parts = stripped.split('{');
            const selectors = parts[0];
            const rest = '{' + parts.slice(1).join('{');
            
            const newSelectors = [];
            for (let sel of selectors.split(',')) {
                sel = sel.trim();
                if (!sel) continue;
                
                if (sel === 'body' || sel === 'html') {
                    newSelectors.push(`#${sectionId}`);
                } else if (sel.startsWith('body')) {
                    newSelectors.push(`#${sectionId}${sel.slice(4)}`);
                } else if (sel.startsWith('html')) {
                    newSelectors.push(`#${sectionId}`);
                } else if (sel.startsWith('*')) {
                    newSelectors.push(`#${sectionId} ${sel}`);
                } else {
                    newSelectors.push(`#${sectionId} ${sel}`);
                }
            }
            
            result.push(newSelectors.join(',') + rest);
        } else {
            result.push(line);
        }
    }
    
    return result.join('\n');
}

function buildMergedHtml() {
    const allStyles = [];
    const allSections = [];
    const allScripts = [];
    
    for (let i = 0; i < FILES.length; i++) {
        const filename = FILES[i];
        const secId = SECTION_IDS[i];
        const filepath = path.join(BASE_DIR, filename);
        
        console.log(`처리 중: ${filename} → #${secId}`);
        
        let html = fs.readFileSync(filepath, 'utf-8');
        
        // 실시간 서버 연동 이벤트 주입
        if (filename === 'screen07_vote.html') {
            html = html.replace('function confirmVote(){', 'function confirmVote(){\n  if(window.wsaEmitVote) window.wsaEmitVote(voteTarget, voteTarget == 3);');
        }
        
        const css = extractStyle(html);
        const { content, script } = extractBodyContentAndScript(html);
        
        // CSS 스코핑
        const scopedCss = scopeCss(css, secId);
        allStyles.push(`/* === ${filename} === */\n${scopedCss}`);
        
        // 첫번째 화면만 보이게
        const display = i === 0 ? 'block' : 'none';
        allSections.push(
            `<section id="${secId}" style="display:${display};">\n${content}\n</section>`
        );
        
        // 스크립트 래핑 + 네비게이션 재작성
        if (script.trim()) {
            const fnName = 'init_' + secId.replace(/-/g, '_');
            let rewrittenScript = rewriteNavigation(script, secId);
            
            // 전역(HTML onclick 등)에서 접근할 수 있도록 함수들을 window 객체에 바인딩
            const funcRegex = /function\s+([a-zA-Z0-9_]+)\s*\(/g;
            const funcs = [];
            let match;
            while ((match = funcRegex.exec(rewrittenScript)) !== null) {
                funcs.push(`    window.${match[1]} = ${match[1]};`);
            }
            if (funcs.length > 0) {
                rewrittenScript += '\n\n    // === 글로벌 스코프 노출 ===\n' + funcs.join('\n');
            }
            
            allScripts.push(`// === ${filename} ===\nfunction ${fnName}() {\n${rewrittenScript}\n}`);
        }
    }
    
    // gotoScreen 매핑 + 화면 전환 유틸리티 스크립트
    const sectionIdsJson = JSON.stringify(SECTION_IDS);
    const iframeMapJson = JSON.stringify(IFRAME_TO_SECTION, null, 2);
    
    const navScript = `
// === iframe ID → section ID 매핑 ===
const IFRAME_TO_SECTION = ${iframeMapJson};

// === 화면 전환 유틸 ===
const SECTIONS = ${sectionIdsJson};
let currentIdx = 0;
var WSA_GROUP = '';

const socket = (typeof io !== 'undefined') ? io() : null;

window.wsaLogin = function() {
    const group = document.getElementById('wsa-group-select').value;
    if (!group) {
        alert('조를 선택해주세요!');
        return;
    }
    WSA_GROUP = group;
    document.getElementById('wsa-login-overlay').style.display = 'none';
    if (socket) {
        socket.emit('student_join', { groupName: group });
    }
};

window.wsaEmitClear = function(stageNum) {
    if (socket && WSA_GROUP) {
        socket.emit('stage_clear', { groupName: WSA_GROUP, stage: stageNum });
    }
};

window.wsaEmitVote = function(votedFor, isSuccess) {
    if (socket && WSA_GROUP) {
        socket.emit('vote_mafia', { groupName: WSA_GROUP, votedFor: votedFor, success: isSuccess });
    }
};

// === 오디오 시스템 (Web Audio API) ===
window.Sound = {
  ctx: null,
  init: function() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  playTone: function(freq, type, duration, vol=0.1) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },
  click: function() { this.playTone(600, 'sine', 0.1, 0.05); },
  success: function() { 
    this.playTone(440, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(554, 'sine', 0.1, 0.1), 100);
    setTimeout(() => this.playTone(659, 'sine', 0.3, 0.1), 200);
  },
  error: function() {
    this.playTone(150, 'sawtooth', 0.2, 0.1);
    setTimeout(() => this.playTone(100, 'sawtooth', 0.3, 0.1), 150);
  },
  ding: function() {
    this.playTone(880, 'sine', 0.8, 0.1);
  }
};

// 글로벌 클릭음 감지
document.addEventListener('click', function(e) {
  if (e.target.tagName === 'BUTTON' || e.target.classList.contains('opt') || e.target.onclick) {
    if (window.Sound) window.Sound.click();
  }
});

// BGM 재생 감지
document.addEventListener('click', function initBGM() {
  const bgm = document.getElementById('bgm');
  if (bgm && bgm.paused) {
    bgm.play().catch(e => console.log('BGM play failed (no file or blocked)'));
  }
  document.removeEventListener('click', initBGM);
}, {once: true});

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
    
    // 실시간 연동: 스테이지 클리어 자동 보고
    if (iframeId === 's-paper1') window.wsaEmitClear(1);
    if (iframeId === 's-paper2') window.wsaEmitClear(2);
    if (iframeId === 's-paper3') window.wsaEmitClear(3);
    if (iframeId === 's-stage4') window.wsaEmitClear(3); 
    if (iframeId === 's-stage5') window.wsaEmitClear(4);
    if (iframeId === 's-vote') window.wsaEmitClear(5);

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
`;

    // 최종 HTML 조립
    const merged = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>3학년 가정 수업 총정리 방탈출 | WSA HOME BASE</title>
<script src="/socket.io/socket.io.js"></script>
<style>
/* === 글로벌 리셋 === */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{height:100%}
body{min-height:100vh;font-family:'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif;background:#0f1923;color:#fff;-webkit-font-smoothing:antialiased}

${allStyles.join('\n')}
</style>
</head>
<body>

<!-- 실시간 연동 로그인 모달 -->
<div id="wsa-login-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;">
    <h1 style="color:#fff;margin-bottom:20px;font-size:32px;font-weight:900;">WSA HOME BASE 접속</h1>
    <h3 style="color:#fca5a5;margin-bottom:40px;font-size:18px;">우리는 몇 조인가요?</h3>
    <select id="wsa-group-select" style="padding:15px 30px;font-size:20px;border-radius:10px;background:#1f2937;color:#fff;border:2px solid #4b5563;margin-bottom:30px;outline:none;">
        <option value="" disabled selected>우리 조를 선택하세요</option>
        <option value="1조">1조</option><option value="2조">2조</option><option value="3조">3조</option><option value="4조">4조</option><option value="5조">5조</option>
        <option value="6조">6조</option><option value="7조">7조</option><option value="8조">8조</option><option value="9조">9조</option><option value="10조">10조</option>
    </select>
    <button onclick="window.wsaLogin()" style="padding:15px 50px;background:#ef4444;color:#fff;font-size:20px;font-weight:bold;border:none;border-radius:10px;cursor:pointer;">인증 및 접속하기</button>
</div>

${allSections.join('\n')}

<script>
${navScript}

${allScripts.join('\n')}
</script>

<!-- 배경음악 (bgm.mp3 파일을 같은 폴더에 넣으면 자동 재생됩니다) -->
<audio id="bgm" loop>
  <source src="bgm.mp3" type="audio/mpeg">
</audio>
</body>
</html>`;
    
    const outputPath = path.join(BASE_DIR, 'merged_game.html');
    fs.writeFileSync(outputPath, merged, 'utf-8');
    
    console.log(`\n✅ 합치기 완료! → ${outputPath}`);
    console.log(`   총 ${FILES.length}개 화면 통합됨`);
    
    // 파일 크기 정보
    const stats = fs.statSync(outputPath);
    console.log(`   파일 크기: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

buildMergedHtml();
