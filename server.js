const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 정적 파일 제공 (현재 폴더를 루트로)
app.use(express.static(__dirname));

// 선생님 대시보드 라우트
app.get('/teacher', (req, res) => {
    res.sendFile(path.join(__dirname, 'teacher.html'));
});

// 메모리에 저장되는 게임 상태
// { '1조': { stage: 2, vote: { votedFor: '3', success: true } } }
const gameState = {};
let globalClassSetup = null;

io.on('connection', (socket) => {
    console.log('새로운 접속:', socket.id);

    // 선생님 접속 시 현재 상태 전송
    socket.on('teacher_join', () => {
        socket.emit('init_state', gameState);
    });

    // 학생 로그인 (조 선택)
    socket.on('student_join', (data) => {
        const { groupName } = data;
        if (!gameState[groupName]) {
            gameState[groupName] = { stage: 0, vote: null };
        }
        socket.groupName = groupName;
        console.log(`${groupName} 접속 완료`);
        io.emit('update_state', gameState); // 선생님에게 업데이트
    });

    // 스테이지 클리어
    socket.on('stage_clear', (data) => {
        const { groupName, stage } = data;
        if (!gameState[groupName]) {
            gameState[groupName] = { stage: 0, vote: null };
        }
        // 가장 높은 스테이지로 갱신
        if (stage > gameState[groupName].stage) {
            gameState[groupName].stage = stage;
            console.log(`${groupName} - 스테이지 ${stage} 클리어`);
            io.emit('update_state', gameState);
        }
    });

    // 최종 마피아 투표
    socket.on('vote_mafia', (data) => {
        const { groupName, votedFor, success } = data;
        if (!gameState[groupName]) {
            gameState[groupName] = { stage: 5, vote: null };
        }
        gameState[groupName].vote = { votedFor, success };
        console.log(`${groupName} 투표 완료 - 지목: ${votedFor}, 성공여부: ${success}`);
        io.emit('update_state', gameState);
    });

    // === 지정 마피아 관리자 기능 ===
    socket.on('save_class_setup', (data) => {
        const setup = {
            className: data.className,
            groups: {}
        };
        for (const [groupName, students] of Object.entries(data.groups)) {
            if (!students || students.length === 0) continue;
            const mafiaIndex = Math.floor(Math.random() * students.length);
            setup.groups[groupName] = {
                students: students,
                mafia: students[mafiaIndex],
                scanned: []
            };
        }
        globalClassSetup = setup;
        console.log('관리자 셋업 저장됨:', setup.className);
        io.emit('update_class_setup', globalClassSetup);
    });

    socket.on('request_class_setup', () => {
        if (globalClassSetup) {
            socket.emit('update_class_setup', globalClassSetup);
        }
    });

    socket.on('mark_scanned', (data) => {
        const { groupName, studentNum } = data;
        if (globalClassSetup && globalClassSetup.groups[groupName]) {
            if (!globalClassSetup.groups[groupName].scanned.includes(studentNum)) {
                globalClassSetup.groups[groupName].scanned.push(studentNum);
                io.emit('update_class_setup', globalClassSetup);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('접속 종료:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 WSA 방탈출 게임 서버가 시작되었습니다!`);
    console.log(`=========================================`);
    console.log(`👉 학생용 접속 주소: http://localhost:${PORT}/merged_game.html`);
    console.log(`👉 선생님 대시보드: http://localhost:${PORT}/teacher`);
    console.log(`(주의: 학생들은 localhost 대신 선생님 PC의 IP 주소로 접속해야 합니다. 예: http://192.168.0.x:3000/merged_game.html)`);
    console.log(`=========================================`);
});
