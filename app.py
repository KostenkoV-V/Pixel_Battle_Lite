import os
from time import time
from threading import Lock

from flask import (
    Flask, render_template, request,
    jsonify, session, redirect, url_for
)
from flask_dance.contrib.github import make_github_blueprint, github

from dotenv import load_dotenv
load_dotenv() 

# ——— Конфигурация ——————————————————————————————————————
WIDTH = 100
HEIGHT = 100
COOLDOWN = 60  # секунд между ходами одного пользователя

# Инициализация холста (двумерный массив HEX‑цветов)
def init_canvas(width, height, default_color="#ffffff"):
    return [[default_color for _ in range(width)] for _ in range(height)]


# ——— Приложение —————————————————————————————————————————
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", os.urandom(24))

# GitHub OAuth
github_bp = make_github_blueprint(
    client_id=os.environ.get("GITHUB_OAUTH_CLIENT_ID"),
    client_secret=os.environ.get("GITHUB_OAUTH_CLIENT_SECRET"),
    scope="read:user",
)
app.register_blueprint(github_bp, url_prefix="/login")

canvas = init_canvas(WIDTH, HEIGHT)
lock = Lock()


# ——— Роуты ——————————————————————————————————————————————

@app.route("/")
def index():
    """Главная страница: подставляем параметры в шаблон."""
    user = None
    if github.authorized:
        resp = github.get("/user")
        if resp.ok:
            user = resp.json().get("login")
    return render_template(
        "index.html",
        width=WIDTH,
        height=HEIGHT,
        cooldown=COOLDOWN,
        user=user
    )


@app.route("/logout")
def logout():
    """Выход: стираем OAuth‑токен и возвращаемся на главную."""
    if github_bp.token:
        del github_bp.token
    return redirect(url_for("index"))


@app.route("/canvas")
def get_canvas():
    """Возвращает полный массив пикселей."""
    return jsonify(canvas)


@app.route("/remaining")
def remaining():
    """Сколько секунд осталось до следующего хода."""
    if not github.authorized:
        return jsonify({"remaining": 0})
    last = session.get("last_paint", 0)
    rem = max(0, COOLDOWN - (time() - last))
    return jsonify({"remaining": int(rem)})


@app.route("/paint", methods=["POST"])
def paint():
    """Закрасить пиксель"""
    if not github.authorized:
        return jsonify({"error": "Login required"}), 401

    payload = request.get_json()
    x, y = payload.get("x"), payload.get("y")
    color = payload.get("color", "#000000")

    now = time()
    last = session.get("last_paint", 0)
    if now - last < COOLDOWN:
        remaining = int(COOLDOWN - (now - last))
        return jsonify({"error": "Cooldown active", "remaining": remaining}), 429

    # Проверяем границы
    if not (0 <= x < WIDTH and 0 <= y < HEIGHT):
        return jsonify({"error": "Out of bounds"}), 400

    # Собственно изменение холста
    with lock:
        canvas[y][x] = color

    # Сохраняем время хода
    session["last_paint"] = now
    return jsonify({"success": True, "remaining": COOLDOWN})


# ——— Запуск ——————————————————————————————————————————————

# Режим debug управляется через FLASK_ENV=development
debug_mode = os.environ.get("FLASK_ENV") == "development"
app.run(host="0.0.0.0", debug=debug_mode)
