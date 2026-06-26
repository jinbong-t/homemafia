"""
방탈출 게임 HTML 파일 합치기 스크립트 🎮
순서: screen01_start → screen02_stage1 → paper1_stage1 → screen03_stage2 → 
      paper2_stage2 → screen04_stage3 → paper3_stage3 → screen06_stage5 → screen07_vote
"""

import re
import os

# 합칠 파일 순서
FILES = [
    'screen01_start.html',
    'screen02_stage1.html',
    'paper1_stage1.html',
    'screen03_stage2.html',
    'paper2_stage2.html',
    'screen04_stage3.html',
    'paper3_stage3.html',
    'screen06_stage5.html',
    'screen07_vote.html',
]

# 각 화면의 ID
SECTION_IDS = [
    'sec-screen01',
    'sec-screen02',
    'sec-paper1',
    'sec-screen03',
    'sec-paper2',
    'sec-screen04',
    'sec-paper3',
    'sec-screen06',
    'sec-screen07',
]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def extract_style(html):
    """<style> 태그 내용 추출"""
    m = re.search(r'<style>(.*?)</style>', html, re.DOTALL)
    return m.group(1) if m else ''

def extract_body(html):
    """<body> 태그 내용 추출 (script 포함)"""
    m = re.search(r'<body>(.*?)</body>', html, re.DOTALL)
    return m.group(1).strip() if m else ''

def extract_body_content_and_script(html):
    """body에서 HTML 콘텐츠와 script를 분리"""
    body = extract_body(html)
    # script 태그들 추출
    scripts = re.findall(r'<script>(.*?)</script>', body, re.DOTALL)
    # script 제거한 HTML
    content = re.sub(r'<script>.*?</script>', '', body, flags=re.DOTALL).strip()
    return content, '\n'.join(scripts)

def scope_css(css, section_id):
    """CSS를 특정 섹션 ID로 스코핑"""
    lines = css.split('\n')
    result = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            result.append(line)
            continue
        # @keyframes, @media 등은 그대로 유지하되 내부 규칙은 스코핑
        if stripped.startswith('@keyframes') or stripped.startswith('@font-face'):
            result.append(line)
            continue
        if stripped.startswith('@media'):
            result.append(line)
            continue
        # 중괄호 닫기
        if stripped == '}':
            result.append(line)
            continue
        # 선택자 라인 감지 (중괄호 포함하는 라인)
        if '{' in stripped:
            # body 선택자를 section으로 변환
            modified = stripped
            # 여러 선택자가 있을 수 있으므로 { 앞부분만 처리
            parts = modified.split('{', 1)
            selectors = parts[0]
            rest = '{' + parts[1]
            
            # 각 선택자에 스코핑 추가
            new_selectors = []
            for sel in selectors.split(','):
                sel = sel.strip()
                if not sel:
                    continue
                # body, html 등의 전역 선택자 처리
                if sel in ('body', 'html'):
                    new_selectors.append(f'#{section_id}')
                elif sel.startswith('body'):
                    new_selectors.append(f'#{section_id}{sel[4:]}')
                elif sel.startswith('html'):
                    new_selectors.append(f'#{section_id}')
                elif sel.startswith('*'):
                    new_selectors.append(f'#{section_id} {sel}')
                else:
                    new_selectors.append(f'#{section_id} {sel}')
            
            result.append(','.join(new_selectors) + rest)
        else:
            result.append(line)
    
    return '\n'.join(result)

def build_merged_html():
    all_styles = []
    all_sections = []
    all_scripts = []
    
    for i, (filename, sec_id) in enumerate(zip(FILES, SECTION_IDS)):
        filepath = os.path.join(BASE_DIR, filename)
        print(f'처리 중: {filename} → #{sec_id}')
        
        with open(filepath, 'r', encoding='utf-8') as f:
            html = f.read()
        
        css = extract_style(html)
        content, script = extract_body_content_and_script(html)
        
        # CSS 스코핑
        scoped_css = scope_css(css, sec_id)
        all_styles.append(f'/* === {filename} === */\n{scoped_css}')
        
        # 첫번째 화면만 보이게
        display = 'block' if i == 0 else 'none'
        all_sections.append(
            f'<section id="{sec_id}" style="display:{display};">\n{content}\n</section>'
        )
        
        # 스크립트 래핑
        if script.strip():
            # 스크립트를 함수로 감싸서 나중에 호출
            all_scripts.append(f'// === {filename} ===\nfunction init_{sec_id.replace("-","_")}() {{\n{script}\n}}')
    
    # 화면 전환 유틸리티 스크립트
    nav_script = """
// === 화면 전환 유틸 ===
const SECTIONS = """ + str(SECTION_IDS) + """;
let currentIdx = 0;

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
"""

    # 최종 HTML 조립
    merged = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>3학년 가정 수업 총정리 방탈출 | WSA HOME BASE</title>
<style>
/* === 글로벌 리셋 === */
*,*::before,*::after{{box-sizing:border-box;margin:0;padding:0}}
html{{height:100%}}
body{{min-height:100vh;font-family:'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif;background:#0f1923;color:#fff;-webkit-font-smoothing:antialiased}}

{chr(10).join(all_styles)}
</style>
</head>
<body>

{chr(10).join(all_sections)}

<script>
{nav_script}

{chr(10).join(all_scripts)}
</script>
</body>
</html>"""
    
    output_path = os.path.join(BASE_DIR, 'merged_game.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(merged)
    
    print(f'\n✅ 합치기 완료! → {output_path}')
    print(f'   총 {len(FILES)}개 화면 통합됨')

if __name__ == '__main__':
    build_merged_html()
