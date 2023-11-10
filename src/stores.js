import { writable } from 'svelte/store'

export const name = writable('')
export const messages = writable([])
// Store all items that were selected by anyone. They key is the ID of the
// item, the value is an array of PeerIDs that selected that item.
export const selectedStore = writable({
  3: ['some-peer-id'],
  20: ['some-peer-id2'],
  6: ['some-peer-id6'],
  16: ['some-peer-id16'],
  18: ['some-peer-id18'],
  23: ['some-peer-id23'],
  25: ['some-peer-id25']
})
// Whenever somone has a Bingo we save that. It's just an array of strings.
export const winnersStore = writable([])
