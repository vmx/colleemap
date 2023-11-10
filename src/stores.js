import { writable } from 'svelte/store'

export const name = writable('')
export const messages = writable([])
// Store all items that were selected by anyone. They key is the ID of the
// item, the value is an array of PeerIDs that selected that item.
export const selectedStore = writable({})
// Whenever somone has a Bingo we save that. It's just an array of strings.
export const winnersStore = writable([])
