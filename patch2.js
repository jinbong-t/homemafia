const fs = require('fs');

try {
    let oldHtml = fs.readFileSync('teacher.html', 'utf-8');
    
    // Extract base64 image
    const srcMatch = oldHtml.match(/src="(data:image\/png;base64,[^"]+)"/);
    let base64Img = '';
    if (srcMatch && srcMatch[1]) {
        base64Img = srcMatch[1];
    } else {
        console.log("Warning: Could not find base64 image, using fallback abstract SVG.");
    }

    const newHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WSA FBI CONTROL ROOM</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; }
        body { background: #000; color: #0f0; display: flex; height: 100vh; overflow: hidden; position: relative; }
        
        body::before {
            content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(rgba(0, 255, 0, 0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 255, 0, 0.05) 1px, transparent 1px);
            background-size: 30px 30px; pointer-events: none; z-index: 0;
        }
        body::after {
            content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(to bottom, transparent 50%, rgba(0, 255, 0, 0.05) 51%);
            background-size: 100% 4px; pointer-events: none; z-index: 999;
        }

        .sidebar { width: 280px; background: rgba(0, 15, 0, 0.9); border-right: 2px solid #0f0; display: flex; flex-direction: column; z-index: 10; box-shadow: 2px 0 20px rgba(0,255,0,0.2); }
        .sidebar-header { padding: 30px 20px; font-size: 24px; font-weight: bold; border-bottom: 2px solid #0f0; color: #0f0; text-align: center; text-shadow: 0 0 10px #0f0; letter-spacing: 2px; }
        
        .nav-btn { padding: 20px; background: none; border: none; color: #0a0; text-align: left; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.2s; border-left: 5px solid transparent; letter-spacing: 1px; outline: none; }
        .nav-btn:hover { background: rgba(0, 255, 0, 0.1); color: #0f0; }
        .nav-btn.active { background: rgba(0, 255, 0, 0.2); color: #0f0; border-left-color: #0f0; text-shadow: 0 0 8px #0f0; }
        .nav-btn.admin { margin-top: auto; border-top: 1px solid #060; color: #f00; }
        .nav-btn.admin:hover { background: rgba(255, 0, 0, 0.1); color: #f00; }
        .nav-btn.admin.active { background: rgba(255, 0, 0, 0.2); color: #f00; border-left-color: #f00; text-shadow: 0 0 8px #f00; }

        .main-content { flex: 1; padding: 50px; overflow-y: auto; position: relative; z-index: 5; }
        .panel { display: none; animation: glitch 0.3s linear; }
        .panel.active { display: block; }
        
        @keyframes glitch {
            0% { opacity: 0; transform: skewX(10deg); }
            50% { opacity: 0.5; transform: skewX(-10deg); filter: blur(2px); }
            100% { opacity: 1; transform: skewX(0); filter: blur(0); }
        }

        .panel-title { font-size: 32px; font-weight: bold; margin-bottom: 40px; border-bottom: 2px solid #0f0; padding-bottom: 15px; text-transform: uppercase; letter-spacing: 3px; text-shadow: 0 0 10px #0f0; }
        .panel-title.admin { border-bottom-color: #f00; text-shadow: 0 0 10px #f00; color:#f00; }
        .cursor::after { content: "█"; animation: blink 1s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        /* === 탭 1: 스캐너 KIOSK === */
        .kiosk-setup { display: flex; justify-content: center; gap: 20px; margin-bottom: 40px; }
        .kiosk-select { padding: 15px; font-size: 20px; border: 2px solid #0f0; background: #000; color: #0f0; outline: none; font-weight: bold; box-shadow: 0 0 15px rgba(0,255,0,0.2); text-transform: uppercase; cursor: pointer; }
        .kiosk-select:focus { box-shadow: 0 0 25px rgba(0,255,0,0.6); }

        .scanner-container { position: relative; display: flex; flex-direction: column; align-items: center; }
        .scanner-box { position: relative; width: 220px; height: 300px; border: 3px solid #0f0; border-radius: 30px; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; background: rgba(0,40,0,0.3); transition: all 0.2s; }
        .scanner-box:active { transform: scale(0.97); }
        .scanner-box:hover { box-shadow: 0 0 30px rgba(0,255,0,0.4), inset 0 0 20px rgba(0,255,0,0.4); }
        
        .fingerprint-svg { width: 150px; height: 220px; object-fit: contain; filter: brightness(0) saturate(100%) invert(39%) sepia(85%) saturate(1450%) hue-rotate(87deg) brightness(115%) contrast(110%); mix-blend-mode: screen; opacity: 0.8; transition: filter 0.3s; }
        .scanner-box:hover .fingerprint-svg { filter: brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%); }
        
        .scan-line { position: absolute; top: 0; left: 0; width: 100%; height: 6px; background: #0f0; box-shadow: 0 0 20px 8px rgba(0,255,0,0.6); display: none; z-index: 10; }
        .scanning .scan-line { display: block; animation: scanAnim 1.2s linear infinite; }
        .scanning .fingerprint-svg { filter: brightness(0) saturate(100%) invert(60%) sepia(100%) saturate(3000%) hue-rotate(86deg) brightness(130%) contrast(120%); }

        @keyframes scanAnim { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
        
        .corner { position: absolute; width: 20px; height: 20px; border: 3px solid transparent; }
        .tl { top: -3px; left: -3px; border-top-color: #0f0; border-left-color: #0f0; border-top-left-radius: 30px; }
        .tr { top: -3px; right: -3px; border-top-color: #0f0; border-right-color: #0f0; border-top-right-radius: 30px; }
        .bl { bottom: -3px; left: -3px; border-bottom-color: #0f0; border-left-color: #0f0; border-bottom-left-radius: 30px; }
        .br { bottom: -3px; right: -3px; border-bottom-color: #0f0; border-right-color: #0f0; border-bottom-right-radius: 30px; }

        .result-display { margin-top: 30px; font-size: 38px; font-weight: bold; height: 60px; text-align: center; text-transform: uppercase; letter-spacing: 4px; }
        .result-mafia { color: #f00; text-shadow: 0 0 25px #f00; animation: alertPulse 0.5s infinite; }
        .result-citizen { color: #0ff; text-shadow: 0 0 20px #0ff; }
        .result-scanning { color: #ff0; text-shadow: 0 0 15px #ff0; animation: scanningText 1s infinite; }
        
        @keyframes alertPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        @keyframes scanningText { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

        /* === 탭 2 & 3: 대시보드 현황 === */
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 30px; }
        .card { background: rgba(0, 30, 0, 0.6); border: 1px solid #0f0; padding: 25px; box-shadow: 0 0 15px rgba(0,255,0,0.1); position: relative; backdrop-filter: blur(5px); }
        .card::before { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: #0f0; box-shadow: 0 0 15px #0f0; }
        .card-header { font-size: 24px; font-weight: bold; margin-bottom: 25px; color: #0f0; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #0f0; padding-bottom: 15px; }
        
        .stage-track { display: flex; align-items: center; gap: 10px; }
        .stage-step { width: 40px; height: 40px; border: 2px solid #060; border-radius: 50%; background: #000; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; color: #060; transition: all 0.4s; }
        .stage-step.active { background: rgba(0,255,0,0.2); color: #0f0; border-color: #0f0; box-shadow: 0 0 15px #0f0, inset 0 0 10px #0f0; text-shadow: 0 0 5px #0f0; }
        .stage-line { flex: 1; height: 3px; background: #060; }
        .stage-line.active { background: #0f0; box-shadow: 0 0 10px #0f0; }

        .vote-result { font-size: 20px; color: #0a0; margin-top: 15px; line-height: 1.5; }
        .vote-success { color: #0ff; text-shadow: 0 0 15px #0ff; font-weight: bold; font-size: 24px; margin-top: 20px; }
        .vote-fail { color: #f00; text-shadow: 0 0 15px #f00; font-weight: bold; font-size: 24px; margin-top: 20px; }

        /* === 탭 4: ADMIN SETUP === */
        .admin-login-overlay { display:none; position:fixed; inset:0; background:rgba(20,0,0,0.95); z-index:9999; flex-direction:column; align-items:center; justify-content:center; }
        .admin-login-box { border: 2px solid #f00; padding: 40px; text-align: center; background: #000; box-shadow: 0 0 30px rgba(255,0,0,0.3); }
        .admin-input { padding:15px; font-size:24px; background:#000; border:2px solid #f00; color:#f00; text-align:center; margin: 20px 0; outline:none; letter-spacing: 5px; width: 100%; }
        .admin-input:focus { box-shadow: 0 0 15px rgba(255,0,0,0.5); }
        .admin-btn { padding:15px 40px; background:rgba(255,0,0,0.2); border:2px solid #f00; color:#f00; cursor:pointer; font-weight:bold; font-size:20px; transition:all 0.2s; }
        .admin-btn:hover { background:#f00; color:#000; box-shadow: 0 0 20px #f00; }

        .admin-layout { display: flex; gap: 30px; height: 600px; }
        .admin-sidebar { width: 250px; border: 1px solid #f00; background: rgba(20,0,0,0.5); display: flex; flex-direction: column; }
        .admin-sidebar-header { padding: 15px; border-bottom: 1px solid #f00; color: #f00; font-weight: bold; text-align: center; }
        .admin-group-list { flex: 1; overflow-y: auto; }
        .admin-group-item { padding: 15px; color: #a00; border-bottom: 1px solid #500; cursor: pointer; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center; }
        .admin-group-item:hover { background: rgba(255,0,0,0.1); color: #f00; }
        .admin-group-item.active { background: rgba(255,0,0,0.3); color: #f00; border-left: 5px solid #f00; }
        .del-btn { background: none; border: none; color: #f00; cursor: pointer; font-size: 18px; padding: 0 5px; }
        .add-group-btn { padding: 15px; background: transparent; border: none; border-top: 1px solid #f00; color: #f00; cursor: pointer; font-weight: bold; }
        .add-group-btn:hover { background: rgba(255,0,0,0.2); }

        .admin-main { flex: 1; border: 1px solid #f00; background: rgba(20,0,0,0.5); padding: 20px; display: flex; flex-direction: column; }
        .student-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 10px; margin-top: 20px; flex: 1; align-content: start; }
        .stu-btn { padding: 15px 0; background: transparent; border: 1px solid #555; color: #aaa; font-size: 20px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
        .stu-btn:hover { border-color: #fff; color: #fff; }
        .stu-btn.assigned { background: rgba(0,255,0,0.2); border-color: #0f0; color: #0f0; }
        .stu-btn.active-assigned { background: rgba(255,0,0,0.4); border-color: #f00; color: #f00; box-shadow: 0 0 10px #f00; }

        .mafia-result-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .mafia-result-table th, .mafia-result-table td { border: 1px solid #f00; padding: 10px; text-align: center; color: #f00; }
        .mafia-result-table th { background: rgba(255,0,0,0.2); }
        .highlight-mafia { color: #fff; font-weight: bold; text-shadow: 0 0 10px #f00; }

    </style>
</head>
<body>

    <!-- Admin Login Overlay -->
    <div id="admin-login-overlay" class="admin-login-overlay">
        <div class="admin-login-box">
            <h2 style="color:#f00; margin-bottom:10px; letter-spacing:3px;">RESTRICTED AREA</h2>
            <p style="color:#a00; margin-bottom:20px;">AUTHORIZATION REQUIRED</p>
            <input type="password" id="admin-pw" class="admin-input" placeholder="PASSCODE" onkeypress="if(event.key==='Enter') verifyAdmin()">
            <button class="admin-btn" onclick="verifyAdmin()">ACCESS SYSTEM</button>
        </div>
    </div>

    <div class="sidebar">
        <div class="sidebar-header">SYSTEM.WSA<br><span style="font-size:14px; opacity:0.7">VER 3.0.0 ONLINE</span></div>
        <button class="nav-btn active" onclick="switchTab('tab-roulette')">> IDENTITY SCANNER</button>
        <button class="nav-btn" onclick="switchTab('tab-progress')">> STAGE MONITOR</button>
        <button class="nav-btn" onclick="switchTab('tab-vote')">> VOTE ANALYSIS</button>
        <button class="nav-btn admin" onclick="openAdmin()">⚙️ ADMIN SETUP</button>
    </div>

    <div class="main-content">
        <!-- 탭 1: 마피아 뽑기 (KIOSK) -->
        <div id="tab-roulette" class="panel active">
            <h2 class="panel-title cursor">IDENTITY SCANNER</h2>
            
            <div class="kiosk-setup">
                <select class="kiosk-select" id="kiosk-group" onchange="updateKioskStudents()">
                    <option value="" disabled selected>-- SELECT GROUP --</option>
                </select>
                <select class="kiosk-select" id="kiosk-student" onchange="resetScanUI()">
                    <option value="" disabled selected>-- SELECT NUMBER --</option>
                </select>
            </div>

            <div class="scanner-container">
                <div class="scanner-box" id="scanner-box" onclick="scanFingerprint()">
                    <div class="corner tl"></div><div class="corner tr"></div>
                    <div class="corner bl"></div><div class="corner br"></div>
                    <div class="scan-line"></div>
                    ${base64Img ? '<img class="fingerprint-svg" src="' + base64Img + '" />' : '<div style="color:#0f0; font-size:50px;">👆</div>'}
                </div>
            </div>

            <div class="result-display" id="roulette-result">AWAITING TARGET SELECTION...</div>
        </div>

        <!-- 탭 2: 스테이지 현황 -->
        <div id="tab-progress" class="panel">
            <h2 class="panel-title cursor">LIVE PROGRESS MONITOR</h2>
            <div class="dashboard-grid" id="progress-grid">
                <div style="color:#060; font-size: 18px;">NO ACTIVE CONNECTIONS DETECTED.</div>
            </div>
        </div>

        <!-- 탭 3: 투표 결과 -->
        <div id="tab-vote" class="panel">
            <h2 class="panel-title cursor">VOTE ANALYSIS RESULT</h2>
            <div class="dashboard-grid" id="vote-grid">
                <div style="color:#060; font-size: 18px;">NO DATA AVAILABLE.</div>
            </div>
        </div>

        <!-- 탭 4: 관리자 설정 (비밀번호 통과 후) -->
        <div id="tab-admin" class="panel">
            <h2 class="panel-title admin cursor">CLASS CONFIGURATION & TARGET ASSIGNMENT</h2>
            
            <div style="margin-bottom: 20px; display:flex; gap:20px; align-items:center;">
                <label style="color:#f00; font-weight:bold; font-size:18px;">TOTAL STUDENTS: </label>
                <input type="number" id="admin-total-stu" value="30" style="padding:10px; font-size:18px; background:#000; border:1px solid #f00; color:#f00; outline:none; width:80px;">
                <button onclick="generateStudentGrid()" style="padding:10px 20px; background:rgba(255,0,0,0.2); border:1px solid #f00; color:#f00; cursor:pointer;">APPLY</button>
                <span style="color:#a00; font-size:14px;">(조를 먼저 추가하고 번호를 클릭하여 배정하세요)</span>
            </div>

            <div class="admin-layout">
                <div class="admin-sidebar">
                    <div class="admin-sidebar-header">GROUPS</div>
                    <div class="admin-group-list" id="admin-group-list">
                        <!-- 동적 생성 -->
                    </div>
                    <button class="add-group-btn" onclick="addAdminGroup()">+ ADD NEW GROUP</button>
                </div>
                
                <div class="admin-main">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f00; padding-bottom:10px;">
                        <h3 style="color:#f00;" id="admin-selected-group-title">SELECT A GROUP TO ASSIGN STUDENTS</h3>
                    </div>
                    <div class="student-grid" id="admin-student-grid">
                        <!-- 번호 버튼들 -->
                    </div>
                </div>
            </div>

            <div style="margin-top:30px; text-align:center;">
                <button class="admin-btn" onclick="saveAndAssignMafia()">SAVE & ASSIGN MAFIAS RANDOMLY</button>
            </div>

            <div id="admin-result-area" style="display:none; margin-top:40px;">
                <h3 style="color:#f00; margin-bottom:15px; border-bottom:1px solid #f00; padding-bottom:5px;">ASSIGNED TARGETS (CLASSIFIED)</h3>
                <table class="mafia-result-table" id="mafia-table">
                    <thead><tr><th>GROUP</th><th>STUDENTS</th><th>MAFIA TARGET</th></tr></thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- 스캐닝 효과음용 -->
    <audio id="snd-scan" src="data:audio/mp3;base64,//OExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" preload="auto"></audio>

    <script>
        const socket = io();
        let gameState = {};
        let classSetup = null;

        // 소켓 이벤트
        socket.on('connect', () => { 
            socket.emit('teacher_join'); 
            socket.emit('request_class_setup');
        });
        socket.on('init_state', (state) => { gameState = state; renderDashboard(); });
        socket.on('update_state', (state) => { gameState = state; renderDashboard(); });
        socket.on('update_class_setup', (setup) => { 
            classSetup = setup; 
            updateKioskDropdowns();
            renderAdminResultTable();
        });

        // 탭 전환
        function switchTab(tabId) {
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
        }

        // ==========================================
        // 1. KIOSK (스캐너) 로직
        // ==========================================
        let isScanning = false;

        function updateKioskDropdowns() {
            const groupSelect = document.getElementById('kiosk-group');
            const currentVal = groupSelect.value;
            groupSelect.innerHTML = '<option value="" disabled selected>-- SELECT GROUP --</option>';
            
            if (classSetup && classSetup.groups) {
                Object.keys(classSetup.groups).forEach(g => {
                    const opt = document.createElement('option');
                    opt.value = g; opt.textContent = g;
                    groupSelect.appendChild(opt);
                });
            }
            if (currentVal && classSetup.groups[currentVal]) groupSelect.value = currentVal;
            updateKioskStudents();
        }

        function updateKioskStudents() {
            const groupName = document.getElementById('kiosk-group').value;
            const stuSelect = document.getElementById('kiosk-student');
            stuSelect.innerHTML = '<option value="" disabled selected>-- SELECT NUMBER --</option>';
            resetScanUI();

            if (!groupName || !classSetup || !classSetup.groups[groupName]) return;
            
            const groupData = classSetup.groups[groupName];
            groupData.students.forEach(num => {
                const opt = document.createElement('option');
                opt.value = num; 
                // 이미 스캔한 번호는 표시 변경
                if (groupData.scanned.includes(num)) {
                    opt.textContent = \`[\${num}번] - ALREADY SCANNED\`;
                    opt.disabled = true;
                } else {
                    opt.textContent = \`\${num}번\`;
                }
                stuSelect.appendChild(opt);
            });
        }

        function resetScanUI() {
            document.getElementById('roulette-result').innerHTML = 'AWAITING TARGET SELECTION...';
        }

        function scanFingerprint() {
            if (isScanning) return;
            
            const groupName = document.getElementById('kiosk-group').value;
            const studentNumStr = document.getElementById('kiosk-student').value;
            
            if (!groupName || !studentNumStr) {
                alert('GROUP AND NUMBER MUST BE SELECTED.');
                return;
            }
            
            const studentNum = parseInt(studentNumStr);
            const groupData = classSetup.groups[groupName];

            isScanning = true;
            const resDisplay = document.getElementById('roulette-result');
            const scannerBox = document.getElementById('scanner-box');
            
            scannerBox.classList.add('scanning');
            resDisplay.innerHTML = '<span class="result-scanning">VERIFYING IDENTITY...</span>';
            playScanSound();

            setTimeout(() => {
                scannerBox.classList.remove('scanning');
                isScanning = false;

                if (groupData.mafia === studentNum) {
                    resDisplay.innerHTML = '🚨 <span class="result-mafia">TARGET IDENTIFIED: MAFIA</span> 🚨';
                    playAlertSound();
                } else {
                    resDisplay.innerHTML = '<span class="result-citizen">CLEAR: CITIZEN</span>';
                    playClearSound();
                }

                // 서버에 스캔 기록 전송
                socket.emit('mark_scanned', { groupName, studentNum });
                
                // 로컬 UI상 드롭다운 업데이트 (잠시 후)
                setTimeout(() => {
                    updateKioskStudents();
                }, 2000);

            }, 1500);
        }

        // ==========================================
        // 2. 관리자 모드 로직 (ADMIN SETUP)
        // ==========================================
        let adminGroups = {}; // { '1조': [1, 5, 9], '2조': [2, 6] }
        let currentAdminGroup = null;

        function openAdmin() {
            document.getElementById('admin-login-overlay').style.display = 'flex';
            document.getElementById('admin-pw').value = '';
            document.getElementById('admin-pw').focus();
        }

        function verifyAdmin() {
            const pw = document.getElementById('admin-pw').value;
            if (pw === '1234') { // 기본 비밀번호
                document.getElementById('admin-login-overlay').style.display = 'none';
                switchTab('tab-admin');
                initAdminUI();
            } else {
                alert('ACCESS DENIED: INVALID PASSCODE');
            }
        }

        function initAdminUI() {
            if (Object.keys(adminGroups).length === 0) {
                adminGroups = {'1조':[], '2조':[], '3조':[], '4조':[]}; // 기본 4개조
            }
            generateStudentGrid();
            renderAdminGroups();
        }

        function generateStudentGrid() {
            const total = parseInt(document.getElementById('admin-total-stu').value) || 30;
            const grid = document.getElementById('admin-student-grid');
            grid.innerHTML = '';
            
            for (let i = 1; i <= total; i++) {
                const btn = document.createElement('button');
                btn.className = 'stu-btn';
                btn.id = 'stu-btn-' + i;
                btn.textContent = i;
                btn.onclick = () => toggleStudentAssign(i);
                grid.appendChild(btn);
            }
            refreshStudentGridColors();
        }

        function renderAdminGroups() {
            const list = document.getElementById('admin-group-list');
            list.innerHTML = '';
            Object.keys(adminGroups).forEach(g => {
                const item = document.createElement('div');
                item.className = 'admin-group-item' + (currentAdminGroup === g ? ' active' : '');
                item.innerHTML = \`<span>\${g} <small>(\${adminGroups[g].length}명)</small></span> <button class="del-btn" onclick="event.stopPropagation(); deleteAdminGroup('\${g}')">X</button>\`;
                item.onclick = () => {
                    currentAdminGroup = g;
                    document.getElementById('admin-selected-group-title').textContent = \`ASSIGNING STUDENTS TO: \${g}\`;
                    renderAdminGroups();
                    refreshStudentGridColors();
                };
                list.appendChild(item);
            });
            if (!currentAdminGroup && Object.keys(adminGroups).length > 0) {
                list.firstChild.click();
            }
        }

        function addAdminGroup() {
            const num = Object.keys(adminGroups).length + 1;
            const name = prompt('새 조 이름을 입력하세요:', num + '조');
            if (name && !adminGroups[name]) {
                adminGroups[name] = [];
                renderAdminGroups();
            }
        }

        function deleteAdminGroup(g) {
            if (confirm(\`\${g}를 삭제하시겠습니까?\`)) {
                delete adminGroups[g];
                if (currentAdminGroup === g) currentAdminGroup = null;
                renderAdminGroups();
                refreshStudentGridColors();
            }
        }

        function toggleStudentAssign(num) {
            if (!currentAdminGroup) {
                alert('먼저 왼쪽에서 할당할 조를 선택하세요.');
                return;
            }
            
            // 다른 조에 있으면 제거
            Object.keys(adminGroups).forEach(g => {
                const idx = adminGroups[g].indexOf(num);
                if (idx > -1) adminGroups[g].splice(idx, 1);
            });

            // 현재 조에 추가/토글
            const idx = adminGroups[currentAdminGroup].indexOf(num);
            if (idx === -1) {
                adminGroups[currentAdminGroup].push(num);
            } else {
                adminGroups[currentAdminGroup].splice(idx, 1); // 클릭 한 번 더 하면 해제
            }
            
            // 번호 오름차순 정렬
            adminGroups[currentAdminGroup].sort((a,b)=>a-b);

            renderAdminGroups();
            refreshStudentGridColors();
        }

        function refreshStudentGridColors() {
            document.querySelectorAll('.stu-btn').forEach(btn => {
                btn.className = 'stu-btn';
                const num = parseInt(btn.textContent);
                
                // 찾기
                let assignedGroup = null;
                Object.keys(adminGroups).forEach(g => {
                    if (adminGroups[g].includes(num)) assignedGroup = g;
                });

                if (assignedGroup) {
                    if (assignedGroup === currentAdminGroup) {
                        btn.classList.add('active-assigned');
                    } else {
                        btn.classList.add('assigned');
                    }
                }
            });
        }

        function saveAndAssignMafia() {
            if (confirm('설정을 저장하고 각 조별로 마피아를 1명씩 무작위로 배정합니다. 진행하시겠습니까?')) {
                const data = {
                    className: "WSA HOMEBASE",
                    groups: adminGroups
                };
                socket.emit('save_class_setup', data);
                alert('저장 및 마피아 배정 완료!');
            }
        }

        function renderAdminResultTable() {
            if (!classSetup || !classSetup.groups) return;
            document.getElementById('admin-result-area').style.display = 'block';
            const tbody = document.querySelector('#mafia-table tbody');
            tbody.innerHTML = '';

            Object.keys(classSetup.groups).forEach(g => {
                const tr = document.createElement('tr');
                const data = classSetup.groups[g];
                
                // 학생 번호 문자열로 렌더링, 마피아는 하이라이트
                const stuStr = data.students.map(n => n === data.mafia ? \`<span class="highlight-mafia">\${n}</span>\` : n).join(', ');
                
                tr.innerHTML = \`
                    <td>\${g}</td>
                    <td>\${stuStr}</td>
                    <td class="highlight-mafia">\${data.mafia}번</td>
                \`;
                tbody.appendChild(tr);
            });
        }

        // ==========================================
        // 3. 기존 현황판 렌더링 로직
        // ==========================================
        function renderDashboard() {
            const progressGrid = document.getElementById('progress-grid');
            const voteGrid = document.getElementById('vote-grid');
            let progressHtml = '';
            let voteHtml = '';
            const groups = Object.keys(gameState).sort((a,b) => parseInt(a) - parseInt(b));
            
            if (groups.length === 0) {
                progressGrid.innerHTML = '<div style="color:#060; font-size: 18px;">NO ACTIVE CONNECTIONS DETECTED.</div>';
                voteGrid.innerHTML = '<div style="color:#060; font-size: 18px;">NO DATA AVAILABLE.</div>';
                return;
            }

            groups.forEach(group => {
                const data = gameState[group];
                let stagesHtml = '';
                for(let i=1; i<=5; i++) {
                    const activeClass = data.stage >= i ? 'active' : '';
                    stagesHtml += \`<div class="stage-step \${activeClass}">\${i}</div>\`;
                    if(i < 5) stagesHtml += \`<div class="stage-line \${activeClass}"></div>\`;
                }
                progressHtml += \`<div class="card"><div class="card-header">\${group}</div><div class="stage-track">\${stagesHtml}</div></div>\`;

                if (data.vote) {
                    const voteClass = data.vote.success ? 'vote-success' : 'vote-fail';
                    const voteText = data.vote.success ? 'MATCH FOUND: MAFIA APPREHENDED' : 'MATCH FAILED: CITIZEN TARGETED';
                    voteHtml += \`<div class="card"><div class="card-header">\${group}</div><div class="vote-result">> TARGETED NO. \${data.vote.votedFor}</div><div class="vote-result \${voteClass}">\${voteText}</div></div>\`;
                }
            });

            progressGrid.innerHTML = progressHtml;
            voteGrid.innerHTML = voteHtml ? voteHtml : '<div style="color:#060; font-size: 18px;">NO DATA AVAILABLE.</div>';
        }

        // === 사운드 유틸 ===
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();

        function playScanSound() {
            if(audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(400, audioCtx.currentTime + 1.5);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 1.5);
        }

        function playAlertSound() {
            if(audioCtx.state === 'suspended') audioCtx.resume();
            for(let i=0; i<3; i++) {
                setTimeout(() => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
                    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                    osc.connect(gain); gain.connect(audioCtx.destination);
                    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
                }, i * 300);
            }
        }

        function playClearSound() {
            if(audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 0.5);
        }
    </script>
</body>
</html>`;

    fs.writeFileSync('teacher.html', newHtml, 'utf-8');
    console.log('Successfully generated new teacher.html with Admin Mode');
} catch(e) {
    console.error(e);
}
