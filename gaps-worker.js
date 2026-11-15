// Shopping suggestions (match.js gaps) off the main thread: ~250 ghost pieces × 6 styles would stutter taps on a phone.
// Gets the closet without photos; sends back ids for real pieces (the page swaps them back in), ghosts as they are.
import { gaps } from './match.js';
onmessage = e => postMessage(gaps(e.data).map(g => ({ ...g, examples: g.examples.map(o => ({ ...o, items: o.items.map(p => p.ghost ? p : { id: p.id }) })) })));
