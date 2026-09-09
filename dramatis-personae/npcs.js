/* ============================================================
   npcs.js — Dramatis Personae data for Portents & Fortunes.
   Each NPC has a narrative `bio` (bio card) and, where statted,
   a `stat` block (play card). Statblock text is reproduced
   VERBATIM from the L5R5e core corpus (titterpig-dsl-l5r5e/0.4,
   l5r5e-0.4-core-npcs.ttrpg) — only whitespace / dice-glyph
   transforms. Own narrative prose is bio-only.
   ============================================================ */
window.NPCS = [

  // ---- Seiya Mori — provincial daimyō (canonical Venerable Provincial Daimyō chassis) ----
  {
    id: "seiya-mori",
    reveal: ["name", "epithet", "portrait", "desc", "bio0"],
    portrait: "../assets/npc/seiya-mori.webp",
    name: "Seiya Mori",
    epithet: "Provincial Daimyō",
    affil: "Dragon · Seiya (a vassal family of the Agasha)",
    statNote: "Statted on the core Venerable Provincial Daimyō block (core p.315) pending a bespoke build.",
    bio: [
      "Lord of the province in which White Flower Village sits, and the hand behind the consolidation. Two or three villages of the province are being given up entirely, their remaining people divided among the settlements that can still carry them — and the order carries a daimyō's authority. The Seiya are a vassal family sworn to the Agasha, and through them to the Dragon; a daimyō of that line answers to Agasha interests while governing in their own name.",
      "The reasoning offered is arithmetic: the mountains are hard, the terraces are failing, and a village past a certain thinness costs more than it returns. Whether that is the whole of it, and on whose counsel it was decided, Norikage does not know. He walks with one of the displaced groups, but not under this lord's command."
    ],
    status: "Named, unmet · ordered the consolidation · Norikage observes it from outside his chain of command",
    stat: {
      kind: "Adversary",
      combatRank: 7, intrigueRank: 6,
      description: "The typical daimyō is stern, serious, and inured to flattery. Their time is valuable, so they appreciate brevity and clarity from any samurai who address them. While most no longer take up arms often, they can be extremely deadly in battle, for they often possess arms and armor of surpassing quality and a lifetime of experience fighting to maintain what is theirs at court and in combat.",
      rings: { air:3, earth:4, fire:4, water:4, void:4 },
      endurance:14, composure:16, focus:7, vigilance:4,
      honor:55, glory:70, status:65,
      demeanor:"Assertive", tnMods:"Earth +2, Air -2",
      skills: { artisan:2, martial:4, scholar:3, social:3, trade:1 },
      advantages: [
        "Wisdom of Experience: (void) Scholar; Mental",
        "Bolstering Presence: (earth) Social; Interpersonal"
      ],
      disadvantages: [
        "Long at Court: (water) Martial; Mental, Physical"
      ],
      weapons: [
        "Wakizashi: Range 0–1, Damage 3, Deadliness 5/7, Ceremonial, Razor-Edged"
      ],
      gear: [ "Calligraphy set", "personal chop" ],
      gearOther: [ "Daishō", "plated armor (Physical 5, Cumbersome, Durable, Wargear)", "various estates" ],
      abilities: [
        { name:"Lord’s Command", text:"Once per scene, as a Support action, a daimyō may advise a character who can hear them on how to complete a task they wish the character to perform. The character may use the daimyō’s ring or skill in place of their own for the next check they make to complete this task before the end of the game session." }
      ]
    }
  },

  // ---- Seiya Fusae — the officer of the escort (canonical Loyal Bushi chassis) ----
  {
    id: "seiya-fusae",
    reveal: ["name", "epithet", "portrait", "desc", "bio0"],
    portrait: "../assets/npc/seiya-fusae.webp",
    name: "Seiya Fusae",
    epithet: "Officer of the Escort",
    affil: "Dragon · Seiya · Mirumoto Two-Heavens Adept, trained at Iron Mountain Dojo",
    statNote: "Statted on the core Loyal Bushi block (core p.312), unmodified, with two additions for her niten training: the wakizashi line from Mirumoto Kichiru, Thwarted Duelist (Writ of Wilds), since Two Heavens needs a second readied blade, and that same NPC's Two Heavens Style ability re-skinned to her. Pending a bespoke build.",
    bio: [
      "Twenty-two years old, and in command of the ashigaru walking the displaced households east to White Flower Village. The Seiya are a vassal family of the Agasha, and virtually every Dragon shugenja is Agasha — so a Seiya daughter who is not attuned to the kami cannot train with her own parent family. She went instead to Iron Mountain Dojo, the academy for most Dragon bushi and the center of excellence for niten, where instruction is famously unfocused by Rokugani standards and students are encouraged to follow their interests. She followed hers to the two-sword style.",
      "The result is an officer taught to fight one person extremely well, handed a column of families, carts and levies instead. The ashigaru under her are mostly older men; her authority over them rests on nothing but rank, because nothing in her education touches this work. She knows it, and so do they. She does not speak about religious matters at all — whether from caution or from ignorance, Norikage cannot yet tell. It is worth his considering that the silence may be his own doing: a monk sent by a temple, in a religious capacity, for reasons nobody explained to her, is an excellent reason to say nothing."
    ],
    status: "On the road with him · commands the escort · silent on anything to do with the kami",
    stat: {
      kind: "Adversary",
      combatRank: 4, intrigueRank: 2,
      description: "Bushi are warriors: armed samurai who are professional soldiers in service to their clan. PCs might encounter bushi individually, or they might meet an organized body, which could be anything from a squad (or guntai) of up to a dozen bushi commanded by a sergeant (or gunsō) to an entire army on the march.",
      rings: { air:2, earth:3, fire:3, water:3, void:2 },
      endurance:12, composure:9, focus:5, vigilance:3,
      honor:55, glory:50, status:39,
      demeanor:"Assertive", tnMods:"Earth +2, Air -2",
      skills: { artisan:1, martial:3, scholar:2, social:1, trade:0 },
      advantages: [
        "Tested in War: (earth) Martial; Mental, Physical",
        "Sworn to Bushidō: (void) Social; Mental"
      ],
      disadvantages: [
        "Hot-Tempered: (water) Social; Mental"
      ],
      weapons: [
        "Katana: Range 1, Damage 4, Deadliness 5/7, Ceremonial, Razor-Edged",
        "Wakizashi: Range 0–1, Damage 3, Deadliness 5/7, Ceremonial, Razor-Edged",
        "Yumi (Bow): Range 2–5, Damage 5, Deadliness 3"
      ],
      gear: [ "Lacquered armor (Physical 4, Ceremonial, Cumbersome, Wargear)", "wakizashi", "quiver", "yari (spear)", "knife" ],
      gearOther: [ "Plain robes (Physical 1, Mundane)", "a handful of koku and bu" ],
      abilities: [
        { name:"Two Heavens Style", tag:"Niten", text:"Once per round, when performing an Attack action, Fusae may spend (op) as follows: (op): Perform a Strike Action with a readied weapon she has not used for an Attack action this turn." },
        { name:"Crescent Moon Style", text:"When performing a Guard action (see page 264), the bushi may spend (op) in the following way: (op): After another character performs an Attack action targeting the bushi or another character the bushi is guarding, the bushi may perform a Strike action targeting them. This effect persists until the start of the bushi’s next turn or until they perform a Strike action." },
        { name:"Sworn Protector", text:"Once per scene, when an Attack action check targeting another character at range 0–1 succeeds, a bushi may intervene, becoming the target of the action instead." }
      ]
    }
  },


  // ================= THE VILLAGERS =================
  // White Flower is administered by FOUR elders — Kitsuki Sadao, Ume, Heisuke, Nui
  // — plus the three arriving with the column. Tōbei is not an elder; he is married
  // to Ume, and is the one villager deliberately left unstatted. Villager chassis
  // and the template overlays are from Path of Waves; ability text is VERBATIM.
  // Bios carry only what is SET — proposals live behind the veil, not here.

  // ---- Arriving with the column ----
  {
    id: "genzo",
    reveal: ["name", "epithet", "portrait", "desc", "bio0", "bio2"],
    portrait: "../assets/npc/genzo.webp",
    name: "Genzō",
    epithet: "Of the village being given up",
    affil: "Arriving with the column · Perfect Land Sect",
    statNote: "Clever Innkeeper (Path of Waves) under the Desperate NPC Template (Path of Waves): +1 combat rank, +1 Fire, +1 Martial and Social. Card: The Chariot, reversed. Before the move he would have taken the Galvanizing template instead — the swap is the reversal, in one line.",
    bio: [
      "The removal has broken him. His farm was in the village being given up, and his ancestors are buried there. His difficulty is practical before it is theological: he is a Fortunist who does not know the spirits of the place he is being sent to, and who no longer has access to his own dead.",
      "What he was before the order came is legible only in what is left of it.",
      "He is a devotee of the Perfect Land Sect. Norikage read the kie off his lips at a distance, given back to Ume in greeting — which is how a line of carts became a welcome without anyone in authority deciding anything."
    ],
    status: "Arriving · cut off from his ancestors · took the kie",
    stat: {
      kind: "Minion", combatRank: 2, intrigueRank: 2,
      description: "A man of the emptied village, walking east with what he could carry. He speaks for people who no longer have a place to speak for.",
      rings: { air:2, earth:2, fire:2, water:2, void:1 },
      endurance:6, composure:7, focus:3, vigilance:2,
      honor:20, glory:23, status:9,
      demeanor:"Shrewd", tnMods:"Air +2, Fire -2",
      skills: { artisan:0, martial:1, scholar:1, social:3, trade:3 },
      advantages: [ "Indomitable Will: (earth) Interpersonal, Mental" ],
      disadvantages: [ "Fear of Death: (earth) Mental, Physical" ],
      weapons: [], gear: [ "Passable clothes", "handful of bu" ],
      abilities: [ { name:"Overlooked", text:"When the clever innkeeper makes a check targeting a character with a higher status rank, the innkeeper treats the target's vigilance as 1 lower." } ]
    }
  },

  {
    id: "kiyo",
    reveal: ["name", "epithet", "portrait", "desc", "bio0"],
    portrait: "../assets/npc/kiyo.webp",
    name: "Kiyo",
    epithet: "Widow of the column",
    affil: "Arriving with the column",
    statNote: "Clever Innkeeper (Path of Waves) under the Galvanizing NPC Template (Path of Waves): +2 intrigue rank, +1 Water, +1 Scholar and Social, demeanor Assertive. Card: Two of Cups, upright.",
    bio: [
      "A widow in her fifties. She holds that the move is logically necessary and is working to see the good in it, which makes her the easiest of the arriving three for a samurai to deal with. A shameless flirt."
    ],
    status: "Arriving · argues the move's necessity · the bridge between benches",
    stat: {
      kind: "Minion", combatRank: 1, intrigueRank: 4,
      description: "A widow who has decided, out loud and repeatedly, that this can be borne. Half the column finds that steadying and the other half finds it unbearable.",
      rings: { air:2, earth:2, fire:1, water:3, void:1 },
      endurance:6, composure:7, focus:3, vigilance:2,
      honor:20, glory:23, status:9,
      demeanor:"Assertive", tnMods:"Earth +2, Air -2",
      skills: { artisan:0, martial:0, scholar:2, social:3, trade:3 },
      advantages: [ "Inspiring: (water) Interpersonal" ],
      disadvantages: [ "Softheartedness: (fire) Interpersonal, Mental" ],
      weapons: [], gear: [ "Passable clothes", "handful of bu" ],
      abilities: [ { name:"Overlooked", text:"When the clever innkeeper makes a check targeting a character with a higher status rank, the innkeeper treats the target's vigilance as 1 lower." } ]
    }
  },

  {
    id: "rokuro",
    reveal: ["name", "epithet", "portrait", "desc", "bio0"],
    portrait: "../assets/npc/rokuro.webp",
    name: "Rokurō",
    epithet: "The jovial one",
    affil: "Arriving with the column",
    statNote: "Clever Innkeeper (Path of Waves) under the Survivalist NPC Template (Path of Waves): +2 combat rank, +1 Water, +1 Martial and Trade, demeanor Detached. Card: Six of Cups, upright.",
    bio: [
      "The most jovial of them. He enjoys getting a little high and reminiscing, and does not reliably keep hold of the present while he does it."
    ],
    status: "Arriving · good company · an unreliable witness to the current hour",
    stat: {
      kind: "Minion", combatRank: 3, intrigueRank: 2,
      description: "Cheerful, weathered, and most present when talking about a time that is not this one.",
      rings: { air:2, earth:2, fire:1, water:3, void:1 },
      endurance:6, composure:7, focus:3, vigilance:2,
      honor:20, glory:23, status:9,
      demeanor:"Detached", tnMods:"Earth +1, Fire +1, Void -2",
      skills: { artisan:0, martial:1, scholar:1, social:2, trade:4 },
      advantages: [ "Wilderness Survival Knowledge: (water) Mental" ],
      disadvantages: [ "Obtuse: (air) Interpersonal, Mental" ],
      weapons: [], gear: [ "Passable clothes", "handful of bu" ],
      abilities: [ { name:"Overlooked", text:"When the clever innkeeper makes a check targeting a character with a higher status rank, the innkeeper treats the target's vigilance as 1 lower." } ]
    }
  },

  // ---- Already at White Flower ----
  {
    id: "ume",
    reveal: ["name", "epithet", "portrait"],
    portrait: "../assets/npc/ume.webp",
    name: "Ume",
    epithet: "First of the sect",
    affil: "White Flower Village · Perfect Land Sect · married to Tōbei",
    statNote: "Clever Innkeeper (Path of Waves) under the Galvanizing NPC Template (Path of Waves), plus the Perfect Land Sect Member title (Path of Waves) for Trustworthy Cadence. The title's −5 status cannot take her below its floor of 15, and she is already beneath it at 9, so status is unchanged. Card: Queen of Wands, reversed.",
    bio: [
      "Married to Tōbei. They had a child, and the child died. She is the first convert to the Perfect Land Sect in White Flower Village.",
      "Demanding and jealous, with little confidence underneath it, and willing to bully people into agreeing with her from a position of pity.",
      "Sour-faced, and strongly and vocally against the arrival — she argued it with Sadao in front of an outside monk on the first day.",
      "She reversed herself the moment she found her own faith among the newcomers, walked the line taking the measure of all three arriving elders, and ended the argument herself: they are staying. She stands at Sadao's shoulder as his equal in public, which a commoner does not do, and he does not dispute it."
    ],
    status: "White Flower · first convert · opened the village to the newcomers",
    stat: {
      kind: "Minion", combatRank: 1, intrigueRank: 4,
      description: "A bereaved mother who stopped waiting for the Fortunes to be fair, and found a doctrine that promised the reward without the waiting.",
      rings: { air:2, earth:2, fire:1, water:3, void:1 },
      endurance:6, composure:7, focus:3, vigilance:2,
      honor:20, glory:23, status:9,
      demeanor:"Assertive", tnMods:"Earth +2, Air -2",
      skills: { artisan:0, martial:0, scholar:2, social:3, trade:3 },
      advantages: [ "Indomitable Will: (earth) Interpersonal, Mental" ],
      disadvantages: [ "Impatience: (earth) Mental" ],
      weapons: [], gear: [ "Passable clothes", "handful of bu" ],
      abilities: [
        { name:"Overlooked", text:"When the clever innkeeper makes a check targeting a character with a higher status rank, the innkeeper treats the target's vigilance as 1 lower." },
        { name:"Trustworthy Cadence", tag:"Perfect Land", text:"When making a social skill check targeting a character with status 20 or lower, reduce the TN by 1." }
      ]
    }
  },

  {
    id: "kitsuki-sadao",
    reveal: ["name", "epithet", "portrait", "desc", "bio0"],
    portrait: "../assets/npc/kitsuki-sadao.webp",
    name: "Kitsuki Sadao",
    epithet: "The old magistrate",
    affil: "White Flower Village · Dragon · Kitsuki · Fortunist",
    statNote: "Kitsuki Noriko, Conflicted Magistrate (Writ of Wilds) as chassis — the Kitsuki family match — with the Wandering NPC Template's advantage, disadvantage and demeanor (Path of Waves) — so his social TN modifiers are Gruff's, not the chassis's Methodical ones. Two deliberate deviations: the template's +2 combat rank is NOT applied, and Endurance is cut from 12 to 5, both for great age (precedent: Kakita Ryoku, Elder Crane, Endurance 4). Card: Knight of Wands, reversed — Impatience is the template's own disadvantage and carries the reversal exactly.",
    bio: [
      "A samurai of the Kitsuki, and very old. A Fortunist. Two children, both grown, both living far away.",
      "Impatience and a mercurial temper have alienated nearly everyone in the village except one neighbour, who is deaf and keeps him company regardless.",
      "A Fortunist of the ordinary observant sort — no formal training, but decades of drinking with pilgrims on the road north, and the vocabulary of a man for whom the celestial order is simply how things are. He does not know the sect is inside his village.",
      "Seventies or eighties, hunched over a stout walking stick. The wakizashi at his belt is what marks him samurai in a village of peasants. Formerly something like a regional administrator; he has worked this province his whole career and dislikes travel. The two children are in the southern Dragon lands — one in the Kitsuki provinces, one an Emerald Magistrate whose letters arrive from as far as Crab lands. His temper flares and then goes out of him, too tired to reach outrage. It is not personal."
    ],
    status: "White Flower · the only samurai resident · a Fortunist who has not noticed the sect",
    stat: {
      kind: "Adversary", combatRank: 4, intrigueRank: 4,
      description: "A Kitsuki grown old a long way from anywhere the Kitsuki are needed. The eye is undimmed; everything holding it up is not.",
      rings: { air:4, earth:3, fire:3, water:5, void:2 },
      endurance:5, composure:16, focus:7, vigilance:5,
      honor:55, glory:62, status:47,
      demeanor:"Gruff", tnMods:"Water +2, Earth -2",
      skills: { artisan:0, martial:3, scholar:4, social:4, trade:2 },
      advantages: [ "Student of Law: (water) Scholar; Mental", "Seasoned: (void) Mental, Interpersonal" ],
      disadvantages: [ "Conflicted: (fire) Social; Mental", "Impatience: (earth) Mental" ],
      weapons: [
        "Katana: Range 1, Damage 4, Deadliness 5/7, Ceremonial, Razor-Edged",
        "Wakizashi: Range 0–1, Damage 3, Deadliness 5/7, Ceremonial, Razor-Edged"
      ],
      gear: [ "Lacquered Armor (Physical 4, Ceremonial, Cumbersome, Wargear)" ],
      abilities: [ { name:"A Keen Eye", text:"Always uses Focus as base initiative value." } ]
    }
  },

  {
    id: "heisuke",
    reveal: ["name", "epithet", "portrait", "desc", "bio0"],
    portrait: "../assets/npc/heisuke.webp",
    name: "Heisuke",
    epithet: "The craftsman",
    affil: "White Flower Village · Perfect Land Sect",
    statNote: "Traveling Tradesperson (Path of Waves) for its I Can Fix That, plus the Perfect Land Sect Member title (Path of Waves) for Trustworthy Cadence. Two deviations for an expert craftsman who does not travel: Artisan raised 0 → 3, and the base's Worldly Wanderer advantage dropped. The title's −5 status cannot take him below its floor of 15 and he is already beneath it, so status is unchanged. Card: Eight of Pentacles, upright.",
    bio: [
      "An expert craftsman. Never married. Late forties, and by far the youngest voice on the village's bench. Large through the shoulders, working apron, a cloth for his hands that ends up over one shoulder. He claps people he approves of.",
      "A convert to the Perfect Land Sect — and, since the stables, satisfied that Norikage is one as well. Every observation behind that conclusion was accurate. Only the conclusion is wrong."
    ],
    status: "White Flower · craftsman · quick to trust · craft not yet named",
    stat: {
      kind: "Minion", combatRank: 1, intrigueRank: 3,
      description: "The most skilled pair of hands in the village, and the youngest voice on its bench. He works the way the patient work, and is quick to decide he has taken a man's measure.",
      rings: { air:3, earth:1, fire:2, water:2, void:1 },
      endurance:6, composure:8, focus:4, vigilance:3,
      honor:25, glory:25, status:9,
      demeanor:"Shrewd", tnMods:"Air +2, Fire -2",
      skills: { artisan:3, martial:0, scholar:2, social:2, trade:3 },
      advantages: [ "Daikoku's Blessing: (water) Social; Interpersonal, Spiritual" ],
      disadvantages: [ "Deferential: (water) Social; Interpersonal, Mental" ],
      weapons: [], gear: [ "Working clothes", "his tools", "handful of bu" ],
      abilities: [
        { name:"I Can Fix That", text:"Can remove the Damaged condition from most non-supernatural items (rarity 6 or lower). GM determines repairability, cost, and time." },
        { name:"Trustworthy Cadence", tag:"Perfect Land", text:"When making a social skill check targeting a character with status 20 or lower, reduce the TN by 1." }
      ]
    }
  },

  {
    id: "nui",
    reveal: ["name", "epithet", "portrait", "desc", "bio0"],
    portrait: "../assets/npc/nui.webp",
    name: "Nui",
    epithet: "Guide of the pilgrim road",
    affil: "White Flower Village · Fortunist, Shinseist-leaning · leads the pilgrim road",
    statNote: "Dai, Fortunist Monk (Emerald Empire) as chassis — the Fortunist match, and her Herbalist ability suits a village's devout woman. One caveat rather than a deviation: Nui is a laywoman who guides pilgrims, not an ordained monk, so her Status 25 reflects standing earned on the road to the shrine rather than a monastic office. Card: The Hermit, upright.",
    bio: [
      "A Fortunist who leans to the Shinseist side of it: self-reflection, and enlightenment. She leads pilgrims to Seidō Fukurokujin. Reliable and devout.",
      "She escorts pilgrims to the shrine north of the village and back, and coaches them on what crafts to make as offerings."
    ],
    status: "White Flower · leads the pilgrim road · the steadiest of them",
    stat: {
      kind: "Adversary", combatRank: 2, intrigueRank: 4,
      description: "The woman who knows the way to the shrine and the order of the observances, and who walks it often enough that the walking is itself the practice.",
      rings: { air:2, earth:3, fire:2, water:3, void:3 },
      endurance:14, composure:15, focus:4, vigilance:3,
      honor:50, glory:45, status:25,
      demeanor:"Assertive", tnMods:"Earth +2, Air -2",
      skills: { artisan:3, martial:1, scholar:2, social:3, trade:0 },
      advantages: [ "Indomitable Will: (air) Social; Mental" ],
      disadvantages: [ "Softheartedness: (fire) Social; Interpersonal" ],
      weapons: [ "Bō Staff: Range 1–2, Damage 6, Deadliness 2, Mundane" ],
      gear: [ "Robes (Physical 1)" ],
      abilities: [ { name:"Herbalist", text:"When Nui makes a Medicine check targeting a character, she may spend (op) as follows: (op)+: The target removes 1 strife for each (op) spent this way." } ]
    }
  },

  // ---- Forest Troll (core adversary, verbatim — core p.321) ----
  {
    id: "forest-troll",
    reveal: ["name", "epithet", "portrait", "desc", "bio0", "bio2"],
    portrait: "../assets/npc/forest-troll.webp",
    name: "Forest Troll",
    epithet: "Out of its country",
    affil: "Spirits and Strange Beings · Otherworldly",
    statNote: "Core Forest Troll (core p.321), unmodified. Silhouette 4 per its own Ancient and Powerful ability, which overrides the silhouette table's listing of trolls at 3.",
    bio: [
      "Trolls are rare inside the Empire and enter it through the Shinomen Mori on the western border — not through the Dragon mountains. One on a mountain road east of nowhere is a thing that was somewhere else and is not there now, which is the same shape as the disturbed earth kami and the neglected shrines.",
      "Intelligent, unpredictable, and not above eating rude humans.",
      "Eight feet of it, greenish and solid, carrying a rock — which on dangerous ground is what a man's hand on his sword amounts to. It speaks, in something that may be Rokugani and may not. It did not mean to attack: the two of them frightened each other, and when offered a way to stop it took the way. It sat, patted the ground, talked for a quarter of an hour at a monk who understood none of it, then rose satisfied that an accord had been reached and walked back up the road toward White Flower."
    ],
    status: "Met on the road west · parted without blood · walked back toward White Flower",
    stat: {
      kind: "Adversary", combatRank: 7, intrigueRank: 4,
      description: "Inside the Empire, trolls are quite rare, but they occasionally enter via the great forest of the Shinomen Mori on Rokugan’s western border. They are intelligent but unpredictable, and not above eating rude humans.",
      rings: { air:2, earth:4, fire:5, water:4, void:3 },
      endurance:16, composure:9, focus:4, vigilance:3,
      honor:30, glory:10, status:5,
      silhouette:4,
      resist: { physical:1, supernatural:1 },
      demeanor:"Assertive", tnMods:"Earth +2, Air -2",
      skills: { artisan:1, martial:3, scholar:3, social:2, trade:1 },
      advantages: [ "Brute Strength: (fire) Martial; Physical" ],
      disadvantages: [ "Insatiable Appetite: (water) Social; Physical" ],
      weapons: [
        "Massive Cudgel: Range 2, Damage 9, Deadliness 5, Cumbersome",
        "Rending Grip: Range 1, Damage 4, Deadliness 6"
      ],
      gear: [ "Scaled hide (Physical 1, Supernatural 1)", "animal-pelt clothes", "polished skull collection" ],
      abilities: [
        { name:"Ancient and Powerful", text:"A troll is an Otherworldly being of silhouette 4." },
        { name:"Sorcerous Scales", text:"After a troll suffers damage from a physical or supernatural source, increase its resistance to that damage type by 4. This effect persists until it suffers damage from a source of a different type." }
      ]
    }
  },

  // ---- Scholarly Shugenja (core adversary, verbatim) ----
  {
    id: "scholarly-shugenja",
    reveal: ["name", "epithet", "portrait"],
    portrait: "../assets/npc/scholarly-shugenja.webp",
    template: true,
    name: "Scholarly Shugenja",
    epithet: "Adversary · Subjects of Rokugan",
    affil: "A priest who communes with the kami",
    bio: [
      "Shugenja are rare, and are seldom met outside shrines, temples, and libraries — so meeting one anywhere else is itself information about where one is standing. They petition the kami directly, and the kami sometimes answer at a scale nobody nearby can argue with.",
      "For Norikage the difficulty is not reverence but overlap: a shugenja does by invocation much of what he does by discipline, and the two traditions explain each other's results differently."
    ],
    status: "Type template · use for any shrine, temple, or library priest met on the road",
    stat: {
      kind: "Adversary",
      combatRank: 4, intrigueRank: 3,
      description: "Shugenja are holy people, priests who commune with the kami, making invocations to persuade them to cause spectacular and even destructive effects in the Mortal Realm. However, shugenja are rare, and seldom encountered outside of shrines, temples, and libraries.",
      rings: { air:3, earth:3, fire:3, water:3, void:3 },
      endurance:10, composure:12, focus:6, vigilance:3,
      honor:60, glory:45, status:39,
      demeanor:"Ambitious", tnMods:"Fire +2, Water -2",
      skills: { artisan:3, martial:0, scholar:2, social:3, trade:0 },
      advantages: [
        "Mystical Knowledge: (void) Scholar; Mental",
        "Holy Personage: (void) Social; Interpersonal"
      ],
      disadvantages: [
        "Scholar’s Physique: (earth) Martial; Physical"
      ],
      weapons: [
        "Wakizashi: Range 0–1, Damage 3, Deadliness 5/7, Ceremonial, Razor-Edged"
      ],
      gear: [ "Sanctified robes (Physical 1, Supernatural 3, Ceremonial)", "scroll satchel", "offerings" ],
      abilities: [
        { name:"Path to Inner Peace", tag:"Invocation", check:{ tn:2, ring:"water", group:"scholar", label:"Theology (Water)" },
          text:"As a Support action, the shugenja may make a TN 2 Theology (Water) check targeting a character at range 0–2. If the shugenja succeeds, the target removes 3 fatigue, plus 1 per bonus success. A target can only be affected by the Path to Inner Peace invocation once per scene." },
        { name:"The Fires from Within", tag:"Invocation", check:{ tn:3, ring:"fire", group:"scholar", label:"Theology (Fire)" },
          text:"As an Attack action, the shugenja may make a TN 3 Theology (Fire) check targeting up to three characters at range 1–3. If the shugenja succeeds, each target suffers 3 supernatural damage, plus 1 per bonus success. (op)+: Choose 1 additional target per (op) spent this way." },
        { name:"Disciple of Secret Lore", text:"Activation: Choose 0–5 additional invocations (see page 189) and 0–3 additional rituals (see page 212) that this shugenja can perform. Add 1 to this character’s combat rank for each invocation with a prerequisite of rank 3+ chosen this way." }
      ]
    }
  },

  // ---- Trained Ashigaru (core minion, verbatim) ----
  {
    id: "trained-ashigaru",
    reveal: ["name", "epithet", "portrait"],
    portrait: "../assets/npc/trained-ashigaru.webp",
    template: true,
    name: "Trained Ashigaru",
    epithet: "Minion · Subjects of Rokugan",
    affil: "Rank-and-file foot soldier",
    bio: [
      "Drafted commoners under arms. Once drafted they count as the lowest rank of the buke — the samurai caste — without being samurai, which is a distinction they are reminded of from both directions. When the service ends most return to farming or a trade; some stay on as guards, scouts, or dōshin to a magistrate.",
      "Ashigaru in formed ranks mean a clan at war. Ashigaru walking beside carts and families mean something duller, heavier, and harder to refuse."
    ],
    status: "Type template · village guards, drafted levies, a daimyō's escort",
    stat: {
      kind: "Minion",
      combatRank: 2, intrigueRank: 1,
      description: "Ashigaru are the rank-and-file foot soldiers who make up the bulk of Rokugani armies. These foot soldiers are commoners, peasants who have been drafted into military service. Interestingly, once drafted, they are considered to belong to the lowest rank of the buke, the samurai caste, even though they aren’t samurai. When they are not performing military service, ashigaru generally revert to their peasant status as farmers or tradespeople, but some continue to serve as guards or scouts, or as dōshin to magistrates. If the player characters encounter ashigaru in formed bodies of troops, then it is almost certainly because they are from a clan that is at war. Samurai from that clan, such as officers and units of bushi, should be nearby.",
      rings: { air:1, earth:3, fire:2, water:2, void:1 },
      endurance:6, composure:12, focus:6, vigilance:2,
      honor:25, glory:29, status:19,
      demeanor:"Gruff", tnMods:"Water +2, Earth -2",
      skills: { artisan:0, martial:1, scholar:0, social:0, trade:1 },
      advantages: [
        "Strength in Numbers: (earth) Martial; Physical"
      ],
      disadvantages: [
        "Jaded by Battle: (fire) Social; Mental"
      ],
      weapons: [
        "Yari: Range 2, Damage 5, Deadliness 3, Wargear"
      ],
      gear: [ "Ashigaru armor (Physical 3, Wargear)", "knife", "dice and cup or musical instrument", "a handful of bu and zeni" ],
      abilities: [
        { name:"Rank Tactics", text:"When an ashigaru provides assistance (see page 26) to the Martial skill check of another character at range 0–2, that character adds one kept (ring) set to a (su) result instead of rolling an additional die." }
      ]
    }
  },

  // ---- Moon Cultist — type template, built on the core recipe ----
  {
    id: "moon-cultist",
    template: true,
    reveal: ["name", "epithet", "desc", "bio0"],
    name: "Moon Cultist",
    epithet: "Servant of the hungry father",
    affil: "No clan \u00b7 a cult of Onnotangu, Lord Moon",
    statNote: "Built on the core recipe (core p.318 profile, GM chapter): \u201cFor the Moon Cultist profile, use the Wicked Mah\u014d-tsukai but replace their mah\u014d with these invocations: By the Light of the Lord Moon, Summon Fog, Tempest of Air, and Vapor of Nightmares.\u201d Numbers, demeanor, skills and conflict ranks are the chassis unchanged. Three deviations, all for the same reason \u2014 this is Onnotangu\u2019s servant, not Jigoku\u2019s: the Whispers of Fu Leng advantage is dropped, and with it Mark of Desecration and Seeker of Vile Lore, so this cultist raises no dead and is not a Tainted being. Dark Secret replaces the chassis\u2019s Rotting from Within, because Dark Secret is the disadvantage the Moon Cultist title itself assigns. Honor 1 suits a devotee with nothing left to lose; a cultist embedded in society keeps their own standing instead, with the title\u2019s \u22125 to a floor of 15.",
    bio: [
      "Acolytes of Lord Moon come in every form, from the lowliest hinin to members of Imperial families. Becoming one asks nothing but practising the faith without question and reminding others that there is perfection in chaos.",
      "Cults are held to be fringe at best and blasphemy deserving of eradication at worst, so they are secretive in the extreme and can operate at any level of society. Those who keep this one hold that Lord Moon is the preeminent divine figure, and their devotions seek to empower him and hasten his judgment upon his children.",
      "They are as paranoid as their patron. Meetings and rituals happen in moonlight, well away from any town or village \u2014 which in the Dragon mountains is most of the map, and which means the evidence of one is a place rather than a person: a cleared ring somewhere no one had reason to go."
    ],
    status: "Type template \u00b7 use for any devotee of Lord Moon \u00b7 hidden inside whatever else they are",
    stat: {
      kind: "Adversary",
      combatRank: 4, intrigueRank: 3,
      description: "Acolytes of Lord Moon come in all manner of forms, from the lowliest hinin to members of Imperial families. All a person needs to do to become a diligent servant of the hungry father is practice their faith unquestioningly and remind others that there is perfection in chaos.",
      rings: { air:3, earth:4, fire:3, water:3, void:2 },
      endurance:14, composure:8, focus:7, vigilance:3,
      honor:1, glory:15, status:0,
      demeanor:"Ambitious", tnMods:"Fire +2, Water -2",
      skills: { artisan:0, martial:1, scholar:3, social:2, trade:1 },
      advantages: [ "Excellent Liar: (air) Social; Interpersonal" ],
      disadvantages: [ "Dark Secret: (void) Social; Interpersonal" ],
      weapons: [ "Ritual Knife: Range 0, Damage 2, Deadliness 6, Concealable, Razor-Edged" ],
      gear: [ "Concealing mask or cowl" ],
      gearOther: [ "Set of vile scrolls", "Several bu" ],
      abilities: [
        { name:"By the Light of the Lord Moon", tag:"Invocation \u00b7 Rank 1", text:"Activation: As a Scheme action, you may make a TN 2 Theology (Air) check targeting an area at range 0\u20132 of you.\n\nEffects: If you succeed, you scry for each hidden character and concealed object (such as secret compartments, trap doors, and concealed weapons) in the targeted area, revealing it with an illusory, luminous outline that only you can perceive. This invocation only reveals objects and people concealed by mundane means.\n\nNew Opportunities \u2014 Air (op)+: If you succeed, you may also reveal up to one magically concealed object per (op) spent this way.\nAir (op)(op)+: Choose one additional character at range 0\u20131 per (op)(op) spent this way. The chosen characters can also see the objects." },
        { name:"Summon Fog", tag:"Invocation \u00b7 Rank 2", text:"Activation: As a Support action, you may make a TN 2 Theology (Air) check targeting one position at range 0\u20134.\n\nEffects: If you succeed, you summon a fog bank that fills an area extending 1 range band around the target position. This fog bank counts as Obscuring terrain.\n\nNew Opportunities \u2014 Air (op): You may choose a character instead of a position. The fog bank follows that character.\nAir (op)+: The fog bank encompasses 1 additional range band per (op) spent this way (to a maximum of range 6).\nAir (op)(op): The fog bank becomes a freezing ice storm, causing it to become Dangerous terrain as well." },
        { name:"Tempest of Air", tag:"Invocation \u00b7 Rank 1", text:"Activation: As an Attack action, you may make a TN 3 Theology (Air) check targeting each character at range 2\u20133.\n\nEffects: If you succeed, blasts of wind smite each target. Each target suffers supernatural damage equal to your Air Ring and must resist with a TN 4 Fitness check (Earth 5, Fire 2) or suffer the Disoriented condition.\n\nNew Opportunities \u2014 Air (op)+: Each target who fails their Fitness check is also pushed 1 range band away from you per (op) spent this way." },
        { name:"Vapor of Nightmares", tag:"Invocation \u00b7 Rank 3", text:"Activation: As an Attack action, you may make a TN 4 Theology (Air) check targeting one character at range 2\u20133.\n\nEffects: If you succeed, you summon an illusion of your target\u2019s greatest fear. Your target must resist with a TN 4 Meditation check (Earth 5, Fire 2) to see through against this phantasm; if they fail, they suffer strife equal to your Air Ring plus your bonus successes, and must immediately unmask if they become Compromised this way. If they unmask in the presence of the phantasm, they focus their attentions on the phantasm, attacking it, fleeing from it, or unleashing harsh words upon it (rather than dealing with you or anyone else). The phantasm persists for a number of rounds equal to your Air Ring.\n\nNew Opportunities \u2014 Air (op): If a target fails the Meditation check, they also suffer the Disoriented condition." }
      ]
    }
  },

  // ---- Togashi Oharu — bio only (Norikage's lord) ----
  {
    id: "togashi-oharu",
    reveal: ["name", "epithet", "portrait", "desc", "bio0"],
    portrait: "../assets/npc/togashi-oharu.webp",
    name: "Togashi Oharu",
    epithet: "The Abbot",
    affil: "Togashi · Norikage's lord and master of his temple",
    statNote: "Built on Togashi Remmu, Sociable Wanderer (Writ of Wilds) with the Temple Abbot title's Soothing Cadence and Status +10 — re-skinned for the Abbot, pending a bespoke build.",
    bio: [
      "Abbot of the Tattooed Order and the authority to whom Norikage answers. It is Oharu who gave the charge that sets this chronicle in motion: to walk east with a village that is being moved, as an observer in a religious capacity — outside the daimyō's chain of command, responsible for none of the moving — and to report back to the temple. What exactly he is to watch for was not specified. Oharu's age, and true reasons, are not yet known.",
      "Like Norikage, an ise zumi of the Togashi line: the same Blood of the Kami worked into the tattoos, the same plain bō in hand. Norikage has never seen him lose his temper, and has never been sure whether that is discipline or distance."
    ],
    status: "Named but unmet · Norikage's lord and giri",
    stat: {
      kind: "Adversary",
      combatRank: 4, intrigueRank: 4,
      description: "An abbot of the Tattooed Order — an ise zumi who presides over Norikage's temple. Revered as wise and deeply committed to his faith and traditions, he carries a tattooed adept's quiet power beneath a warm and sociable manner.",
      rings: { air:3, earth:3, fire:3, water:4, void:4 },
      endurance:12, composure:14, focus:6, vigilance:4,
      honor:60, glory:72, status:45,
      demeanor:"Outgoing", tnMods:"Water +2, Earth -2",
      skills: { artisan:2, martial:3, scholar:3, social:3, trade:1 },
      advantages: [ "Higher Purpose: (air) Scholar; Mental" ],
      disadvantages: [ "Conciliatory: (fire) Social; Mental" ],
      weapons: [ "Bō (staff): Range 1–2, Damage 6, Deadliness 2, Mundane" ],
      gear: [ "Traveling Clothes (Physical 2, Durable, Mundane, Subtle)", "Wicker satchel", "Journal of personal poetry" ],
      abilities: [
        { name:"Blood of the Kami", text:"When Oharu successfully uses a kihō, they are considered to have three bonus successes for the purposes of resolving the effects of that kihō." },
        { name:"Drawing From Within", text:"Choose four kihō from those listed beginning on page 182 of the Core Rulebook, which Oharu can use. Each is linked to an appropriate tattoo, so they benefit from Blood of the Kami." },
        { name:"Soothing Cadence", tag:"Abbot", text:"When making a skill check to communicate with a group of three or more people, you may keep up to one extra die. If your check succeeds, each other character in the scene removes strife equal to your bonus successes." }
      ]
    }
  },

  // ---- Kaito Juri — Phoenix ishiken, built from her character file ----
  {
    id: "kaito-juri",
    reveal: ["name", "epithet", "portrait", "desc", "bio0"],
    portrait: "../assets/npc/kaito-juri.webp",
    name: "Kaito Juri",
    epithet: "Sent from the Phoenix",
    affil: "Phoenix \u00b7 Kaito \u00b7 Ishiken Initiate School, rank 1 \u00b7 Sage",
    statNote: "Converted from her rank-1 character file into the published NPC profile shape (core p.310\u2013312): rings, derived attributes and social standing are hers unchanged; individual skills are collapsed to skill groups at her best rank in each, which is what the NPC format rolls. The spread the collapse loses \u2014 Theology 3, Fitness 2, Culture 1, Medicine 1, every other skill 0 \u2014 is the truth of her, so Scholar 3 should not be read as Government 3. Conflict ranks estimated: combat 1 for a sage with Martial Arts 0 and no armor, intrigue 2 for a mediator by office whose Social skills are all 0. Demeanor is the one thing the file does not set; Detached is the core Sage template\u2019s own option (p.312) and its Void \u20132 is the opening Norikage is equipped to use.",
    bio: [
      "A Kaito of the Phoenix, sent into the Dragon mountains with an introduction to the abbot of Norikage\u2019s temple. Her fingers move across manuscript pages with a precision that looks like hesitation, deliberate enough that someone watching would wonder whether she knows what she is looking for. She is twenty-odd and holds no office anyone at the temple would recognize.",
      "Her lord is the Phoenix Champion, by way of Kaito Utamuro, and her charge is to mediate disputes inside the clan\u2019s temples where both parties claim righteousness. She discharges it by declining to declare either party wrong, which satisfies nobody. She preserved the Asako library\u2019s disputed manuscripts that way, copying each into the archive exactly as written while the two factions watched her work in silence. Her teachers have begun assigning her the hardest cases for the same reason.",
      "She is an ishiken \u2014 one of the vanishingly rare who can call on the Void directly, trained at the Starry Heaven Sanctuary. Few people in Rokugan know ishiken exist, fewer understand what they do, and to most peasants the abilities look like a sinister practice; ishiken are taught to use discretion. She has not told anyone in the Dragon lands what she is.",
      "An unfamiliar medical or theological text takes her five readings where another scholar needs one, and she knows her teachers watch her struggle. She is going to a shrine of the Fortune of Wisdom.",
      "What she wants is to stop being asked to mediate at all \u2014 one temple\u2019s garden and its records, with no dispute crossing the threshold. She holds Righteousness paramount and Sincerity least, and she is aware those two sit badly together in her."
    ],
    status: "Arriving at the temple \u00b7 an audience with Oharu \u00b7 bound for Seid\u014d Fukurokujin",
    stat: {
      kind: "Adversary",
      combatRank: 1, intrigueRank: 2,
      description: "A Kaito sage of the Ishiken Initiate School. She mediates disputes between people who both believe they are in the right, and does it by refusing to name a loser \u2014 a method that has made her useful to her clan and exhausting to everyone she is sent to.",
      rings: { air:1, earth:3, fire:2, water:1, void:3 },
      endurance:10, composure:8, focus:3, vigilance:1,
      honor:47, glory:45, status:30,
      demeanor:"Detached", tnMods:"Earth +1, Fire +1, Void -2",
      skills: { artisan:0, martial:1, scholar:3, social:0, trade:0 },
      advantages: [
        "Traditional Adherent: (earth) Artisan; Mental",
        "Syncretic Philosophy: (water) Social; Interpersonal, Mental",
        "Local Flare for Dragon Lands: (earth) Scholar; Interpersonal"
      ],
      disadvantages: [
        "Fukurokujin\u2019s Curse: (fire) Scholar; Mental, Spiritual",
        "Whispers of Failure: (fire) Social; Interpersonal, Infamy",
        "Softheartedness: (fire) Martial; Interpersonal, Mental"
      ],
      weapons: [
        "B\u014d (staff): Range 1\u20132, Damage 6, Deadliness 2, Mundane",
        "Wakizashi: Range 0\u20131, Damage 3, Deadliness 5/7, Ceremonial, Razor-Edged"
      ],
      gear: [ "Sanctified robes (Physical 1, Supernatural 3, Ceremonial)" ],
      gearOther: [ "Inconspicuous garb", "Scroll satchel", "Traveling pack" ],
      abilities: [
        { name:"Way of the Void", tag:"School Ability", text:"When you make a check using your Void Ring, after rolling dice, you may receive fatigue up to your school rank. If you push, choose that many blank dice and alter each to a non-blank result of your choice. If you pull, choose that many non-blank dice and alter each to blank." },
        { name:"One within the Void", tag:"Inversion", text:"Activation: As a Support action, you may make a TN 2 Sentiment (Void) check targeting yourself and one other character at range 0\u20133.\n\nEffects: If you succeed, you augment all targets with the ability to communicate with each other without words, making their intentions clear even if they do not speak the same language. When any target makes a check, one other target may receive 2 fatigue to provide assistance on the check regardless of distance. This effect lasts until the end of the scene.\n\nNew Opportunities \u2014 (op)+: Choose one additional target per (op) spent this way.\n\nMagnitude 1+: When a target is dealt strife, one other target of your choice may receive that strife instead.\nMagnitude 3+: Choose a ring or skill. When any target makes a check using that ring or skill, they may use any other target\u2019s rank in that ring or skill instead of their own." },
        { name:"Divination", tag:"Ritual", text:"Activation: As a downtime activity, you may make a TN 2 Theology (Void) check targeting one character to see glimpses of their future.\n\nEffects: If you succeed, choose one of the following omens that you see in the target\u2019s near future:\n\nOmen of the Azure Dragon: The next time the target performs a check using a skill from the Artisan skill group this game session, the target adds a kept (ring) set to an (op) (st) result.\nOmen of the Black Tortoise: The next time the target performs a check using a skill from the Scholar skill group this game session, the target adds a kept (ring) set to an (op) (st) result.\nOmen of the White Tiger: The next time the target performs a check using a skill from the Martial skill group this game session, the target adds a kept (ring) set to an (op) (st) result.\nOmen of the Vermilion Bird: The next time the target performs a check using a skill from the Social skill group this game session, the target adds a kept (ring) set to an (op) (st) result.\nOmen of the Weaver and the Cowherd: The next time the target performs a check using a skill from the Trade skill group this game session, the target adds a kept (ring) set to an (op) (st) result.\n\nIf you fail, the GM chooses one of the above omens instead. The target cannot receive another divination until the next game session." },
        { name:"Truth Burns through Lies", tag:"Sh\u016bji", text:"Activation: When making a Scholar skill (Fire) check to assess a character\u2019s story, you may spend (op) in the following way:\n\nFire (op): If there is a single statement upon which the character\u2019s story hinges, you determine what it is and what you would need to do to verify or disprove it." }
      ]
    }
  },

  // ---- Yogo Kenzan — bio only (mentor) ----
  {
    id: "yogo-kenzan",
    reveal: ["name", "epithet", "portrait", "desc", "bio0"],
    portrait: "../assets/npc/yogo-kenzan.webp",
    name: "Yogo Kenzan",
    epithet: "“Brother Kenzan”",
    affil: "Brotherhood of Shinsei · the teacher from whom Norikage learned the most",
    statNote: "Built on Jun, Shinseist Monk (Emerald Empire), re-skinned for Kenzan's Yogo / Brotherhood background, pending a bespoke build.",
    bio: [
      "A monk of the Brotherhood of Shinsei, Scorpion-born under the Yogo name, and the person from whom Norikage says he learned the most. Their conversations shaped how the young Togashi thinks about faith and doubt. Where he is now, and what he has come to believe, Norikage does not know, and has not asked anyone who would.",
      "A flippant manner belies a deep understanding of the Way — the kind of teacher who answers a hard question with a lighter one, and is remarkably difficult to corner in an argument or a conflict."
    ],
    status: "Known · mentor",
    stat: {
      kind: "Adversary",
      combatRank: 4, intrigueRank: 2,
      description: "A Shinseist monk with a flippant demeanor that belies his deep understanding of the Way. His attunement to Shinsei's teachings makes him remarkably difficult to overcome in conflict.",
      rings: { air:4, earth:2, fire:2, water:3, void:3 },
      endurance:10, composure:12, focus:6, vigilance:4,
      honor:55, glory:45, status:25,
      demeanor:"Flippant", tnMods:"Fire +2, Air -2",
      skills: { artisan:0, martial:2, scholar:3, social:3, trade:0 },
      advantages: [ "Subtle Observer: (air) Social; Interpersonal" ],
      disadvantages: [ "Bluntness: (air) Social; Interpersonal" ],
      weapons: [ "Walking Staff: Range 1–2, Damage 6, Deadliness 2, Mundane" ],
      gear: [ "Monk's robes (Physical 1)", "Gold lotus pendant (When performing a Meditation check add one rolled Ring die showing (op) result)" ],
      abilities: [
        { name:"Attuned to the Way", text:"When a character succeeds on an Attack or Scheme action targeting Kenzan, reduce their bonus successes by 3, to a minimum of 0." }
      ]
    }
  }

];
