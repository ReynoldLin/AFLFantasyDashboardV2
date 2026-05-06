const BYE_ROUNDS = {
    10: 12,
    20: 15,
    30: 14,
    40: 14,
    50: 15,
    60: 14,
    70: 16,
    80: 14,
    90: 16,
    100: 12,
    110: 12,
    120: 13,
    130: 16,
    140: 16,
    150: 15,
    160: 15,
    1000: 12,
    1010: 13
}

export function getByeRound(squadId) {
    return BYE_ROUNDS[squadId] ?? null
}

export function isOnBye(squadId, selectedRound) {
    if (!selectedRound) return false
    return BYE_ROUNDS[squadId] === selectedRound
}