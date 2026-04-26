import { useEffect, useState, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ─── CONFIG ─── */
const GITHUB_USERNAME = '1Anuraag0';
const API_URL = `https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=last`;
const CACHE_KEY = 'gh_contributions_v1';
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours → max 2 API calls per day

/* ─── TYPES ─── */
interface ContribDay {
  date: string;
  count: number;
  level: number; // 0-4
}

interface APIResponse {
  total: Record<string, number>;
  contributions: ContribDay[];
}

interface CachedPayload {
  data: APIResponse;
  fetchedAt: number;
}

/* ─── CACHE HELPERS ─── */
function readCache(): APIResponse | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedPayload = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt > CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data: APIResponse) {
  const payload: CachedPayload = { data, fetchedAt: Date.now() };
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

/* ─── DATA HELPERS ─── */
function calcStreak(days: ContribDay[]): number {
  const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date));
  const today = new Date().toISOString().slice(0, 10);
  // Skip today if zero (day isn't over yet)
  const start = sorted[0]?.date === today && sorted[0].count === 0 ? 1 : 0;
  let streak = 0;
  for (let i = start; i < sorted.length; i++) {
    if (sorted[i].count > 0) streak++;
    else break;
  }
  return streak;
}

function calcTotal(days: ContribDay[]): number {
  return days.reduce((sum, d) => sum + d.count, 0);
}

/** Group flat day array into week columns (each = 7 rows, Sun→Sat) */
function groupWeeks(days: ContribDay[]): (ContribDay | null)[][] {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return [];

  const firstDow = new Date(sorted[0].date + 'T00:00:00').getDay(); // 0=Sun
  const padded: (ContribDay | null)[] = [...Array(firstDow).fill(null), ...sorted];
  while (padded.length % 7 !== 0) padded.push(null);

  const weeks: (ContribDay | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  return weeks;
}

/** Get month labels positioned at the week where each month starts */
function getMonthLabels(weeks: (ContribDay | null)[][]): { label: string; idx: number }[] {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const labels: { label: string; idx: number }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, wi) => {
    const day = week.find((d) => d !== null);
    if (!day) return;
    const m = new Date(day.date + 'T00:00:00').getMonth();
    if (m !== lastMonth) {
      labels.push({ label: monthNames[m], idx: wi });
      lastMonth = m;
    }
  });
  return labels;
}

/* ─── COMPONENT ─── */
export default function GithubSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [data, setData] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /* Fetch contribution data with 12-hour cache */
  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    fetch(API_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: APIResponse) => {
        writeCache(d);
        setData(d);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  /* GSAP entrance animations */
  useEffect(() => {
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (rm) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gh-section-eye',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: '#github', start: 'top 80%', once: true },
        }
      );
      gsap.fromTo(
        '.gh-section-title',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: '#github', start: 'top 78%', once: true },
        }
      );
      gsap.fromTo(
        '.gh-card',
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: '#github', start: 'top 72%', once: true },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  /* Derived data */
  const { weeks, monthLabels, total, currentStreak } = useMemo(() => {
    if (!data?.contributions?.length) {
      return { weeks: [], monthLabels: [], total: 0, currentStreak: 0 };
    }
    const ws = groupWeeks(data.contributions);
    return {
      weeks: ws,
      monthLabels: getMonthLabels(ws),
      total: calcTotal(data.contributions),
      currentStreak: calcStreak(data.contributions),
    };
  }, [data]);

  const CELL_SIZE = 12;
  const CELL_GAP = 4;
  const CELL_STEP = CELL_SIZE + CELL_GAP;

  return (
    <section
      id="github"
      ref={sectionRef}
      style={{
        padding: 'clamp(80px, 12vw, 140px) clamp(24px, 5vw, 80px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Section Header */}
      <p
        className="gh-section-eye section-eye"
        style={{ opacity: 0 }}
      >
        ✦ OPEN SOURCE ✦
      </p>
      <h2
        className="gh-section-title section-title"
        style={{ marginBottom: 48, opacity: 0 }}
      >
        GitHub <em>Contributions</em>
      </h2>

      {/* Glass Card */}
      <div
        className="gh-card"
        style={{
          background: 'rgba(20, 20, 25, 0.95)',
          padding: 'clamp(20px, 4vw, 32px)',
          borderRadius: 20,
          boxShadow:
            '0 30px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(201, 162, 39, 0.15)',
          maxWidth: 1100,
          margin: '0 auto',
          opacity: 0,
          willChange: 'transform, opacity',
        }}
      >
        {/* Card Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(18px, 2vw, 22px)',
                fontWeight: 600,
                color: 'var(--gold-pale)',
                letterSpacing: '0.02em',
              }}
            >
              @{GITHUB_USERNAME}
            </h3>
            <p
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                color: 'var(--ivory-dim)',
                fontWeight: 300,
              }}
            >
              Activity & Commit History
            </p>
          </div>

          {!loading && !error && (
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                color: 'var(--ivory-dim)',
                textAlign: 'right',
              }}
            >
              {total.toLocaleString()} Contributions
              <br />
              <strong
                style={{
                  color: '#4ade80',
                  fontWeight: 600,
                  textShadow: '0 0 10px rgba(74, 222, 128, 0.4)',
                }}
              >
                Current Streak: {currentStreak} Days
              </strong>
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 140,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: '2px solid rgba(201, 162, 39, 0.15)',
                borderTopColor: 'var(--gold)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <p
            style={{
              textAlign: 'center',
              color: 'var(--ivory-dim)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              padding: '40px 0',
            }}
          >
            Unable to load contribution data. Please try again later.
          </p>
        )}

        {/* Contribution Grid */}
        {!loading && !error && weeks.length > 0 && (
          <div style={{ overflowX: 'auto', paddingBottom: 10 }}>
            {/* Month labels */}
            <div
              style={{
                position: 'relative',
                height: 20,
                marginBottom: 6,
                marginLeft: 30,
                minWidth: weeks.length * CELL_STEP,
              }}
            >
              {monthLabels.map((m, i) => (
                <span
                  key={i}
                  style={{
                    position: 'absolute',
                    left: m.idx * CELL_STEP,
                    fontSize: '0.7rem',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: CELL_GAP, minWidth: 'max-content' }}>
              {/* Day labels */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: CELL_GAP,
                  marginRight: 6,
                  marginTop: 1,
                }}
              >
                {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '0.65rem',
                      color: '#64748b',
                      height: CELL_SIZE,
                      lineHeight: `${CELL_SIZE}px`,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Grid columns */}
              {weeks.map((week, wi) => (
                <div
                  key={wi}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: CELL_GAP,
                  }}
                >
                  {week.map((day, di) => {
                    if (!day) {
                      return (
                        <div
                          key={di}
                          style={{ width: CELL_SIZE, height: CELL_SIZE }}
                        />
                      );
                    }
                    const delay = wi * 12 + di * 18;
                    return (
                      <div
                        key={di}
                        className={`gh-cell ${day.level > 0 ? `gh-level-${day.level}` : ''}`}
                        title={
                          day.count === 0
                            ? `No contributions on ${day.date}`
                            : `${day.count} contribution${day.count > 1 ? 's' : ''} on ${day.date}`
                        }
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        {!loading && !error && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginTop: 20,
              fontSize: '0.75rem',
              color: '#64748b',
              gap: 6,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Less
            <div className="gh-legend" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }} />
            <div className="gh-legend gh-level-1" />
            <div className="gh-legend gh-level-2" />
            <div className="gh-legend gh-level-3" />
            <div className="gh-legend gh-level-4" />
            More
          </div>
        )}
      </div>

      {/* Scoped Styles */}
      <style>{`
        /* Power-on sweep animation */
        @keyframes ghPowerOn {
          0% { opacity: 0; transform: scale(0.5) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        .gh-cell {
          width: ${CELL_SIZE}px;
          height: ${CELL_SIZE}px;
          border-radius: 3px;
          background-color: rgba(255, 255, 255, 0.015);
          border: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
          position: relative;
          opacity: 0;
          animation: ghPowerOn 0.6s ease-out forwards;
        }

        .gh-cell:hover {
          transform: scale(1.8) translateZ(10px);
          z-index: 20;
          filter: brightness(1.3);
          border-color: rgba(255, 255, 255, 0.8);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
        }

        /* Neon Green Glow Levels */
        .gh-level-1 {
          background-color: #14532d;
          border-color: #14532d;
          box-shadow: 0 0 6px rgba(20, 83, 45, 0.8);
        }
        .gh-level-2 {
          background-color: #16a34a;
          border-color: #16a34a;
          box-shadow: 0 0 10px rgba(22, 163, 74, 0.8);
        }
        .gh-level-3 {
          background-color: #22c55e;
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 15px rgba(34, 197, 94, 0.9), inset 0 0 2px rgba(255, 255, 255, 0.5);
        }
        .gh-level-4 {
          background-color: #4ade80;
          border-color: rgba(255, 255, 255, 0.6);
          box-shadow: 0 0 20px rgba(74, 222, 128, 1), 0 0 40px rgba(74, 222, 128, 0.4), inset 0 0 4px rgba(255, 255, 255, 0.8);
        }

        /* Legend cells */
        .gh-legend {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          opacity: 0;
          animation: ghPowerOn 1s ease-out 0.8s forwards;
        }

        /* Mobile responsive */
        @media (max-width: 767px) {
          .gh-card {
            padding: 16px !important;
            border-radius: 14px !important;
          }
        }
      `}</style>
    </section>
  );
}
