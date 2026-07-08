// modules/userDataStore.js

/**
 * Persistent (non-session) storage for the latest user-entered calculator data —
 * enabling a "recalculate using your data" option without requiring
 * the user to re-enter everything.
 *
 * @param {import('redis').RedisClientType} redisClient
 */
export const createUserDataStore = (redisClient) => {

    const PULSE_KEY = (userId) => `user:last_pulse:${userId}`;
    const TDEE_KEY = (userId) => `user:last_tdee:${userId}`;
    const TTL_SECONDS = 60 * 60 * 24 * 180; // храним полгода

    const savePulseData = async (userId, data) => {
        try {
            await redisClient.set(PULSE_KEY(userId), JSON.stringify(data), { EX: TTL_SECONDS });
        } catch (err) {
            console.error('userDataStore.savePulseData error:', err);
        }
    };

    const getPulseData = async (userId) => {
        try {
            const raw = await redisClient.get(PULSE_KEY(userId));
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            console.error('userDataStore.getPulseData error:', err);
            return null;
        }
    };

    const saveTdeeData = async (userId, data) => {
        try {
            await redisClient.set(TDEE_KEY(userId), JSON.stringify(data), { EX: TTL_SECONDS });
        } catch (err) {
            console.error('userDataStore.saveTdeeData error:', err);
        }
    };

    const getTdeeData = async (userId) => {
        try {
            const raw = await redisClient.get(TDEE_KEY(userId));
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            console.error('userDataStore.getTdeeData error:', err);
            return null;
        }
    };

    return { savePulseData, getPulseData, saveTdeeData, getTdeeData };
};