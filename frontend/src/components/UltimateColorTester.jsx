import React, { useState } from 'react';

const UltimateColorTester = () => {
  const [showTester, setShowTester] = useState(false);

  const applyTheme = (theme) => {
    const styleId = 'ultimate-theme';
    let styleEl = document.getElementById(styleId);

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      /* ========== HEADER BACKGROUNDS ========== */
      .bg-white, header, .bg-white.shadow-sm, .sticky.top-0.bg-white,
      [class*="bg-white"].shadow-sm, div.bg-white {
        background-color: ${theme.headerBg} !important;
      }
      
      /* Header border */
      .border-b, .border-gray-200, .shadow-sm {
        border-bottom-color: ${theme.border} !important;
      }
      
      /* ========== PRIMARY BUTTONS ========== */
      .bg-blue-600, .bg-blue-500, button.bg-blue-600, .bg-green-600, .bg-green-500,
      .bg-purple-600, .bg-purple-500, .btn-primary, [class*="bg-blue-600"],
      [class*="bg-green-600"], [class*="bg-purple-600"], .bg-primary-600 {
        background-color: ${theme.primary} !important;
      }
      
      .bg-blue-600:hover, .bg-blue-500:hover, .bg-green-600:hover, .bg-green-500:hover,
      .bg-purple-600:hover, .bg-purple-500:hover, .btn-primary:hover {
        background-color: ${theme.primaryDark} !important;
      }
      
      /* ========== SUCCESS/COMPLETE COLORS ========== */
      .text-green-500, .text-green-600, .text-green-700, .text-success-500,
      .checkmark, [class*="text-green-"], svg.text-green-500 {
        color: ${theme.success} !important;
      }
      
      /* ========== PROGRESS BARS ========== */
      .bg-blue-600.h-2, .bg-green-600.h-2, .progress-bar-fill,
      .bg-blue-600.rounded-full, div[class*="bg-blue-600"].h-2 {
        background-color: ${theme.success} !important;
      }
      
      /* ========== LINKS & SECONDARY BUTTONS ========== */
      .text-blue-500, .text-blue-600, .text-primary-500, .text-primary-600,
      a[class*="text-blue-"], button[class*="text-blue-"], .btn-outline {
        color: ${theme.secondary} !important;
      }
      
      .border-blue-500, .border-blue-600, .btn-outline {
        border-color: ${theme.secondary} !important;
      }
      
      /* ========== PAGE BACKGROUND ========== */
      body, .bg-gray-50, .min-h-screen.bg-gray-50, [class*="bg-gray-50"] {
        background-color: ${theme.background} !important;
      }
      
      /* ========== CARD BACKGROUNDS ========== */
      .card, [class*="rounded-xl"].bg-white, [class*="rounded-lg"].bg-white {
        background-color: ${theme.cardBg} !important;
      }
      
      /* ========== SIDEBAR HIGHLIGHT ========== */
      .bg-blue-50, .border-blue-300, .bg-blue-100 {
        background-color: ${theme.primary}15 !important;
        border-color: ${theme.primary}30 !important;
      }
      
      .text-blue-700, .text-primary-700 {
        color: ${theme.primary} !important;
      }
      
      /* ========== XP TEXT IN HEADER ========== */
      .text-green-600, .text-xl.font-bold.text-green-600 {
        color: ${theme.success} !important;
      }
      
      /* ========== DANGER/ERROR STATES ========== */
      .text-red-500, .text-red-600, .bg-red-500, .bg-red-600 {
        color: ${theme.danger} !important;
        background-color: ${theme.danger} !important;
      }
      
      /* ========== WARNING STATES ========== */
      .text-yellow-500, .text-yellow-600, .bg-yellow-500, .bg-yellow-600,
      .bg-yellow-50, .border-yellow-200 {
        color: ${theme.warning} !important;
        background-color: ${theme.warning}20 !important;
      }
      
      /* ========== DIFFICULTY BADGES ========== */
      .bg-green-100, .text-green-800 {
        background-color: ${theme.success}20 !important;
        color: ${theme.success} !important;
      }
      
      .bg-purple-100, .text-purple-800 {
        background-color: ${theme.secondary}20 !important;
        color: ${theme.secondary} !important;
      }
      
      /* ========== LOCK SCREEN ========== */
      .bg-red-100, .text-red-600 {
        background-color: ${theme.danger}20 !important;
        color: ${theme.danger} !important;
      }
      
      /* ========== INPUT FOCUS ========== */
      .focus\\:ring-blue-500:focus {
        --tw-ring-color: ${theme.primary} !important;
      }
      
      /* ========== TEXT COLORS ========== */
      .text-gray-900, .text-gray-800, h1, h2, h3, h4, .font-bold {
        color: ${theme.textDark} !important;
      }
      
      .text-gray-600, .text-gray-500, .text-gray-400, .text-sm.text-gray-500 {
        color: ${theme.textLight} !important;
      }
      
      /* ========== LOGOUT BUTTON ========== */
      .text-red-600.hover\\:bg-red-50 {
        color: ${theme.danger} !important;
      }
    `;
  };

  const presets = {
    blush: {
      primary: '#CE6A6C',
      primaryDark: '#BA5658',
      secondary: '#42899B',
      success: '#94C4C1',
      background: '#F9C7BE',
      headerBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      danger: '#FF4B4B',
      warning: '#FF9600',
      border: '#E5E7EB',
      textDark: '#28405C',
      textLight: '#64748B',
    },
    duolingo: {
      primary: '#58CC71',
      primaryDark: '#46B45A',
      secondary: '#1CB0F6',
      success: '#58CC71',
      background: '#F7F9FA',
      headerBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      danger: '#FF4B4B',
      warning: '#FF9600',
      border: '#E5E7EB',
      textDark: '#2C3E50',
      textLight: '#7F8C8D',
    },
    technicolor: {
      primary: '#FF00FF',      // Hot Pink
      primaryDark: '#E000E0',  // Darker Pink
      secondary: '#00FFFF',    // Cyan
      success: '#CCFF00',      // Neon Green/Yellow
      background: '#F5F5FF',   // Light lavender
      headerBg: '#191970',     // Midnight Blue
      cardBg: '#FFFFFF',       // White
      danger: '#FF4444',       // Red
      warning: '#FFAA00',      // Orange
      border: '#E0E0E0',       // Light gray
      textDark: '#191970',     // Midnight Blue
      textLight: '#666666',    // Gray
    },
    purple: {
      primary: '#7C3AED',
      primaryDark: '#6D28D9',
      secondary: '#EC4899',
      success: '#10B981',
      background: '#F1F5F9',
      headerBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      danger: '#EF4444',
      warning: '#F59E0B',
      border: '#E2E8F0',
      textDark: '#1E293B',
      textLight: '#64748B',
    },
    ocean: {
      primary: '#0EA5E9',
      primaryDark: '#0284C7',
      secondary: '#06B6D4',
      success: '#10B981',
      background: '#F0F9FF',
      headerBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      danger: '#EF4444',
      warning: '#F59E0B',
      border: '#E2E8F0',
      textDark: '#0F172A',
      textLight: '#475569',
    },
    sunset: {
      primary: '#F97316',
      primaryDark: '#EA580C',
      secondary: '#8B5CF6',
      success: '#22C55E',
      background: '#FFF7ED',
      headerBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      danger: '#EF4444',
      warning: '#F59E0B',
      border: '#E5E7EB',
      textDark: '#431407',
      textLight: '#9A3412',
    },
  };

  const loadPreset = (presetName) => {
    applyTheme(presets[presetName]);

    const toast = document.createElement('div');
    toast.textContent = `✨ Theme changed to ${presetName.toUpperCase()}! ✨`;
    toast.style.cssText = `
      position: fixed; 
      bottom: 100px; 
      right: 20px; 
      background: ${presets[presetName].primary}; 
      color: white; 
      padding: 10px 20px; 
      border-radius: 12px; 
      z-index: 10000; 
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  if (!showTester) {
    return (
      <button
        onClick={() => setShowTester(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#28405C',
          color: 'white',
          padding: '12px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '20px',
        }}
      >
        🎨
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      padding: '16px',
      zIndex: 9999,
      width: '280px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontWeight: 'bold', color: '#28405C', margin: 0 }}>🎨 Color Tester</h3>
        <button onClick={() => setShowTester(false)} style={{ color: '#9CA3AF', fontSize: '20px', cursor: 'pointer' }}>×</button>
      </div>

      <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>Click any preset:</p>

      <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => loadPreset('blush')} style={{ padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: '#CE6A6C', color: 'white', cursor: 'pointer' }}>
          🌸 Blush (Your Palette)
        </button>
        <button onClick={() => loadPreset('duolingo')} style={{ padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: '#58CC71', color: 'white', cursor: 'pointer' }}>
          🦜 Duolingo Green
        </button>
        <button onClick={() => loadPreset('technicolor')} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #FF00FF, #00FFFF)', color: '#191970', fontWeight: 'bold', cursor: 'pointer' }}>
          🌈 Technicolor
        </button>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
        <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Preview:</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#CE6A6C', color: 'white', fontSize: '12px' }}>Button</button>
          <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
            <div style={{ width: '60%', height: '8px', backgroundColor: '#94C4C1', borderRadius: '4px' }}></div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
        💡 Click any preset to change colors instantly!
      </p>
    </div>
  );
};

export default UltimateColorTester;