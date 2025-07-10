// Элементы DOM
const canvas = document.querySelector('#pixelCanvas');
const ctx = canvas.getContext('2d');
const viewport = document.querySelector('#viewport');
const colorInput = document.querySelector('#colorPicker');
const timerLabel = document.querySelector('#timer');
const timerProgress = document.querySelector('#timer-bar');
const refreshButton = document.querySelector('#refreshCanvas');

// Константы и состояние
const CELL_SIZE = 10;           // размер ячейки в пикселях при scale = 1
const MAX_COOLDOWN = 5;         // максимальный таймаут между кликами (сек)
let cooldown = 0;               // оставшееся время ожидания
let scale = 1;                  // текущий масштаб
let offsetX = 0;                // смещение по X для панорамирования
let offsetY = 0;                // смещение по Y для панорамирования
let isPanning = false;          // флаг панорамирования
let panStart = { x: 0, y: 0 };  // начальная точка пан
let canvasState = [];           // массив цветов пикселей

// Утилита: ограничение значения в диапазоне
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Изменяем размер canvas под размеры viewport
function adjustCanvasSize() {
  canvas.width = viewport.clientWidth;
  canvas.height = viewport.clientHeight;
  render();
}
window.addEventListener('resize', adjustCanvasSize);

// Получаем текущее состояние пиксельного холста с сервера
async function loadCanvasState() {
  try {
    const response = await fetch('/canvas');
    canvasState = await response.json();
    render();
  } catch (err) {
    console.error('Ошибка при загрузке данных:', err);
  }
}

// Рисуем холст: сетку + цветные пиксели
function render() {
  if (!canvasState.length) return;

  const rows = canvasState.length;
  const cols = canvasState[0].length;
  const fullWidth = cols * CELL_SIZE;
  const fullHeight = rows * CELL_SIZE;
  const viewW = canvas.width / scale;
  const viewH = canvas.height / scale;

  // Ограничиваем пан
  offsetX = clamp(offsetX, 0, fullWidth - viewW);
  offsetY = clamp(offsetY, 0, fullHeight - viewH);

  // Сброс трансформации и фон
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#374151';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Задаем масштаб и смещение
  ctx.setTransform(scale, 0, 0, scale, -offsetX * scale, -offsetY * scale);

  drawGrid(cols, rows, fullWidth, fullHeight);
  drawPixels(cols, rows);
}

// Рисуем сетку
function drawGrid(cols, rows, width, height) {
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  for (let x = 0; x <= cols; x++) {
    ctx.moveTo(x * CELL_SIZE, 0);
    ctx.lineTo(x * CELL_SIZE, height);
  }
  for (let y = 0; y <= rows; y++) {
    ctx.moveTo(0, y * CELL_SIZE);
    ctx.lineTo(width, y * CELL_SIZE);
  }
  ctx.stroke();
}

// Выводим пиксели из состояния
function drawPixels(cols, rows) {
  const startCol = Math.floor(offsetX / CELL_SIZE);
  const startRow = Math.floor(offsetY / CELL_SIZE);
  const endCol = Math.min(cols, Math.ceil((offsetX + canvas.width / scale) / CELL_SIZE));
  const endRow = Math.min(rows, Math.ceil((offsetY + canvas.height / scale) / CELL_SIZE));

  for (let y = startRow; y < endRow; y++) {
    for (let x = startCol; x < endCol; x++) {
      ctx.fillStyle = canvasState[y][x];
      ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
}

// Панорамирование мышью
viewport.addEventListener('mousedown', (e) => {
  isPanning = true;
  panStart = { x: e.clientX, y: e.clientY };
});
window.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  offsetX -= (e.clientX - panStart.x) / scale;
  offsetY -= (e.clientY - panStart.y) / scale;
  panStart = { x: e.clientX, y: e.clientY };
  render();
});
window.addEventListener('mouseup', () => {
  isPanning = false;
});

// Зум колесом мыши
viewport.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  const rect = canvas.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left) / scale + offsetX;
  const mouseY = (e.clientY - rect.top) / scale + offsetY;

  scale *= zoomFactor;
  offsetX = mouseX - (e.clientX - rect.left) / scale;
  offsetY = mouseY - (e.clientY - rect.top) / scale;

  render();
});

// Клик для раскраски пикселя
viewport.addEventListener('click', async (e) => {
  if (cooldown > 0) return;

  const rect = canvas.getBoundingClientRect();
  const xCanvas = (e.clientX - rect.left) / scale + offsetX;
  const yCanvas = (e.clientY - rect.top) / scale + offsetY;
  const px = Math.floor(xCanvas / CELL_SIZE);
  const py = Math.floor(yCanvas / CELL_SIZE);

  try {
    const response = await fetch('/paint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x: px, y: py, color: colorInput.value })
    });
    const result = await response.json();

    if (response.status === 429) {
      cooldown = result.remaining;
    } else if (result.success) {
      cooldown = result.remaining;
      await loadCanvasState();
    }
  } catch (err) {
    console.error('Не удалось отправить запрос:', err);
  }
});

// Обновление таймера и индикатора прогресса
async function fetchCooldown() {
  try {
    const res = await fetch('/remaining');
    const data = await res.json();
    cooldown = data.remaining;
  } catch (err) {
    console.error('Ошибка при получении таймера:', err);
  }
}

function updateTimerDisplay() {
  if (cooldown > 0) {
    timerLabel.textContent = `${cooldown}s`;
    const percent = ((MAX_COOLDOWN - cooldown) / MAX_COOLDOWN) * 100;
    timerProgress.style.width = `${percent}%`;
    cooldown--;
  } else {
    timerLabel.textContent = 'Go!';
    timerProgress.style.width = '100%';
  }
}

// Инициализация приложения
(async function init() {
  adjustCanvasSize();
  await loadCanvasState();
  await fetchCooldown();

  setInterval(fetchCooldown, 5000);
  setInterval(updateTimerDisplay, 1000);
  refreshButton.addEventListener('click', loadCanvasState);
})();
