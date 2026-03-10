import React from 'react'

const BottomSheet = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-end"
    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    onClick={e => e.target === e.currentTarget && onClose()}
  >
    <div
      className="w-full rounded-t-3xl p-5 pb-10 max-h-[85vh] overflow-y-auto"
      style={{
        background: '#16131f',
        border: '1px solid rgba(255,255,255,0.08)',
        animation: 'slideUp 0.25s ease',
      }}
    >
      <div className="flex justify-center mb-4">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-black text-xl">{title}</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm hover:bg-white/20 transition-colors"
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

export default BottomSheet
