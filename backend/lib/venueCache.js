const cache = new Map()
const TTL_MS = 10 * 60 * 1000 // 10 minutes

/**
 * Round lat/lng to 2 decimal places (~1km grid)
 * Same area = same cache key
 */
const bucketKey = (lat, lng, category) => {
    const bLat = Math.round(parseFloat(lat) * 100) / 100
    const bLng = Math.round(parseFloat(lng) * 100) / 100
    return `${bLat},${bLng},${category}`
}

export const getCached = (lat, lng, category) => {
    const key = bucketKey(lat, lng, category)
    const entry = cache.get(key)
    if (entry) {
        if (Date.now() - entry.timestamp > TTL_MS) {
            cache.delete(key)
            return null
        }
        return entry.data
    }
}

export const setCached = (lat, lng, category, data) => {
    const key = bucketKey(lat, lng, category)
    cache.set(key, { timestamp: Date.now(), data })
    // Prevent memory leak — cap cache at 100 entries
    if (cache.size > 100) {
        const oldest = [...cache.entries()]
            .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
        cache.delete(oldest[0])
    }
}

export const getCacheStats = () => ({
    entries: cache.size,
    keys: [...cache.keys()]
})

// Detail cache
const detailCache = new Map()
const DETAIL_TTL_MS = 30 * 60 * 1000 // 30 min — details change rarely

export const getDetailCached = (placeId) => {
    const entry = detailCache.get(placeId)
    if (!entry) return null
    if (Date.now() - entry.timestamp > DETAIL_TTL_MS) {
        detailCache.delete(placeId)
        return null
    }
    return entry.data
}

export const setDetailCached = (placeId, data) => {
    detailCache.set(placeId, { timestamp: Date.now(), data })
    if (detailCache.size > 200) {
        const oldest = [...detailCache.entries()]
            .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
        detailCache.delete(oldest[0])
    }
}
