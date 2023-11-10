export const PUBSUB_TOPIC_TOPOLOGY = 'topology'
export const PUBSUB_TOPIC_DATA = 'data-exchange'
export const PUBSUB_TOPIC_CIDS = 'cids'
// On this topic all events related to the Bingo are distributed. There are
// three types of messages:
//  - item selected: { type: "selected", id: <the-id-of-the-item> }
//  - item deselected: { type: "deselected", id: <the-id-of-the-item> }
//  - bingo: { type: "bingo", name: <the-name-of-the-winner> }
export const PUBSUB_TOPIC_BINGO = 'bingo'

export const ITEMS = [
  { id: 1, text: 'Awesome' },
  { id: 2, text: 'LabWeek' },
  { id: 3, text: 'Nucleation' },
  { id: 4, text: 'Humanity' },
  { id: 5, text: 'MelodySheep' },
  { id: 6, text: 'PLN' },
  { id: 7, text: 'Performance Review' },
  { id: 8, text: 'Cats' },
  { id: 9, text: 'Funding' },
  { id: 10, text: 'Blue' },
  { id: 11, text: 'Yellow' },
  { id: 12, text: 'Green' },
  { id: 13, text: 'Future' },
  { id: 14, text: 'IPLD' },
  { id: 15, text: 'RIF' },
  { id: 16, text: 'Compensation' },
  { id: 17, text: 'Equity' },
  { id: 18, text: 'Wrong decision' },
  { id: 19, text: 'Honest mistake' },
  { id: 20, text: 'IPO' },
  { id: 21, text: 'Board of directors' },
  { id: 22, text: 'Trust' },
  { id: 23, text: 'Flat hierarchy' },
  { id: 24, text: 'Distributed web' },
  { id: 25, text: 'VC' }
]
