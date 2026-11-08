// ============ LAGOS CAR RACING - TRUE HORIZONTAL - FIXED ============

let playerY = 150;
let score = 0;
let money = 0;
let fuel = 100;
let speed = 5;
let currentSpeed = 5;
let level = 1;
let gameRunning = false;
let isPaused = false;
let braking = false;
let movingUp = false;
let movingDown = false;
let enemies = [];
let moneyItems = [];
let fuelItems = [];
let lines = [];
let gameLoop;

let bestScore = localStorage.getItem('lagosBest') || 0;
let bestMoney = localStorage.getItem('lagosMoney') || 0;
let bestLevel = localStorage.getItem('lagosLevel') || 1;

const gameBox = document.getElementById('gameBox');
const player = document.getElementById('player');
const road = document.getElementById('road');
const scoreBoard = document.getElementById('scoreBoard');
const levelBanner = document.getElementById('levelBanner');

function getGameWidth(){ return gameBox.clientWidth || window.innerWidth; }
function getGameHeight(){ return gameBox.clientHeight || window.innerHeight; }

function getLanes(){
  let h = getGameHeight();
  return [h*0.12, h*0.32, h*0.52, h*0.72];
}
function clampPlayer(){
  let maxY = getGameHeight() - 65;
  if(playerY < 5) playerY = 5;
  if(playerY > maxY) playerY = maxY;
}

if(document.getElementById('bestOnStart')){
  document.getElementById('bestOnStart').innerText = bestScore > 0 ? '🏆 Best: ' + bestScore + ' | ₦' + bestMoney + ' | Level ' + bestLevel : '';
}

// Road lines - FIXED: 3 rows of dashes
for(let r=0; r<3; r++){
  for(let i=0; i<6; i++){
    let l = document.createElement('div');
    l.className = 'line';
    l.style.left = (i*160) + 'px';
    let h = getGameHeight();
    // lines dey between lanes
    if(r===0) l.style.top = (h*0.22) + 'px';
    if(r===1) l.style.top = (h*0.42) + 'px';
    if(r===2) l.style.top = (h*0.62) + 'px';
    road.appendChild(l);
    lines.push(l);
  }
}

let audioCtx = null;
function playSound(type){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    if(type === 'coin'){ osc.frequency.value = 900; osc.type = 'sine'; gain.gain.value = 0.15; osc.start(); osc.stop(audioCtx.currentTime + 0.15); }
    if(type === 'fuel'){ osc.frequency.value = 500; osc.type = 'sine'; gain.gain.value = 0.2; osc.start(); osc.frequency.setValueAtTime(500, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.2); osc.stop(audioCtx.currentTime + 0.25); }
    if(type === 'crash'){ osc.frequency.value = 100; osc.type = 'sawtooth'; gain.gain.value = 0.3; osc.start(); osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.4); osc.stop(audioCtx.currentTime + 0.4); }
    if(type === 'horn'){ osc.frequency.value = 400; osc.type = 'square'; gain.gain.value = 0.08; osc.start(); osc.stop(audioCtx.currentTime + 0.2); }
    if(type === 'lowfuel'){ osc.frequency.value = 300; osc.type = 'square'; gain.gain.value = 0.1; osc.start(); osc.stop(audioCtx.currentTime + 0.15); }
    if(type === 'levelup'){ osc.frequency.value = 400; osc.type = 'square'; gain.gain.value = 0.15; osc.start(); osc.frequency.setValueAtTime(400, audioCtx.currentTime); osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.15); osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.3); osc.stop(audioCtx.currentTime + 0.45); }
  }catch(e){}
}

function getLevelName(l){
  if(l===1) return 'Ikeja';
  if(l===2) return 'Oshodi';
  if(l===3) return 'Island';
  if(l>=4) return 'LEKKI MADNESS';
  return 'Ikeja';
}

function updateBoard(){
  let barHtml = '<div id="fuelBox"><div id="fuelBar" style="width:' + fuel + '%"></div></div>';
  scoreBoard.innerHTML = 'Score: ' + score + '<br>Speed: ' + Math.round(currentSpeed*20) + ' km/h ' + (braking ? '🛑' : '') + '<br>💰 ₦' + money + '<br>🏆 Best: ' + bestScore + '<br>🏁 Level ' + level + ' - ' + getLevelName(level) + '<br>' + barHtml + '<div style="font-size:12px;">⛽ Fuel</div>';
  let bar = document.getElementById('fuelBar');
  if(bar){
    if(fuel > 50) bar.style.background = '#00FF00';
    else if(fuel > 25) bar.style.background = '#FFCC00';
    else bar.style.background = '#FF0000';
  }
}
updateBoard();

function showLevelBanner(text){
  levelBanner.innerText = text;
  levelBanner.style.display = 'block';
  setTimeout(function(){ levelBanner.style.display = 'none'; }, 2000);
}

function checkLevel(){
  let newLevel = 1;
  if(score >= 100) newLevel = 4;
  else if(score >= 60) newLevel = 3;
  else if(score >= 30) newLevel = 2;
  else newLevel = 1;
  if(newLevel !== level){
    level = newLevel;
    playSound('levelup');
    gameBox.classList.remove('level2','level3','level4');
    if(level===2){ gameBox.classList.add('level2'); showLevelBanner('LEVEL 2! OSHODI 🔥'); }
    if(level===3){ gameBox.classList.add('level3'); showLevelBanner('LEVEL 3! ISLAND CRAZY! 😱'); }
    if(level===4){ gameBox.classList.add('level4'); showLevelBanner('LEVEL 4! LEKKI MADNESS! 👑'); }
    money += 500;
    fuel = 100;
    updateBoard();
  }
}

function startGame(){
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameOver').style.display = 'none';
  document.getElementById('pauseScreen').style.display = 'none';
  document.getElementById('pauseBtn').innerText = '⏸️';
  score = 0; money = 0; fuel = 100; speed = 5; currentSpeed = 5;
  playerY = getGameHeight()/2 - 27; level = 1;
  braking = false; movingUp = false; movingDown = false;
  gameBox.classList.remove('level2','level3','level4');
  enemies.forEach(function(e){ e.element.remove(); });
  moneyItems.forEach(function(m){ m.element.remove(); });
  fuelItems.forEach(function(f){ f.element.remove(); });
  enemies = []; moneyItems = []; fuelItems = [];
  gameRunning = true; isPaused = false;
  updateBoard();
  clearInterval(gameLoop);
  gameLoop = setInterval(update, 20);
}
function restartGame(){ startGame(); }

function togglePause(){
  if(!gameRunning && !isPaused) return;
  if(!isPaused){
    isPaused = true;
    clearInterval(gameLoop);
    document.getElementById('pauseScore').innerText = 'Score: ' + score + ' | Level ' + level + ' - ' + getLevelName(level) + ' | Money: ₦' + money + ' | Fuel: ' + Math.round(fuel) + '%';
    document.getElementById('pauseScreen').style.display = 'flex';
    document.getElementById('pauseBtn').innerText = '▶️';
  } else {
    isPaused = false;
    document.getElementById('pauseScreen').style.display = 'none';
    document.getElementById('pauseBtn').innerText = '⏸️';
    gameLoop = setInterval(update, 20);
  }
}

function createEnemy(){
  let types = [
    { name: 'DANFO', color: '#FFCC00', w: 110, h: 65, extraSpeed: -1, label: 'DANFO' },
    { name: 'KEKE', color: '#00AA00', w: 80, h: 45, extraSpeed: 0, label: 'KEKE' },
    { name: 'OKADA', color: '#FF3300', w: 70, h: 35, extraSpeed: 2, label: 'OKADA' },
    { name: 'CAR', color: '#0066FF', w: 95, h: 55, extraSpeed: 0, label: '' },
    { name: 'CAR', color: '#9900FF', w: 95, h: 55, extraSpeed: 0.5, label: '' },
    { name: 'POLICE', color: '#111111', w: 95, h: 55, extraSpeed: 1, label: 'POLICE' },
  ];
  if(level >= 3) types.push({ name: 'OKADA', color: '#FF3300', w: 70, h: 35, extraSpeed: 3, label: 'OKADA' });
  if(level >= 4) types.push({ name: 'DANFO', color: '#FFCC00', w: 110, h: 65, extraSpeed: 0, label: 'DANFO' });
  let t = types[Math.floor(Math.random() * types.length)];
  let lanes = getLanes();
  let y = lanes[Math.floor(Math.random() * lanes.length)];
  let el = document.createElement('div');
  el.className = 'car enemy';
  el.style.background = t.color;
  el.style.width = t.w + 'px';
  el.style.height = t.h + 'px';
  el.style.left = (getGameWidth() + 50) + 'px';
  el.style.top = y + 'px';
  let labelHTML = t.label ? '<div class="vehicle-label">' + t.label + '</div>' : '';
  el.innerHTML = '<div class="window"></div><div class="window2"></div>' + labelHTML;
  if(t.name === 'OKADA') el.classList.add('okada');
  if(t.name === 'KEKE') el.classList.add('keke');
  gameBox.appendChild(el);
  if(t.name === 'POLICE' && Math.random() < 0.5) playSound('horn');
  enemies.push({ x: getGameWidth()+50, y: y, w: t.w, h: t.h, extraSpeed: t.extraSpeed, element: el });
}

function createMoney(){
  let el = document.createElement('div');
  el.className = 'money';
  el.innerText = '₦';
  let lanes = getLanes();
  let y = lanes[Math.floor(Math.random() * lanes.length)] + 10;
  el.style.left = (getGameWidth()+20) + 'px';
  el.style.top = y + 'px';
  gameBox.appendChild(el);
  moneyItems.push({ x: getGameWidth()+20, y: y, element: el });
}

function createFuel(){
  let el = document.createElement('div');
  el.className = 'fuel-item';
  el.innerText = '⛽';
  let lanes = getLanes();
  let y = lanes[Math.floor(Math.random() * lanes.length)] + 5;
  el.style.left = (getGameWidth()+20) + 'px';
  el.style.top = y + 'px';
  gameBox.appendChild(el);
  fuelItems.push({ x: getGameWidth()+20, y: y, element: el });
}

function update(){
  if(!gameRunning || isPaused) return;

  if(movingUp) playerY -= 6;
  if(movingDown) playerY += 6;
  clampPlayer();

  if(braking){ currentSpeed = speed * 0.35; }
  else { currentSpeed += (speed - currentSpeed) * 0.1; if(currentSpeed > speed) currentSpeed = speed; }

  fuel -= 0.05 + (currentSpeed * 0.005);
  if(fuel <= 0){ fuel = 0; crash('Fuel Finish! ⛽ Motor don off!'); return; }
  if(fuel < 25 && Math.random() < 0.02) playSound('lowfuel');

  lines.forEach(function(l){
    let left = parseInt(l.style.left) - (8 + currentSpeed);
    if(left < -60) left = getGameWidth() + 60;
    l.style.left = left + 'px';
  });

  player.style.top = playerY + 'px';

  let spawnRate = 0.022 + (level * 0.004);
  if(Math.random() < spawnRate) createEnemy();
  if(Math.random() < 0.012) createMoney();
  if(fuel < 40 && Math.random() < 0.015) createFuel();
  else if(Math.random() < 0.006) createFuel();

  for(let i=enemies.length-1; i>=0; i--){
    let e = enemies[i];
    e.x -= currentSpeed + e.extraSpeed;
    e.element.style.left = e.x + 'px';
    if(e.x < -150){
      e.element.remove(); enemies.splice(i,1);
      score += 1;
      if(score % 10 === 0) speed += 0.5;
      checkLevel(); updateBoard(); continue;
    }
    if(80 < e.x + e.w && 80 + 95 > e.x && playerY < e.y + e.h && playerY + 55 > e.y){
      crash('CRASH! 💥 You jam Danfo!'); return;
    }
  }

  for(let i=moneyItems.length-1; i>=0; i--){
    let m = moneyItems[i];
    m.x -= currentSpeed; m.element.style.left = m.x + 'px';
    if(m.x < -50){ m.element.remove(); moneyItems.splice(i,1); continue; }
    if(80 < m.x + 35 && 80 + 95 > m.x && playerY < m.y + 35 && playerY + 55 > m.y){
      money += 100; playSound('coin');
      m.element.remove(); moneyItems.splice(i,1); updateBoard();
    }
  }

  for(let i=fuelItems.length-1; i>=0; i--){
    let f = fuelItems[i];
    f.x -= currentSpeed; f.element.style.left = f.x + 'px';
    if(f.x < -50){ f.element.remove(); fuelItems.splice(i,1); continue; }
    if(80 < f.x + 40 && 80 + 95 > f.x && playerY < f.y + 40 && playerY + 55 > f.y){
      fuel += 35; if(fuel > 100) fuel = 100;
      playSound('fuel');
      f.element.remove(); fuelItems.splice(i,1); updateBoard();
    }
  }

  let bar = document.getElementById('fuelBar');
  if(bar){
    bar.style.width = fuel + '%';
    if(fuel > 50) bar.style.background = '#00FF00';
    else if(fuel > 25) bar.style.background = '#FFCC00';
    else bar.style.background = '#FF0000';
  }
}

function crash(reason){
  gameRunning = false; isPaused = false; braking = false; movingUp = false; movingDown = false;
  clearInterval(gameLoop);
  playSound('crash');
  document.getElementById('pauseBtn').innerText = '⏸️';
  if(score > bestScore){ bestScore = score; localStorage.setItem('lagosBest', bestScore); }
  if(money > bestMoney){ bestMoney = money; localStorage.setItem('lagosMoney', bestMoney); }
  if(level > bestLevel){ bestLevel = level; localStorage.setItem('lagosLevel', bestLevel); }
  document.getElementById('gameOverTitle').innerText = reason || 'CRASH! 💥';
  document.getElementById('finalScore').innerHTML = 'Score: ' + score + ' | Money: ₦' + money + ' | Fuel: ' + Math.round(fuel) + '%<br>🏁 You Reach Level ' + level + ' - ' + getLevelName(level) + '<br>🏆 Best Score: ' + bestScore + ' (Level ' + bestLevel + ')<br>💰 Best Money: ₦' + bestMoney;
  document.getElementById('gameOver').style.display = 'block';
  updateBoard();
}

let upBtn = document.getElementById('upBtn');
let downBtn = document.getElementById('downBtn');
let brakeBtn = document.getElementById('brakeBtn');

function bindHold(btn, on, off){
  btn.addEventListener('touchstart', function(e){ e.preventDefault(); on(); }, {passive:false});
  btn.addEventListener('touchend', function(e){ e.preventDefault(); off(); }, {passive:false});
  btn.addEventListener('touchcancel', function(){ off(); }, {passive:false});
  btn.addEventListener('mousedown', function(e){ e.preventDefault(); on(); });
  btn.addEventListener('mouseup', off);
  btn.addEventListener('mouseleave', off);
}
bindHold(upBtn, function(){ movingUp = true; upBtn.classList.add('pressed'); }, function(){ movingUp = false; upBtn.classList.remove('pressed'); });
bindHold(downBtn, function(){ movingDown = true; downBtn.classList.add('pressed'); }, function(){ movingDown = false; downBtn.classList.remove('pressed'); });
bindHold(brakeBtn, function(){ braking = true; brakeBtn.classList.add('braking'); }, function(){ braking = false; brakeBtn.classList.remove('braking'); });

let startY = 0;
gameBox.addEventListener('touchstart', function(e){ startY = e.touches[0].clientY; });
gameBox.addEventListener('touchmove', function(e){
  let move = e.touches[0].clientY - startY;
  if(Math.abs(move) > 10){
    playerY += move * 0.5; clampPlayer();
    startY = e.touches[0].clientY;
  }
});

document.addEventListener('keydown', function(e){
  if(e.key === 'ArrowUp') movingUp = true;
  if(e.key === 'ArrowDown') movingDown = true;
  if(e.key === 'p' || e.key === 'P') togglePause();
  if(e.key === ' ' || e.key === 's' || e.key === 'S') braking = true;
});
document.addEventListener('keyup', function(e){
  if(e.key === 'ArrowUp') movingUp = false;
  if(e.key === 'ArrowDown') movingDown = false;
  if(e.key === ' ' || e.key === 's' || e.key === 'S') braking = false;
});

window.addEventListener('resize', function(){ clampPlayer(); });