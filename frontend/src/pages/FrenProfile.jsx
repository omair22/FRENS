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
            style={{ background: '#0a0a0a' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#f5f5f5', animation: 'spin 1s linear infinite' }} />
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
        <div className="min-h-screen pb-32" style={{ background: '#0a0a0a' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '56px 20px 16px', sticky: 'top', background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.06)', zIndex: 10 }}>
                <button onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', color: '#666666', fontSize: 20, cursor: 'pointer' }}>
                    ‹
                </button>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#f5f5f5', margin: 0 }}>{user.name}</h1>
            </div>

            <div className="px-4 pt-6">

                {/* Avatar + name + status */}
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="relative">
                        <Avatar
                            name={user.name}
                            config={user.avatar_config || {}}
                            size={100}
                        />
                        <div
                            className="absolute bottom-1 right-1 w-6 h-6 rounded-full border-4"
                            style={{ background: status.dot, borderColor: '#0a0a0a' }}
                        />
                    </div>

                    <div className="text-center">
                        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, color: '#f5f5f5', margin: 0 }}>{user.name}</h2>
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: status.color, marginTop: 4, display: 'block' }}>
                            {status.label}
                        </span>
                        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#3a3a3a', marginTop: 4 }}>Member since {memberSince}</p>
                    </div>

                    {/* Fren action button */}
                    {!isMe && (
                        <div className="mt-2" style={{ width: '100%', maxWidth: 200 }}>
                            {!isFren && friendshipStatus === null && (
                                <button
                                    onClick={handleAddFren}
                                    disabled={actionLoading}
                                    className="btn-primary"
                                    style={{ width: '100%', height: 44 }}
                                >
                                    {actionLoading ? '...' : 'Add Fren'}
                                </button>
                            )}
                            {friendshipStatus === 'pending_sent' && (
                                <div style={{ 
                                    width: '100%', height: 44, borderRadius: 12, 
                                    background: '#1a1a1a', color: '#666666', border: '1px solid rgba(255,255,255,0.07)',
                                    display: 'flex', alignItems: 'center', justify: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600
                                }}>
                                    Request sent
                                </div>
                            )}
                            {friendshipStatus === 'pending_received' && (
                                <button
                                    onClick={() => navigate('/frens')}
                                    className="btn-primary"
                                    style={{ width: '100%', height: 44 }}
                                >
                                    Accept Request
                                </button>
                            )}
                            {isFren && (
                                <button
                                    onClick={handleRemoveFren}
                                    disabled={actionLoading}
                                    className="btn-secondary"
                                    style={{ width: '100%', height: 44 }}
                                >
                                    {actionLoading ? '...' : 'Remove Fren'}
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
                            <div className="card" style={{ padding: 20, marginBottom: 12 }}>
                                <h3 className="section-label" style={{ marginBottom: 16 }}>You & {user.name}</h3>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                    <div style={{ display: 'flex', marginLeft: 8 }}>
                                        <div style={{ zIndex: 2 }}>
                                            <Avatar name={currentUser.name} config={currentUser.avatar_config || {}} size={40} />
                                        </div>
                                        <div style={{ marginLeft: -12, zIndex: 1 }}>
                                            <Avatar name={user.name} config={user.avatar_config || {}} size={40} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                        <div>
                                            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700, color: '#ff4d4d', margin: 0 }}>
                                                {sharedStats.hangoutsTogether}
                                            </p>
                                            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#3a3a3a', textTransform: 'uppercase', marginTop: 2 }}>Hangouts</p>
                                        </div>
                                        {frensSince && (
                                            <div>
                                                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#f5f5f5', margin: 0 }}>{frensSince}</p>
                                                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#3a3a3a', textTransform: 'uppercase', marginTop: 2 }}>Since</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent hangouts together */}
                        {sharedStats.recentTogether?.length > 0 && (
                            <div className="mb-8">
                                <h3 className="section-label" style={{ marginBottom: 12, paddingLeft: 4 }}>Recent Together</h3>
                                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                    {sharedStats.recentTogether.map(h => (
                                        <button
                                            key={h.id}
                                            onClick={() => navigate(`/hangout/${h.id}`)}
                                            style={{
                                                width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                                                background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                cursor: 'pointer', textAlign: 'left'
                                            }}
                                        >
                                            <span style={{ fontSize: 24 }}>{h.emoji}</span>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#f5f5f5', margin: 0 }}>{h.title}</p>
                                                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#3a3a3a', marginTop: 2 }}>
                                                    {h.datetime ? new Date(h.datetime).toLocaleDateString('en-GB') : 'TBD'}
                                                </p>
                                            </div>
                                            <span style={{ color: '#1a1a1a' }}>›</span>
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
    <div className="card" style={{ padding: 20 }}>
        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color, margin: 0 }}>{value}</p>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#3a3a3a', textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.02em' }}>{label}</p>
    </div>
)

export default FrenProfile
