export type Group = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'

export interface GroupData {
  teams: string[]
  matches: { date: string; home: string; away: string }[]
}

export const WC_GROUPS: Record<Group, GroupData> = {
  A: {
    teams: ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
    matches: [
      { date: 'Jun 11', home: 'Mexico', away: 'South Africa' },
      { date: 'Jun 12', home: 'South Korea', away: 'Czechia' },
      { date: 'Jun 17', home: 'Mexico', away: 'Czechia' },
      { date: 'Jun 17', home: 'South Korea', away: 'South Africa' },
      { date: 'Jun 24', home: 'South Korea', away: 'Mexico' },
      { date: 'Jun 24', home: 'Czechia', away: 'South Africa' },
    ],
  },
  B: {
    teams: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
    matches: [
      { date: 'Jun 12', home: 'Canada', away: 'Bosnia and Herzegovina' },
      { date: 'Jun 13', home: 'Qatar', away: 'Switzerland' },
      { date: 'Jun 18', home: 'Canada', away: 'Switzerland' },
      { date: 'Jun 18', home: 'Qatar', away: 'Bosnia and Herzegovina' },
      { date: 'Jun 24', home: 'Switzerland', away: 'Bosnia and Herzegovina' },
      { date: 'Jun 24', home: 'Canada', away: 'Qatar' },
    ],
  },
  C: {
    teams: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
    matches: [
      { date: 'Jun 12', home: 'Brazil', away: 'Morocco' },
      { date: 'Jun 13', home: 'Haiti', away: 'Scotland' },
      { date: 'Jun 19', home: 'Brazil', away: 'Scotland' },
      { date: 'Jun 19', home: 'Morocco', away: 'Haiti' },
      { date: 'Jun 25', home: 'Scotland', away: 'Morocco' },
      { date: 'Jun 25', home: 'Brazil', away: 'Haiti' },
    ],
  },
  D: {
    teams: ['USA', 'Paraguay', 'Australia', 'Turkey'],
    matches: [
      { date: 'Jun 12', home: 'USA', away: 'Paraguay' },
      { date: 'Jun 13', home: 'Australia', away: 'Turkey' },
      { date: 'Jun 19', home: 'USA', away: 'Australia' },
      { date: 'Jun 19', home: 'Paraguay', away: 'Turkey' },
      { date: 'Jun 25', home: 'Turkey', away: 'Paraguay' },
      { date: 'Jun 25', home: 'USA', away: 'Australia' },
    ],
  },
  E: {
    teams: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'],
    matches: [
      { date: 'Jun 13', home: 'Germany', away: 'Curaçao' },
      { date: 'Jun 14', home: 'Ivory Coast', away: 'Ecuador' },
      { date: 'Jun 20', home: 'Germany', away: 'Ecuador' },
      { date: 'Jun 20', home: 'Ivory Coast', away: 'Curaçao' },
      { date: 'Jun 25', home: 'Ecuador', away: 'Curaçao' },
      { date: 'Jun 25', home: 'Germany', away: 'Ivory Coast' },
    ],
  },
  F: {
    teams: ['Netherlands', 'Japan', 'Tunisia', 'Denmark'],
    matches: [
      { date: 'Jun 14', home: 'Netherlands', away: 'Japan' },
      { date: 'Jun 14', home: 'Tunisia', away: 'Denmark' },
      { date: 'Jun 20', home: 'Netherlands', away: 'Denmark' },
      { date: 'Jun 20', home: 'Japan', away: 'Tunisia' },
      { date: 'Jun 26', home: 'Denmark', away: 'Japan' },
      { date: 'Jun 26', home: 'Netherlands', away: 'Tunisia' },
    ],
  },
  G: {
    teams: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
    matches: [
      { date: 'Jun 15', home: 'Belgium', away: 'Egypt' },
      { date: 'Jun 15', home: 'Iran', away: 'New Zealand' },
      { date: 'Jun 21', home: 'Belgium', away: 'New Zealand' },
      { date: 'Jun 21', home: 'Iran', away: 'Egypt' },
      { date: 'Jun 26', home: 'Egypt', away: 'New Zealand' },
      { date: 'Jun 26', home: 'Belgium', away: 'Iran' },
    ],
  },
  H: {
    teams: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
    matches: [
      { date: 'Jun 15', home: 'Spain', away: 'Cape Verde' },
      { date: 'Jun 16', home: 'Saudi Arabia', away: 'Uruguay' },
      { date: 'Jun 21', home: 'Spain', away: 'Uruguay' },
      { date: 'Jun 21', home: 'Saudi Arabia', away: 'Cape Verde' },
      { date: 'Jun 26', home: 'Uruguay', away: 'Cape Verde' },
      { date: 'Jun 26', home: 'Spain', away: 'Saudi Arabia' },
    ],
  },
  I: {
    teams: ['France', 'Senegal', 'Norway', 'Algeria'],
    matches: [
      { date: 'Jun 16', home: 'France', away: 'Senegal' },
      { date: 'Jun 16', home: 'Norway', away: 'Algeria' },
      { date: 'Jun 22', home: 'France', away: 'Algeria' },
      { date: 'Jun 22', home: 'Norway', away: 'Senegal' },
      { date: 'Jun 27', home: 'Algeria', away: 'Senegal' },
      { date: 'Jun 27', home: 'France', away: 'Norway' },
    ],
  },
  J: {
    teams: ['Argentina', 'Jordan', 'Austria', 'DR Congo'],
    matches: [
      { date: 'Jun 16', home: 'Argentina', away: 'Jordan' },
      { date: 'Jun 17', home: 'Austria', away: 'DR Congo' },
      { date: 'Jun 22', home: 'Argentina', away: 'DR Congo' },
      { date: 'Jun 22', home: 'Austria', away: 'Jordan' },
      { date: 'Jun 27', home: 'DR Congo', away: 'Jordan' },
      { date: 'Jun 27', home: 'Argentina', away: 'Austria' },
    ],
  },
  K: {
    teams: ['Portugal', 'Colombia', 'Uzbekistan', 'DR Congo'],
    matches: [
      { date: 'Jun 17', home: 'Portugal', away: 'Uzbekistan' },
      { date: 'Jun 17', home: 'Colombia', away: 'DR Congo' },
      { date: 'Jun 23', home: 'Portugal', away: 'DR Congo' },
      { date: 'Jun 23', home: 'Colombia', away: 'Uzbekistan' },
      { date: 'Jun 27', home: 'Uzbekistan', away: 'DR Congo' },
      { date: 'Jun 27', home: 'Portugal', away: 'Colombia' },
    ],
  },
  L: {
    teams: ['England', 'Croatia', 'Ghana', 'Panama'],
    matches: [
      { date: 'Jun 17', home: 'England', away: 'Croatia' },
      { date: 'Jun 18', home: 'Ghana', away: 'Panama' },
      { date: 'Jun 23', home: 'England', away: 'Panama' },
      { date: 'Jun 23', home: 'Croatia', away: 'Ghana' },
      { date: 'Jun 27', home: 'Panama', away: 'Croatia' },
      { date: 'Jun 27', home: 'England', away: 'Ghana' },
    ],
  },
}

// Map normalised country names → group
export const COUNTRY_TO_GROUP: Record<string, Group> = {}
for (const [group, data] of Object.entries(WC_GROUPS) as [Group, GroupData][]) {
  for (const team of data.teams) {
    COUNTRY_TO_GROUP[team.toLowerCase()] = group
  }
}

// Aliases for Sorare country slugs / display names
export const COUNTRY_ALIASES: Record<string, string> = {
  'united-states': 'usa',
  'united states': 'usa',
  'ivory-coast': 'ivory coast',
  "côte d'ivoire": 'ivory coast',
  'cote-divoire': 'ivory coast',
  'south-korea': 'south korea',
  'korea-republic': 'south korea',
  'new-zealand': 'new zealand',
  'saudi-arabia': 'saudi arabia',
  'cape-verde': 'cape verde',
  'dr-congo': 'dr congo',
  'bosnia-and-herzegovina': 'bosnia and herzegovina',
  'south-africa': 'south africa',
  czechia: 'czechia',
  'czech-republic': 'czechia',
  türkiye: 'turkey',
  turkiye: 'turkey',
  curacao: 'curaçao',
  'new-caledonia': '',
}

export function getGroupForCountry(rawCountry: string): Group | null {
  const lower = rawCountry.toLowerCase()
  const resolved = COUNTRY_ALIASES[lower] ?? lower
  return COUNTRY_TO_GROUP[resolved] ?? null
}

export function getMatchesForGroup(group: Group) {
  return WC_GROUPS[group].matches
}
