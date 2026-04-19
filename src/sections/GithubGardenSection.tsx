import { useState } from 'react';
import GithubGardenCanvas from '../components/GithubGardenCanvas';

export default function GithubGardenSection() {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [stats, setStats] = useState({
    total: 0,
    maxDay: 0,
    activeDays: 0,
    streak: 0,
  });

  return (
    <section 
      id="garden" 
      style={{ 
        width: '100%',
        minHeight: '100vh', 
        borderTop: '1px solid rgba(201, 162, 39, 0.1)',
        paddingBottom: '80px',
        paddingTop: '80px',
        position: 'relative',
        zIndex: 1 
      }}
    >
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{ 
                width: '4px', 
                height: '40px', 
                background: 'linear-gradient(180deg, var(--gold), var(--saffron), var(--magenta))', 
                borderRadius: '2px' 
              }}
            />
            <div>
              <h2 style={{ fontSize: '30px', margin: 0, fontFamily: 'var(--font-serif)', color: 'var(--gold)', letterSpacing: '0.05em' }}>
                Contribution Garden
              </h2>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '4px', color: 'var(--gold-muted)' }}>
                {selectedYear === 'all' ? 'Lifetime • 2023–Present' : `Year in Code • ${selectedYear}`}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {['2026', '2025', 'all'].map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: `1px solid ${selectedYear === yr ? 'var(--gold)' : 'rgba(201, 162, 39, 0.2)'}`,
                  background: selectedYear === yr ? 'rgba(201, 162, 39, 0.1)' : 'transparent',
                  color: selectedYear === yr ? 'var(--gold)' : 'var(--gold-muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  letterSpacing: '0.1em'
                }}
              >
                {yr === 'all' ? 'LIFETIME' : yr}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Canvas Container */}
        <div 
          style={{ 
            width: '100%',
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            height: '80vh', // Increased from 65vh to give more screen real estate
            background: 'rgba(7, 3, 15, 0.5)',
            border: '1px solid rgba(201, 162, 39, 0.2)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 0 60px rgba(201,162,39,0.05)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <GithubGardenCanvas 
            year={selectedYear}
            onDataLoaded={(total, maxDay, activeDays, streak) => {
              setStats({ total, maxDay, activeDays, streak });
            }}
          />

          {/* Stats Overlay inside the canvas box */}
          <div 
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              padding: '24px',
              pointerEvents: 'none',
              background: 'rgba(10, 10, 15, 0.75)',
              border: '1px solid rgba(201, 162, 39, 0.2)',
              borderRadius: '12px',
              backdropFilter: 'blur(12px)',
              minWidth: '240px',
              color: 'white'
            }}
          >
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', color: 'var(--gold-muted)' }}>
              Overview
            </div>
            
            <div style={{ fontSize: '42px', color: 'var(--gold)', fontFamily: 'var(--font-sans)', fontWeight: 800, lineHeight: 1 }}>
              {stats.total.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px', marginBottom: '24px', color: 'var(--saffron)' }}>
              total contributions
            </div>

            <div style={{ display: 'flex', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--magenta)' }}>{stats.maxDay}</div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-muted)' }}>best day</div>
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--gold)' }}>{stats.activeDays}</div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-muted)' }}>active days</div>
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>{stats.streak}</div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-muted)' }}>max streak</div>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8 }}>
              <span style={{ fontSize: '10px', color: 'var(--gold-muted)' }}>Less</span>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#161b22' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#5b1a72' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#d4145a' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ff6b35' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ffd700' }} />
              <span style={{ fontSize: '10px', color: 'var(--gold-muted)' }}>More</span>
            </div>
          </div>
          
          {/* Helper hint for interaction */}
          <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyItems: 'center' }}>
              <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, transparent, var(--gold))' }} />
              <div style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold-muted)' }}>
                ✦ Drag to Rotate ✦
              </div>
              <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
