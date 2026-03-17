import React from 'react'

const BottomSheet = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full rounded-t-3xl p-6 pb-12 max-h-[90vh] overflow-y-auto"
        style={{
          background: '#111111',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center mb-6">
          <div className="w-12 h-1 rounded-full bg-white/10" />
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: '#f5f5f5', margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666666',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
        
        {children}
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default BottomSheet
