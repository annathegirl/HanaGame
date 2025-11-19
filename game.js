// ============================================
// 參數設定
// ============================================

const GROUND = 180;
const PLAYER_X = 100;

let gameState = "MENU"; // MENU, PLAYING, GAMEOVER

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

// 障礙物圖片
const lowImgs = ["IMG_8329.png", "IMG_8337.png", "IMG_8338.png", "IMG_8341.png"];
const highImgs = ["unnamed.png", "IMG_8330.png", "IMG_8339.png", "IMG_8340.png"];

// ============================================
// DOM 物件
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
// 高分
// ============================================

function loadHighScore() {
  const saved = parseInt(localStorage.getItem("hana_highscore") || "0");
  highScore = saved;
  highScoreText.textContent = highScore;
}

function saveHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("hana_highscore", highScore);
    highScoreText.textContent = highScore;
  }
}

// ============================================
// 遊戲流程
// ============================================

btnStart.onclick = () => startGame();

function startGame() {
  gameState = "PLAYING";
  score = 0;
  scoreText.textContent = score;

  playerBottom = GROUND;
  playerVy = 0;
  jumpCount = 0;

  obstacles.forEach((o) => o.el.remove());
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
    startScreen.classList.remove("hidden");
    gameState = "MENU";
  }, 2000);
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

// 重要：用 right 移動（避免 transform 造成 hitbox 失效）
function spawnObstacle() {
  const isHigh = Math.random() < 0.5;
  const src = isHigh ? random(highImgs) : random(lowImgs);

  const el = document.createElement("img");
  el.src = src;
  el.className = "obstacle";

  // ★★★ 加上 class 讓 CSS 可以控制大小 ★★★
  if (isHigh) el.classList.add("high");
  else el.classList.add("low");

  el.style.right = "-200px";

  obstacleContainer.appendChild(el);

  const obs = {
    el,
    x: window.innerWidth,
    width: 120,  // 邏輯寬度，與顯示無關
    isHigh,
    scored: false,
  };

  obstacles.push(obs);
}

function updateObstacles(dt) {
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = 120 + Math.random() * 80;
  }

  const speed = 6;

  obstacles.forEach((o) => {
    o.x -= speed * dt;
    o.el.style.right = `${window.innerWidth - o.x}px`;
  });

  obstacles = obstacles.filter((o) => {
    // 得分
    if (!o.scored && o.x < PLAYER_X) {
      o.scored = true;
      const gain = o.isHigh ? 25 + Math.floor(Math.random() * 16) : 10;
      addScore(gain, o);
    }

    // 出畫面左側刪除
    if (o.x > -200) return true;

    o.el.remove();
    return false;
  });
}

function addScore(amount, obs) {
  score += amount;
  scoreText.textContent = score;

  const rect = obs.el.getBoundingClientRect();
  const float = document.createElement("div");
  float.className = "float-score";
  float.textContent = `+${amount}`;
  float.style.left = rect.left + rect.width / 2 + "px";
  float.style.top = rect.top + "px";
  document.body.appendChild(float);

  setTimeout(() => float.remove(), 900);
}

// ============================================
// 碰撞（方法一：加入安全距離 padding）
// ============================================

function checkCollision() {
  const padding = 30; // <<< 安全距離越大 -> 越不容易撞到（建議 10~25）

  const p = playerEl.getBoundingClientRect();

  // 主角的碰撞框縮小 padding
  const pLeft   = p.left   + padding;
  const pRight  = p.right  - padding;
  const pTop    = p.top    + padding;
  const pBottom = p.bottom - padding;

  for (const o of obstacles) {
    const r = o.el.getBoundingClientRect();

    // 障礙物的碰撞框也縮小 padding
    const rLeft   = r.left   + padding;
    const rRight  = r.right  - padding;
    const rTop    = r.top    + padding;
    const rBottom = r.bottom - padding;

    // AABB 碰撞檢查
    if (!(
      pRight < rLeft ||
      pLeft > rRight ||
      pBottom < rTop ||
      pTop > rBottom
    )) {
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

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    if (gameState === "PLAYING") doJump();
    else if (gameState === "MENU") startGame();
  }
});

window.addEventListener("mousedown", () => {
  if (gameState === "PLAYING") doJump();
});

window.addEventListener("touchstart", (e) => {
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
