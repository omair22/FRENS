import React, { useState } from 'react'

import { useNavigate } from 'react-router-dom'

// You might need to adjust buildAvatarUrl based on how it's imported in other parts of the app.
// I will assume it's imported from your utils, or I'll provide a placeholder if it's missing.
const buildAvatarUrl = (name, config) => {
    if (config?.url) return config.url
    const seed = name || 'Fren'
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`
}

const SLIDER_LABELS = {
    0: { label: "I'm out", color: '#ff6b6b', emoji: '❌' },
    25: { label: 'Probably not', color: '#ff9f43', emoji: '😬' },
    50: { label: 'Maybe', color: '#ffd93d', emoji: '🤔' },
    75: { label: 'Likely yes', color: '#b8e994', emoji: '😊' },
    100: { label: 'Perfect!', color: '#6bcb77', emoji: '🙌' },
}

const getSliderConfig = (val) => {
    if (val === undefined) return { label: 'Not voted', color: '#ffffff', emoji: '?' }
    if (val < 50) return SLIDER_LABELS[0]
    return SLIDER_LABELS[100]
}

const TimeProposalCard = ({
    proposal,
    myVote,
    isCreatorOrHost,
    currentUserId,
    hangoutId,
    onVote,
    onAccept,
    onDelete
}) => {
    const [localVote, setLocalVote] = useState(myVote ?? 50)
    const [hasVoted, setHasVoted] = useState(myVote !== undefined)
    const navigate = useNavigate()
    const config = getSliderConfig(localVote)

    // Average interest across all votes
    const votes = proposal.votes || []
    const avgInterest = votes.length > 0
        ? Math.round(votes.reduce((s, v) => s + v.interest, 0) / votes.length)
        : null

    const avgConfig = avgInterest !== null ? getSliderConfig(avgInterest) : null

    const isMyProposal = proposal.created_by === currentUserId
    const canDelete = isCreatorOrHost || isMyProposal

    const formattedDate = proposal.proposed_datetime
        ? new Date(proposal.proposed_datetime).toLocaleDateString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short',
            hour: '2-digit', minute: '2-digit'
        })
        : 'TBD'

    return (
        <div className="rounded-2xl overflow-hidden"
            style={{ background: '#16131f', border: '1px solid rgba(255,255,255,0.07)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                <div>
                    <p className="text-sm font-black">{formattedDate}</p>
                    {proposal.label && (
                        <p className="text-[11px] text-white/40 mt-0.5">{proposal.label}</p>
                    )}
                    <p className="text-[10px] text-white/25 mt-0.5">
                        by {proposal.proposer?.name || 'someone'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Voter avatars */}
                    {votes.length > 0 && (
                        <div className="flex -space-x-2">
                            {votes.slice(0, 4).map(v => (
                                <div key={v.user_id}
                                    onClick={(e) => { e.stopPropagation(); navigate(`/profile/${v.user_id}`) }}
                                    className="w-6 h-6 rounded-full overflow-hidden cursor-pointer active:scale-95"
                                    style={{ border: '1.5px solid #0e0c14' }}>
                                    <img
                                        src={buildAvatarUrl(v.voter?.name, v.voter?.avatar_config || {})}
                                        alt={v.voter?.name}
                                        className="w-full h-full"
                                        style={{ background: '#1d1928' }}
                                    />
                                </div>
                            ))}
                            {votes.length > 4 && (
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black"
                                    style={{ background: '#2a2535', border: '1.5px solid #0e0c14', color: '#fff' }}>
                                    +{votes.length - 4}
                                </div>
                            )}
                        </div>
                    )}
                    {canDelete && (
                        <button onClick={onDelete}
                            className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-xs">
                            🗑️
                        </button>
                    )}
                </div>
            </div>

            {/* Group interest bar */}
            {votes.length > 0 && avgConfig && (
                <div className="px-4 pb-2">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${avgInterest}%`,
                                    background: avgConfig.color
                                }}
                            />
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: avgConfig.color }}>
                            {avgConfig.emoji} {votes.length} voted
                        </span>
                    </div>
                </div>
            )}

            {/* My vote buttons */}
            <div className="px-4 pb-4 pt-1">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-widest font-black text-white/30">
                        Can you make this time?
                    </span>
                    {hasVoted && (
                        <span className="text-xs font-bold transition-colors"
                            style={{ color: config.color }}>
                            {config.emoji} {config.label}
                        </span>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setLocalVote(100)
                            setHasVoted(true)
                            onVote(100)
                        }}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border ${localVote === 100 ? 'bg-primary-green/20 border-primary-green/50 text-primary-green' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                    >
                        🙌 Yes
                    </button>
                    <button
                        onClick={() => {
                            setLocalVote(0)
                            setHasVoted(true)
                            onVote(0)
                        }}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border ${localVote === 0 ? 'bg-primary-red/20 border-primary-red/50 text-primary-red' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                    >
                        ❌ No
                    </button>
                </div>
            </div>


            {/* Host accept button — only show if isCreatorOrHost */}
            {isCreatorOrHost && votes.length > 0 && (
                <button
                    onClick={onAccept}
                    className="w-full py-3 flex items-center justify-center gap-2 font-bold text-sm transition-all"
                    style={{
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        color: '#6bcb77',
                        background: 'rgba(107,203,119,0.05)'
                    }}
                >
                    Accept this time
                    {avgInterest !== null && (
                        <span className="text-[10px] opacity-60">
                            · avg {avgInterest}% interest
                        </span>
                    )}
                </button>
            )}
        </div>
    )
}

export default TimeProposalCard
