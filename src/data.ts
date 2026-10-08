export const WORLD = {
  camStart: 6.4,
  camEnd: -36.05,
  meters: 240,
};

export function depthForY(y: number) {
  const camY = y + 1.25;
  const t = (WORLD.camStart - camY) / (WORLD.camStart - WORLD.camEnd);
  return Math.min(1, Math.max(0, t));
}

export type Slide = { src: string; alt: string; caption: string };

export type Project = {
  id: string;
  num: string;
  title: string;
  kicker: string;
  category: string;
  year: string;
  role: string;
  practice: string;
  summary: string;
  whisper: string;
  y: number;
  slides: Slide[];
};

/** Public URL for a file in `public/`, respecting Vite's base path. */
export function mediaUrl(path: string) {
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\//, "")}`;
}

const img = (path: string) => mediaUrl(`media/${path}.webp`);

export const projects: Project[] = [
  {
    id: "sjwd",
    num: "01",
    title: "SJWD Water District",
    kicker: "Startex · Jackson · Wellford · Duncan",
    category: "Identity & communications",
    year: "2026",
    role: "Visual Communications Intern, then Specialist",
    practice: "Illustration, identity, print, and public notices",
    summary:
      "Began working for SJWD as a Visual Communications Intern in June 2026, and stayed on as a Specialist. The published work is a full illustrated voice for the water district: a welcome, merch, a 70-year mark, a watershed map, wildlife stickers, and safety and customer notices.",
    whisper: "a water district, drawn by hand",
    y: -1.6,
    slides: [
      {
        src: img("sjwd/system"),
        alt: "SJWD illustrated identity sheet with water tower, boat, eagle, and local landmarks",
        caption: "Illustrated identity system for SJWD Water District.",
      },
      {
        src: img("sjwd/welcome"),
        alt: "Welcome sign reading We're glad you're here",
        caption: "Welcome lockup. “We’re glad you’re here.”",
      },
      {
        src: img("sjwd/tote"),
        alt: "Tote bag printed with the SJWD illustration system",
        caption: "The system, carried. Tote application.",
      },
      {
        src: img("sjwd/mug"),
        alt: "Mug with an illustrated bridge, tree, and SJWD wordmark, est. 1956",
        caption: "Mug illustration. Bridge, tree, and the 1956 mark.",
      },
      {
        src: img("sjwd/seventy"),
        alt: "Circular badge reading 70 years of service, filled with water-district illustrations",
        caption: "70 years of service. Illustrated numeral.",
      },
      {
        src: img("sjwd/seal"),
        alt: "Circular seal with the SJWD water tower, 70 years of service, established 1956",
        caption: "Seal. Water tower, est. 1956.",
      },
      {
        src: img("sjwd/drops"),
        alt: "Poster of the SJWD water tower with the line Every drop counts",
        caption: "“Every drop counts.”",
      },
      {
        src: img("sjwd/map"),
        alt: "Illustrated map titled Our Tyger River Watershed",
        caption: "Illustrated map, Our Tyger River Watershed.",
      },
      {
        src: img("sjwd/wildlife"),
        alt: "Four wildlife stickers: bald eagle, blue heron, red hawk, and mallard duck",
        caption: "Watershed wildlife stickers.",
      },
      {
        src: img("sjwd/pass"),
        alt: "Fire extinguisher safety poster teaching PASS: pull, aim, squeeze, sweep",
        caption: "Safety graphic. Remember PASS.",
      },
      {
        src: img("sjwd/meter"),
        alt: "Illustrated water meter maintenance tips",
        caption: "Water meter maintenance tips.",
      },
      {
        src: img("sjwd/alerts"),
        alt: "Customer notification system graphic with a phone alert from SJWD Water District",
        caption: "New customer notification system.",
      },
    ],
  },
  {
    id: "imagine",
    num: "02",
    title: "The Imagine Group",
    kicker: "Hibbett · Charlotte",
    category: "Retail display",
    year: "2025",
    role: "Design intern",
    practice: "Thumbnails, campaign concepts, 3D display models, prototypes",
    summary:
      "Internship work from The Imagine Group in Charlotte. The sequence is hers: a Nike glorifier concept for Hibbett’s Evergreen collection, a Valentine’s program, then Shoe of the Week from thumbnail to a 3D model, a rejected prototype, and the nesting table built for the store.",
    whisper: "a table that made it onto the floor",
    y: -6.4,
    slides: [
      { src: img("imagine/01"), alt: "Nike glorifier concept banner", caption: "Nike Glorifier Concept for Hibbett's \"Evergreen\" Collection" },
      { src: img("imagine/02"), alt: "Valentine's Day program concept, part 1", caption: "Concept model for Hibbett's \"Valentine's Day\" Program (1/3)" },
      { src: img("imagine/03"), alt: "Valentine's Day program concept, part 2", caption: "Concept model for Hibbett's \"Valentine's Day\" Program (2/3)" },
      { src: img("imagine/04"), alt: "Valentine's Day program concept, part 3", caption: "Concept model for Hibbett's \"Valentine's Day\" Program (3/3)" },
      { src: img("imagine/05"), alt: "Thumbnail sketches for the Evergreen collection", caption: "Original thumbnail sketches for Nike/Hibbett's \"Evergreen\" Collection" },
      { src: img("imagine/06"), alt: "Hibbett glorifier concept design, part 1", caption: "Hibbett glorifier concept designs (1/3)" },
      { src: img("imagine/07"), alt: "Hibbett glorifier concept design, part 2", caption: "Hibbett glorifier concept designs (2/3)" },
      { src: img("imagine/08"), alt: "Hibbett glorifier concept design, part 3", caption: "Hibbett glorifier concept designs (3/3)" },
      { src: img("imagine/09"), alt: "Thumbnail sketches for Shoe of the Week", caption: "Thumbnail sketches for Hibbett's \"Shoe of the Week\" display in stores" },
      { src: img("imagine/10"), alt: "First Shoe of the Week display design", caption: "First design drafted for Hibbett's \"Shoe of the Week\" display" },
      { src: img("imagine/11"), alt: "Finished Shoe of the Week nesting table in Charlotte", caption: "Final \"Shoe of the Week\" nesting table located in Charlotte, NC" },
      { src: img("imagine/12"), alt: "3D model of the Shoe of the Week display", caption: "Final 3D \"Shoe of the Week\" model sent to Hibbett for approval" },
      { src: img("imagine/13"), alt: "Shoe of the Week nesting table design", caption: "\"Shoe of the Week\" nesting table design" },
      { src: img("imagine/14"), alt: "Rejected prototype of the Shoe of the Week display", caption: "Prototype of Hibbett's \"Shoe of the Week\" display, ultimately rejected" },
    ],
  },
  {
    id: "frog",
    num: "03",
    title: "Froggy Frenzy",
    kicker: "Creative mockup project",
    category: "Product & prototype",
    year: "2026",
    role: "Concept, identity, and prototype",
    practice: "Boards, logo sketches, turnarounds, a lit physical prototype",
    summary:
      "A gachapon machine taken from a MIRO board to a white-cut prototype with lights strung inside. Concept sketches went to a structure team. The frog design won. She also drew the logo.",
    whisper: "a machine with a frog on it",
    y: -11.2,
    slides: [
      { src: img("frog/machine"), alt: "Froggy Frenzy gachapon machine illustration", caption: "Froggy Frenzy. The frog design." },
      { src: img("frog/miro"), alt: "MIRO board of the gachapon project", caption: "MIRO board depicting my progress from idea to concept and execution" },
      { src: img("frog/concepts"), alt: "Concept sketches of gachapon machines", caption: "Concept sketches of the gachapon design, ultimately went with the frog design" },
      { src: img("frog/turnaround"), alt: "Turnaround sketches of the gachapon machine", caption: "Turnaround sketches of the gachapon machine sent to structure team for feedback" },
      { src: img("frog/logo"), alt: "Logo concept sketches", caption: "Logo concept sketches" },
      { src: img("frog/prototype"), alt: "White cut prototype of the gachapon with internal lights", caption: "White cut prototype of the functional gachapon machine. Internal lights string inside" },
    ],
  },
  {
    id: "plush",
    num: "04",
    title: "Jamie and Juno",
    kicker: "Plush line",
    category: "Character & product",
    year: "2026",
    role: "Character design and manufacturer art direction",
    practice: "Turnarounds, annotated revisions, production notes",
    summary:
      "Original characters Jamie Blackwood and Juno Hornet, drawn as plush concepts and sent to manufacturers. The first draft took three revisions. The notes in the margins are the job: necklace, gum on a shoe, the hawaiian shirt, said clearly enough to sew.",
    whisper: "two characters, stuffed",
    y: -15.8,
    slides: [
      { src: img("plush/juno"), alt: "Juno Hornet plush concept, front and back", caption: "Juno Hornet plush concept sent to manufacturers" },
      { src: img("plush/jamie"), alt: "Jamie Blackwood plush concept", caption: "Jamie Blackwood plush concept sent to manufacturers" },
      { src: img("plush/draft"), alt: "First plush draft", caption: "First plush draft, the full project took 3 revisions before completion" },
      { src: img("plush/side"), alt: "Side view of the first plush draft", caption: "Side view of first plush draft by manufacturers in China" },
      { src: img("plush/feedback"), alt: "Annotated feedback sent to the plush manufacturers", caption: "Example of feedback I would send to manufacturers with clear communication on what I would like completed." },
      { src: img("plush/final-a"), alt: "Final plush design, first of two", caption: "Final plush designs (1/2)" },
      { src: img("plush/final-b"), alt: "Final plush design, second of two", caption: "Final plush designs (2/2)" },
      { src: img("plush/pair"), alt: "Finished Juno and Jamie plush toys sitting together", caption: "The pair, finished." },
    ],
  },
  {
    id: "personal",
    num: "05",
    title: "Personal Work",
    kicker: "Illustration & identity",
    category: "Illustration",
    year: "2024–2026",
    role: "Illustrator",
    practice: "Character, poster, logo, and study",
    summary:
      "Commissions, studies, a club poster, a logo, and original characters. The captions under the pictures are the ones from the original portfolio, kept as written.",
    whisper: "the octopus is holding pictures",
    y: -20.4,
    slides: [
      { src: img("personal/01"), alt: "Illustrated party of tabletop characters walking at night", caption: "Original artwork of player characters in my tabletop role-playing game \"Call of Cthuluhu\" (2025)" },
      { src: img("personal/02"), alt: "Self portrait coloring study", caption: "Self portrait/Coloring study (2025)" },
      { src: img("personal/03"), alt: "Large illustration of a Dungeons and Dragons party in a tavern", caption: "Commission of a \"Dungeons and Dragons\" party celebrating in a tavern. Large scale piece that includes 18 characters (2024)" },
      { src: img("personal/04"), alt: "Blush plush concept artwork", caption: "\"Blush\" Paid plush concept artwork for an original character stuffed animal (2026)" },
      { src: img("personal/05"), alt: "Boso Society logo", caption: "Logo created for \"Boso Society\" (Group created by @santoast on Instagram) (2026)" },
      { src: img("personal/06"), alt: "Commission of a cowboy character", caption: "Commission of a cowboy character by @SirSonty on discord (2025)" },
      { src: img("personal/07"), alt: "Poster for Clemson University's Dungeons and Dragons club", caption: "Poster created for Clemson University's Dungeons and Dragons club (2025)" },
      { src: img("personal/08"), alt: "Poster-style commission referencing Mob Psycho 100", caption: "Commission of a friends original character made to mimic a poster from the anime \"Mob Psycho 100\" (2025)" },
      { src: img("personal/09"), alt: "Lighting study of Jamie Blackwood", caption: "Lighting study of my original character Jamie Blackwood (2024)" },
      { src: img("personal/10"), alt: "Illustration of a wizard casting magic", caption: "Creative illustration of a wizard casting magic for the first time (2024)" },
      { src: img("personal/11"), alt: "Custom Pokemon card illustration of a friend and Giratina", caption: "Illustration for a custom Pokemon card made of my friend and \"Giritina\" (2025)" },
      { src: img("personal/12"), alt: "Commission of two Dungeons and Dragons characters", caption: "Commission of two characters from a clients \"Dungeons and Dragons\" campaign (2026)" },
      { src: img("personal/13"), alt: "Painting study of Tillian Bloom", caption: "Lighting study/Painting study of my original character Tillian Bloom (2024)" },
      { src: img("personal/14"), alt: "Comic of Jamie Blackwood and Marz Thorne", caption: "Comic practice of my two original characters Jamie Blackwood and Marz Thorne (2024)" },
    ],
  },
];

export const personalTentacles = [
  { slide: 0, thumb: mediaUrl("media/thumbs/personal-01.webp") },
  { slide: 2, thumb: mediaUrl("media/thumbs/personal-03.webp") },
  { slide: 3, thumb: mediaUrl("media/thumbs/personal-04.webp") },
  { slide: 4, thumb: mediaUrl("media/thumbs/personal-05.webp") },
  { slide: 6, thumb: mediaUrl("media/thumbs/personal-07.webp") },
  { slide: 8, thumb: mediaUrl("media/thumbs/personal-09.webp") },
];

export const stops = [
  { id: "surface", label: "Surface", depth: 0 },
  { id: "reef", label: "Reef", depth: depthForY(-1.6) },
  { id: "open", label: "Open", depth: depthForY(-15.8) },
  { id: "drop", label: "Drop", depth: depthForY(-25.6) },
  { id: "abyss", label: "Abyss", depth: depthForY(-36.6) },
];

export const relics = [
  {
    id: "clemson",
    title: "Clemson",
    note: "Graphic communications, with a minor in Digital Production Arts. The minor is where still pictures start to move.",
  },
  {
    id: "sjwd",
    title: "SJWD",
    note: "Visual Communications Intern beginning June 2026. Still there, now a Specialist. Startex-Jackson-Wellford-Duncan Water District.",
  },
  {
    id: "imagine",
    title: "Charlotte",
    note: "2025 internship at The Imagine Group. Retail displays for Hibbett, from thumbnail sketches to a nesting table on the floor.",
  },
  {
    id: "dice",
    title: "The table",
    note: "A lot of the illustration is for people who play. Call of Cthulhu, a Clemson D&D club poster, tavern commissions, original characters with campaign names.",
  },
  {
    id: "plush",
    title: "Soft goods",
    note: "Jamie Blackwood and Juno Hornet left the page and came back as plush. Three revisions, notes in the margins, a manufacturer in China.",
  },
  {
    id: "shop",
    title: "@BiggoDoodle",
    note: "The social practice and the shop. Instagram, TikTok, and an Etsy called BiggoDoodle. Commissions, characters, things you can hold.",
  },
];

export const skills = [
  {
    id: "illustration",
    title: "Illustration",
    object: "A brain of coral that keeps glowing.",
    note: "Character, poster, and study. Most of the personal work, and the entire SJWD voice, is drawn.",
  },
  {
    id: "brand",
    title: "Brand identity",
    object: "A shell with a wordmark worn into it.",
    note: "Systems that have to survive a mug, a tote, a seal, and a map. SJWD, Boso Society, Froggy Frenzy.",
  },
  {
    id: "print",
    title: "Print & information",
    object: "A book left open on the sand.",
    note: "Safety steps, meter tips, customer alerts, posters. The words have a job.",
  },
  {
    id: "display",
    title: "Display & dimension",
    object: "A nesting table, small enough to lose.",
    note: "Hibbett’s Shoe of the Week: sketches, a 3D model, a prototype that was rejected, and one that was built in Charlotte.",
  },
  {
    id: "type",
    title: "Typography",
    object: "Letters that refused to sink.",
    note: "Lockups, seals, and hand-drawn type sitting next to a clean sans. The welcome sign is a good example. The PASS poster is another.",
  },
  {
    id: "character",
    title: "Character production",
    object: "Thread, wound and labeled.",
    note: "Turnarounds, callouts, and revision notes specific enough to manufacture. Jamie, Juno, and Blush.",
  },
];

export const jellyNotes = [
  {
    title: "Bell 01",
    body: "Graphic communications at Clemson. The minor is Digital Production Arts — motion and image, sitting beside print.",
  },
  {
    title: "Bell 02",
    body: "June 2026. SJWD Water District. She arrived as a visual communications intern and stayed as a specialist.",
  },
  {
    title: "Bell 03",
    body: "@BiggoDoodle is the sketchbook that grew a shop. Instagram, TikTok, Etsy. Original characters included.",
  },
  {
    title: "Bell 04",
    body: "The deepest bells glow because almost nothing else does. The work down here is still the work.",
  },
];

export const socials = [
  { label: "Instagram", handle: "@biggodoodle", href: "https://www.instagram.com/biggodoodle/" },
  { label: "TikTok", handle: "@biggodoodle", href: "https://www.tiktok.com/@biggodoodle" },
  { label: "Etsy", handle: "BiggoDoodle", href: "https://www.etsy.com/shop/BiggoDoodle" },
  { label: "LinkedIn", handle: "Haley Nichols", href: "https://www.linkedin.com/in/haley-nichols-191a5a3a3" },
];

export const shellIds = ["shell-a", "shell-b", "shell-c", "shell-d", "shell-e"];

export function projectById(id: string) {
  return projects.find((p) => p.id === id) ?? null;
}

export function nextProject(id: string) {
  const i = projects.findIndex((p) => p.id === id);
  return projects[(i + 1) % projects.length];
}
