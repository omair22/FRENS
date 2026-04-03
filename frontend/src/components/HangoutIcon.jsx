import React from 'react'

const HangoutIcon = ({ emoji, size = 64, className = '' }) => {
  const iconStyle = {
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  // Base colors
  const primary = '#ff4d4d' // Red
  const secondary = '#0a0a0a' // Black

  // SVGs with animations
  const icons = {
    '🍕': (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes pizza-bite {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1) rotate(5deg); }
          }
          .pizza-path { animation: pizza-bite 2s ease-in-out infinite; transform-origin: center; }
        `}</style>
        <path className="pizza-path" d="M12 2L4.5 20.5C4.5 20.5 8 22 12 22C16 22 19.5 20.5 19.5 20.5L12 2Z" fill={primary} />
        <circle cx="12" cy="12" r="1.5" fill={secondary} opacity="0.3" />
        <circle cx="9" cy="16" r="1" fill={secondary} opacity="0.3" />
        <circle cx="15" cy="16" r="1" fill={secondary} opacity="0.3" />
      </svg>
    ),
    '☕': (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes steam {
            0% { transform: translateY(2px) scale(0.8); opacity: 0; }
            50% { transform: translateY(-2px) scale(1.1); opacity: 0.8; }
            100% { transform: translateY(-6px) scale(0.6); opacity: 0; }
          }
          @keyframes cup-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(1px); }
          }
          .steam-line { animation: steam 1.8s infinite linear; }
          .steam-line:nth-child(2) { animation-delay: 0.6s; }
          .steam-line:nth-child(3) { animation-delay: 1.2s; }
          .cup { animation: cup-bob 1.5s infinite ease-in-out; }
        `}</style>
        <g className="cup">
          <path d="M18 10H6C4.89543 10 4 10.8954 4 12V17C4 19.2091 5.79086 21 8 21H16C18.2091 21 20 19.2091 20 17V15M18 10V8C18 6.89543 18.8954 6 20 6H21" stroke={primary} strokeWidth="2" strokeLinecap="round" />
        </g>
        <path className="steam-line" d="M8 7V5" stroke={primary} strokeWidth="1" strokeLinecap="round" />
        <path className="steam-line" d="M12 7V4" stroke={primary} strokeWidth="1.2" strokeLinecap="round" />
        <path className="steam-line" d="M16 7V5" stroke={primary} strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    '🍻': (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes clash-left {
            0%, 30%, 100% { transform: rotate(0deg) translateX(0px); }
            45%, 55% { transform: rotate(-30deg) translateX(3px); }
            65% { transform: rotate(-5deg) translateX(1px); }
            75% { transform: rotate(-30deg) translateX(3px); }
          }
          @keyframes clash-right {
            0%, 30%, 100% { transform: rotate(0deg) translateX(0px); }
            45%, 55% { transform: rotate(30deg) translateX(-3px); }
            65% { transform: rotate(5deg) translateX(-1px); }
            75% { transform: rotate(30deg) translateX(-3px); }
          }
          @keyframes foam {
            0%, 40% { opacity: 0; transform: translateY(0); }
            50% { opacity: 1; transform: translateY(-2px); }
            80% { opacity: 0; transform: translateY(-5px); }
            100% { opacity: 0; }
          }
          .mug-left  { animation: clash-left  2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite; transform-origin: 10px 20px; }
          .mug-right { animation: clash-right 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite; transform-origin: 14px 20px; }
          .foam { animation: foam 2s infinite; }
        `}</style>
        {/* Left mug — thick body */}
        <g className="mug-left">
          <rect x="3" y="8" width="8" height="12" rx="1.5" fill={primary} />
          <rect x="11" y="10" width="3" height="7" rx="1.5" fill={primary} />
          <rect x="3" y="8" width="8" height="3" rx="1" fill="#ff7070" />
        </g>
        {/* Right mug — thick body */}
        <g className="mug-right">
          <rect x="13" y="8" width="8" height="12" rx="1.5" fill={primary} />
          <rect x="10" y="10" width="3" height="7" rx="1.5" fill={primary} />
          <rect x="13" y="8" width="8" height="3" rx="1" fill="#ff7070" />
        </g>
        {/* Foam splashes on clash */}
        <circle className="foam" cx="12" cy="7" r="1.5" fill="#ff7070" />
        <circle className="foam" cx="9"  cy="5" r="1"   fill="#ff7070" style={{animationDelay:'0.1s'}} />
        <circle className="foam" cx="15" cy="5" r="1"   fill="#ff7070" style={{animationDelay:'0.15s'}} />
      </svg>
    ),

    '🎮': (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes jstick-l {
            0%, 100% { transform: translate(0,0); }
            25%  { transform: translate(1.5px,0); }
            50%  { transform: translate(0,1.5px); }
            75%  { transform: translate(-1.5px,0); }
          }
          @keyframes jstick-r {
            0%, 100% { transform: translate(0,0); }
            25%  { transform: translate(-1.5px,1px); }
            50%  { transform: translate(1.5px,1px); }
            75%  { transform: translate(1.5px,-1px); }
          }
          .jstick-l { animation: jstick-l 0.9s linear infinite; }
          .jstick-r { animation: jstick-r 0.75s linear infinite; }
        `}</style>

        {/* ── Left controller ── */}
        {/* Body */}
        <rect x="0.5" y="10" width="9.5" height="6.5" rx="2.5" fill={primary} />
        {/* Shoulder bumper */}
        <rect x="2" y="8" width="5.5" height="2.5" rx="1.5" fill={primary} />
        {/* Left joystick */}
        <circle className="jstick-l" cx="3.2" cy="13" r="1.6" fill={secondary} />
        {/* D-pad */}
        <rect x="6.8"  y="12.4" width="2.2" height="0.8" rx="0.3" fill={secondary} />
        <rect x="7.5" y="11.7" width="0.8" height="2.2" rx="0.3" fill={secondary} />

        {/* ── Right controller ── */}
        {/* Body */}
        <rect x="14" y="10" width="9.5" height="6.5" rx="2.5" fill={primary} />
        {/* Shoulder bumper */}
        <rect x="16.5" y="8" width="5.5" height="2.5" rx="1.5" fill={primary} />
        {/* Right joystick */}
        <circle className="jstick-r" cx="20.8" cy="13" r="1.6" fill={secondary} />
        {/* Action buttons — diamond ABXY */}
        <circle cx="15.8" cy="12" r="0.85" fill={secondary} />
        <circle cx="17.3" cy="13.2" r="0.85" fill={secondary} />
        <circle cx="15.8" cy="14.4" r="0.85" fill={secondary} />
        <circle cx="14.3" cy="13.2" r="0.85" fill={secondary} />

      </svg>
    ),

    '🚶': (
      // Two figures: man (left, cx=7) + woman (right, cx=17)
      // Using <animateTransform> so rotation is reliable around the joint origin (0,0)
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">

        {/* ══ MAN (cx ≈ 7) ══ */}
        {/* Head */}
        <circle cx="7" cy="3.5" r="2" fill={primary} />
        {/* Torso */}
        <line x1="7" y1="5.5" x2="7" y2="13" stroke={primary} strokeWidth="2.2" strokeLinecap="round" />
        {/* Left arm — swings forward with right leg */}
        <g transform="translate(7,8)">
          <line x1="0" y1="0" x2="-3" y2="4" stroke={primary} strokeWidth="1.8" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate"
              values="22 0 0;-22 0 0;22 0 0" dur="0.7s" repeatCount="indefinite"/>
          </line>
        </g>
        {/* Right arm — opposite */}
        <g transform="translate(7,8)">
          <line x1="0" y1="0" x2="3" y2="4" stroke={primary} strokeWidth="1.8" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate"
              values="-22 0 0;22 0 0;-22 0 0" dur="0.7s" repeatCount="indefinite"/>
          </line>
        </g>
        {/* Left leg */}
        <g transform="translate(7,13)">
          <line x1="0" y1="0" x2="-2" y2="7" stroke={primary} strokeWidth="2.2" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate"
              values="-28 0 0;28 0 0;-28 0 0" dur="0.7s" repeatCount="indefinite"/>
          </line>
        </g>
        {/* Right leg — opposite phase */}
        <g transform="translate(7,13)">
          <line x1="0" y1="0" x2="2" y2="7" stroke={primary} strokeWidth="2.2" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate"
              values="28 0 0;-28 0 0;28 0 0" dur="0.7s" repeatCount="indefinite"/>
          </line>
        </g>

        {/* ══ WOMAN (cx ≈ 17) ══ */}
        {/* Head */}
        <circle cx="17" cy="3.5" r="2" fill={primary} />
        {/* Hair — arc above head to suggest longer hair */}
        <path d="M15.2 3 Q17 1 18.8 3" stroke={primary} strokeWidth="1.3"
              strokeLinecap="round" fill="none"/>
        {/* Torso — shorter, leads into skirt */}
        <line x1="17" y1="5.5" x2="17" y2="11" stroke={primary} strokeWidth="2.2" strokeLinecap="round" />
        {/* Skirt — trapezoid wider at bottom */}
        <path d="M15.3 11 L13.5 16 L20.5 16 L18.7 11 Z" fill={primary} />
        {/* Left arm */}
        <g transform="translate(17,8)">
          <line x1="0" y1="0" x2="-3" y2="4" stroke={primary} strokeWidth="1.8" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate"
              values="22 0 0;-22 0 0;22 0 0" dur="0.7s" repeatCount="indefinite"/>
          </line>
        </g>
        {/* Right arm */}
        <g transform="translate(17,8)">
          <line x1="0" y1="0" x2="3" y2="4" stroke={primary} strokeWidth="1.8" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate"
              values="-22 0 0;22 0 0;-22 0 0" dur="0.7s" repeatCount="indefinite"/>
          </line>
        </g>
        {/* Woman legs emerge from skirt hem — smaller swing range */}
        <g transform="translate(15.5,16)">
          <line x1="0" y1="0" x2="-1.5" y2="6" stroke={primary} strokeWidth="2" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate"
              values="-18 0 0;18 0 0;-18 0 0" dur="0.7s" repeatCount="indefinite"/>
          </line>
        </g>
        <g transform="translate(18.5,16)">
          <line x1="0" y1="0" x2="1.5" y2="6" stroke={primary} strokeWidth="2" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate"
              values="18 0 0;-18 0 0;18 0 0" dur="0.7s" repeatCount="indefinite"/>
          </line>
        </g>
      </svg>
    ),



    '🎬': (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes clap {
            0%, 100% { transform: rotate(0); }
            50% { transform: rotate(-30deg); }
          }
          .clapper-top { animation: clap 1s ease-in-out infinite; transform-origin: bottom left; }
        `}</style>
        <rect x="3" y="11" width="18" height="10" rx="1" fill={primary} />
        <g className="clapper-top">
          <rect x="3" y="4" width="18" height="6" rx="1" fill={primary} />
          <path d="M6 4L9 10M11 4L14 10M16 4L19 10" stroke={secondary} strokeWidth="1.5" />
        </g>
      </svg>
    ),
    '📚': (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes page-turn {
            0%, 40%, 100% { transform: rotateY(0deg); }
            60%, 80%       { transform: rotateY(-40deg); }
          }
          .pg { animation: page-turn 2.5s ease-in-out infinite; transform-origin: left center; transform-style: preserve-3d; }
        `}</style>

        {/* Left page */}
        <rect x="2" y="4" width="9" height="16" rx="1" fill={primary} />
        {/* Text lines on left page */}
        <line x1="4" y1="8"  x2="9"  y2="8"  stroke={secondary} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="4" y1="11" x2="9"  y2="11" stroke={secondary} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="4" y1="14" x2="7.5" y2="14" stroke={secondary} strokeWidth="1" strokeLinecap="round" opacity="0.5" />

        {/* Spine */}
        <rect x="11" y="4" width="2" height="16" rx="1" fill="#cc2200" />

        {/* Right page — turns/flips */}
        <g className="pg">
          <rect x="13" y="4" width="9" height="16" rx="1" fill={primary} />
          {/* Text lines on right page */}
          <line x1="15" y1="8"  x2="20" y2="8"  stroke={secondary} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <line x1="15" y1="11" x2="20" y2="11" stroke={secondary} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <line x1="15" y1="14" x2="18" y2="14" stroke={secondary} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        </g>
      </svg>
    ),

    '💪': (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Bicep curl: forearm+dumbbell rotates around elbow joint at (16,17) */}

        {/* Upper arm — static, goes from shoulder down to elbow */}
        <line x1="18" y1="8" x2="16" y2="17" stroke={primary} strokeWidth="4" strokeLinecap="round" />
        {/* Shoulder cap */}
        <circle cx="18" cy="8" r="2.5" fill={primary} />

        {/* Bicep bulge in the middle — pulses on curl */}
        <ellipse cx="18" cy="13" rx="3.5" ry="2" fill={primary}>
          <animate attributeName="rx" values="3.5;4.5;3.5" dur="1.4s"
            calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" repeatCount="indefinite" />
        </ellipse>

        {/* Forearm + dumbbell — rotates around elbow */}
        <g>
          <line x1="16" y1="17" x2="6" y2="17" stroke={primary} strokeWidth="3.5" strokeLinecap="round" />
          {/* Dumbbell left plate */}
          <rect x="2" y="13" width="4" height="8" rx="2" fill={primary} />
          {/* Bar connector */}
          <rect x="5.5" y="16" width="1.5" height="2" rx="0.5" fill="#cc2200" />
          <animateTransform attributeName="transform" type="rotate"
            values="35 16 17; -20 16 17; 35 16 17"
            dur="1.4s" calcMode="spline"
            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
            repeatCount="indefinite" />
        </g>
      </svg>
    ),



    '✨': (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          @keyframes twinkle {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
          }
          .star { animation: twinkle 1s infinite alternate; transform-origin: center; }
          .star:nth-child(2) { animation-delay: 0.3s; }
          .star:nth-child(3) { animation-delay: 0.6s; }
        `}</style>
        <path className="star" d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill={primary} />
        <path className="star" d="M6 16L7 19L10 20L7 21L6 24L5 21L2 20L5 19L6 16Z" fill={primary} size={8} />
        <path className="star" d="M18 4L19 7L22 8L19 9L18 12L17 9L14 8L17 7L18 4Z" fill={primary} />
      </svg>
    )
  }

  return (
    <div className={className} style={iconStyle}>
      {icons[emoji] || icons['✨']}
    </div>
  )
}

export default HangoutIcon
