import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { getCached, setCached, getDetailCached, setDetailCached } from '../lib/venueCache.js'

const router = express.Router()
const PLACES_KEY = process.env.GOOGLE_PLACES_KEY

/**
 * GET /api/venues/nearby
 * Query params: lat, lng, category (food|coffee|drinks|parks|all)
 * Returns up to 20 nearby places
 */
router.get('/nearby', authMiddleware, async (req, res) => {
    try {
        const { lat, lng, category = 'all' } = req.query
        if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' })

        // Check cache first — skip Google API call if hit
        const cached = getCached(lat, lng, category)
        if (cached) {
            return res.json({ venues: cached, cached: true })
        }

        const categoryMap = {
            food: 'restaurant',
            coffee: 'cafe',
            drinks: 'bar',
            parks: 'park',
            all: 'restaurant'
        }

        let venues = []

        if (category === 'all') {
            const types = ['restaurant', 'cafe', 'bar', 'park']

            const results = await Promise.all(
                types.map(type => fetchPlaces(lat, lng, type))
            )

            // Merge and deduplicate
            const seen = new Set()
            for (const batch of results) {
                for (const v of batch) {
                    if (!seen.has(v.id)) {
                        seen.add(v.id)
                        venues.push(v)
                    }
                }
            }

            // Sort by rating desc, take top 20
            venues = venues
                .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                .slice(0, 20)
        } else {
            const type = categoryMap[category] || 'restaurant'
            venues = await fetchPlaces(lat, lng, type)
        }

        // Store in cache
        setCached(lat, lng, category, venues)

        res.json({ venues, cached: false })
    } catch (err) {
        console.error('[VENUES]', err)
        res.status(500).json({ error: err.message })
    }
})

/**
 * GET /api/venues/:placeId
 * Full details for a single venue
 */
router.get('/:placeId', authMiddleware, async (req, res) => {
    try {
        // Check detail cache
        const cached = getDetailCached(req.params.placeId)
        if (cached) return res.json(cached)

        const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
        url.searchParams.set('place_id', req.params.placeId)
        url.searchParams.set('fields', 'name,formatted_address,formatted_phone_number,opening_hours,rating,user_ratings_total,price_level,website,geometry,photos,types')
        url.searchParams.set('key', PLACES_KEY)

        const response = await fetch(url.toString())
        const data = await response.json()

        if (data.status !== 'OK') {
            return res.status(404).json({ error: 'Venue not found' })
        }

        const p = data.result
        const shapedResult = {
            id: req.params.placeId,
            name: p.name,
            address: p.formatted_address,
            phone: p.formatted_phone_number || null,
            website: p.website || null,
            rating: p.rating || null,
            ratingCount: p.user_ratings_total || 0,
            priceLevel: p.price_level ?? null,
            isOpen: p.opening_hours?.open_now ?? null,
            hours: p.opening_hours?.weekday_text || [],
            lat: p.geometry.location.lat,
            lng: p.geometry.location.lng,
            photos: (p.photos || []).slice(0, 3).map(ph =>
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${ph.photo_reference}&key=${PLACES_KEY}`
            ),
            icon: getVenueEmoji(p.types || [])
        }

        // Cache the result before returning
        setDetailCached(req.params.placeId, shapedResult)
        res.json(shapedResult)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// Extracted fetch helper — one place type at a time
const fetchPlaces = async (lat, lng, type) => {
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
    url.searchParams.set('location', `${lat},${lng}`)
    url.searchParams.set('radius', '800')
    url.searchParams.set('type', type)
    url.searchParams.set('key', PLACES_KEY)
    url.searchParams.set('language', 'en')

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error(`[VENUES] Google error for ${type}:`, data.status, data.error_message)
        return []
    }

    return (data.results || []).slice(0, 10).map(place => ({
        id: place.place_id,
        name: place.name,
        category: place.types?.[0] || 'place',
        address: place.vicinity,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        rating: place.rating || null,
        ratingCount: place.user_ratings_total || 0,
        priceLevel: place.price_level ?? null,
        isOpen: place.opening_hours?.open_now ?? null,
        photo: place.photos?.[0]?.photo_reference
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${PLACES_KEY}`
            : null,
        icon: getVenueEmoji(place.types || [])
    }))
}

// Map Google place types to a single emoji
const getVenueEmoji = (types) => {
    if (types.includes('restaurant')) return '🍽️'
    if (types.includes('cafe')) return '☕'
    if (types.includes('bar')) return '🍺'
    if (types.includes('bakery')) return '🥐'
    if (types.includes('park')) return '🌳'
    if (types.includes('night_club')) return '🎵'
    if (types.includes('meal_takeaway')) return '🥡'
    if (types.includes('food')) return '🍴'
    return '📍'
}

router.get('/cache/stats', authMiddleware, async (req, res) => {
    const { getCacheStats } = await import('../lib/venueCache.js')
    res.json(getCacheStats())
})

export default router
