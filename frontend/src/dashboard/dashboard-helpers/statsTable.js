import { scoreColour, togColour, cbaColour } from '../../helpers/colourCoding'

const STAT_ROWS = [
  { key: 'games',        label: 'Games',          format: v => v,             isCount: true },
  { key: 'fantasyPts',   label: 'Fantasy Pts',    format: v => v.toFixed(1),  highlight: true },
  { key: 'disposals',    label: 'Disposals',      format: v => v.toFixed(1) },
  { key: 'kicks',        label: 'Kicks',          format: v => v.toFixed(1) },
  { key: 'handballs',    label: 'Handballs',      format: v => v.toFixed(1) },
  { key: 'marks',        label: 'Marks',          format: v => v.toFixed(1) },
  { key: 'tackles',      label: 'Tackles',        format: v => v.toFixed(1) },
  { key: 'hitouts',      label: 'Hitouts',        format: v => v.toFixed(1) },
  { key: 'goals',        label: 'Goals',          format: v => v.toFixed(1) },
  { key: 'behinds',      label: 'Behinds',        format: v => v.toFixed(1) },
  { key: 'timeOnGroundPercentage',           label: 'Time on Ground %', format: v => v.toFixed(0) + '%', colourFn: togColour },
  { key: 'centreBounceAttendancePercentage', label: 'CBA %',            format: v => v.toFixed(0) + '%', colourFn: cbaColour },
  { key: 'ruckContestPercentage',            label: 'Ruck Contest %',   format: v => v.toFixed(0) + '%' },
  { key: 'kickins',                          label: 'Kick Ins',         format: v => v.toFixed(1) },
]

export function StatsTable({ playerWith, playerWithout, statsWith, statsWithout, loadingWith, loadingWithout }) {
  const col = { padding: '11px 24px', textAlign: 'center', fontSize: 13 }
  const labelCol = { padding: '11px 16px', fontSize: 13, color: 'var(--muted)', fontWeight: 500, whiteSpace: 'nowrap' }

  function renderCell(stats, loading, key, format, highlight, colourFn) {
    if (loading) return <td style={col}><div className="skeleton" style={{ width: 40, margin: '0 auto' }} /></td>
    if (!stats) return <td style={{ ...col, color: 'var(--muted)' }}>—</td>
    const val = stats[key]
    if (highlight && key === 'fantasyPts') {
      return (
        <td style={col}>
          <span style={{ ...scoreColour(val), borderRadius: 6, padding: '2px 10px', fontWeight: 700, display: 'inline-block', minWidth: 50 }}>
            {format(val)}
          </span>
        </td>
      )
    }
    if (colourFn) {
      return (
        <td style={col}>
          <span style={{ ...colourFn(val), borderRadius: 6, padding: '2px 10px', fontWeight: 700, display: 'inline-block', minWidth: 50 }}>
            {format(val)}
          </span>
        </td>
      )
    }
    return <td style={{ ...col, fontWeight: key === 'games' ? 700 : 500 }}>{format(val)}</td>
  }

  // Diff column: with - without, shown when both loaded
  function renderDiff(key, format) {
    if (!statsWith || !statsWithout) return <td style={{ ...col, color: 'var(--muted)' }}>—</td>
    const diff = statsWithout[key] - statsWith[key]
    if (key === 'games') return <td style={{ ...col, color: 'var(--muted)' }}>—</td>
    const color = diff > 0 ? '#007a52' : diff < 0 ? '#d63050' : 'var(--muted)'
    const prefix = diff > 0 ? '+' : ''
    return (
      <td style={{ ...col, color, fontWeight: 700 }}>
        {prefix}{format(diff)}
      </td>
    )
  }

  return (
    <div className="table-wrap" style={{ marginTop: 24 }}>
      <table>
        <thead>
          <tr>
            <th style={{ padding: '10px 16px', textAlign: 'left', width: 120 }}></th>
            <th style={{ ...col, background: 'var(--surface2)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>WITH</span>
              </div>
            </th>
            <th style={{ ...col, background: 'var(--surface2)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>WITHOUT</span>
              </div>
            </th>
            <th style={{ ...col, background: 'var(--surface2)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>DIFF</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {STAT_ROWS.map(({ key, label, format, highlight, isCount, colourFn }) => (
            <tr key={key} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={labelCol}>{label}</td>
              {renderCell(statsWith,    loadingWith,    key, format, highlight, colourFn)}
              {renderCell(statsWithout, loadingWithout, key, format, highlight, colourFn)}
              {renderDiff(key, format)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}