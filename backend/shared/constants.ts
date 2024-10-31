export enum SquareType {
  VERTICAL = 'vertical-square',
  CORNER = 'corner-square',
  SIDE = 'side-square'
}

// colors are placeholder tokens for player avatars
export const COLORS = ['red', 'yellow', 'green', 'purple', 'blue', 'pink', 'cyan']

export const BOX_TYPES = {
  GO: 'GO',
  AVENUE: 'AVENUE',
  CHANCE: 'CHANCE',
  COMMUNITY: 'COMMUNITY',
  TAX: 'TAX',
  UTILITIES: 'UTILITIES',
  JAIL: 'JAIL',
  PARKING: 'PARKING',
  // GO_TO_JAIL: 'GO TO JAIL',
  RAILROADS: 'RAILROADS',
}

export const GAME_SETTINGS = {
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 2,
}

export const CARDS = {
  COMMUNITY: {
    GET_OUT_OF_JAIL_FREE: "Get out of Jail, Free. This card may be kept until needed or traded.",
    GENERAL_REPAIRS: "Make General Repairs on All Your Property. For each house pay $25. For each hotel $100.",
    STREET_REPAIRS: "You are assessed for street repairs. Pay $40 per house. Pay $115 per hotel.",
    GO_BACK_THREE_SPACES: "Go back three spaces.",
    ADVANCE_TO_GO: "ADVANCE TO GO (Collect $200)",
    BANK_DIVIDEND: "Bank pays you dividend of $50.",
    ADVANCE_TO_CHRIST_REDEEMER: "ADVANCE to Christ Redeemer. If you pass 'GO' collect $200.",
    PAY_POOR_TAX: "Pay poor tax of $15.",
    PAY_SCHOOL_TAX: "Pay school tax of $150.",
    ADVANCE_TO_STREET_OF_PEACE: "ADVANCE to Street of Peace.",
    ADVANCE_TO_HENRI_MARTIN: "ADVANCE to Henri Martin. If you pass 'GO' collect $200.",
    BUILDING_LOAN_MATURES: "Your building loan matures. Collect $150.",
    ADVANCE_TO_PARK_OF_LYON: "ADVANCE TO Park of Lyon. If you pass 'GO' collect $200.",
    INTOXICATION_FINE: "Amend for intoxication. Pay $20.",
    GO_TO_JAIL: "Go to Jail. Go Directly to Jail. Do not pass 'GO'. Do not collect $200.",
    XMAS_FUND: "Xmas fund matures. Collect $10.",
  },

  CHANCE: {
    GET_OUT_OF_JAIL_FREE: "GET OUT OF JAIL FREE. This card may be kept until needed or traded.",
    GENERAL_REPAIRS: "Make General Repairs on All Your Property. For each house pay $25. For each hotel $100.",
    STREET_REPAIRS: "You are assessed for street repairs. Pay $40 per house. Pay $115 per hotel.",
    GO_BACK_THREE_SPACES: "Go back three spaces.",
    ADVANCE_TO_GO: "ADVANCE TO GO (Collect $200)",
    BANK_DIVIDEND: "Bank pays you dividend of $50.",
    ADVANCE_TO_CHRIST_REDEEMER: "ADVANCE to Christ Redeemer. If you pass 'GO' collect $200.",
    PAY_POOR_TAX: "Pay poor tax of $15.",
    PAY_SCHOOL_TAX: "Pay school tax of $150.",
    ADVANCE_TO_STREET_OF_PEACE: "ADVANCE to Street of Peace.",
    ADVANCE_TO_HENRI_MARTIN: "ADVANCE to Henri Martin. If you pass 'GO' collect $200.",
    BUILDING_LOAN_MATURES: "Your building loan matures. Collect $150.",
    ADVANCE_TO_PARK_OF_LYON: "ADVANCE TO Park of Lyon. If you pass 'GO' collect $200.",
    INTOXICATION_FINE: "Amend for intoxication. Pay $20.",
    GO_TO_JAIL: "Go to Jail. Go Directly to Jail. Do not pass 'GO'. Do not collect $200.",
    XMAS_FUND: "Xmas fund matures. Collect $10."
  }
};

export const RAILROAD_RENTS = {
  FIRST: 25,
  SECOND: 50,
  THIRD: 100,
  FOURTH: 200,
}

export const MONETARY = {
  STARTING_BALANCE: 1500,
  JAIL_FINE: 50,
  PASS_GO_AMOUNT: 200
}

export enum GameEvents {
  ROLL = 'Roll',
  BUY = 'Buy',
  RENT = 'Rent',
  DRAW_CARD = 'Draw Card',
}