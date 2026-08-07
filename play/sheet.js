/* ============================================================
   sheet.js — renders window.SHEET and runs an L5R5e Roll & Keep roller.
   Dice faces are the official Ring (d6) and Skill (d12) faces.
   ============================================================ */
(function () {
  "use strict";
  var CURRENT = window.SHEET;
  if (!CURRENT) return;
  var S = CURRENT;                       // active version's data (reassigned when viewing history)
  var root = document.getElementById("sheet");
  var LSKEY = "pf-sheet-" + (CURRENT.id || "pc");

  // ---- version registry: a time-series of character sheets ----
  // The live sheet is always "current". window.SHEET_HISTORY (optional) holds
  // read-only snapshots of prior sessions, each SHEET-shaped, e.g.:
  //   { id, label, date, data:{ ...rings/skills/techniques/…, state:{strife,fatigue,void,stance} } }
  var VERSIONS = [{ id:"current", label:"Current", live:true, data:CURRENT }];
  (window.SHEET_HISTORY||[]).forEach(function(h){
    VERSIONS.push({ id:h.id, label:h.label||h.id, date:h.date||"", live:false, data:h.data||{} });
  });
  var curView = "current";   // id of the version being shown
  var RO = false;            // read-only (a past snapshot is being viewed)
  var SNAP = null;           // snapshot's recorded tracker state while RO
  function verById(id){ for(var i=0;i<VERSIONS.length;i++){ if(VERSIONS[i].id===id) return VERSIONS[i]; } return null; }

  // ---- dice faces (face index 0 == pip 1) ----
  var RING_FACES = [
    {key:"ring_blank"}, {key:"ring_ot",op:1,st:1}, {key:"ring_o",op:1},
    {key:"ring_st",su:1,st:1}, {key:"ring_s",su:1}, {key:"ring_et",ex:1,st:1}
  ];
  var SKILL_FACES = [
    {key:"skill_blank"}, {key:"skill_blank"}, {key:"skill_o",op:1}, {key:"skill_o",op:1}, {key:"skill_o",op:1},
    {key:"skill_st",su:1,st:1}, {key:"skill_st",su:1,st:1}, {key:"skill_s",su:1}, {key:"skill_s",su:1},
    {key:"skill_so",su:1,op:1}, {key:"skill_et",ex:1,st:1}, {key:"skill_e",ex:1}
  ];
  function faceTitle(d){
    var parts=[]; if(d.ex)parts.push(d.ex+"× explosive success"); if(d.su)parts.push(d.su+"× success");
    if(d.op)parts.push(d.op+"× opportunity"); if(d.st)parts.push(d.st+"× strife");
    return parts.length?parts.join(", "):"blank";
  }
  var RINGS = ["air","earth","fire","water","void"];
  var SKILL_GROUPS = [
    ["Artisan", ["aesthetics","composition","design","smithing"]],
    ["Martial", ["fitness","melee","ranged","unarmed","meditation","tactics"]],
    ["Scholar", ["culture","government","medicine","sentiment","theology"]],
    ["Social", ["command","courtesy","games","performance"]],
    ["Trade", ["commerce","labor","seafaring","skulduggery","survival"]]
  ];
  var SKILL_NAMES = { unarmed:"Martial Arts [Unarmed]", melee:"Martial Arts [Melee]", ranged:"Martial Arts [Ranged]" };

  // ---- persisted state ----
  var st = { strife:0, fatigue:0, "void":(S.trackers&&S.trackers["void"]&&S.trackers["void"].start)||0,
             stance:S.stance||"void", ring:"earth", skill:null,
             inConflict:false, conflictType:"skirmish", oppTable:"general" };
  var L5RD = window.L5R || {stances:{},conflicts:{},opportunities:{},oppTables:[],techniqueOpportunities:[]};
  try { var saved = JSON.parse(localStorage.getItem(LSKEY)); if (saved) Object.assign(st, saved); } catch(e){}
  function save(){ if(RO) return; try { localStorage.setItem(LSKEY, JSON.stringify(st)); } catch(e){} }
  function trkVal(key){ return RO ? ((SNAP&&SNAP[key])||0) : (st[key]||0); }

  function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
  function el(tag, cls, html){ var e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
  function symHTML(d, dark){
    var out=[];
    function push(n,c,g){ for(var i=0;i<(n||0);i++) out.push("<span class='sym "+c+"'>"+g+"</span>"); }
    push(d.ex,"ex","❉"); push(d.su,"su","❁"); push(d.op,"op","◈"); push(d.st,"st","▲");
    if(!out.length) return "<span class='blank'>blank</span>";
    return out.join("");
  }
  function succ(d){ return (d.su||0)+(d.ex||0); }

  // ---- build the sheet ----
  function render(){
    root.innerHTML="";
    root.classList.toggle("readonly", RO);

    // header
    var head = el("div","sh-head");
    if (S.portrait){ var pf=el("div","sh-portrait"); pf.appendChild(el("img")); pf.querySelector("img").src=S.portrait; pf.querySelector("img").alt=S.name; head.appendChild(pf); }
    var id = el("div","sh-id");
    id.appendChild(el("h1",null,S.name));
    id.appendChild(el("div","sub", S.clan+" Clan · "+S.family+" family"));
    id.appendChild(el("div","sub2", S.school+" · Rank "+S.rank+" "+S.role));
    var hgs = el("div","hgs");
    [["Honor",S.social.honor],["Glory",S.social.glory],["Status",S.social.status]].forEach(function(p){
      hgs.appendChild(el("div","stat","<span class='lab'>"+p[0]+"</span><span class='val'>"+p[1]+"</span>"));
    });
    id.appendChild(hgs);
    head.appendChild(id);
    var mon=el("img","sh-mon"); mon.src="../assets/mon/"+S.clan.toLowerCase()+".svg"; mon.alt=S.clan+" mon"; head.appendChild(mon);
    root.appendChild(head);

    if(RO){
      var v=verById(curView);
      root.appendChild(el("div","ro-banner","<span class='seal'>&#9719;</span><div><b>Read-only.</b> Viewing "+(v?v.label:"a past session")+(v&&v.date?" &middot; "+v.date:"")+" — a snapshot from an earlier session. Switch the sheet selector to <em>Current</em> to make changes.</div>"));
    } else {
      // Roll & Keep — collapsed by default, at the top of the sheet
      root.appendChild(buildRoller());
    }

    var grid = el("div","sh-grid");

    // --- Rings + derived ---
    var cRings = el("div","sh-card");
    cRings.appendChild(el("h2",null,"Rings &amp; Approach"));
    var rr = el("div","rings");
    RINGS.forEach(function(r){
      var rc = el("div","ring"+(st.ring===r?" sel":""));
      rc.setAttribute("data-ring",r);
      rc.innerHTML="<img class='ricon' src='../assets/rings/"+r+".svg' alt=''><span class='rn'>"+cap(r)+"</span><span class='rv'>"+S.rings[r]+"</span>"+(S.deficiency===r?"<span class='defmark' title='Elemental Deficiency'>▼</span>":"");
      rc.addEventListener("click",function(){ st.ring=r; save(); syncRing(); syncRoller(); });
      rr.appendChild(rc);
    });
    cRings.appendChild(rr);
    var der = el("div","derived");
    [["Endurance",S.derived.endurance],["Composure",S.derived.composure],["Focus",S.derived.focus],["Vigilance",S.derived.vigilance]].forEach(function(d){
      der.appendChild(el("div","d","<span class='dl'>"+d[0]+"</span><span class='dv'>"+d[1]+"</span>"));
    });
    cRings.appendChild(der);
    if (S.deficiency) cRings.appendChild(el("p","trk-note","▼ Elemental Deficiency ("+cap(S.deficiency)+")"));
    grid.appendChild(cRings);

    // --- Trackers ---
    var cTrk = el("div","sh-card trackers");
    cTrk.appendChild(el("h2",null,"Condition"));
    cTrk.appendChild(tracker("strife","Strife",S.trackers.strife.max,S.derived.composure,"Compromised at "+S.derived.composure));
    cTrk.appendChild(tracker("fatigue","Fatigue",S.trackers.fatigue.max,S.derived.endurance,"Incapacitated at "+S.derived.endurance));
    cTrk.appendChild(tracker("void","Void Points",S.trackers["void"].max,null,null));
    grid.appendChild(cTrk);

    // --- Conflict (stances hidden until a conflict begins) ---
    if(!RO) grid.appendChild(buildConflict());

    // --- Skills ---
    var cSk = el("div","sh-card");
    cSk.appendChild(el("h2",null,"Skills"));
    SKILL_GROUPS.forEach(function(g){
      var wrap=el("div","skgroup");
      wrap.appendChild(el("h3",null,g[0]));
      g[1].forEach(function(k){
        var rank=(S.skills[k]||0);
        var row=el("div","skrow"+(rank>0?" ranked":"")+(st.skill===k?" sel":""));
        row.setAttribute("data-skill",k);
        var dots="";
        for(var i=1;i<=5;i++) dots+="<i class='"+(i<=rank?"on":"")+"'></i>";
        row.innerHTML="<span class='skn'>"+(SKILL_NAMES[k]||cap(k))+"</span><span class='skdots'>"+dots+"</span><span class='skv'>"+rank+"</span>";
        row.addEventListener("click",function(){ st.skill=(st.skill===k?null:k); save(); syncSkill(); syncRoller(); });
        wrap.appendChild(row);
      });
      cSk.appendChild(wrap);
    });
    grid.appendChild(cSk);

    // --- Techniques ---
    var cTech = el("div","sh-card");
    cTech.appendChild(el("h2",null,"Techniques"));
    S.techniques.forEach(function(t){ cTech.appendChild(entry(t.name,t.tag,t.ring,t.text)); });
    grid.appendChild(cTech);

    // --- Peculiarities ---
    var cPec = el("div","sh-card span2");
    cPec.appendChild(el("h2",null,"Distinctions, Adversities, Passions &amp; Anxieties"));
    var pgrid=el("div"); pgrid.style.columns="2"; pgrid.style.columnGap="1.6rem";
    S.peculiarities.forEach(function(p){ var e=entry(p.name,p.tag,p.ring,p.text); e.style.breakInside="avoid"; pgrid.appendChild(e); });
    cPec.appendChild(pgrid);
    grid.appendChild(cPec);

    // --- Gear ---
    var cGear = el("div","sh-card gear");
    cGear.appendChild(el("h2",null,"Weapons, Armour &amp; Possessions"));
    S.gear.forEach(function(g){
      var e=el("div","entry");
      var meta=[]; if(g.category)meta.push(g.category); if(g.damage!=null)meta.push("Damage "+g.damage); if(g.deadliness!=null)meta.push("Deadliness "+g.deadliness); if(g.rarity!=null)meta.push("Rarity "+g.rarity);
      e.innerHTML="<div class='et-head'><span class='et-name'>"+g.name+"</span>"+(g.kind?"<span class='et-tag ring'>"+g.kind+"</span>":"")+"</div>"+(meta.length?"<div class='gearmeta'>"+meta.join(" · ")+"</div>":"")+(g.text?"<p class='et-text'>"+g.text+"</p>":"");
      cGear.appendChild(e);
    });
    if (S.money) cGear.appendChild(el("p","gearmeta","Wealth: "+S.money));
    grid.appendChild(cGear);

    // --- Bushido / motivations ---
    var cMot = el("div","sh-card");
    cMot.appendChild(el("h2",null,"Bushidō &amp; Motivation"));
    var dl=el("div","deflist");
    function row(dt,dd){ dl.appendChild(el("div","row","<dt>"+dt+"</dt><dd>"+dd+"</dd>")); }
    row("Paramount", S.bushido.paramount);
    row("Least significant", S.bushido.less);
    row("Ninjō (desire)", S.ninjo);
    row("Giri (duty)", S.giri);
    cMot.appendChild(dl);
    grid.appendChild(cMot);

    root.appendChild(grid);
  }

  function tracker(key,name,max,limit,warnAt){
    var wrap=el("div","trk"); wrap.setAttribute("data-key",key);
    wrap.innerHTML="<div class='trk-top'><span class='trk-name'>"+name+" <span class='warn' data-warn></span></span><span class='trk-val'></span></div>";
    var pips=el("div","pips");
    for(var i=1;i<=max;i++){ (function(n){ var p=el("div","pip"); p.addEventListener("click",function(){ if(RO) return; st[key]=(st[key]===n?n-1:n); save(); syncTracker(key); }); pips.appendChild(p); })(i); }
    wrap.appendChild(pips);
    if(warnAt) wrap.appendChild(el("p","trk-note",warnAt));
    setTimeout(function(){ syncTracker(key); },0);
    return wrap;
  }
  function syncTracker(key){
    var wrap=root.querySelector('.trk[data-key="'+key+'"]'); if(!wrap) return;
    var v=trkVal(key);
    wrap.querySelectorAll(".pip").forEach(function(p,i){ p.classList.toggle("on", i<v); });
    wrap.querySelector(".trk-val").textContent=v+" / "+wrap.querySelectorAll(".pip").length;
    var warn=wrap.querySelector("[data-warn]"); warn.textContent="";
    if(key==="strife" && v>=S.derived.composure) warn.textContent="Compromised";
    if(key==="fatigue" && v>=S.derived.endurance) warn.textContent="Incapacitated";
  }
  function entry(name,tag,ring,text){
    var e=el("div","entry");
    var tags=(tag?"<span class='et-tag'>"+tag+"</span>":"")+(ring?"<span class='et-tag ring'>"+cap(ring)+"</span>":"");
    e.innerHTML="<div class='et-head'><span class='et-name'>"+name+"</span>"+tags+"</div><p class='et-text collapsed'>"+text+"</p><button class='more'>Read more</button>";
    var body=e.querySelector(".et-text"), btn=e.querySelector(".more");
    btn.addEventListener("click",function(){ var c=body.classList.toggle("collapsed"); btn.textContent=c?"Read more":"Show less"; });
    return e;
  }

  function syncRing(){ root.querySelectorAll(".ring").forEach(function(r){ r.classList.toggle("sel", r.getAttribute("data-ring")===st.ring); }); }
  function syncSkill(){ root.querySelectorAll(".skrow").forEach(function(r){ r.classList.toggle("sel", r.getAttribute("data-skill")===st.skill); }); }
  function syncStance(){ root.querySelectorAll(".stbtn").forEach(function(b){ b.classList.toggle("sel", b.getAttribute("data-stance")===st.stance); }); }

  // ===================== CONFLICT =====================
  function buildConflict(){
    var c=el("div","sh-card conflict-card");
    c.appendChild(el("h2",null,"Conflict"));
    var body=el("div","conflict-body");
    c.appendChild(body);
    setTimeout(function(){ renderConflict(body); },0);
    return c;
  }
  function confRow(label,node){
    var r=el("div","conf-row"); r.appendChild(el("div","conf-label",label)); r.appendChild(node); return r;
  }
  function renderConflict(body){
    body.innerHTML="";
    if(!st.inConflict){
      var enter=el("button","roll-btn conf-enter","⚔ Enter Conflict");
      enter.addEventListener("click",function(){ st.inConflict=true; st.conflictType=st.conflictType||"skirmish"; save(); renderConflict(body); syncRoller(); });
      body.appendChild(enter);
      body.appendChild(el("p","stance-note","Conflict type, stances, initiative, and available actions appear once a conflict begins."));
      return;
    }
    // conflict type
    var typeWrap=el("div","conf-choices");
    Object.keys(L5RD.conflicts).forEach(function(k){
      var b=el("button","conf-choice"+(st.conflictType===k?" sel":""),L5RD.conflicts[k].name);
      b.addEventListener("click",function(){ st.conflictType=k; save(); renderConflict(body); });
      typeWrap.appendChild(b);
    });
    body.appendChild(confRow("Type",typeWrap));
    var conf=L5RD.conflicts[st.conflictType]||{actions:[],initSkill:"—"};
    // stance
    var stWrap=el("div","stances");
    RINGS.forEach(function(r){
      var b=el("button","stbtn"+(st.stance===r?" sel":""),cap(r));
      b.setAttribute("data-stance",r);
      b.addEventListener("click",function(){ st.stance=r; st.ring=r; save(); renderConflict(body); syncRing(); syncRoller(); });
      stWrap.appendChild(b);
    });
    body.appendChild(confRow("Stance",stWrap));
    if(st.stance && L5RD.stances[st.stance]){
      body.appendChild(el("div","stance-detail","<b>"+L5RD.stances[st.stance].name+".</b> "+L5RD.stances[st.stance].text));
    }
    // initiative
    var initWrap=el("div","conf-init");
    var initBtn=el("button","roll-btn ghost","Roll Initiative");
    initBtn.addEventListener("click",function(){ rollInitiative(conf); });
    initWrap.appendChild(initBtn);
    initWrap.appendChild(el("span","conf-note","TN 1 · "+conf.initSkill+" · any ring — order by bonus successes, ties: lowest honor first"));
    body.appendChild(confRow("Initiative",initWrap));
    // actions
    var actWrap=el("div","conf-choices actions");
    conf.actions.forEach(function(a){ actWrap.appendChild(el("span","conf-action",a)); });
    body.appendChild(confRow("Actions",actWrap));
    // end
    var end=el("button","link-btn","End conflict");
    end.addEventListener("click",function(){ st.inConflict=false; save(); renderConflict(body); syncRoller(); });
    body.appendChild(end);
  }
  function rollInitiative(conf){
    var key=conf.initSkill.toLowerCase();
    st.skill=key; save(); syncSkill();
    var rc=document.getElementById("rollerCard"); if(rc) rc.classList.remove("collapsed");
    var tn=document.getElementById("rTN"); if(tn) tn.value=1;
    syncRoller(); doRoll();
    if(rc) rc.scrollIntoView({behavior:"smooth",block:"start"});
  }

  // ===================== ROLLER =====================
  // Roll & Keep, played by the rules: the player keeps dice (nothing is kept
  // automatically), chooses whether to explode kept (ex) dice, may reroll dice
  // for advantages/disadvantages, add Assistance dice, or spend a Void point.
  var pool=[];       // die objects: {type,key,su,ex,op,st,kept,bonus,explodedDone}
  var curKeep=0;     // keep limit locked in at roll time
  var cfg={ assistSkill:0, assistRing:0, voidSpend:false };

  function buildRoller(){
    var c=el("div","sh-card span2 roller collapsed"); c.id="rollerCard";
    c.innerHTML=""
      +"<button class='roller-toggle' id='rollerToggle' aria-expanded='false'>"
      +"  <span class='rt-title'>Roll &amp; Keep</span>"
      +"  <span class='rt-current' id='rtCurrent'></span>"
      +"  <span class='rt-chevron'>&#9656;</span>"
      +"</button>"
      +"<div class='roller-body' id='rollerBody'>"
      +"  <div class='r-controls'>"
      +"    <div class='r-field'><label>Ring</label><span class='r-pick' id='rRing'></span></div>"
      +"    <div class='r-field'><label>Skill</label><span class='r-pick' id='rSkill'></span></div>"
      +"    <div class='r-field r-tn'><label>TN</label><input id='rTN' type='number' min='0' value='2'></div>"
      +"    <div class='r-field'><label>Assist &mdash; skilled</label><span class='stepper' data-cfg='assistSkill'></span></div>"
      +"    <div class='r-field'><label>Assist &mdash; unskilled</label><span class='stepper' data-cfg='assistRing'></span></div>"
      +"    <div class='r-field'><label>Void <span id='rVoidHave' class='vhave'></span></label><label class='vchk'><input type='checkbox' id='rVoid'> Seize the Moment</label></div>"
      +"  </div>"
      +"  <div class='r-actions'><button class='roll-btn' id='rRoll'>Assemble &amp; Roll</button><button class='roll-btn ghost' id='rClear'>Clear</button><span class='r-summary' id='rSummary'></span></div>"
      +"  <p class='r-hint'><b>Click dice to keep</b> &mdash; nothing is kept for you. <b>&#8635;</b> rerolls a die (for advantages or disadvantages). A kept <b>explosive</b> (&#10057;) die shows an explode button to roll a bonus die, which you may keep or drop.</p>"
      +"  <div class='dice-row' id='rDice'></div>"
      +"  <div class='r-result' id='rResult'></div>"
      +"  <div class='opp-panel collapsed' id='oppPanel'>"
      +"    <button class='opp-toggle' id='oppToggle'><span>Opportunity spends (&#9672;)</span><span class='rt-chevron'>&#9656;</span></button>"
      +"    <div class='opp-body' id='oppBody'></div>"
      +"  </div>"
      +"  <p class='legend'><span>Dark <b>d6</b> = Ring die</span><span>Light <b>d12</b> = Skill die</span><span>Assist / Void add a die <em>and</em> a keep; Void spends a point.</span></p>"
      +"</div>";
    setTimeout(function(){
      c.querySelector("#rollerToggle").addEventListener("click",function(){
        var open=!c.classList.toggle("collapsed");
        this.setAttribute("aria-expanded", open?"true":"false");
      });
      buildStepper(c.querySelector("[data-cfg='assistSkill']"),"assistSkill");
      buildStepper(c.querySelector("[data-cfg='assistRing']"),"assistRing");
      c.querySelector("#rRoll").addEventListener("click",doRoll);
      c.querySelector("#rClear").addEventListener("click",clearRoll);
      c.querySelector("#rVoid").addEventListener("change",function(){ cfg.voidSpend=this.checked; });
      c.querySelector("#rTN").addEventListener("input",function(){ if(pool.length) tally(); });
      c.querySelector("#oppToggle").addEventListener("click",function(){ document.getElementById("oppPanel").classList.toggle("collapsed"); });
      syncRoller();
      renderOpp();
    },0);
    return c;
  }

  function renderOpp(){
    var body=document.getElementById("oppBody"); if(!body) return;
    if(!L5RD.oppTables.length){ body.innerHTML=""; return; }
    st.oppTable = st.oppTable || "general";
    body.innerHTML="";
    var chips=el("div","opp-chips");
    L5RD.oppTables.forEach(function(t){
      var b=el("button","opp-chip"+(st.oppTable===t[0]?" sel":""),t[1]);
      b.addEventListener("click",function(){ st.oppTable=t[0]; save(); renderOpp(); });
      chips.appendChild(b);
    });
    body.appendChild(chips);
    body.appendChild(el("div","opp-ringnote","Your approach is <b>"+cap(st.ring)+"</b> — matching spends are highlighted. Spend (&#9672;) opportunity from your kept dice."));
    var table=L5RD.opportunities[st.oppTable]||{};
    var list=el("div","opp-list");
    if(table.any) list.appendChild(oppGroup("Any approach", table.any, false, false));
    RINGS.forEach(function(r){ if(table[r]) list.appendChild(oppGroup(cap(r), table[r], r===st.ring, false)); });
    var techs=(L5RD.techniqueOpportunities||[]).filter(function(t){ return t.ring===st.ring; });
    if(techs.length) list.appendChild(oppGroup("From your techniques", techs.map(function(t){ return "<b>"+t.name+":</b> "+t.text; }), true, true));
    body.appendChild(list);
  }
  function oppGroup(label,items,hi,rawHTML){
    var g=el("div","opp-group"+(hi?" hi":""));
    g.appendChild(el("div","opp-gl",label));
    items.forEach(function(s){ var e=el("div","opp-item"); if(rawHTML) e.innerHTML=s; else e.textContent=s; g.appendChild(e); });
    return g;
  }

  function buildStepper(host,key){
    host.innerHTML="<button class='st-btn' data-d='-1' aria-label='decrease'>&minus;</button><span class='st-val'>0</span><button class='st-btn' data-d='1' aria-label='increase'>+</button>";
    var val=host.querySelector(".st-val");
    host.querySelectorAll(".st-btn").forEach(function(b){
      b.addEventListener("click",function(){
        cfg[key]=Math.max(0,Math.min(6,(cfg[key]||0)+parseInt(b.getAttribute("data-d"),10)));
        val.textContent=cfg[key];
      });
    });
  }

  function ringN(){ return S.rings[st.ring]||0; }
  function skillN(){ return st.skill?(S.skills[st.skill]||0):0; }
  function skillLabel(){ return st.skill?((SKILL_NAMES[st.skill]||cap(st.skill))+" "+skillN()):"— none —"; }
  function syncRoller(){
    var rr=document.getElementById("rRing"); if(!rr) return;
    rr.textContent=cap(st.ring)+" "+ringN();
    document.getElementById("rSkill").textContent=skillLabel();
    var cur=document.getElementById("rtCurrent");
    if(cur) cur.textContent=cap(st.ring)+" "+ringN()+(st.skill?"  ·  "+skillLabel():"");
    var vh=document.getElementById("rVoidHave"); if(vh) vh.textContent="("+(st["void"]||0)+" held)";
    var sum=document.getElementById("rSummary");
    if(sum) sum.innerHTML="Base pool <b>"+(ringN()+skillN())+"</b> · keep <b>"+ringN()+"</b>";
    renderOpp();
  }

  function rollFace(type){
    var faces=type==="ring"?RING_FACES:SKILL_FACES;
    var f=faces[Math.floor(Math.random()*faces.length)];
    return { type:type, key:f.key, su:f.su||0, ex:f.ex||0, op:f.op||0, st:f.st||0, kept:false, bonus:false, explodedDone:false };
  }

  function doRoll(){
    var spendVoid = cfg.voidSpend && (st["void"]||0)>=1;
    var extraRing = cfg.assistRing + (spendVoid?1:0);
    var extraSkill = cfg.assistSkill;
    pool=[]; var i;
    for(i=0;i<ringN()+extraRing;i++) pool.push(rollFace("ring"));
    for(i=0;i<skillN()+extraSkill;i++) pool.push(rollFace("skill"));
    curKeep = ringN() + cfg.assistRing + cfg.assistSkill + (spendVoid?1:0);
    if(spendVoid){ st["void"]=Math.max(0,(st["void"]||0)-1); save(); syncTracker("void"); syncRoller(); }
    var vc=document.getElementById("rVoid"); if(vc) vc.checked=false; cfg.voidSpend=false;
    renderDice(); tally();
  }
  function clearRoll(){ pool=[]; renderDice(); document.getElementById("rResult").classList.remove("show"); }

  function keptBase(){ return pool.filter(function(d){ return d.kept && !d.bonus; }).length; }

  function renderDice(){
    var row=document.getElementById("rDice"); row.innerHTML="";
    if(!pool.length){ document.getElementById("rResult").classList.remove("show"); return; }
    ["ring","skill"].forEach(function(type){
      var group=pool.filter(function(d){ return d.type===type; });
      if(!group.length) return;
      row.appendChild(el("div","dice-group-label",(type==="ring"?"Ring Dice (d6)":"Skill Dice (d12)")));
      group.forEach(function(d){ row.appendChild(makeDie(d)); });
    });
  }
  function makeDie(d){
    var die=el("div","die "+d.type+(d.kept?" kept":"")+(d.bonus?" bonus":""));
    die.title=faceTitle(d);
    var canExplode = d.kept && d.ex>0 && !d.explodedDone;
    die.innerHTML="<img class='face' src='../assets/dice/"+d.key+".svg' alt=''>"
      +"<span class='dtype'>"+(d.type==="ring"?"d6":"d12")+"</span>"
      +"<button class='die-op reroll' title='Reroll this die'>&#8635;</button>"
      +(canExplode?"<button class='die-op explode' title='Explode: roll a bonus die'>&#10057;</button>":"");
    die.addEventListener("click",function(){ toggleKeep(d); });
    die.querySelector(".reroll").addEventListener("click",function(e){ e.stopPropagation(); rerollDie(d); });
    var ex=die.querySelector(".explode"); if(ex) ex.addEventListener("click",function(e){ e.stopPropagation(); explodeDie(d); });
    return die;
  }
  function toggleKeep(d){
    if(!d.kept && !d.bonus && keptBase()>=curKeep) return; // base keep limit
    d.kept=!d.kept;
    renderDice(); tally();
  }
  function rerollDie(d){
    var f=rollFace(d.type);
    d.key=f.key; d.su=f.su; d.ex=f.ex; d.op=f.op; d.st=f.st; d.explodedDone=false;
    renderDice(); tally();
  }
  function explodeDie(d){
    d.explodedDone=true;
    var nd=rollFace(d.type); nd.bonus=true; nd.kept=true;
    pool.splice(pool.indexOf(d)+1,0,nd);
    renderDice(); tally();
  }

  function tally(){
    var kept=pool.filter(function(d){ return d.kept; });
    var su=0,op=0,stf=0,bonusKept=0;
    kept.forEach(function(d){ su+=d.su+d.ex; op+=d.op; stf+=d.st; if(d.bonus) bonusKept++; });
    var tn=parseInt(document.getElementById("rTN").value||"0",10);
    var res=document.getElementById("rResult");
    var pass=su>=tn;
    var voidStance = st.inConflict && st.stance==="void";
    var strifeApplied = voidStance ? 0 : stf;
    res.className="r-result show";
    res.innerHTML=""
      +"<div class='verdict "+(pass?"pass":"fail")+"'>"+(pass?"Success":"Failure")+" &mdash; "+su+" vs TN "+tn+"</div>"
      +"<div class='tallies'><span>Kept <b>"+keptBase()+"/"+curKeep+"</b>"+(bonusKept?" <em>+"+bonusKept+" bonus</em>":"")+"</span><span>Successes <b class='sym su' style='color:#3f8f5a'>"+su+"</b></span><span>Opportunity <b class='sym op' style='color:#c08a1e'>"+op+"</b></span><span>Strife <b class='sym st' style='color:#b0642a'>"+stf+"</b></span></div>"
      +"<div class='applybar'><button class='roll-btn ghost' id='rApplyStrife'>Apply "+strifeApplied+" strife"+(voidStance&&stf>0?" (Void stance: 0)":"")+"</button><span class='r-summary'>"+(voidStance&&stf>0?"Void stance ignores ▲ on kept dice":"")+"</span></div>";
    document.getElementById("rApplyStrife").addEventListener("click",function(){
      st.strife=Math.min(S.trackers.strife.max, (st.strife||0)+strifeApplied); save(); syncTracker("strife");
    });
  }

  // ---- version switching ----
  function switchVersion(id){
    var v=verById(id)||VERSIONS[0];
    curView=v.id; RO=!v.live; S=v.data; SNAP = v.live ? null : (v.data.state||{});
    buildVersionPicker();
    render();
  }
  function buildVersionPicker(){
    var host=document.getElementById("verPicker"); if(!host) return;
    var s="<label class='ver-label'>Sheet</label><select id='verSel'"+(VERSIONS.length<=1?" title='Prior sessions appear here once recorded'":"")+">";
    VERSIONS.forEach(function(v){ s+="<option value='"+v.id+"'"+(v.id===curView?" selected":"")+">"+v.label+(v.date?" · "+v.date:"")+"</option>"; });
    s+="</select>";
    host.innerHTML=s;
    document.getElementById("verSel").addEventListener("change",function(){ switchVersion(this.value); });
  }

  buildVersionPicker();
  render();
})();
