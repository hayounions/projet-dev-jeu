let audioContext;
let startBtn, playBtn, status, lastTimeEl, bestTimeEl, gameScreen, introModal;

let gameState = 'idle';
let startTime = 0;
let bestTime = Infinity;
let fakeButtons = [];
const catchyColors = ['#00f5ff', '#ff00ff', '#ffff00', '#ff4757', '#2ed573', '#ffa502', '#ff6b9d', '#54a0ff'];
const bluffTexts = ['Attends encore...', 'Faux!', 'Piège?', 'Pas maintenant!', 'Bluff!'];

document.addEventListener('DOMContentLoaded', init);

function init() {
    startBtn = document.getElementById('start-btn');
    playBtn = document.getElementById('play-btn');
    status = document.getElementById('status');
    lastTimeEl = document.getElementById('last-time');
    bestTimeEl = document.getElementById('best-time');
    gameScreen = document.getElementById('game-screen');
    introModal = document.getElementById('intro-modal');
    
    initAudio();
    randomButtonPos();
    
    playBtn.addEventListener('click', startIntroClose);
    startBtn.addEventListener('click', startGame);
    gameScreen.addEventListener('click', handleGameClick);
    gameScreen.addEventListener('touchstart', handleGameClick, { passive: false });
}

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playTone(frequency, duration = 0.2, type = 'sine') {
    initAudio();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function startIntroClose() {
    introModal.style.display = 'none';
    playTone(800, 0.4);
    status.textContent = 'Prêt? Cliquez Démarrer pour commencer!';
    randomButtonPos();
}

function randomButtonPos() {
    if (!startBtn) return;
    const x = Math.random() * 60 + 20;
    const y = Math.random() * 30 + 20;
    startBtn.style.position = 'absolute';
    startBtn.style.left = x + '%';
    startBtn.style.top = y + '%';
    startBtn.style.transform = 'translate(-50%, -50%)';
}

function handleGameClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const fakeBtn = e.target.closest('.fake-btn');
    if (fakeBtn) {
        handleBluff(fakeBtn);
        return;
    }
    
    handleReaction();
}

function startGame() {
    console.log('=== NOUVEAU JEU ===');
    playTone(600, 0.3, 'square');
    gameState = 'waiting';
    status.textContent = 'Attendez le signal vert → jaune → FLASH COULEUR!';
    startBtn.style.display = 'none';
    gameScreen.className = 'game-screen waiting';
    gameScreen.innerHTML = '';
    clearFakes();
    
    const waitTime = 2000 + Math.random() * 2500;
    setTimeout(() => gameState === 'waiting' && enterReadyState(), waitTime);
}

function enterReadyState() {
    console.log('PRET!');
    playTone(900, 0.5, 'sine');
    gameState = 'ready';
    status.textContent = 'PREPAREZ VOUS! Ignorez les boutons pièges!';
    gameScreen.className = 'game-screen ready';
    gameScreen.innerHTML = '';
    
    const numTraps = 2 + Math.floor(Math.random() * 3);
    Array.from({length: numTraps}).forEach((_, i) => {
        setTimeout(() => gameState === 'ready' && createFakeButton(), 300 + i * 500 + Math.random() * 400);
    });
    
    const readyDelay = 1500 + Math.random() * 2500;
    setTimeout(() => gameState === 'ready' && showSignal(), readyDelay);
}

function createFakeButton() {
    const btn = document.createElement('button');
    btn.className = 'fake-btn';
    btn.innerText = bluffTexts[Math.floor(Math.random() * bluffTexts.length)];
    btn.style.position = 'absolute';
    btn.style.left = (15 + Math.random() * 70) + '%';
    btn.style.top = (15 + Math.random() * 70) + '%';
    gameScreen.appendChild(btn);
    fakeButtons.push(btn);
}

function clearFakes() {
    fakeButtons.forEach(btn => btn && btn.remove());
    fakeButtons = [];
}

function handleBluff(btn) {
    console.log('PIEGES!');
    playTone(350, 0.6, 'sawtooth');
    status.textContent = 'BLUFF! Piège détecté 😂 Recommence!';
    gameScreen.classList.add('bluff-shake');
    btn.remove();
    fakeButtons = fakeButtons.filter(b => b !== btn);
    setTimeout(() => {
        gameScreen.classList.remove('bluff-shake');
        resetGame();
    }, 2500);
}

function showSignal() {
    console.log('*** SIGNAL ***');
    playTone(1200, 1);
    gameState = 'signal';
    startTime = performance.now();
    clearFakes();
    const color = catchyColors[Math.floor(Math.random() * catchyColors.length)];
    gameScreen.style.background = `radial-gradient(circle, ${color}, white)`;
    gameScreen.className = 'game-screen signal';
    gameScreen.innerHTML = ''; 
    status.textContent = 'CLICK L ECRAN DES QUE FLASH!';
    status.style.fontSize = '2.2rem';
    status.style.fontWeight = 'bold';
}

function handleReaction() {
    if (gameState !== 'signal') {
        playTone(250, 0.4);
        status.textContent = 'TOO EARLY! Attends le FLASH couleur!';
        status.style.fontSize = '1.4rem';
        setTimeout(resetGame, 1500);
        return;
    }
    
    const rt = (performance.now() - startTime) / 1000;
    const reactionTime = rt.toFixed(3);
    console.log('*** REACTION TIME:', reactionTime, 's ***');
    playTone(800 + (0.3 - rt) * 800, 0.8);
    
    lastTimeEl.textContent = 'Ce temps: ' + reactionTime + 's';
    if (rt < bestTime) bestTime = rt;
    bestTimeEl.textContent = 'Meilleur: ' + bestTime.toFixed(3) + 's';
    
    status.textContent = 'INCROYABLE! ' + reactionTime + 's 🏅';
    status.style.fontSize = '1.8rem';
    gameState = 'idle';
    setTimeout(() => {
        gameScreen.className = 'game-screen';
        gameScreen.style.background = '';
        randomButtonPos();
        startBtn.style.display = 'block';
        status.style.fontSize = '';
    }, 3000);
}

function resetGame() {
    gameState = 'idle';
    gameScreen.className = 'game-screen';
    gameScreen.style.background = '';
    gameScreen.innerHTML = '';
    status.textContent = 'Clique Démarrer pour recommencer!';
    status.style.fontSize = '';
    startBtn.style.display = 'block';
    randomButtonPos();
    clearFakes();
}
