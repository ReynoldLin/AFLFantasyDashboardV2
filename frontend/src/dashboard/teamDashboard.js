import { useEffect, useState } from 'react';
import { calcFantasyScore } from '../modal/tab-content/gameHistory';
import { fetchPlayers, fetchPlayerGameStats } from '../api';

const BATCH_SIZE = 20;

const AFL_TEAMS = [
  { id: 10,   name: 'Adelaide Crows' },
  { id: 20,   name: 'Brisbane Lions' },
  { id: 30,   name: 'Carlton' },
  { id: 40,   name: 'Collingwood' },
  { id: 50,   name: 'Essendon' },
  { id: 60,   name: 'Fremantle' },
  { id: 1010, name: 'GWS Giants' },
  { id: 70,   name: 'Geelong Cats' },
  { id: 1000, name: 'Gold Coast' },
  { id: 80,   name: 'Hawthorn' },
  { id: 90,   name: 'Melbourne' },
  { id: 100,  name: 'North Melbourne' },
  { id: 110,  name: 'Port Adelaide' },
  { id: 120,  name: 'Richmond' },
  { id: 130,  name: 'St Kilda' },
  { id: 160,  name: 'Sydney Swans' },
  { id: 150,  name: 'West Coast Eagles' },
  { id: 140,  name: 'Western Bulldogs' },
];

export function TeamDashboard() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [sortKey, setSortKey] = useState('total');
  const [sortDir, setSortDir] = useState('desc');
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch players (teams are hardcoded — static data)
        const { players } = await fetchPlayers();

        if (cancelled) return;

        const playerIds = players.map(p => p.id ?? p.playerId);

        setProgress({ done: 0, total: playerIds.length });

        // 2. Fetch all game stats in batches, updating progress
        const allStats = [];
        for (let i = 0; i < playerIds.length; i += BATCH_SIZE) {
          if (cancelled) return;
          const batch = playerIds.slice(i, i + BATCH_SIZE);
          const settled = await Promise.allSettled(
            batch.map(id => fetchPlayerGameStats(id))
          );
          for (const s of settled) {
            if (s.status === 'fulfilled') allStats.push(...s.value);
          }
          setProgress({ done: Math.min(i + BATCH_SIZE, playerIds.length), total: playerIds.length });
        }

        if (cancelled) return;

        // 3. Aggregate fantasy points conceded per opponent team
        const conceded = {}; // { teamId: { total, games } }
        for (const g of allStats) {
          const tid = g.opponentSquadId;
          if (!tid) continue;
          if (!conceded[tid]) conceded[tid] = { total: 0, games: 0 };
          conceded[tid].total += calcFantasyScore(g);
          conceded[tid].games += 1;
        }

        // 4. Build rows for all 18 teams (even if no data yet)
        const built = AFL_TEAMS.map(t => {
          const c = conceded[t.id] ?? { total: 0, games: 0 };
          return {
            id:    t.id,
            name:  t.name,
            total: Math.round(c.total),
            games: c.games,
            ppg:   c.games > 0 ? Math.round(c.total / c.games) : 0,
          };
        });

        setRows(built);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) { setLoading(false); setProgress(null); }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  function handleSort(key) {
    setSortDir(prev => sortKey === key ? (prev === 'desc' ? 'asc' : 'desc') : 'desc');
    setSortKey(key);
  }

  const sorted = [...rows].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortDir === 'desc' ? -diff : diff;
  });

  function SortIcon({ col }) {
    if (sortKey !== col) return <span style={{ color: 'var(--border)', marginLeft: 4 }}>↕</span>;
    return <span style={{ color: 'var(--accent)', marginLeft: 4 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>;
  }

  const thStyle = (key) => ({
    cursor: 'pointer',
    userSelect: 'none',
    background: sortKey === key ? 'rgba(15,150,218,0.06)' : undefined,
  });

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <main>
        <div className="table-wrap" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>
            {progress
              ? `Loading player stats… ${progress.done} / ${progress.total} players`
              : 'Loading…'}
          </div>
          {progress && (
            <div style={{
              height: 4,
              borderRadius: 2,
              background: 'var(--border)',
              maxWidth: 320,
              margin: '0 auto',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                borderRadius: 2,
                background: 'var(--accent)',
                width: `${(progress.done / progress.total) * 100}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
          )}
          {/* Skeleton rows */}
          <div style={{ marginTop: 32 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, marginBottom: 10, justifyContent: 'center'
              }}>
                <div className="skeleton" style={{ width: 180 }} />
                <div className="skeleton" style={{ width: 80 }} />
                <div className="skeleton" style={{ width: 60 }} />
                <div className="skeleton" style={{ width: 60 }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <div className="table-wrap">
          <div className="error">Failed to load team data: {error}</div>
        </div>
      </main>
    );
  }

  // ── Summary stats ──────────────────────────────────────────────
  const maxTotal = Math.max(...sorted.map(r => r.total));
  const minTotal = Math.min(...sorted.map(r => r.total).filter(v => v > 0));
  const avgPpg   = sorted.length
    ? Math.round(sorted.reduce((s, r) => s + r.ppg, 0) / sorted.filter(r => r.games > 0).length)
    : 0;

  return (
    <main>
      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Most Pts Conceded', value: sorted[0]?.name ?? '—', sub: sorted[0]?.total.toLocaleString() ?? '' },
          { label: 'Least Pts Conceded', value: [...sorted].sort((a,b) => a.total - b.total).find(r => r.total > 0)?.name ?? '—', sub: minTotal?.toLocaleString() ?? '' },
          { label: 'Avg PPG Conceded', value: avgPpg, sub: 'across all teams' },
        ].map(card => (
          <div key={card.label} className="stat-badge-bg" style={{ flex: '1 1 160px', minWidth: 140 }}>
            <div className="stat-badge-title">{card.label}</div>
            <div className="stat-badge-data" style={{ fontSize: 16 }}>{card.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>TEAM</th>
              <th style={thStyle('games')} onClick={() => handleSort('games')}>
                GAMES<SortIcon col="games" />
              </th>
              <th style={thStyle('total')} onClick={() => handleSort('total')}>
                TOTAL PTS CONCEDED<SortIcon col="total" />
              </th>
              <th style={thStyle('ppg')} onClick={() => handleSort('ppg')}>
                AVG PPG<SortIcon col="ppg" />
              </th>
              <th>RELATIVE</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const pct = maxTotal > 0 ? (row.total / maxTotal) * 100 : 0;
              const isHigh = row.ppg > avgPpg;
              return (
                <tr key={row.id}>
                  <td className="muted-val">{i + 1}</td>
                  <td>
                    <span className="player-name">{row.name}</span>
                  </td>
                  <td className="normal-val">{row.games}</td>
                  <td className="text-val">{row.total > 0 ? row.total.toLocaleString() : '—'}</td>
                  <td>
                    <span style={{
                      color: row.games === 0 ? 'var(--muted)'
                           : isHigh         ? 'var(--danger)'
                           : 'var(--accent)',
                      fontWeight: 700,
                      fontSize: 13,
                    }}>
                      {row.games > 0 ? row.ppg : '—'}
                    </span>
                  </td>
                  <td style={{ width: 160 }}>
                    {row.total > 0 && (
                      <div style={{
                        height: 6,
                        borderRadius: 3,
                        background: 'var(--border)',
                        overflow: 'hidden',
                        width: 120,
                      }}>
                        <div style={{
                          height: '100%',
                          borderRadius: 3,
                          width: `${pct}%`,
                          background: isHigh ? 'var(--danger)' : 'var(--accent)',
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}