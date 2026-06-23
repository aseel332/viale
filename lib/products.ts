import { toINR, type Product } from "@/lib/product-utils";

export * from "@/lib/product-utils";

// ── Catalogue ─────────────────────────────────────────────────
// Authored in small base units; `PRODUCTS` (below) exposes ₹ prices.
const RAW_PRODUCTS: Product[] = [
  {
    id: "sauvage-dior",
    name: "Sauvage", brand: "Dior",
    price: 18, rating: 4.9,
    imageSrc: "/top_1.png", tag: "Bestseller",
    notes: ["Bergamot", "Pepper", "Ambroxan", "Vetiver"],
    family: "Fresh", gender: "Men", seasons: ["Summer", "Spring"],
    bottleSizes: [5, 10, 30],
    description: "A raw and noble freshness — the quintessential modern masculine.",
    longDescription: `Sauvage by Dior is a landscape in a bottle — vast, raw, and breathtakingly masculine. 
Conceived by master perfumer François Demachy, it opens with an explosive burst of Calabrian bergamot 
immediately followed by a Sichuan pepper heart that crackles with electric energy.

At its core, Ambroxan — a molecule derived from ambergris — gives the fragrance its now-legendary 
skin-close warmth and projection. Vetiver from the island of Réunion anchors the dry-down with an 
earthy, woody tenacity that lingers for hours after the first spray.

The result is a paradox: wild yet refined, fierce yet approachable. Whether you're stepping into a 
board room or disappearing into the wilderness, Sauvage adapts without compromise. This is modern 
masculinity distilled to its purest expression.`,
  },
  {
    id: "tobacco-vanille-tf",
    name: "Tobacco Vanille", brand: "Tom Ford",
    price: 24, rating: 4.8,
    imageSrc: "/top_2.png", tag: "Top Pick",
    notes: ["Tobacco", "Vanilla", "Tonka Bean", "Sandalwood"],
    family: "Oriental", gender: "Unisex", seasons: ["Autumn", "Winter"],
    bottleSizes: [5, 10, 30],
    description: "An opulent embrace of tobacco and vanilla — rich, dark, and utterly seductive.",
    longDescription: `Tom Ford's Tobacco Vanille is the definition of olfactory opulence. Launched as part of 
the Private Blend collection, this fragrance wraps you in a warm, enveloping accord that feels like 
being draped in the finest cashmere on a cold winter evening.

The opening is immediately rich — spicy tobacco flower and aromatic spices hit the senses with 
confidence, then yield to a luscious heart of vanilla and tonka bean. These sweet, creamy notes 
intertwine with sandalwood and dry fruit to create a complexity that rewards every sniff.

Tobacco Vanille has rightfully earned its cult status among fragrance connoisseurs worldwide. It 
transcends gender and season (though it truly comes alive in cool weather) and performs with 
exceptional longevity. Apply it on pulse points and let the silage do the talking.`,
  },
  {
    id: "aventus-creed",
    name: "Aventus", brand: "Creed",
    price: 30, rating: 4.9,
    imageSrc: "/top_3.png", tag: "Iconic",
    notes: ["Pineapple", "Blackcurrant", "Birch", "Ambergris"],
    family: "Fresh", gender: "Men", seasons: ["Spring", "Summer"],
    bottleSizes: [5, 10, 30],
    description: "Creed's masterpiece — the scent of power, success and ambition.",
    longDescription: `Aventus is Creed's magnum opus — a fragrance that has transcended the world of perfumery 
to become a cultural icon. Inspired by the strength and vision of a legendary 19th-century French 
emperor, it was designed to celebrate success, power, and the determination to achieve.

The opening is spectacular: a bright, tropical burst of pineapple and blackcurrant over bergamot 
and apple. This vibrant fruity opening is deceptive — it transitions seamlessly into a smoky, 
woody heart of birch, rose, and dry jasmine that announces authority and presence.

The base is a deep, soul-stirring composition of musk, oakmoss, ambergris, and vanillin that 
settles into a skin-close signature you'll come back to again and again. No two batches of Aventus 
are exactly alike, which has spawned an entire collector culture around its slight variations. 
Wear it when you want the room to know you've arrived.`,
  },
  {
    id: "baccarat-rouge-mfk",
    name: "Baccarat Rouge 540", brand: "Maison Francis Kurkdjian",
    price: 32, rating: 4.9,
    imageSrc: "/collection_img.png",
    notes: ["Jasmine", "Amberwood", "Cedar", "Saffron"],
    family: "Floral", gender: "Unisex", seasons: ["Spring", "Summer", "Autumn", "Winter"],
    bottleSizes: [5, 10, 30],
    description: "An ethereal, amberwood and floral accord — the internet's most-loved fragrance.",
    longDescription: `Created to celebrate the 250th anniversary of Baccarat crystal, Baccarat Rouge 540 by 
Maison Francis Kurkdjian is a masterpiece of contemporary perfumery. Its liquid structure — the 
way it seems to vibrate and shimmer on the skin — is unlike anything else in the fragrance world.

The opening glows with saffron and jasmine, a warm, slightly metallic opening that hints at 
the complexity to come. The heart reveals amberwood, a proprietary accord that blends amber and 
woody notes into something ineffably warm and luminous — like sunlight refracted through crystal.

Cedar and the effervescent fission accord in the base give the fragrance its airy, lightweight 
finish despite its deep, enveloping warmth. BR540 works across every season, occasion, and 
personality. It is, quite simply, one of the most beautiful things ever put in a bottle.`,
  },
  {
    id: "lost-cherry-tf",
    name: "Lost Cherry", brand: "Tom Ford",
    price: 26, rating: 4.7,
    imageSrc: "/collection_img.png",
    notes: ["Cherry", "Rose", "Tonka Bean", "Benzoin"],
    family: "Gourmand", gender: "Unisex", seasons: ["Autumn", "Winter"],
    bottleSizes: [5, 10, 30],
    description: "Dark, sweet temptation — a cherry that bites back.",
    longDescription: `Lost Cherry is Tom Ford's ode to forbidden fruit — a fragrance that smolders with 
dark sweetness and barely-restrained sensuality. It opens with a burst of tart, juicy black 
cherry, brightened with marasca cherry liqueur and almond milk, creating an accord that is 
simultaneously innocent and provocative.

As the fragrance develops, spicy Turkish rose and clove emerge from the shadows, adding 
a mysterious, almost gothic complexity. The tonka bean and benzoin base envelop everything 
in a warm, resinous sweetness that lasts for hours and draws people closer.

This is not a fragrance for the faint-hearted. Lost Cherry is designed to be noticed, to 
linger, to create memories. It is perfectly calibrated for intimate evenings, candlelit 
dinners, and any moment where you want to leave a lasting impression.`,
  },
  {
    id: "good-girl-ch",
    name: "Good Girl", brand: "Carolina Herrera",
    price: 16, rating: 4.6,
    imageSrc: "/collection_img.png", tag: "Bestseller",
    notes: ["Jasmine", "Cocoa", "Tuberose", "Sandalwood"],
    family: "Oriental", gender: "Women", seasons: ["Autumn", "Winter"],
    bottleSizes: [5, 10, 30],
    description: "The duality of femininity — white florals by day, dark cocoa by night.",
    longDescription: `Good Girl by Carolina Herrera is a statement about the duality of modern womanhood — 
the coexistence of innocence and provocation, light and darkness. Its iconic stiletto-shaped 
bottle houses a fragrance that is equally iconic: a chypre-floral-gourmand that defies easy 
categorization.

The top notes burst with white florals: jasmine and tuberose, luminous and sheer, like 
sunlight on silk. But beneath the surface, a rich, dark undercurrent of cocoa and coffee 
waits. This unexpected pairing — pristine florals meeting indulgent chocolate — is what 
makes Good Girl so endlessly fascinating.

Sandalwood and vanilla in the base lend warmth and depth, ensuring the fragrance evolves 
beautifully throughout the day. Good Girl rewards patience: wear it in the morning and 
discover by evening that it has transformed into something entirely different and even 
more beautiful on your skin.`,
  },
  {
    id: "flowerbomb-vr",
    name: "Flowerbomb", brand: "Viktor & Rolf",
    price: 16, rating: 4.6,
    imageSrc: "/collection_img.png", tag: "Top Pick",
    notes: ["Jasmine", "Rose", "Patchouli", "Vanilla"],
    family: "Floral", gender: "Women", seasons: ["Spring", "Summer"],
    bottleSizes: [5, 10, 30],
    description: "A floral explosion so intense it rewrites the genre.",
    longDescription: `Flowerbomb by Viktor & Rolf is exactly what its name promises — an explosive, 
maximalist floral that overwhelms the senses in the most glorious way possible. Since its 
2005 launch, it has become one of the best-selling fragrances in the world, and for good reason.

The opening is a sambac jasmine and freesia grenade, bright and intoxicating. The heart 
unfolds with a lush bouquet of rose, cattleya orchid, and jasmine — a floral triumvirate 
that is simultaneously soft and overwhelming, like being buried in a garden in full bloom.

Patchouli, musk, and vanilla form a rich, lingering base that anchors all that floral 
exuberance with earthy depth and sweetness. The result is a fragrance that is unabashedly 
feminine and joyful, perfect for spring events, date nights, and any occasion where you 
want to feel like you're wrapped in a thousand flowers.`,
  },
  {
    id: "libre-ysl",
    name: "Libre", brand: "Yves Saint Laurent",
    price: 18, rating: 4.7,
    imageSrc: "/collection_img.png",
    notes: ["Lavender", "Jasmine", "Vanilla", "Musk"],
    family: "Floral", gender: "Women", seasons: ["Spring", "Summer", "Autumn", "Winter"],
    bottleSizes: [5, 10, 30],
    description: "Freedom in a bottle — lavender and jasmine in a bold, unapologetic accord.",
    longDescription: `Libre by Yves Saint Laurent is a manifesto of freedom and femininity. Its breakthrough 
lies in a radical pairing: lavender — traditionally masculine — meets warm, sensual florals 
in a combination that is entirely new and entirely feminine on its own terms.

The opening is a vibrant accord of lavender essence from Provence and mandarin orange, 
fresh and slightly herbal, immediately arresting attention. The floral heart brings together 
orange blossom and lavender water, creating a luminous, almost solar effect on the skin.

A base of Madagascar vanilla and musk gives Libre its staying power and sensual warmth. 
This is not a fragrance that asks permission — it announces itself with quiet confidence 
and stays with you through every season and every mood. It is the olfactory equivalent 
of YSL's fashion legacy: bold, beautiful, and free.`,
  },
  {
    id: "bleu-chanel",
    name: "Bleu de Chanel", brand: "Chanel",
    price: 20, rating: 4.8,
    imageSrc: "/collection_img.png",
    notes: ["Citrus", "Grapefruit", "Sandalwood", "Vetiver"],
    family: "Fresh", gender: "Men", seasons: ["Spring", "Summer"],
    bottleSizes: [5, 10, 30],
    description: "Chanel's defining masculine — free, fresh, and effortlessly elegant.",
    longDescription: `Bleu de Chanel is the distillation of Chanel's masculine ideal — a man who is free 
from convention, who writes his own rules. Perfumer Jacques Polge composed this aromatic 
woody fragrance to capture exactly that spirit of independence and subtle sophistication.

The opening is a clean, invigorating burst of citrus — grapefruit, lemon, mint — with a 
warm, spicy undertone of ginger. The transition to the woody heart reveals notes of 
nutmeg, jasmine, and dry cedar, creating a warm yet airy accord that feels like a 
perfectly tailored suit.

The base of sandalwood, patchouli, and vetiver provides an elegant, long-lasting 
foundation that is simultaneously earthy and refined. Bleu de Chanel has the rare quality 
of being appropriate for every occasion — boardroom or beach, first date or family dinner. 
It is the definition of effortless luxury.`,
  },
  {
    id: "black-orchid-tf",
    name: "Black Orchid", brand: "Tom Ford",
    price: 22, rating: 4.8,
    imageSrc: "/collection_img.png",
    notes: ["Black Orchid", "Patchouli", "Vetiver", "Incense"],
    family: "Oriental", gender: "Unisex", seasons: ["Autumn", "Winter"],
    bottleSizes: [5, 10, 30],
    description: "Dark, velvety glamour — Tom Ford's most mysterious creation.",
    longDescription: `Black Orchid by Tom Ford is an exercise in dark luxury — opulent, mysterious, and 
deeply sensual. It was Tom Ford's first fragrance under his own label, and it announced 
his olfactory vision with unmistakable authority: this is perfumery as seduction.

The opening is immediately intoxicating: a rich, dark blend of black truffle, ylang-ylang, 
and top notes of black orchid (a complex, proprietary accord) that creates a floral-gourmand 
opening unlike anything else. The effect is simultaneously earthy and opulent, like velvet 
against skin.

As the fragrance evolves, patchouli, dark chocolate, and incense emerge, deepening the 
mystery. The base of sandalwood, vetiver, and amber provides an incredibly tenacious 
foundation that projects quietly but insistently for hours. Black Orchid rewards those 
who wear it with patience — it changes constantly and always, always surprises.`,
  },
  {
    id: "miss-dior",
    name: "Miss Dior", brand: "Dior",
    price: 20, rating: 4.8,
    imageSrc: "/collection_img.png",
    notes: ["Rose", "Iris", "Jasmine", "Peony"],
    family: "Floral", gender: "Women", seasons: ["Spring", "Summer"],
    bottleSizes: [5, 10, 30],
    description: "The original Dior feminine — an exquisite rose wrapped in chypre.",
    longDescription: `Miss Dior is the quintessential Dior feminine — a fragrance with a legacy that 
stretches back to Christian Dior's first fashion show in 1947. Though it has evolved over 
the decades, Miss Dior retains the soul of that original creation: joyful, romantic, and 
unmistakably feminine.

The contemporary version opens with a vibrant chypre accord brightened by blood orange 
and bergamot, immediately fresh and elegant. The heart is where the magic lives: 
a luminous rose de Grasse — some of the world's most precious rose — blooms alongside 
jasmine and peony in a floral bouquet of extraordinary refinement.

Patchouli and musk in the base add just enough depth and texture to prevent the florals 
from becoming saccharine. The result is a perfect balance — feminine without being 
girlish, romantic without being sentimental. Miss Dior is the fragrance equivalent of 
the perfect little black dress: timeless, appropriate everywhere, and always beautiful.`,
  },
  {
    id: "coco-mad-chanel",
    name: "Coco Mademoiselle", brand: "Chanel",
    price: 22, rating: 4.9,
    imageSrc: "/collection_img.png", tag: "Iconic",
    notes: ["Orange", "Rose", "Vetiver", "Patchouli"],
    family: "Chypre", gender: "Women", seasons: ["Spring", "Summer", "Autumn", "Winter"],
    bottleSizes: [5, 10, 30],
    description: "The bold spirit of Coco Chanel reborn for a new generation.",
    longDescription: `Coco Mademoiselle by Chanel is a tribute to the free-spirited boldness of Coco Chanel 
herself — a fragrance designed for a woman who is sensual, spontaneous, and gloriously 
independent. Since its 2001 launch, it has become one of the world's best-loved fragrances.

The opening is a vibrant citrus-oriental burst — orange, bergamot, and grapefruit — 
fresh and immediately captivating. The heart reveals the true character of the fragrance: 
a sumptuous Turkish rose and jasmine accord, warm and deeply feminine, that is the 
olfactory heart of this composition.

The base is where Coco Mademoiselle truly distinguishes itself: vetiver, patchouli, 
and white musk create a sophisticated, earthy depth that is both modern and timeless. 
The drydown is extraordinary — intimate, sensual, and unmistakably Chanel. This is 
the fragrance you wear when you want to feel utterly, powerfully yourself.`,
  },
  {
    id: "oud-wood-tf",
    name: "Oud Wood", brand: "Tom Ford",
    price: 28, rating: 4.7,
    imageSrc: "/collection_img.png",
    notes: ["Oud", "Sandalwood", "Vetiver", "Rosewood"],
    family: "Woody", gender: "Men", seasons: ["Autumn", "Winter"],
    bottleSizes: [5, 10, 30],
    description: "Rare oud distilled to its purest, most sophisticated expression.",
    longDescription: `Oud Wood by Tom Ford is a landmark in Western perfumery's love affair with oud — 
the rare, precious resin from the agar tree that has been prized in the Middle East for 
millennia. Tom Ford strips away the complexity and baroque ornamentation of traditional 
oud fragrances to present something purely refined.

The opening is immediately distinctive: rare oud wood, rosewood, and cardamom create 
a warm, spicy-woody accord that feels simultaneously ancient and contemporary. There is 
no sweetness here, no concession — just the honest, slightly smoky character of this 
precious material.

Sandalwood, vetiver, and amber in the heart and base weave a sophisticated tapestry 
around the oud, giving the fragrance incredible depth and texture. The dry-down is a 
thing of beauty: close-to-the-skin, warm, slightly smoky, and extraordinarily tenacious. 
Oud Wood is the fragrance of quiet power — worn by those who need no introduction.`,
  },
  {
    id: "spicebomb-vr",
    name: "Spicebomb Extreme", brand: "Viktor & Rolf",
    price: 22, rating: 4.6,
    imageSrc: "/collection_img.png",
    notes: ["Tobacco", "Vanilla", "Cayenne", "Cardamom"],
    family: "Oriental", gender: "Men", seasons: ["Autumn", "Winter"],
    bottleSizes: [5, 10, 30],
    description: "The original Spicebomb, amplified to explosive intensity.",
    longDescription: `Spicebomb Extreme by Viktor & Rolf takes the DNA of the original Spicebomb and 
pushes it into darker, richer territory — an intensified oriental that is built for 
those who believe that "too much" is never enough. The grenade-shaped bottle is no longer 
just a design choice; it's a promise.

The opening detonates with cayenne, cinnamon, and cardamom — a warm, spicy shrapnel 
that coats the skin with immediate presence and projection. If the original Spicebomb 
sparkles, the Extreme smolders: deeper, more sustained, more enveloping.

The tobacco and vanilla heart is where Extreme truly earns its name. Rich tobacco flower — 
aromatic and slightly floral — combines with creamy vanilla in an accord of deep, sensual 
warmth. The base of vetiver, leather, and woody musks ensures the fragrance settles 
into something insistently masculine and long-lasting. A cold-weather essential.`,
  },
  {
    id: "lavb-lancome",
    name: "La Vie Est Belle", brand: "Lancôme",
    price: 14, rating: 4.5,
    imageSrc: "/collection_img.png",
    notes: ["Iris", "Jasmine", "Praline", "Patchouli"],
    family: "Gourmand", gender: "Women", seasons: ["Spring", "Summer", "Autumn", "Winter"],
    bottleSizes: [5, 10, 30],
    description: "Life is beautiful — and so is this joyful iris and praline accord.",
    longDescription: `La Vie Est Belle — "life is beautiful" — is a fragrance built on a philosophy of 
happiness and gratitude. Created by perfumers Anne Flipo, Dominique Ropion, and Loc 
Dong, it captures the essence of choosing your own path and finding beauty in that freedom.

The fragrance opens with a bright, optimistic burst of black currant and pear, a 
luminous fruity accord that immediately lifts the spirits. The heart — iris, jasmine, 
and orange blossom — is a sophisticated floral blend that provides depth and femininity 
without ever becoming heavy or overwhelming.

The base is where La Vie Est Belle earns its warmth: a luscious praline, vanilla, and 
patchouli accord that is undeniably gourmand but balanced by the sophistication of the 
iris heart. The result is a fragrance that smells genuinely joyful — warm, sweet, and 
full of life. A perfect everyday signature for those who want their fragrance to smile.`,
  },
  {
    id: "si-intense-armani",
    name: "Sì Intense", brand: "Giorgio Armani",
    price: 18, rating: 4.7,
    imageSrc: "/collection_img.png",
    notes: ["Blackcurrant", "Rose", "Patchouli", "Vanilla"],
    family: "Chypre", gender: "Women", seasons: ["Autumn", "Winter"],
    bottleSizes: [5, 10, 30],
    description: "An intense, modern chypre — femininity amplified.",
    longDescription: `Sì Intense by Giorgio Armani takes the successful DNA of the original Sì and transforms 
it into something deeper, more dramatic, and intensely sensual. This is femininity without 
apology — confident, passionate, and undeniably present.

The opening is immediate and arresting: a burst of blackcurrant nectar brightened by 
bergamot creates a fruity-chypre accord that feels both contemporary and classic. 
The transition to the heart is seamless — modern chypre woods and a restrained rose 
accord add sophistication and depth without competing with the fruit.

Vanilla, patchouli, and a signature wood accord in the base give Sì Intense extraordinary 
tenacity and projection. The fragrance develops beautifully over time, becoming increasingly 
warm and intimate as it melds with the skin. This is the scent you wear when you want to 
be remembered — the one they'll ask about the morning after.`,
  },
  {
    id: "hacivat-nishane",
    name: "Hacivat", brand: "Nishane",
    price: 26, rating: 4.7,
    imageSrc: "/collection_img.png",
    notes: ["Pineapple", "Oakmoss", "Cedar", "Jasmine"],
    family: "Fresh", gender: "Unisex", seasons: ["Spring", "Summer"],
    bottleSizes: [5, 10, 30],
    description: "A Turkish artisan masterwork — pineapple and oakmoss in perfect harmony.",
    longDescription: `Hacivat by Nishane is the fragrance that introduced much of the Western world to this 
extraordinary Turkish niche house. Named after the witty character from Karagöz — the 
traditional Turkish shadow puppet theatre — Hacivat embodies complexity and artistry.

The opening is a head-turning pineapple and bergamot accord, bright and tropical without 
being novelty. It announces confidence and playfulness in equal measure. But Hacivat 
immediately reveals its depth: a green, slightly aquatic middle note of oakmoss and 
jasmine unfolds beneath the tropical brightness, adding remarkable complexity.

The base of cedar, vetiver, and woody musks grounds everything in substance and elegance. 
Hacivat has the rare quality of being simultaneously impressive and wearable — it performs 
in a boardroom as naturally as on a sun-drenched terrace. For those who want to discover 
what niche perfumery is truly capable of, Hacivat is the perfect introduction.`,
  },
  {
    id: "black-opium-ysl",
    name: "Black Opium", brand: "Yves Saint Laurent",
    price: 16, rating: 4.7,
    imageSrc: "/collection_img.png",
    notes: ["Coffee", "Vanilla", "White Flowers", "Patchouli"],
    family: "Oriental", gender: "Women", seasons: ["Autumn", "Winter"],
    bottleSizes: [5, 10, 30],
    description: "Coffee and white flowers — a rock 'n' roll oriental for the modern woman.",
    longDescription: `Black Opium by Yves Saint Laurent is a modern classic — a fragrance that successfully 
marries the rebellious spirit of rock with the sophistication of high perfumery. Its 
central accord — coffee and white flowers — is as unexpected as it is genius.

The opening is a glittering burst of pink pepper and adrenaline, the olfactory equivalent 
of the first chord of a great song. Then coffee — rich, dark, roasted — explodes into 
the composition, unlike anything in mainstream feminine perfumery before it.

White flowers (jasmine and orange blossom) weave through the coffee accord, providing 
femininity and softness that prevent the coffee from becoming overwhelming. The base of 
patchouli, cedar, and vanilla warms everything into a deeply sensual, long-lasting 
signature. Black Opium is a confidence-builder: wear it when you need to own the room.`,
  },
];
// Catalogue with prices converted to ₹ (single source of truth for the app).
export const PRODUCTS: Product[] = RAW_PRODUCTS.map((p) => ({
  ...p,
  price: toINR(p.price),
}));

/** Cheapest 5ml price across the catalogue, in ₹ — used for "from ₹…" copy. */
export const MIN_BASE_PRICE = Math.min(...PRODUCTS.map((p) => p.price));
