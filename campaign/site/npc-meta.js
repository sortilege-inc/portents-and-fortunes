/* Presentation for the campaign's NPCs (campaign/dsl/portents-npcs.ttrpg), keyed by entity id:
   the portrait, what a player has revealed (the old site's field ids: name, epithet, portrait,
   desc, bio0…), and the note on how each was built. Not game data, so not in the gate. */
window.PF_NPC_META = {
 "#PFnpcBrotherUjiyasu": {
  "reveal": [
   "name",
   "epithet",
   "desc",
   "bio0",
   "bio1"
  ],
  "statNote": "The Brotherhood Monk template unchanged — Jun, Shinseist Monk (Emerald Empire p.191) — with one deviation: demeanor Detached rather than the chassis’s Flippant, because a man who answers a point by reciting at you is not flippant. Earth +1, Fire +1, Void −2 accordingly.",
  "was": "brother-ujiyasu"
 },
 "#PFnpcBrotherhoodMonk": {
  "reveal": [
   "name",
   "epithet",
   "desc",
   "bio0"
  ],
  "statNote": "Jun, Shinseist Monk (Emerald Empire p.191) as chassis, unmodified — the same block Yogo Kenzan is built on, which is the point of keeping this one generic: Kenzan is that profile re-skinned for a particular man, this is the profile as it comes. The gold lotus pendant is the chassis’s and can be dropped without touching anything else. For a young initiate rather than a settled monk, Chikako, Initiate Monk (Emerald Empire p.192) is the better block: combat 1 / intrigue 3, Void 3, Detached.",
  "was": "brotherhood-monk"
 },
 "#PFnpcForestTroll": {
  "portrait": "campaign/assets/npc/forest-troll.webp",
  "reveal": [
   "name",
   "epithet",
   "portrait",
   "desc",
   "bio0",
   "bio2"
  ],
  "statNote": "Core Forest Troll (core p.321), unmodified. Silhouette 4 per its own Ancient and Powerful ability, which overrides the silhouette table's listing of trolls at 3.",
  "was": "forest-troll"
 },
 "#PFnpcGenzo": {
  "portrait": "campaign/assets/npc/genzo.webp",
  "reveal": [
   "name",
   "epithet",
   "portrait",
   "desc",
   "bio0",
   "bio2"
  ],
  "statNote": "Clever Innkeeper (Path of Waves) under the Desperate NPC Template (Path of Waves): +1 combat rank, +1 Fire, +1 Martial and Social. Card: The Chariot, reversed. Before the move he would have taken the Galvanizing template instead — the swap is the reversal, in one line.",
  "was": "genzo"
 },
 "#PFnpcHeisuke": {
  "portrait": "campaign/assets/npc/heisuke.webp",
  "reveal": [
   "name",
   "epithet",
   "portrait",
   "desc",
   "bio0"
  ],
  "statNote": "Traveling Tradesperson (Path of Waves) for its I Can Fix That, plus the Perfect Land Sect Member title (Path of Waves) for Trustworthy Cadence. Two deviations for an expert craftsman who does not travel: Artisan raised 0 → 3, and the base's Worldly Wanderer advantage dropped. The title's −5 status cannot take him below its floor of 15 and he is already beneath it, so status is unchanged. Card: Eight of Pentacles, upright.",
  "tags": {
   "Trustworthy Cadence": "Perfect Land"
  },
  "was": "heisuke"
 },
 "#PFnpcKaitoJuri": {
  "portrait": "campaign/assets/npc/kaito-juri.webp",
  "reveal": [
   "name",
   "epithet",
   "portrait",
   "desc",
   "bio0"
  ],
  "statNote": "Converted from her rank-1 character file into the published NPC profile shape (core p.310–312): rings, derived attributes and social standing are hers unchanged; individual skills are collapsed to skill groups at her best rank in each, which is what the NPC format rolls. The spread the collapse loses — Theology 3, Fitness 2, Culture 1, Medicine 1, every other skill 0 — is the truth of her, so Scholar 3 should not be read as Government 3. Conflict ranks estimated: combat 1 for a sage with Martial Arts 0 and no armor, intrigue 2 for a mediator by office whose Social skills are all 0. Demeanor is the one thing the file does not set; Detached is the core Sage template’s own option (p.312) and its Void –2 is the opening Norikage is equipped to use.",
  "tags": {
   "Divination": "Ritual",
   "One within the Void": "Inversion",
   "Truth Burns through Lies": "Shūji",
   "Way of the Void": "School Ability"
  },
  "was": "kaito-juri"
 },
 "#PFnpcKitsukiSadao": {
  "portrait": "campaign/assets/npc/kitsuki-sadao.webp",
  "reveal": [
   "name",
   "epithet",
   "portrait",
   "desc",
   "bio0"
  ],
  "statNote": "Kitsuki Noriko, Conflicted Magistrate (Writ of Wilds) as chassis — the Kitsuki family match — with the Wandering NPC Template's advantage, disadvantage and demeanor (Path of Waves) — so his social TN modifiers are Gruff's, not the chassis's Methodical ones. Two deliberate deviations: the template's +2 combat rank is NOT applied, and Endurance is cut from 12 to 5, both for great age (precedent: Kakita Ryoku, Elder Crane, Endurance 4). Card: Knight of Wands, reversed — Impatience is the template's own disadvantage and carries the reversal exactly.",
  "was": "kitsuki-sadao"
 },
 "#PFnpcKiyo": {
  "portrait": "campaign/assets/npc/kiyo.webp",
  "reveal": [
   "name",
   "epithet",
   "portrait",
   "desc",
   "bio0"
  ],
  "statNote": "Clever Innkeeper (Path of Waves) under the Galvanizing NPC Template (Path of Waves): +2 intrigue rank, +1 Water, +1 Scholar and Social, demeanor Assertive. Card: Two of Cups, upright.",
  "was": "kiyo"
 },
 "#PFnpcMoonCultist": {
  "reveal": [
   "name",
   "epithet",
   "desc",
   "bio0"
  ],
  "statNote": "Built on the core recipe (core p.318 profile, GM chapter): “For the Moon Cultist profile, use the Wicked Mahō-tsukai but replace their mahō with these invocations: By the Light of the Lord Moon, Summon Fog, Tempest of Air, and Vapor of Nightmares.” Numbers, demeanor, skills and conflict ranks are the chassis unchanged. Three deviations, all for the same reason — this is Onnotangu’s servant, not Jigoku’s: the Whispers of Fu Leng advantage is dropped, and with it Mark of Desecration and Seeker of Vile Lore, so this cultist raises no dead and is not a Tainted being. Dark Secret replaces the chassis’s Rotting from Within, because Dark Secret is the disadvantage the Moon Cultist title itself assigns. Honor 1 suits a devotee with nothing left to lose; a cultist embedded in society keeps their own standing instead, with the title’s −5 to a floor of 15.",
  "tags": {
   "By the Light of the Lord Moon": "Invocation · Rank 1",
   "Summon Fog": "Invocation · Rank 2",
   "Tempest of Air": "Invocation · Rank 1",
   "Vapor of Nightmares": "Invocation · Rank 3"
  },
  "was": "moon-cultist"
 },
 "#PFnpcNui": {
  "portrait": "campaign/assets/npc/nui.webp",
  "reveal": [
   "name",
   "epithet",
   "portrait",
   "desc",
   "bio0"
  ],
  "statNote": "Dai, Fortunist Monk (Emerald Empire) as chassis — the Fortunist match, and her Herbalist ability suits a village's devout woman. One caveat rather than a deviation: Nui is a laywoman who guides pilgrims, not an ordained monk, so her Status 25 reflects standing earned on the road to the shrine rather than a monastic office. Card: The Hermit, upright.",
  "was": "nui"
 },
 "#PFnpcRokuro": {
  "portrait": "campaign/assets/npc/rokuro.webp",
  "reveal": [
   "name",
   "epithet",
   "portrait",
   "desc",
   "bio0"
  ],
  "statNote": "Clever Innkeeper (Path of Waves) under the Survivalist NPC Template (Path of Waves): +2 combat rank, +1 Water, +1 Martial and Trade, demeanor Detached. Card: Six of Cups, upright.",
  "was": "rokuro"
 },
 "#PFnpcScholarlyShugenja": {
  "portrait": "campaign/assets/npc/scholarly-shugenja.webp",
  "reveal": [
   "name",
   "epithet",
   "portrait"
  ],
  "tags": {
   "Path to Inner Peace": "Invocation",
   "The Fires from Within": "Invocation"
  },
  "was": "scholarly-shugenja"
 },
 "#PFnpcSeiyaFusae": {
  "portrait": "campaign/assets/npc/seiya-fusae.webp",
  "reveal": [
   "name",
   "epithet",
   "portrait",
   "desc",
   "bio0"
  ],
  "statNote": "Statted on the core Loyal Bushi block (core p.312), unmodified, with two additions for her niten training: the wakizashi line from Mirumoto Kichiru, Thwarted Duelist (Writ of Wilds), since Two Heavens needs a second readied blade, and that same NPC's Two Heavens Style ability re-skinned to her. Pending a bespoke build.",
  "tags": {
   "Two Heavens Style": "Niten"
  },
  "was": "seiya-fusae"
 },
 "#PFnpcSeiyaMori": {
  "portrait": "campaign/assets/npc/seiya-mori.webp",
  "reveal": [
   "name",
   "epithet",
   "portrait",
   "desc",
   "bio0"
  ],
  "statNote": "Statted on the core Venerable Provincial Daimyō block (core p.315) pending a bespoke build.",
  "was": "seiya-mori"
 },
 "#PFnpcTogashiOharu": {
  "portrait": "campaign/assets/npc/togashi-oharu.webp",
  "reveal": [
   "name",
   "epithet",
   "portrait",
   "desc",
   "bio0"
  ],
  "statNote": "Built on Togashi Remmu, Sociable Wanderer (Writ of Wilds) with the Temple Abbot title's Soothing Cadence and Status +10 — re-skinned for the Abbot, pending a bespoke build.",
  "tags": {
   "Soothing Cadence": "Abbot"
  },
  "was": "togashi-oharu"
 },
 "#PFnpcTrainedAshigaru": {
  "portrait": "campaign/assets/npc/trained-ashigaru.webp",
  "reveal": [
   "name",
   "epithet",
   "portrait"
  ],
  "was": "trained-ashigaru"
 },
 "#PFnpcUme": {
  "portrait": "campaign/assets/npc/ume.webp",
  "reveal": [
   "name",
   "epithet",
   "portrait"
  ],
  "statNote": "Clever Innkeeper (Path of Waves) under the Galvanizing NPC Template (Path of Waves), plus the Perfect Land Sect Member title (Path of Waves) for Trustworthy Cadence. The title's −5 status cannot take her below its floor of 15, and she is already beneath it at 9, so status is unchanged. Card: Queen of Wands, reversed.",
  "tags": {
   "Trustworthy Cadence": "Perfect Land"
  },
  "was": "ume"
 },
 "#PFnpcYogoKenzan": {
  "portrait": "campaign/assets/npc/yogo-kenzan.webp",
  "reveal": [
   "name",
   "epithet",
   "portrait",
   "desc",
   "bio0"
  ],
  "statNote": "Built on Jun, Shinseist Monk (Emerald Empire), re-skinned for Kenzan's Yogo / Brotherhood background, pending a bespoke build.",
  "was": "yogo-kenzan"
 }
};
