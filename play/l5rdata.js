/* ============================================================
   l5rdata.js — L5R5e reference data for the sheet
   Stances, conflict types/actions, and the Opportunity (op) spend
   tables. Opportunity spend text is verbatim from the L5R5e core.
   ============================================================ */
window.L5R = {

  // --- Stances (chosen in conflict; the default ring for checks) ---
  stances: {
    air:   { name:"Air Stance",   text:"Increase the TN of Attack action checks targeting you at range 1–2 by 1 (by 2 at school rank 4+)." },
    earth: { name:"Earth Stance", text:"When other characters make Attack action checks and Scheme action checks that target you, they cannot spend (op) to inflict critical strikes or conditions on you." },
    fire:  { name:"Fire Stance",  text:"When you make an Attack or Scheme action check, gain a bonus success for each kept die showing a strife (▲) result." },
    water: { name:"Water Stance", text:"You may perform an additional action that does not require a check. The additional action cannot be the same type as an action you have already performed that turn." },
    void:  { name:"Void Stance",  text:"You do not receive strife from strife (▲) symbols on your kept dice. You can still receive strife from other sources." }
  },

  // --- Conflict types: initiative skill + available actions ---
  conflicts: {
    intrigue:   { name:"Intrigue",    initSkill:"Sentiment",  actions:["Assist","Calming Breath","Persuade","Unique Action"] },
    duel:       { name:"Duel",        initSkill:"Meditation", actions:["Calming Breath","Center","Predict","Prepare Item","Strike"] },
    skirmish:   { name:"Skirmish",    initSkill:"Tactics",    actions:["Assist","Calming Breath","Challenge","Guard","Maneuver","Prepare Item","Strike","Unique Action","Wait"] },
    massbattle: { name:"Mass Battle", initSkill:"Command",    actions:["Assault","Challenge","Rally","Reinforce"] }
  },

  // --- Opportunity spend tables (verbatim from the core rulebook) ---
  // Each context maps a ring (or "any") to its list of (op) spends.
  opportunities: {
    general: {
      any: [
        "(op): If you failed, determine the easiest way to accomplish the task you were attempting (skill and approach).",
        "(op)+: Remove 1 strife you gained from this check per (op) spent this way.",
        "(op)(op): Provide assistance to the next character to attempt a check to accomplish something similar."
      ],
      air: [
        "(op): Learn another character in the scene's demeanor (if an NPC) and current strife.",
        "(op)+: Act subtly to attract minimal attention in your efforts. Extra (op) makes the attempt even subtler.",
        "(op)(op): Notice an interesting detail about a character in the scene, such as an advantage or disadvantage. At the GM's discretion, you may establish a new detail for an NPC."
      ],
      earth: [
        "(op): Reassure another character in the scene with your presence, allowing them to remove 2 strife.",
        "(op)+: Act carefully to minimize consequences of failure or other dangers that could arise from the task. Extra (op) makes the attempt even safer.",
        "(op)(op): Suddenly recall an important piece of information not directly related to the task. At the GM's discretion, you may establish a small preparatory action you took earlier, such as bringing along a common useful item."
      ],
      fire: [
        "(op): Inflame another character in the scene with your presence, causing them to receive 2 strife.",
        "(op)+: Perform the task in a flashy way, drawing attention to yourself. Extra (op) attracts even more notice.",
        "(op)(op): Notice something missing or out of place in the vicinity that is not directly related to the task. At the GM's discretion, you may establish an absence, such as a lack of shoes outside indicating the occupant's absence."
      ],
      water: [
        "(op): Remove 2 strife from yourself.",
        "(op)+: Perform the task efficiently, completing it more quickly or saving supplies. Extra (op) further reduces the time or materials expended.",
        "(op)(op): Spot an interesting physical detail present in your environment not directly related to your check. At the GM's discretion, you may establish a piece of terrain or a mundane object nearby."
      ],
      void: [
        "(op): Choose a ring other than Void. Reduce the TN of your next check by 1 if it uses that ring.",
        "(op)+: Feel a chill down your spine, notice a sudden silence, or detect another sign of the supernatural if there is a spiritual disturbance in the scene. Extra (op) gives an increasingly precise location for the supernatural occurrence.",
        "(op)(op): Gain spiritual insight into the nature of the universe or your own heart. At the GM's discretion, you may establish a fact about your character that has not been previously revealed but relates to the situation."
      ]
    },
    conflict: {
      air: [
        "(op): Add a kept (ring) set to an (op) result to your next Martial skill check.",
        "(op)+: During a Movement action check, up to 1 range band of any distance you move per (op) spent this way may be along a vertical surface.",
        "(op)(op): Increase the TN of the next Martial Arts [Ranged] check targeting you before the start of your next turn by 2."
      ],
      earth: [
        "(op): During a Movement action, ignore one terrain quality of your choice.",
        "(op)+: Reduce the severity of the next critical strike you suffer before the start of your next turn by 1 per (op) spent this way.",
        "(op)(op): Do not apply one of your disadvantages to checks until the end of your next turn."
      ],
      fire: [
        "(op): Choose another character in the scene; increase the TN of the next check they make before the end of their next turn by 1 if it does not include you as a target.",
        "(op)+: During an Attack action check, increase the TN of the next check the target makes to resist a critical strike they suffer before the start of your next turn by 1 per (op) spent this way.",
        "(op)(op): Other characters must receive 2 strife to choose you as the target of their Attack and Scheme actions until the start of your next turn."
      ],
      water: [
        "(op): Remove 1 fatigue.",
        "(op)+: During an Attack action check, ignore 1 point of target's physical resistance per (op) spent this way.",
        "(op)(op): Move 1 range band."
      ],
      void: [
        "(op): During the next Attack action check you make before the end of your next turn, ignore one terrain quality of your choice.",
        "(op)+: During a Support action check, increase your Initiative value by 1 per (op) spent this way.",
        "(op)(op): Ignore the effects of one condition you are suffering until the end of your next turn."
      ]
    },
    initiative: {
      air:   ["(op): Assess one foe's weakness. Learn one of their disadvantages of that foe's choice."],
      earth: ["(op): Choose another character's disadvantage you know. They do not apply that disadvantage to their checks this scene."],
      fire:  ["(op): Use your focus instead of your vigilance for your initiative when surprised."],
      water: ["(op): Assess the qualities of all terrain in the scene."],
      void:  ["(op): Sense if there is an Otherworldly being in the scene."]
    },
    downtime: {
      air: [
        "(op)+: Learn a detail about one person in your company (such as an advantage or disadvantage of their choice) per (op) spent this way. You can learn only one detail about each person this way in a single downtime scene.",
        "(op)(op): Perform your downtime activity without letting one or more others of your choice know that you did."
      ],
      earth: [
        "(op)+: Another character in your company may remove 1 strife or fatigue per (op) spent this way.",
        "(op)(op): Memorize a small but vital detail from your activity; you can recall it later without a check."
      ],
      fire: [
        "(op)+: Assist one other character per (op) spent this way with their next downtime activity check this session.",
        "(op)(op): Energize another character in your company with your efforts; they may perform 1 additional downtime action this downtime (to a maximum of 2)."
      ],
      water: [
        "(op)+: Remove 1 strife or fatigue per (op) spent this way.",
        "(op)(op): Make a new friend while undertaking your downtime activity."
      ],
      void: [
        "(op)+: Reserve 1 dropped die from your check, to a maximum of your ranks in the skill you used. Add that die to your next check with the same skill as a kept die instead of rolling it.",
        "(op)(op): Have a brief premonition of a possible future event while undertaking your downtime activity."
      ]
    },
    // Skill-group opportunities (one line per ring per group)
    social: {
      air:   ["(op): Learn if the honor, glory, or status attribute of a character in the scene is higher, lower, or equal to yours."],
      earth: ["(op): Increase the TN of the next Social check another character makes before the end of the scene by 1."],
      fire:  ["(op): Reduce the TN of the next Social check another character makes before the end of the scene by 1."],
      water: ["(op): Add a kept (ring) set to an (op) result to your next Social check before the end of the scene."],
      void:  ["(op): Discern the objective of another character in the scene."]
    },
    scholar: {
      air:   ["(op): Learn something about a character who created or used the item you are studying (such as one of their advantages or disadvantages of the GM's choice that affected their creation or use of the item)."],
      earth: ["(op): Remember a place where you can research or study the topic you were attempting to recall."],
      fire:  ["(op): Extrapolate the motivations or desires of another character in the scene or wider situation."],
      water: ["(op): Spot a unique or identifying quality, aspect, or ability of something that you are identifying."],
      void:  ["(op): Intuit whether you can learn anything of value from your current course of inquiry."]
    },
    artisan: {
      air:   ["(op): If you succeed, add the Resplendent or Subtle quality to an item that you are refining."],
      earth: ["(op): If you succeed, add the Durable quality to an item that you are restoring."],
      fire:  ["(op): If you succeed, make one additional copy of the item you are creating."],
      water: ["(op): Add a kept (ring) set to an (op) result to the next Artisan skill check you make before the end of the game session."],
      void:  ["(op): Reduce the TN of the next check you make using the item you are attuning yourself to by 1."]
    },
    trade: {
      air:   ["(op): Convince a buyer to pay an additional 10% for an item you are selling."],
      earth: ["(op): Reduce the TN of the next check another character makes with the same skill before the end of the scene by 1."],
      fire:  ["(op): Unusual inspiration strikes; add a kept (ring) set to an (op) result to the next check you make with another skill."],
      water: ["(op): Convince a seller to give you an additional 10% discount for an item you are buying."],
      void:  ["(op): Reduce any effect you have on your environment (and physical traces of your efforts) to a minimum."]
    }
  },

  // The order chips appear in and their labels
  oppTables: [
    ["general","General"], ["conflict","Conflict"], ["initiative","Initiative"],
    ["social","Social"], ["scholar","Scholar"], ["artisan","Artisan"], ["trade","Trade"], ["downtime","Downtime"]
  ],

  // Opportunities granted by this character's own techniques
  techniqueOpportunities: [
    { name:"Lord Togashi’s Insight", ring:"void", text:"(op): Reduce the TN of your first check to overcome the problem you are facing by your school rank (to a minimum of 1)." }
  ]
};
