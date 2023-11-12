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
  { id: 5, text: 'Go-to-market' },
  { id: 6, text: 'PLN' },
  { id: 7, text: 'Performance Review' },
  { id: 8, text: 'Public goods' },
  { id: 9, text: 'Funding' },
  { id: 10, text: 'PMF' },
  { id: 11, text: 'Re-org' },
  { id: 12, text: 'Innovation chasm' },
  { id: 13, text: 'Future' },
  { id: 14, text: 'Collaboration' },
  { id: 15, text: 'Revenue' },
  { id: 16, text: 'Compensation' },
  { id: 17, text: 'Equity' },
  { id: 18, text: 'Wrong decision' },
  { id: 19, text: 'Transition' },
  { id: 20, text: 'Transparency' },
  { id: 21, text: 'Pitches' },
  { id: 22, text: 'Trust' },
  { id: 23, text: 'Adoption' },
  { id: 24, text: 'Distributed web' },
  { id: 25, text: 'VC' }
]

// celebrate
// progress
// masterplan
