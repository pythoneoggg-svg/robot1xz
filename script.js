// ========== ХОЛСТ ==========
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// ========== РОБОТ ==========
let robot = {
    x: 200, y: 210,
    headW: 44, headH: 38,
    bodyW: 34, bodyH: 55,
    armW: 14, armH: 55,
    legW: 16, legH: 60,
    fingerLen: 8,
    rightArmAngle: 0,
    leftArmAngle: 0,
    rightLegAngle: 0,
    leftLegAngle: 0,
    rightFingerAngle: 0,
    leftFingerAngle: 0,
    headTilt: 0,
    bodyY: 210,
    eyeGlow: 0,
};

// ========== ПАМЯТЬ ==========
let memory = {};
try {
    const saved = localStorage.getItem('robot_memory');
    if (saved) memory = JSON.parse(saved);
} catch (e) { }

function saveMemory() {
    localStorage.setItem('robot_memory', JSON.stringify(memory));
}

// ========== РИСОВАНИЕ ==========
function drawRobot() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { x, bodyY, headW, headH, bodyW, bodyH, armW, armH, legW, legH,
        rightArmAngle, leftArmAngle, rightLegAngle, leftLegAngle,
        rightFingerAngle, leftFingerAngle, headTilt } = robot;

    // Тень
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x, bodyY + bodyH / 2 + legH + 5, 25, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ноги
    drawLimb(x - 12, bodyY + bodyH / 2, legW, legH, leftLegAngle);
    drawLimb(x + 12, bodyY + bodyH / 2, legW, legH, rightLegAngle);

    // Тело
    const bodyGrad = ctx.createLinearGradient(x, bodyY - bodyH / 2, x, bodyY + bodyH / 2);
    bodyGrad.addColorStop(0, '#555');
    bodyGrad.addColorStop(1, '#333');
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(x - bodyW / 2, bodyY - bodyH / 2, bodyW, bodyH);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - bodyW / 2, bodyY - bodyH / 2, bodyW, bodyH);

    // Руки
    drawLimb(x - bodyW / 2 - 3, bodyY - bodyH / 2 + 12, armW, armH, leftArmAngle);
    drawLimb(x + bodyW / 2 + 3, bodyY - bodyH / 2 + 12, armW, armH, rightArmAngle);

    // Пальцы
    drawFingers(x - bodyW / 2 - 3, bodyY - bodyH / 2 + 12 + armH, leftFingerAngle, -1);
    drawFingers(x + bodyW / 2 + 3, bodyY - bodyH / 2 + 12 + armH, rightFingerAngle, 1);

    // Голова
    ctx.save();
    ctx.translate(x, bodyY - bodyH / 2 - headH / 2);
    ctx.rotate(headTilt * Math.PI / 180);
    ctx.fillStyle = '#444';
    ctx.fillRect(-headW / 2, -headH / 2, headW, headH);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.strokeRect(-headW / 2, -headH / 2, headW, headH);

    // Антенна
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(-2, -headH / 2 - 12, 4, 12);
    ctx.beginPath();
    ctx.arc(0, -headH / 2 - 14, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0000';
    ctx.fill();

    // Глаза
    const glow = 0.5 + Math.sin(Date.now() / 1000) * 0.5;
    ctx.fillStyle = `rgba(255, 0, 0, ${0.5 + glow * 0.5})`;
    ctx.fillRect(-14, -headH / 2 + 8, 10, 10);
    ctx.fillRect(4, -headH / 2 + 8, 10, 10);

    ctx.restore();
}

function drawLimb(px, py, w, h, angle) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle * Math.PI / 180);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#666');
    grad.addColorStop(1, '#333');
    ctx.fillStyle = grad;
    ctx.fillRect(-w / 2, 0, w, h);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-w / 2, 0, w, h);
    ctx.restore();
}

function drawFingers(px, py, angle, dir) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle * Math.PI / 180);
    ctx.fillStyle = '#555';
    ctx.fillRect(-2, 0, 4, 10);
    ctx.fillRect(-6, 0, 3, 8);
    ctx.fillRect(3, 0, 3, 8);
    ctx.restore();
}

// ========== АНИМАЦИЯ ==========
function animateAngle(part, targetAngle, duration = 400) {
    return new Promise(resolve => {
        const start = robot[part];
        const startTime = performance.now();

        function step(time) {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
            robot[part] = start + (targetAngle - start) * eased;
            drawRobot();

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                robot[part] = targetAngle;
                drawRobot();
                spawnParticles(part);
                resolve();
            }
        }

        requestAnimationFrame(step);
    });
}

// ========== ЧАСТИЦЫ ==========
function spawnParticles(part) {
    const container = document.getElementById('particles');
    if (!container) return;

    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = document.querySelector('.canvas-wrapper').getBoundingClientRect();

    let px = robot.x;
    let py = robot.bodyY;

    if (part.includes('Arm')) {
        px += part.includes('Right') ? 40 : -40;
        py = robot.bodyY - robot.bodyH / 2 + robot.armH;
    } else if (part.includes('Leg')) {
        px += part.includes('Right') ? 12 : -12;
        py = robot.bodyY + robot.bodyH / 2 + robot.legH;
    }

    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = (px - 2) + 'px';
        particle.style.top = (py - 2) + 'px';
        particle.style.setProperty('--dx', (Math.random() - 0.5) * 20 + 'px');
        particle.style.setProperty('--dy', (Math.random() - 0.5) * 20 + 'px');
        container.appendChild(particle);
        setTimeout(() => particle.remove(), 500);
    }
}

// ========== КОМАНДЫ ==========
const baseCommands = {
    "поднять правую руку": () => animateAngle("rightArmAngle", -90),
    "опустить правую руку": () => animateAngle("rightArmAngle", 0),
    "поднять левую руку": () => animateAngle("leftArmAngle", -90),
    "опустить левую руку": () => animateAngle("leftArmAngle", 0),
    "поднять правую ногу": () => animateAngle("rightLegAngle", -45),
    "опустить правую ногу": () => animateAngle("rightLegAngle", 0),
    "поднять левую ногу": () => animateAngle("leftLegAngle", -45),
    "опустить левую ногу": () => animateAngle("leftLegAngle", 0),
    "сжать правую руку": () => animateAngle("rightFingerAngle", -30),
    "разжать правую руку": () => animateAngle("rightFingerAngle", 0),
    "сжать левую руку": () => animateAngle("leftFingerAngle", -30),
    "разжать левую руку": () => animateAngle("leftFingerAngle", 0),
    "наклонить голову": () => animateAngle("headTilt", 15),
    "выпрямить голову": () => animateAngle("headTilt", 0),
};

// ========== КОНСОЛЬ ==========
function log(msg, cls = '') {
    const c = document.getElementById('console');
    const d = new Date();
    const t = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    c.innerHTML += `<div class="${cls}">[${t}] ${msg}</div>`;
    c.scrollTop = c.scrollHeight;
}

function clearConsole() {
    document.getElementById('console').innerHTML = '';
}

function resetRobot() {
    robot.rightArmAngle = 0;
    robot.leftArmAngle = 0;
    robot.rightLegAngle = 0;
    robot.leftLegAngle = 0;
    robot.rightFingerAngle = 0;
    robot.leftFingerAngle = 0;
    robot.headTilt = 0;
    robot.bodyY = 210;
    drawRobot();
    log('Робот сброшен', 'success');
}

function showMemory() {
    const keys = Object.keys(memory);
    if (keys.length === 0) {
        log('Память пуста.', 'info');
        return;
    }
    log('🧠 Комбинации:');
    keys.forEach(k => {
        log(`  • <span class="memory-item" onclick="runMemory('${k}')">${k}</span> (${memory[k].length} ком.)`);
    });
}

function showHelp() {
    log('📋 Доступные команды:', 'info');
    Object.keys(baseCommands).forEach(c => log(`  • ${c}`));
    if (Object.keys(memory).length > 0) {
        log('🧠 Комбинации: ' + Object.keys(memory).join(', '));
    }
    log('💡 Можно через запятую: поднять правую руку, опустить правую руку');
    log('📝 Обучить: комбинация идти = поднять правую ногу, опустить правую ногу, поднять левую ногу, опустить левую ногу');
}

function quickCmd(cmd) {
    document.getElementById('cmd').value = cmd;
    runCode();
}

// ========== ВЫПОЛНЕНИЕ ==========
async function executeCommand(cmd) {
    cmd = cmd.trim().toLowerCase();
    if (!cmd) return;

    // Комбинация из памяти
    if (memory[cmd]) {
        log(`🔄 ${cmd}`, 'success');
        for (const sub of memory[cmd]) {
            await executeCommand(sub);
        }
        return;
    }

    // Обучение
    if (cmd.startsWith('комбинация ') || cmd.startsWith('научить ')) {
        const match = cmd.match(/(?:комбинация|научить)\s+(\w+)\s*=\s*(.+)/i);
        if (match) {
            const name = match[1].toLowerCase();
            const cmds = match[2].split(',').map(c => c.trim()).filter(c => c);
            if (cmds.length > 0) {
                memory[name] = cmds;
                saveMemory();
                log(`✅ "${name}" сохранена!`, 'success');
                return;
            }
        }
        log('❌ Формат: комбинация имя = команда1, команда2', 'error');
        return;
    }

    // Идти
    if (cmd === 'иди' || cmd === 'идти') {
        if (!memory['идти']) {
            memory['идти'] = ['поднять правую ногу', 'опустить правую ногу', 'поднять левую ногу', 'опустить левую ногу'];
            saveMemory();
            log('🚶 Научил ходьбе!', 'success');
        }
        await executeCommand('идти');
        return;
    }

    // Танцевать
    if (cmd === 'танцевать' || cmd === 'танец') {
        if (!memory['танцевать']) {
            memory['танцевать'] = [
                'поднять правую руку', 'поднять левую руку',
                'опустить правую руку', 'опустить левую руку',
                'поднять правую ногу', 'опустить правую ногу',
                'поднять левую ногу', 'опустить левую ногу'
            ];
            saveMemory();
            log('💃 Научил танцу!', 'success');
        }
        await executeCommand('танцевать');
        return;
    }

    // Базовая команда
    if (baseCommands[cmd]) {
        log(`▶ ${cmd}`);
        await baseCommands[cmd]();
        log(`✅ ${cmd}`, 'success');
    } else {
        log(`❓ Неизвестно: "${cmd}"`, 'error');
    }
}

async function runCode() {
    const input = document.getElementById('cmd');
    const text = input.value.trim();
    if (!text) return;

    const commands = text.split(/[,;\n]+/).map(c => c.trim()).filter(c => c);
    log(`📝 ${commands.join(' → ')}`);

    for (const cmd of commands) {
        await executeCommand(cmd);
        await sleep(150);
    }

    input.value = '';
}

function runMemory(name) {
    document.getElementById('cmd').value = name;
    runCode();
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ========== ЗАПУСК ==========
drawRobot();
log('🤖 Робот готов!');
log('📝 Например: поднять правую руку');
log('🧠 Обучить: комбинация идти = поднять правую ногу, опустить правую ногу, поднять левую ногу, опустить левую ногу');