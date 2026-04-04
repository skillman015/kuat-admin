// 1. ПРОВЕРКА ДОСТУПА (срабатывает сразу при подключении файла)
(function checkAuth() {
    const token = localStorage.getItem('access_token');
    const path = window.location.pathname;
    const isLoginPage = path.includes('index.html') || path === '/' || path.endsWith('/');

    // Если токена нет и мы пытаемся зайти в админку
    if (!token && !isLoginPage) {
        window.location.href = 'index.html';
    }

    // Если токен есть и мы на странице входа — отправляем в админку
    if (token && isLoginPage) {
        window.location.href = 'main.html';
    }
})();

async function authorizedFetch(url, options = {}) {
    const token = localStorage.getItem('access_token');

    // 1. Формируем заголовки динамически
    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers // Позволяем переопределять заголовки снаружи
    };

    // 2. Умная проверка типа контента:
    // Если мы НЕ отправляем файл (FormData) и в опциях не указан другой Content-Type,
    // тогда ставим дефолтный application/json.
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    // ВАЖНО: Если отправляем FormData, мы НЕ должны ставить Content-Type вообще.
    // Браузер сделает это сам автоматически.

    const config = {
        ...options,
        headers: headers
    };

    try {
        const response = await fetch(url, config);

        // Обработка истекшей авторизации
        if (response.status === 401) {
            console.error("Авторизация истекла");
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');

            // Проверяем, не на странице ли логина мы уже, чтобы избежать цикла
            if (!window.location.pathname.includes('index.html')) {
                window.location.href = 'index.html';
            }
            return;
        }

        return response;
    } catch (error) {
        console.error("Ошибка сети или сервера:", error);
        throw error;
    }
}