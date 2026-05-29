# Приложение доставки пиццы
Telegram Mini App для заказа пиццы.

## Локальные Telegram-уведомления о заказах

После успешной демо-оплаты frontend отправляет заказ на локальный сервер:

```bash
http://localhost:3001/order
```

Сервер отправляет сообщение администратору через Telegram Bot API.

### Настройка backend

1. Перейдите в папку backend:

```bash
cd backend
```

2. Установите зависимости:

```bash
npm install
```

3. Откройте `backend/.env` и замените значения:

```bash
BOT_TOKEN=telegram_bot_token
ADMIN_CHAT_ID=telegram_chat_id
PORT=3001
```

`BOT_TOKEN` можно получить у `@BotFather`.

`ADMIN_CHAT_ID` можно узнать через бота вроде `@userinfobot` или через `getUpdates` вашего бота после отправки ему сообщения.

4. Запустите локальный bot-server:

```bash
npm run dev
```

5. Проверьте, что сервер работает:

```bash
curl http://localhost:3001/health
```

### Как это работает

1. Пользователь оформляет заказ в Mini App.
2. Пользователь проходит демо-оплату.
3. Frontend отправляет `POST /order` на локальный сервер.
4. Node.js сервер форматирует заказ и отправляет Telegram-сообщение админу.

Это демо-логика без базы данных, backend API и реальной платежной системы.
