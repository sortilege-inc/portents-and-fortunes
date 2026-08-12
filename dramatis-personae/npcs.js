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

  // ---- Scholarly Shugenja (core adversary, verbatim) ----
  {
    id: "scholarly-shugenja",
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

  // ---- Togashi Oharu — bio only (Norikage's lord) ----
  {
    id: "togashi-oharu",
    name: "Togashi Oharu",
    epithet: "The Abbot",
    affil: "Togashi · Norikage's lord and master of his temple",
    statNote: "Built on Togashi Remmu, Sociable Wanderer (Writ of Wilds) with the Temple Abbot title's Soothing Cadence and Status +10 — re-skinned for the Abbot, pending a bespoke build.",
    bio: [
      "Abbot of the Tattooed Order and the authority to whom Norikage answers. It is Oharu who gave the charge that sets this chronicle in motion: to walk east with a village that is being moved, as an observer in a religious capacity — outside the daimyō's chain of command, responsible for none of the moving — and to report back to the temple. What exactly he is to watch for was not specified. Norikage's character sheet first recorded Togashi Oharu as a provincial daimyō he served as \"eyes and ears\"; that role is now understood as the abbot and the temple. Oharu's age, and true reasons, are not yet known.",
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

  // ---- Yogo Kenzan — bio only (mentor) ----
  {
    id: "yogo-kenzan",
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
