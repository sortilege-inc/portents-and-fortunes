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

  // ---- Scholarly Shugenja (core adversary, verbatim) ----
  {
    id: "scholarly-shugenja",
    template: true,
    name: "Scholarly Shugenja",
    epithet: "Adversary · Subjects of Rokugan",
    affil: "A priest who communes with the kami",
    bio: [
      "Shugenja are holy people, priests who commune with the kami, making invocations to persuade them to cause spectacular and even destructive effects in the Mortal Realm. However, shugenja are rare, and seldom encountered outside of shrines, temples, and libraries."
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
      "Ashigaru are the rank-and-file foot soldiers who make up the bulk of Rokugani armies. These foot soldiers are commoners, peasants who have been drafted into military service. Interestingly, once drafted, they are considered to belong to the lowest rank of the buke, the samurai caste, even though they aren’t samurai."
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
      "Like Norikage, an ise zumi of the Togashi line — the same Blood of the Kami in the tattoos, the same humble bō in hand. What the student sees in the master is a mirror held a lifetime ahead."
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
      "A monk of the Brotherhood of Shinsei, Scorpion-born under the Yogo name, and the person from whom Norikage says he learned the most. Their conversations shaped how the young Togashi thinks about faith and doubt. Where Kenzan is now, and what he believes, are threads yet to be drawn.",
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
