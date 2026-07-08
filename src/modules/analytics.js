// modules/analytics.js

export const createAnalytics = (redisClient) => {

    const trackEvent = async (userId, eventType, meta = {}) => {
        const now = Date.now();
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        try {
            // 1. Множество всех уникальных юзеров (для общего охвата)
            await redisClient.sAdd('users:all', String(userId));

            // 2. first_seen — пишем только если ещё нет (NX)
            await redisClient.set(`user:first_seen:${userId}`, now, { NX: true });

            // 3. last_active — для расчёта DAU/WAU/MAU через ZCOUNT по времени
            await redisClient.zAdd('users:last_active', [{ score: now, value: String(userId) }]);

            // 4. Активные пользователи за конкретный день (для дневной разбивки)
            await redisClient.sAdd(`users:active:${today}`, String(userId));
            await redisClient.expire(`users:active:${today}`, 60 * 60 * 24 * 90); // храним 90 дней

            // 5. Счётчик событий по типам (общий, для быстрой сводки)
            await redisClient.hIncrBy('events:count', eventType, 1);

            // 6. Сырой лог последних событий (для экспорта в n8n/Sheets), максимум 5000 записей
            await redisClient.lPush('events:log', JSON.stringify({ userId, eventType, meta, ts: now }));
            await redisClient.lTrim('events:log', 0, 4999);

        } catch (err) {
            console.error('Analytics tracking error:', err);
        }
    };

    const getStats = async () => {
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;

        const totalUsers = await redisClient.sCard('users:all');
        const dau = await redisClient.zCount('users:last_active', now - day, now);
        const wau = await redisClient.zCount('users:last_active', now - 7 * day, now);
        const mau = await redisClient.zCount('users:last_active', now - 30 * day, now);
        const eventCounts = await redisClient.hGetAll('events:count');

        return { totalUsers, dau, wau, mau, eventCounts };
    };

    return { trackEvent, getStats };
};