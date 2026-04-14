import '../App.css'

export const TEAM_COLOURS = {
  10: { primary: '#0F1432', secondary: '#FFD200'}, // Adelaide Crows
  20: { primary: '#A30046', secondary: '#FDBE57'}, // Brisbane Lions
  30: { primary: '#0E1E2D', secondary: '#FFFFFF'}, // Carlton
  40: { primary: '#000000', secondary: '#FFFFFF'}, // Collingwood
  50: { primary: '#000000', secondary: '#E20A20'}, // Essendon
  60: { primary: '#2A1A54', secondary: '#FFFFFF'}, // Fremantle
  70: { primary: '#1C3C63', secondary: '#FFFFFF'}, // Geelong Cats
  80: { primary: '#4D2004', secondary: '#FBBF15'}, // Hawthorn
  90: { primary: '#0F1131', secondary: '#CC2031'}, // Melbourne
  100: { primary: '#013B9F', secondary: '#FFFFFF'}, // North Melbourne
  110: { primary: '#008AAB', secondary: '#FFFFFF'}, // Port Adelaide
  120: { primary: '#000000', secondary: '#FED102'}, // Richmond
  130: { primary: '#ED1B2E', secondary: '#FFFFFF'}, // St Kilda
  140: { primary: '#20539D', secondary: '#FFFFFF'}, // Western Bulldogs
  150: { primary: '#FFD700', secondary: '#062EE2'}, // West Coast Eagles
  160: { primary: '#ED171F', secondary: '#FFFFFF'}, // Sydney Swans
  1000: { primary: '#FFE600', secondary: '#D93E39'}, // Gold Coast Suns
  1010: { primary: '#F15C22', secondary: '#FFFFFF'} // GWS Giants
};

export const POS_COLOURS = {
  DEF: '#F38182',
  MID: '#EBF19F',
  RUC: '#A8A8FB',
  FWD: '#ABF5CA',
}

export function getTeamColour(squadId) {
  return TEAM_COLOURS[squadId] || { primary: 'var(--accent)', secondary: '#ffffff' }
}

export function scoreColour(score) {
  if (score >= 120) return { background: '#8DDEFE', color: 'var(--text)' }
  if (score >= 100) return { background: '#E8D5FF', color: 'var(--text)' }
  if (score >= 80) return { background: '#C8E0A9', color: 'var(--text)' }
  if (score >= 60)  return { background: '#FEE08D', color: 'var(--text)' }
  return { background: '#ED999B', color: 'var(--text)' }
}

export function qtrScoreColour(score) {
  if (score >= 50) return { background: '#E8D5FF', color: 'var(--text)' }
  if (score >= 30) return { background: '#8DDEFE', color: 'var(--text)' }
  if (score >= 20) return { background: '#C8E0A9', color: 'var(--text)' }
  if (score >= 15)  return { background: '#FEE08D', color: 'var(--text)' }
  return { background: '#ED999B', color: 'var(--text)' }
}

export function gamesColour(games) {
  if (games >= 20) return { background: '#C8E0A9', color: 'var(--text)' }
  if (games >= 15)  return { background: '#FEE08D', color: 'var(--text)' }
  return { background: '#ED999B', color: 'var(--text)' }
}

export function togColour(tog) {
  if (tog >= 80) return { background: '#C8E0A9', color: 'var(--text)' }
  if (tog >= 70) return { background: '#FEE08D', color: 'var(--text)' }
  return { background: '#ED999B', color: 'var(--text)' }
}

export function cbaColour(cba) {
  if (cba >= 80) return { background: '#E8D5FF', color: 'var(--text)' }
  if (cba >= 70) return { background: '#8DDEFE', color: 'var(--text)' }
  if (cba >= 50) return { background: '#C8E0A9', color: 'var(--text)' }
  if (cba >= 30)  return { background: '#FEE08D', color: 'var(--text)' }
  return { background: '#ED999B', color: 'var(--text)' }
}

export function priceChangeColour(val) {
  if (val > 0) return '#007a52'
  if (val < 0) return '#d63050'
  return 'var(--text)'
}

export function PosBadge({ positions }) {
  if (positions.length === 1) {
    return (
      <span className="pos-badge" style={{ background: POS_COLOURS[positions[0]] }}>
        {positions[0]}
      </span>
    )
  }
  if (positions.length === 2) {
    const c1 = POS_COLOURS[positions[0]]
    const c2 = POS_COLOURS[positions[1]]
    return (
      <span className="pos-badge" style={{ background: `linear-gradient(125deg, ${c1} 50%, ${c2} 50%)` }}>
        {positions.join('/')}
      </span>
    )
  }
  if (positions.length >= 3) {
    const c1 = POS_COLOURS[positions[0]]
    const c2 = POS_COLOURS[positions[1]]
    const c3 = POS_COLOURS[positions[2]]
    return (
      <span className="pos-badge" style={{ background: `linear-gradient(125deg, ${c1} 33%, ${c2} 33%, ${c2} 66%, ${c3} 66%)` }}>
        {positions.join('/')}
      </span>
    )
  }
}