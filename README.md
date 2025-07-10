# ⚔️ Pixel Battle

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3.2-green.svg)](https://flask.palletsprojects.com/)
[![Canvas](https://img.shields.io/badge/Canvas-HTML5-yellow.svg)](https://developer.mozilla.org/docs/Web/API/Canvas_API)

*Pixel Battle* — это браузерная мультиплеерная игра, в которой участники красят пиксели на общем холсте. Игра поддерживает масштабирование (zoom), панорамирование и работает быстро даже на гигантских размерах полотна.

---

## 📌 Основные возможности

- **Flask API**  
  - `GET /canvas` — получить текущее состояние полотна  
  - `POST /paint` — закрасить пиксель (с учетом кулдауна)  
  - `GET /remaining` — узнать оставшийся кулдаун
- **HTML5 Canvas**  
  - Плавный зум колесом мыши в точке курсора  
  - Панорамирование перетаскиванием (drag) мышью или касанием  
  - Отрисовка только видимой области для производительности
- **Кулдаун-таймер**  
  - Прогресс-бар и текстовый индикатор «Go!»  
- **Современный UI**  
  - Стиль через Tailwind CSS  
  - Иконки Feather Icons
- **Легкая настройка**  
  - Нет сложных зависимостей — достаточно виртуального окружения и Flask

---

## ⚙️ Установка и запуск

```bash
git clone https://github.com/KostenkoV-V/Pixel_Battle_Lite.git
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Откройте в браузере: `http://127.0.0.1:5000/`

---

## 📋 Дорожная карта

- [x] Базовый Flask-сервер и хранение полотна в памяти  
- [x] Маршруты `/canvas`, `/paint`, `/remaining`  
- [x] Механика задержки и хранение времени в сессии  
- [x] Перевод DOM-сетки в HTML5 Canvas  
- [x] Zoom & Pan canvas  
- [x] Отрисовка только видимой области  
- [х] UI: Tailwind CSS + Feather Icons
- [х] OAuth-вход через GitHub (Flask-Dance)
- [ ] Хранение состояния (БД/Redis)
- [ ] Кабинет администратора
- [ ] Аутентификация и модерация    
- [ ] Встроенный чат для игроков  
- [ ] Мобильная адаптация (жесты)  
- [ ] Лидеры и статистика игроков  


