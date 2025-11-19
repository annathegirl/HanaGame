// ============================================
// 參數設定
// ============================================

const GROUND = 180;
const PLAYER_X = 100;

let gameState = "MENU";
let playerName = "玩家";

let playerBottom = GROUND;
let playerVy = 0;
let gravity = -1.1;

let jumpCount = 0;
const MAX_JUMP = 3;
const JUMP_FORCE1 = 20;
const JUMP_FORCE2 = 18;

let obstacles = [];
let spawnTimer = 0;
let lastTime = null;

let score = 0;
let highScore = 0;

// 圖片
const lowImgs = ["IMG_8329.png", "IMG_8337.png", "IMG_8338.png", "IMG_8341.png"];
const highImgs = ["unnamed.png", "IMG_8330.png", "IMG_8339.png", "IMG_8340.png"];

// ============================================
// DOM
// ============================================

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const btnStart = document.getElementById("btn-start");

const playerEl = document.getElementById("player");
const obstacleContainer = document.getElementById("obstacle-container");

const scoreText = document.getElementById("score-text");
const highScoreText = document.getElementById("high-score-text");

const gameOverOverlay = document.getElementById("game-over-overlay");
const finalScoreText = document.getElementById("final-score-text");

// ============================================
// 高分紀錄
// ============================================

function loadHighScore() {
  let saved = localStorage.getItem("hana_highscore");

  if (!saved) {
    highScoreText.textContent = "無紀錄";
    highScore = 0;
    return;
  }

  try {
    saved = JSON.parse(saved);
  } catch {
    // 舊資料格式錯誤 → 清掉
    localStorage.removeItem("hana_highscore");
    highScoreText.textContent = "無紀錄";
    return;
  }

  if (!saved.name || typeof saved.score !== "number") {
    highScoreText.textContent = "無紀錄";
    return;
  }

  highScore = saved.score;
  highScoreText.textContent = `${saved.name}：${saved.score}`;
}

function saveHighScore() {
  if (score > highScore) {
    const data = { name: playerName, score: score };
    localStorage.setItem("hana_highscore", JSON.stringify(data));
    highScore = score;
    highScoreText.textContent = `${playerName}：${score}`;
  }
}

// ============================================
// 遊戲流程
// ============================================

btnStart.onclick = () => {
  let name = prompt("請輸入玩家名稱：");
  if (!name || name.trim() === "") name = "玩家";
  playerName = name.trim();

  startGame();
};

function startGame() {
  gameState = "PLAYING";
  score = 0;
  scoreText.textContent = score;

  playerBottom = GROUND;
  playerVy = 0;
  jumpCount = 0;

  obstacles.forEach(o => o.el.remove());
  obstacles = [];
  spawnTimer = 0;
  lastTime = null;

  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  hideGameOver();

  requestAnimationFrame(gameLoop);
}

function gameOver() {
  if (gameState !== "PLAYING") return;

  gameState = "GAMEOVER";

  saveHighScore();
  finalScoreText.textContent = score;

  showGameOver();

  setTimeout(() => {

    gameScreen.classList.add("hidden");
    hideGameOver();
    startScreen.classList.remove("hidden");

    gameState = "MENU";
  }, 4000);
}

// ============================================
// 主迴圈
// ============================================

function gameLoop(time) {
  if (gameState !== "PLAYING") return;

  if (!lastTime) lastTime = time;
  const dt = (time - lastTime) / 16.67;
  lastTime = time;

  updatePlayer(dt);
  updateObstacles(dt);
  checkCollision();

  requestAnimationFrame(gameLoop);
}

// ============================================
// 主角
// ============================================

function updatePlayer(dt) {
  playerVy += gravity * dt;
  playerBottom += playerVy * dt;

  if (playerBottom <= GROUND) {
    playerBottom = GROUND;
    playerVy = 0;
    jumpCount = 0;
  }

  playerEl.style.bottom = `${playerBottom}px`;
}

function doJump() {
  if (jumpCount >= MAX_JUMP) return;

  jumpCount++;

  if (jumpCount === 1) playerVy = JUMP_FORCE1;
  else playerVy = JUMP_FORCE2;
}

// ============================================
// 障礙物
// ============================================

function spawnObstacle() {
  const isHigh = Math.random() < 0.5;
  const src = isHigh ? random(highImgs) : random(lowImgs);

  const el = document.createElement("img");
  el.src = src;
  el.className = "obstacle";

  if (isHigh) el.classList.add("high");
  else el.classList.add("low");

  el.style.right = "-200px";

  obstacleContainer.appendChild(el);

  obstacles.push({
    el,
    x: window.innerWidth,
    isHigh,
    scored: false
  });
}

function updateObstacles(dt) {
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = 120 + Math.random() * 80;
  }

  const speed = 6;

  obstacles.forEach(o => {
    o.x -= speed * dt;
    o.el.style.right = `${window.innerWidth - o.x}px`;
  });

  obstacles = obstacles.filter(o => {
    if (!o.scored && o.x < PLAYER_X) {
      o.scored = true;
      const gain = o.isHigh ? 25 + Math.floor(Math.random() * 16) : 10;
      addScore(gain);
    }

    if (o.x > -200) return true;
    o.el.remove();
    return false;
  });
}

function addScore(amount) {
  score += amount;
  scoreText.textContent = score;

  const p = playerEl.getBoundingClientRect();

  const float = document.createElement("div");
  float.className = "float-score";
  float.textContent = `+${amount}`;
  float.style.left = (p.left + p.width / 2) + "px";
  float.style.top = (p.top - 40) + "px";

  document.body.appendChild(float);

  setTimeout(() => float.remove(), 900);
}

// ============================================
// 碰撞
// ============================================

function checkCollision() {
  const padding = 30;

  const p = playerEl.getBoundingClientRect();
  const pL = p.left + padding;
  const pR = p.right - padding;
  const pT = p.top + padding;
  const pB = p.bottom - padding;

  for (const o of obstacles) {
    const r = o.el.getBoundingClientRect();
    const rL = r.left + padding;
    const rR = r.right - padding;
    const rT = r.top + padding;
    const rB = r.bottom - padding;

    if (!(pR < rL || pL > rR || pB < rT || pT > rB)) {
      gameOver();
      return;
    }
  }
}

// ============================================
// Game Over 動畫
// ============================================

function showGameOver() {
  gameOverOverlay.classList.remove("hidden");
  gameOverOverlay.classList.add("active");

  setTimeout(() => {
    gameOverOverlay.classList.add("show-text");
  }, 1500);
}

function hideGameOver() {
  gameOverOverlay.classList.add("hidden");
  gameOverOverlay.classList.remove("active", "show-text");
}

// ============================================
// 輸入
// ============================================

window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    if (gameState === "PLAYING") doJump();
  }
});

window.addEventListener("mousedown", () => {
  if (gameState === "PLAYING") doJump();
});

window.addEventListener("touchstart", e => {
  e.preventDefault();
  if (gameState === "PLAYING") doJump();
});

// ============================================
// Utils
// ============================================

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================
// PWA
// ============================================

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

loadHighScore();
