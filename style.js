// Your style notes (style-notes/*.md, @erikxei TikToks) boiled down to data. match.js reads this.
// Edit freely: 'color + color: vibe'. Colors are the words below; '|' means "either".
// Suggestions, not laws: a combo you hit gets a small boost and its vibe shows as the reason.

// Note words → the app's color names (what colorName() returns).
export const ALIAS = {
  cream: 'white|beige', ivory: 'white|beige', bone: 'white|beige', ecru: 'white|beige',
  beige: 'beige', taupe: 'beige|grey', stone: 'beige|grey', tan: 'beige|camel',
  grey: 'grey|light grey', charcoal: 'grey|black', white: 'white', black: 'black',
  brown: 'brown', espresso: 'brown', camel: 'camel', cognac: 'camel|rust|brown',
  burgundy: 'burgundy', plum: 'burgundy|purple',
  navy: 'navy', indigo: 'navy|blue', denim: 'denim|light blue', slate: 'denim|grey',
  lightblue: 'light blue', blue: 'blue', anyblue: 'blue|light blue|denim|navy',
  forest: 'forest|green', green: 'green|forest|sage|lime', olive: 'olive', sage: 'sage',
  yellow: 'yellow', lime: 'lime|yellow', teal: 'teal', red: 'red', pink: 'pink',
  purple: 'purple|magenta', lavender: 'purple|pink', rust: 'rust|orange', orange: 'orange|rust',
  earth: 'brown|camel|beige|olive|rust',
};

// One color alone = head-to-toe (monochrome). Biggest matching combo wins.
export const COMBOS = [
  // monochrome
  'black: confident, understated', 'white: crisp', 'brown: heritage', 'beige: refined', 'grey: sleek', 'cream: inviting', 'olive: rugged',
  // neutrals
  'navy + black: disciplined', 'grey + white: clean', 'brown + cream: sophisticated', 'beige + white: warm and polished',
  'taupe + cream: tonal warmth', 'navy + brown: classic depth', 'taupe + navy: understated cool', 'white + navy: casually sharp',
  'white + black: all-time classic', 'navy + grey: intellectual cool', 'navy + lightblue: tonal and fresh', 'navy + denim: cohesion',
  'black + taupe: low key', 'black + cream: precise', 'grey + cream: soft balance', 'black + grey: stoic', 'brown + black: editorial',
  'taupe + denim: classic', 'denim + white: effortless', 'white + slate: unexpectedly refined',
  // brown, camel, cognac
  'brown + anyblue: timeless charm', 'brown + olive: safari chic', 'brown + yellow: golden', 'pink + brown: slow burn',
  'camel + cream: upscale', 'camel + olive: rustic', 'camel + black: alluring', 'camel + navy: timeless', 'camel + grey: cerebral',
  'denim + cognac: Americana ease', 'black + cognac: dark sophistication', 'cream + cognac: warm elegance', 'beige + cognac: desert luxe', 'brown + cognac: tonal depth',
  // greens
  'forest + cream: grounded', 'forest + white: classy', 'forest + grey: low key', 'forest + brown: rustic', 'forest + navy: nautical', 'forest + black: mysterious', 'forest + taupe: refined',
  'olive + navy: earthy, effortless', 'olive + white: classically rugged', 'olive + black: grounded', 'olive + slate: mellow', 'olive + burgundy: harmony',
  'sage + cream: gentle', 'sage + grey + brown: down to earth', 'beige + olive: timeless', 'cream + olive + black: sharp',
  // blues
  'blue + white: coastal', 'blue + brown: rich', 'blue + yellow: fresh', 'blue + black: moody', 'blue + taupe: refined', 'blue + denim: casual',
  'blue + camel: coastal cowboy', 'blue + teal: blue grotto', 'blue + cream: maritime', 'lightblue + yellow + white: optimistic',
  'blue + white + grey: retro clean', 'brown + navy + white: old money casual', 'black + indigo + white: timeless',
  'denim + beige + black: depth', 'brown + grey + slate: dynamic', 'navy + cream + denim + grey: easy layers',
  // reds, burgundy
  'burgundy + grey: intellectual', 'burgundy + cream: regal', 'burgundy + black: midnight authority', 'burgundy + beige: vintage academia',
  'burgundy + denim: rebel Americana', 'navy + burgundy: bold luxury', 'burgundy + grey + white: refined depth', 'black + olive + burgundy: expensive',
  'red + black: unapologetic', 'red + white: country club', 'red + olive: combat chic', 'red + grey + yellow: 90s off duty',
  'red + cognac: cowboy luxe', 'red + anyblue: retro Cali', 'red + earth: off-duty utility', 'cream + red: ivy heat',
  // yellows, oranges
  'yellow + white: easy going', 'yellow + black: graphic', 'yellow + olive: adventurous', 'yellow + grey: grown', 'yellow + pink: vibrant',
  'white + yellow + grey + black: bright but grounded',
  'orange + olive: heatwave', 'orange + cream: poolside', 'orange + navy: yacht', 'orange + black: sunset', 'rust + tan: smooth',
  // the rest
  'teal + white: refreshing', 'teal + black: deep', 'teal + red: bold', 'teal + navy: tonal', 'teal + brown: earthy',
  'purple + grey: poetic', 'purple + red: chaotic good', 'purple + black: corporate goth', 'purple + green: matcha', 'purple + white: cloud 9', 'purple + brown: jazz club',
  'pink + white: pop star', 'pink + olive: tough love', 'pink + grey: bubblegum grunge', 'pink + red: cherry bomb', 'pink + black: fatal attraction',
  'lime + black: rebel chic', 'lime + white: nomadic heat', 'sage + white + camel: elegant', 'taupe + white + camel: expensive',
  // 2026-11-18 batch (pattern + color reels, @hangingwithmr.jones, @rjmoorelife)
  'forest + denim: easy win', 'charcoal + teal + beige: strong, eased off', 'red + brown: coordinated, not matched', 'black + yellow: monochrome with a pop',
];

// What to wear on top, by the color of the pants. Jeans keyed by wash (as the app reads it).
export const JEANS = {
  'light blue': ['Light wash jeans', 'grey + lightblue + cream'],
  denim: ['Mid wash jeans', 'brown + olive + black + grey'],
  navy: ['Dark wash jeans', 'white + burgundy + camel + green'],
  black: ['Black jeans', 'brown + slate + taupe + black'],
  white: ['Ecru jeans', 'burgundy + brown + lightblue'], beige: ['Ecru jeans', 'burgundy + brown + lightblue'],
  grey: ['Grey jeans', 'cream + yellow + lavender + charcoal'], 'light grey': ['Grey jeans', 'cream + yellow + lavender + charcoal'],
  brown: ['Brown jeans', 'navy + pink + forest + black'],
};
export const TROUSERS = {
  black: ['Black pants', 'blue + beige + brown + white + grey'],
  white: ['White pants', 'navy + brown + red + white + forest + grey + black'], beige: ['Beige pants', 'burgundy + forest + sage + red + navy + grey + black'],
  grey: ['Grey pants', 'yellow + burgundy + lightblue + sage'], 'light grey': ['Grey pants', 'yellow + burgundy + lightblue + sage'],
  brown: ['Brown pants', 'lightblue + taupe + black + cream + beige + navy + green'],
  navy: ['Navy pants', 'rust + grey + lightblue + white'],
  camel: ['Camel pants', 'rust + burgundy + lightblue + cream'],
  olive: ['Olive pants', 'brown + black + cream'],
};

// Camo pants work like a neutral (2026-11-18 reels): what each color on top brings.
export const CAMO = ['Camo pants', 'pink + burgundy + white + lightblue + black + brown + yellow + red + orange'];
// Metal tone by the color near it (reel DeaNjY8vRMF): cool and dark colors take silver, warm ones take gold.
export const METAL = { silver: ['black', 'grey', 'light grey', 'navy', 'blue', 'denim', 'light blue'], gold: ['white', 'brown', 'beige', 'camel', 'burgundy', 'olive', 'rust'] };
