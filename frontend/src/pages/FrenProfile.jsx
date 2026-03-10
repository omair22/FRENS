import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { getFrenProfile, addFren, removeFren } from '../lib/api'
import Avatar from '../components/Avatar'
import { buildAvatarUrl } from '../lib/avatar'

const FrenProfile = () => {
    const { userId } = useParams()
    const navigate = useNavigate()
    const { user: currentUser, setToast } = useStore()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    // Redirect to own profile
    useEffect(() => {
        if (userId === currentUser?.id) {
            navigate('/profile', { replace: true })
            return
        }
        loadProfile()
    }, [userId])

    const loadProfile = async () => {
        try {
            const res = await getFrenProfile(userId)
            setProfile(res.data)
        } catch (err) {
            setToast({ message: 'Could not load profile', type: 'error' })
            navigate(-1)
        } finally {
            setLoading(false)
        }
    }

    const handleAddFren = async () => {
        setActionLoading(true)
        try {
            await addFren(userId)
            setProfile(prev => ({ ...prev, friendshipStatus: 'pending_sent' }))
            setToast({ message: 'Fren request sent 👋', type: 'success' })
        } catch {
            setToast({ message: 'Failed to send request', type: 'error' })
        } finally {
            setActionLoading(false)
        }
    }

    const handleRemoveFren = async () => {
        setActionLoading(true)
        try {
            await removeFren(userId)
            setProfile(prev => ({ ...prev, isFren: false, friendshipStatus: null }))
            setToast({ message: 'Removed from frens', type: 'info' })
        } catch {
            setToast({ message: 'Failed to remove', type: 'error' })
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center"
            style={{ background: '#0e0c14' }}>
            <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
        </div>
    )

    if (!profile) return null

    const { user, isFren, isMe, friendshipStatus, sharedStats } = profile

    const statusConfig = {
        free: { label: 'Free to hang', color: '#6bcb77', dot: '#6bcb77' },
        busy: { label: 'Busy', color: '#ff6b6b', dot: '#ff6b6b' },
        maybe: { label: 'Maybe free', color: '#ffd93d', dot: '#ffd93d' },
        ghost: { label: 'Ghosting', color: '#c77dff', dot: '#c77dff' },
        invisible: { label: 'Invisible', color: '#666', dot: '#444' },
        offline: { label: 'Offline', color: '#444', dot: '#333' },
    }

    const status = statusConfig[user.status] || statusConfig.offline

    const memberSince = new Date(user.created_at).toLocaleDateString('en-GB', {
        month: 'long', year: 'numeric'
    })

    const frensSince = sharedStats?.frensSince
        ? new Date(sharedStats.frensSince).toLocaleDateString('en-GB', {
            month: 'short', year: 'numeric'
        })
        : null

    return (
        <div className="min-h-screen pb-32" style={{ background: '#0e0c14' }}>

            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-14 pb-4 sticky top-0 z-10"
                style={{ background: '#0e0c14', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={() => navigate(-1)}
                    className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
                    ←
                </button>
                <h1 className="font-display font-black text-xl truncate">{user.name}</h1>
            </div>

            <div className="px-4 pt-6">

                {/* Avatar + name + status */}
                <div className="flex flex-col items-center gap-3 mb-6">
                    <div className="relative">
                        <Avatar
                            name={user.name}
                            config={user.avatar_config || {}}
                            size={96}
                        />
                        {/* Status dot */}
                        <div
                            className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-2"
                            style={{ background: status.dot, borderColor: '#0e0c14' }}
                        />
                    </div>

                    <div className="text-center">
                        <h2 className="font-display font-black text-3xl">{user.name}</h2>
                        <div className="flex items-center justify-center gap-1.5 mt-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: status.dot }} />
                            <span className="text-sm font-semibold" style={{ color: status.color }}>
                                {status.label}
                            </span>
                        </div>
                        <p className="text-xs text-white/25 mt-1">Member since {memberSince}</p>
                    </div>

                    {/* Fren action button */}
                    {!isMe && (
                        <div className="mt-1">
                            {!isFren && friendshipStatus === null && (
                                <button
                                    onClick={handleAddFren}
                                    disabled={actionLoading}
                                    className="px-6 py-2.5 rounded-2xl font-bold text-sm"
                                    style={{
                                        background: 'linear-gradient(135deg, #4d96ff, #6c63ff)',
                                        color: '#fff',
                                        boxShadow: '0 6px 20px rgba(77,150,255,0.3)'
                                    }}
                                >
                                    {actionLoading ? '...' : '👋 Add Fren'}
                                </button>
                            )}
                            {friendshipStatus === 'pending_sent' && (
                                <div className="px-5 py-2.5 rounded-2xl font-bold text-sm"
                                    style={{
                                        background: 'rgba(77,150,255,0.1)', color: '#4d96ff',
                                        border: '1px solid rgba(77,150,255,0.2)'
                                    }}>
                                    ⏳ Request sent
                                </div>
                            )}
                            {friendshipStatus === 'pending_received' && (
                                <button
                                    onClick={() => navigate('/frens')}
                                    className="px-5 py-2.5 rounded-2xl font-bold text-sm"
                                    style={{
                                        background: 'rgba(107,203,119,0.15)', color: '#6bcb77',
                                        border: '1px solid rgba(107,203,119,0.3)'
                                    }}>
                                    👋 Accept Request
                                </button>
                            )}
                            {isFren && (
                                <button
                                    onClick={handleRemoveFren}
                                    disabled={actionLoading}
                                    className="px-5 py-2.5 rounded-2xl font-bold text-xs"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'rgba(255,255,255,0.25)',
                                        border: '1px solid rgba(255,255,255,0.08)'
                                    }}>
                                    {actionLoading ? '...' : 'Remove fren'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Stats — only visible to frens */}
                {sharedStats && (
                    <>
                        {/* Their overall stats */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <StatCard
                                value={sharedStats.theirTotalHangouts}
                                label="Hangouts attended"
                                icon="🎉"
                                color="#ffd93d"
                            />
                            <StatCard
                                value={sharedStats.theirCreatedHangouts}
                                label="Plans created"
                                icon="📅"
                                color="#4d96ff"
                            />
                        </div>

                        {/* Together stats */}
                        {isFren && (
                            <div className="rounded-2xl p-4 mb-4"
                                style={{ background: '#16131f', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3">
                                    You & {user.name}
                                </h3>

                                <div className="flex items-center gap-4">
                                    {/* Overlap avatars */}
                                    <div className="flex -space-x-3 flex-shrink-0">
                                        <img
                                            src={buildAvatarUrl(currentUser.name, currentUser.avatar_config || {})}
                                            className="w-10 h-10 rounded-full"
                                            style={{ background: '#1d1928', border: '2px solid #0e0c14' }}
                                        />
                                        <img
                                            src={buildAvatarUrl(user.name, user.avatar_config || {})}
                                            className="w-10 h-10 rounded-full"
                                            style={{ background: '#1d1928', border: '2px solid #0e0c14' }}
                                        />
                                    </div>

                                    <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1">
                                        <div>
                                            <p className="text-2xl font-black" style={{ color: '#ff6b6b' }}>
                                                {sharedStats.hangoutsTogether}
                                            </p>
                                            <p className="text-[10px] text-white/30">hangouts together</p>
                                        </div>
                                        {frensSince && (
                                            <div>
                                                <p className="text-sm font-black text-white/70">{frensSince}</p>
                                                <p className="text-[10px] text-white/30">frens since</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent hangouts together */}
                        {sharedStats.recentTogether?.length > 0 && (
                            <div className="mb-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 px-1">
                                    Recent Together
                                </h3>
                                <div className="rounded-2xl overflow-hidden divide-y divide-white/5"
                                    style={{ background: '#16131f', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    {sharedStats.recentTogether.map(h => (
                                        <button
                                            key={h.id}
                                            onClick={() => navigate(`/hangout/${h.id}`)}
                                            className="w-full flex items-center gap-3 px-4 py-3 
                        hover:bg-white/5 active:bg-white/10 transition-colors text-left"
                                        >
                                            <span className="text-xl">{h.emoji}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">{h.title}</p>
                                                <p className="text-[11px] text-white/30 mt-0.5">
                                                    {h.datetime
                                                        ? new Date(h.datetime).toLocaleDateString('en-GB', {
                                                            day: 'numeric', month: 'short', year: 'numeric'
                                                        })
                                                        : 'TBD'}
                                                </p>
                                            </div>
                                            <span className="text-white/20 text-sm">›</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Not frens yet — show locked state */}
                {!isFren && !isMe && (
                    <div className="flex flex-col items-center py-8 gap-2 text-center">
                        <span className="text-4xl">🔒</span>
                        <p className="font-bold text-sm text-white/50">
                            Add {user.name} to see shared stats
                        </p>
                    </div>
                )}

            </div>
        </div>
    )
}

// Reusable stat card
const StatCard = ({ value, label, icon, color }) => (
    <div className="rounded-2xl p-4"
        style={{ background: '#16131f', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{icon}</span>
        </div>
        <p className="text-3xl font-black" style={{ color }}>{value}</p>
        <p className="text-[11px] text-white/30 mt-0.5">{label}</p>
    </div>
)

export default FrenProfile
