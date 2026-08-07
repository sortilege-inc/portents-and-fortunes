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
             inConflict:false, conflictType:"skirmish", oppTable:"general",
             conditions:[], techUses:{},
             honor:(S.social?S.social.honor:0), glory:(S.social?S.social.glory:0), status:(S.social?S.social.status:0) };
  var CONDITIONS = ["Afflicted","Bleeding","Burning","Compromised","Dazed","Disoriented","Enraged","Exhausted","Immobilized","Intoxicated","Prone","Silenced","Unconscious"];
  var L5RD = window.L5R || {stances:{},conflicts:{},opportunities:{},oppTables:[],techniqueOpportunities:[]};
  try { var saved = JSON.parse(localStorage.getItem(LSKEY)); if (saved) Object.assign(st, saved); } catch(e){}
  function save(){ if(RO) return; try { localStorage.setItem(LSKEY, JSON.stringify(st)); } catch(e){} }
  function trkVal(key){ return RO ? ((SNAP&&SNAP[key])||0) : (st[key]||0); }

  // ---- roll log (history of kept results) ----
  var LOGKEY = "pf-log-" + (CURRENT.id || "pc");
  var rollLog = []; try { rollLog = JSON.parse(localStorage.getItem(LOGKEY)) || []; } catch(e){}
  function saveLog(){ try { localStorage.setItem(LOGKEY, JSON.stringify(rollLog)); } catch(e){} }
  function nowStr(){ try { return new Date().toLocaleString(); } catch(e){ return ""; } }
  function logEvent(cat, desc, extra){
    if(RO) return;
    rollLog.unshift(Object.assign({ kind:"event", cat:cat, desc:desc, when:nowStr() }, extra||{}));
    saveLog(); updateLogCount(); renderLog();
  }
  function socialVal(attr){ if(RO) return (S.social&&S.social[attr])||0; return st[attr]!=null?st[attr]:((S.social&&S.social[attr])||0); }
  function ringIcon(r){ return "<img class='ring-ico' src='../assets/rings/"+r+".svg' alt='"+cap(r)+"' title='"+cap(r)+"'>"; }

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
  function escapeHTML(s){ return String(s).replace(/[&<>"']/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  // Render the dice-symbol tokens the corpus stores as ASCII, e.g. (op), as styled glyphs.
  function syms(t){
    if(t==null) return "";
    return String(t)
      .replace(/\(op\)/g,"<span class='sym op'>◈</span>")
      .replace(/\(su\)/g,"<span class='sym su'>❁</span>")
      .replace(/\(ex\)/g,"<span class='sym ex'>❉</span>")
      .replace(/\(st\)/g,"<span class='sym st'>▲</span>")
      .replace(/\(ring\)/g,"<span class='sym ring'>⬢</span>")
      .replace(/\((air|earth|fire|water|void)\)/gi,function(m,r){ return ringIcon(r.toLowerCase()); })
      .replace(/\[(Air|Earth|Fire|Water|Void)\]/g,function(m,r){ return ringIcon(r.toLowerCase()); });
  }

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

    // --- Conflict (spans the full width, above rings/condition) ---
    if(!RO) grid.appendChild(buildConflict());

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
    cTrk.appendChild(buildConditions());
    grid.appendChild(cTrk);

    // --- Social (Honor / Glory / Status) ---
    grid.appendChild(buildSocial());

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

    // --- Techniques (beside Skills) ---
    var cTech = el("div","sh-card");
    cTech.appendChild(el("h2",null,"Techniques"));
    var techBody=el("div"); techBody.id="techBody"; cTech.appendChild(techBody);
    grid.appendChild(cTech);
    setTimeout(renderTechniques,0);

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
    var TNAMES={strife:"Strife",fatigue:"Fatigue","void":"Void points"};
    for(var i=1;i<=max;i++){ (function(n){ var p=el("div","pip"); p.addEventListener("click",function(){
      if(RO) return;
      var from=st[key]||0, to=(from===n?n-1:n);
      if(to===from) return;
      st[key]=to; save(); syncTracker(key);
      logEvent(key,(TNAMES[key]||key)+" "+from+" → "+to+((key==="void"&&to<from)?" (spent)":""),{attr:key,from:from,to:to,delta:to-from});
    }); pips.appendChild(p); })(i); }
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
    e.innerHTML="<div class='et-head'><span class='et-name'>"+name+"</span>"+tags+"</div><p class='et-text collapsed'>"+syms(text)+"</p><button class='more'>Read more</button>";
    var body=e.querySelector(".et-text"), btn=e.querySelector(".more");
    btn.addEventListener("click",function(){ var c=body.classList.toggle("collapsed"); btn.textContent=c?"Read more":"Show less"; });
    return e;
  }

  function syncRing(){ root.querySelectorAll(".ring").forEach(function(r){ r.classList.toggle("sel", r.getAttribute("data-ring")===st.ring); }); }
  function syncSkill(){ root.querySelectorAll(".skrow").forEach(function(r){ r.classList.toggle("sel", r.getAttribute("data-skill")===st.skill); }); }
  function syncStance(){ root.querySelectorAll(".stbtn").forEach(function(b){ b.classList.toggle("sel", b.getAttribute("data-stance")===st.stance); }); }

  // ===================== CONDITIONS =====================
  function buildConditions(){
    var wrap=el("div","conditions-wrap");
    wrap.appendChild(el("h2",null,"Conditions"));
    var chips=el("div","cond-chips");
    CONDITIONS.forEach(function(c){
      var b=el("button","cond-chip"+(st.conditions.indexOf(c)>=0?" on":""),c);
      b.addEventListener("click",function(){
        if(RO) return;
        var i=st.conditions.indexOf(c);
        if(i>=0){ st.conditions.splice(i,1); logEvent("condition","Removed condition: "+c,{attr:c,delta:"removed"}); }
        else { st.conditions.push(c); logEvent("condition","Applied condition: "+c,{attr:c,delta:"applied"}); }
        save(); b.classList.toggle("on");
      });
      chips.appendChild(b);
    });
    wrap.appendChild(chips);
    return wrap;
  }

  // ===================== SOCIAL STANDING =====================
  function buildSocial(){
    var c=el("div","sh-card span2 social-card");
    c.appendChild(el("h2",null,"Social Standing"));
    var row=el("div","social-row");
    [["honor","Honor"],["glory","Glory"],["status","Status"]].forEach(function(p){ row.appendChild(socialAttr(p[0],p[1])); });
    c.appendChild(row);
    c.appendChild(el("p","trk-note","Adjust with − / +, or stake a set amount to wager it. Every change is written to the roll log."));
    return c;
  }
  function socialAttr(attr,label){
    var box=el("div","soc-attr"); box.setAttribute("data-attr",attr);
    box.innerHTML="<div class='soc-lab'>"+label+"</div>"
      +"<div class='soc-main'><button class='soc-adj' data-d='-1'>&minus;</button><span class='soc-val'>"+socialVal(attr)+"</span><button class='soc-adj' data-d='1'>+</button></div>"
      +"<div class='soc-stake'><input type='number' class='soc-stake-in' min='1' placeholder='stake'><button class='soc-stake-btn'>Stake</button></div>";
    if(RO){ box.querySelectorAll("button,input").forEach(function(x){ x.disabled=true; }); return box; }
    var valEl=box.querySelector(".soc-val");
    box.querySelectorAll(".soc-adj").forEach(function(b){
      b.addEventListener("click",function(){
        var d=parseInt(b.getAttribute("data-d"),10);
        var from=socialVal(attr), to=Math.max(0,from+d);
        if(to===from) return;
        st[attr]=to; save(); valEl.textContent=to;
        logEvent("social",label+" "+from+" → "+to+" ("+(d>0?"+":"")+d+")",{attr:attr,from:from,to:to,delta:d});
      });
    });
    box.querySelector(".soc-stake-btn").addEventListener("click",function(){
      var inp=box.querySelector(".soc-stake-in"), amt=Math.max(0,parseInt(inp.value||"0",10));
      if(!amt) return;
      logEvent("stake","Staked "+amt+" "+label+" (holding "+socialVal(attr)+")",{attr:attr,amount:amt});
      inp.value="";
    });
    return box;
  }

  // ===================== TECHNIQUES =====================
  function renderTechniques(){
    var body=document.getElementById("techBody"); if(!body) return;
    body.innerHTML="";
    S.techniques.forEach(function(t){ body.appendChild(techEntry(t)); });
  }
  function wireMore(body,btn){ btn.addEventListener("click",function(){ var c=body.classList.toggle("collapsed"); btn.textContent=c?"Read more":"Show less"; }); }
  function techEntry(t){
    var e=el("div","entry tech-entry");
    if(t.kind==="school"){   // Blood of the Kami — special collapsed view
      e.innerHTML="<div class='et-head'><span class='et-name'>"+t.name+"</span><span class='et-tag'>"+t.tag+"</span>"+ringIcon(t.ring)+"</div>"
        +"<div class='tech-blood'>Active — empowers <b>"+t.linkedKiho+"</b> (the "+t.motif+" tattoo): on a successful activation, add bonus successes equal to your school rank ("+(S.rank||1)+").</div>"
        +"<p class='et-text collapsed'>"+syms(t.text)+"</p><button class='more'>Read more</button>";
      wireMore(e.querySelector(".et-text"), e.querySelector(".more"));
      return e;
    }
    var usage = t.uses ? "<span class='tech-uses'>"+(st.techUses[t.name]||0)+"/"+t.uses.max+" per "+t.uses.per+"</span>" : "";
    e.innerHTML="<div class='et-head'><span class='et-name'>"+t.name+"</span><span class='et-tag'>"+t.tag+"</span>"+ringIcon(t.ring)+usage+"</div>";
    if(t.activation){
      var a=t.activation;
      var maxed = t.uses && (st.techUses[t.name]||0)>=t.uses.max;
      var btn=el("button","tech-activate"+(maxed?" spent":""), a.actionType+a.punct+" TN "+a.tn+" "+(SKILL_NAMES[a.skill]||cap(a.skill))+" "+ringIcon(a.ring));
      btn.addEventListener("click",function(){ if(RO) return; activateTechnique(t); });
      e.appendChild(btn);
    }
    var body=el("p","et-text collapsed"); body.innerHTML=syms(t.text); e.appendChild(body);
    var more=el("button","more","Read more"); e.appendChild(more); wireMore(body,more);
    return e;
  }
  function activateTechnique(t){
    var a=t.activation; if(!a) return;
    st.ring=a.ring; st.skill=a.skill; save(); syncRing(); syncSkill();
    var rc=document.getElementById("rollerCard"); if(rc) rc.classList.remove("collapsed");
    var tn=document.getElementById("rTN"); if(tn) tn.value=a.tn;
    var note=document.getElementById("rNote"); if(note && !note.value) note.value=t.name;
    rollCtx={ source:t.name, activation:a.actionType+a.punct, bloodOfKami:!!t.bloodOfKami, schoolRank:(S.rank||1) };
    if(t.uses){ st.techUses[t.name]=(st.techUses[t.name]||0)+1; save(); renderTechniques(); }
    syncRoller(); doRoll();
    if(rc) rc.scrollIntoView({behavior:"smooth",block:"start"});
  }

  // ===================== CONFLICT =====================
  function buildConflict(){
    var c=el("div","sh-card span2 conflict-card");
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
      body.appendChild(el("div","stance-detail","<b>"+L5RD.stances[st.stance].name+".</b> "+syms(L5RD.stances[st.stance].text)));
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
  var rollLogged=false;
  var rollMeta=null; // full provenance of the current roll (for the log)
  var rollCtx=null;  // technique-activation context (source, Blood of the Kami, etc.)
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
      +"  <div class='roller-tabs'><button class='rtab sel' data-tab='roll'>Roll</button><button class='rtab' data-tab='log'>Log <span class='logcount' id='rLogCount'></span></button></div>"
      +"  <div class='roller-tab tp-roll' data-tab='roll'>"
      +"    <div class='r-controls'>"
      +"      <div class='r-field'><label>Ring</label><span class='r-pick' id='rRing'></span></div>"
      +"      <div class='r-field'><label>Skill</label><span class='r-pick' id='rSkill'></span></div>"
      +"      <div class='r-field r-tn'><label>TN</label><input id='rTN' type='number' min='0' value='2'></div>"
      +"      <div class='r-field'><label>Assist &mdash; skilled</label><span class='stepper' data-cfg='assistSkill'></span></div>"
      +"      <div class='r-field'><label>Assist &mdash; unskilled</label><span class='stepper' data-cfg='assistRing'></span></div>"
      +"      <div class='r-field'><label>Void <span id='rVoidHave' class='vhave'></span></label><label class='vchk'><input type='checkbox' id='rVoid'> Seize the Moment</label></div>"
      +"    </div>"
      +"    <div class='r-noterow'><label class='r-notelabel'>Concerning</label><input type='text' id='rNote' class='r-note' placeholder='What is this roll about? (optional — saved to the log)' maxlength='140'></div>"
      +"    <div class='r-actions'><button class='roll-btn' id='rRoll'>Assemble &amp; Roll</button><button class='roll-btn ghost' id='rClear'>Clear</button><span class='r-summary' id='rSummary'></span></div>"
      +"    <p class='r-hint'><b>Click dice to keep</b> &mdash; nothing is kept for you. <b>&#8635;</b> rerolls a die (for advantages or disadvantages). A kept <b>explosive</b> (&#10057;) die shows an explode button to roll a bonus die, which you may keep or drop.</p>"
      +"    <div class='dice-row' id='rDice'></div>"
      +"    <div class='r-result' id='rResult'></div>"
      +"    <div class='opp-panel collapsed' id='oppPanel'>"
      +"      <button class='opp-toggle' id='oppToggle'><span>Opportunity spends (&#9672;)</span><span class='rt-chevron'>&#9656;</span></button>"
      +"      <div class='opp-body' id='oppBody'></div>"
      +"    </div>"
      +"    <p class='legend'><span>Dark <b>d6</b> = Ring die</span><span>Light <b>d12</b> = Skill die</span><span>Assist / Void add a die <em>and</em> a keep; Void spends a point.</span></p>"
      +"  </div>"
      +"  <div class='roller-tab tp-log' data-tab='log' id='rLog' hidden></div>"
      +"</div>";
    setTimeout(function(){
      c.querySelector("#rollerToggle").addEventListener("click",function(){
        var open=!c.classList.toggle("collapsed");
        this.setAttribute("aria-expanded", open?"true":"false");
      });
      c.querySelectorAll(".rtab").forEach(function(b){
        b.addEventListener("click",function(){
          var t=b.getAttribute("data-tab");
          c.querySelectorAll(".rtab").forEach(function(x){ x.classList.toggle("sel",x===b); });
          c.querySelector(".tp-roll").hidden=(t!=="roll");
          c.querySelector(".tp-log").hidden=(t!=="log");
          if(t==="log") renderLog();
        });
      });
      buildStepper(c.querySelector("[data-cfg='assistSkill']"),"assistSkill");
      buildStepper(c.querySelector("[data-cfg='assistRing']"),"assistRing");
      c.querySelector("#rRoll").addEventListener("click",function(){ rollCtx=null; doRoll(); });
      c.querySelector("#rClear").addEventListener("click",clearRoll);
      c.querySelector("#rVoid").addEventListener("change",function(){ cfg.voidSpend=this.checked; });
      c.querySelector("#rTN").addEventListener("input",function(){ if(pool.length) tally(); });
      c.querySelector("#oppToggle").addEventListener("click",function(){ document.getElementById("oppPanel").classList.toggle("collapsed"); });
      syncRoller();
      renderOpp();
      updateLogCount();
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
    body.appendChild(el("div","opp-ringnote","Spends for your <b>"+cap(st.ring)+"</b> approach. Spend <span class='sym op'>◈</span> opportunity from your kept dice."));
    var table=L5RD.opportunities[st.oppTable]||{};
    var list=el("div","opp-list");
    if(table.any) list.appendChild(oppGroup("Any approach", table.any, false));
    if(table[st.ring]) list.appendChild(oppGroup(cap(st.ring)+" approach", table[st.ring], true));
    else if(!table.any) list.appendChild(el("div","opp-empty","No "+cap(st.ring)+" opportunities listed for this context."));
    var techs=(L5RD.techniqueOpportunities||[]).filter(function(t){ return t.ring===st.ring; });
    if(techs.length) list.appendChild(oppGroup("From your techniques", techs.map(function(t){ return "<b>"+t.name+":</b> "+t.text; }), true));
    body.appendChild(list);
  }
  function oppGroup(label,items,hi){
    var g=el("div","opp-group"+(hi?" hi":""));
    g.appendChild(el("div","opp-gl",label));
    items.forEach(function(s){ var e=el("div","opp-item"); e.innerHTML=syms(s); g.appendChild(e); });
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
    rollLogged=false;
    var spendVoid = cfg.voidSpend && (st["void"]||0)>=1;
    var extraRing = cfg.assistRing + (spendVoid?1:0);
    var extraSkill = cfg.assistSkill;
    pool=[]; var i;
    for(i=0;i<ringN()+extraRing;i++) pool.push(rollFace("ring"));
    for(i=0;i<skillN()+extraSkill;i++) pool.push(rollFace("skill"));
    curKeep = ringN() + cfg.assistRing + cfg.assistSkill + (spendVoid?1:0);
    rollMeta = {
      ring: st.ring, ringN: ringN(),
      skillLabel: st.skill ? (SKILL_NAMES[st.skill]||cap(st.skill)) : null, skillN: skillN(),
      assistSkill: cfg.assistSkill, assistRing: cfg.assistRing, voidSpent: spendVoid,
      keepLimit: curKeep,
      initial: pool.map(function(d){ return { type:d.type, key:d.key }; }),
      events: [],
      source: rollCtx ? rollCtx.source : null,
      activation: rollCtx ? rollCtx.activation : null,
      bloodOfKami: rollCtx ? !!rollCtx.bloodOfKami : false,
      inConflict: !!st.inConflict, stance: st.inConflict ? st.stance : null,
      conflictType: st.inConflict ? st.conflictType : null
    };
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
    var from=d.key;
    var f=rollFace(d.type);
    d.key=f.key; d.su=f.su; d.ex=f.ex; d.op=f.op; d.st=f.st; d.explodedDone=false;
    if(rollMeta) rollMeta.events.push({ kind:"reroll", type:d.type, from:from, to:f.key });
    renderDice(); tally();
  }
  function explodeDie(d){
    d.explodedDone=true;
    var nd=rollFace(d.type); nd.bonus=true; nd.kept=true;
    pool.splice(pool.indexOf(d)+1,0,nd);
    if(rollMeta) rollMeta.events.push({ kind:"explode", type:d.type, source:d.key, result:nd.key });
    renderDice(); tally();
  }

  function tally(){
    var kept=pool.filter(function(d){ return d.kept; });
    var su=0,op=0,stf=0,bonusKept=0;
    kept.forEach(function(d){ su+=d.su+d.ex; op+=d.op; stf+=d.st; if(d.bonus) bonusKept++; });
    var tn=parseInt(document.getElementById("rTN").value||"0",10);
    var res=document.getElementById("rResult");
    var pass=su>=tn;
    var bok = (rollCtx && rollCtx.bloodOfKami && pass) ? (rollCtx.schoolRank||0) : 0;
    var totalSu = su + bok;
    var voidStance = st.inConflict && st.stance==="void";
    var strifeApplied = voidStance ? 0 : stf;
    res.className="r-result show";
    var applyBar;
    if(rollLogged){
      applyBar="<div class='applybar'><span class='kept-tag'>✓ Results kept &amp; logged</span></div>";
    } else {
      applyBar="<div class='applybar'>"
        +"<label class='strife-sel'>Keep strife <input type='number' id='rStrife' min='0' max='"+stf+"' value='"+strifeApplied+"'></label>"
        +"<span class='of-max'>of "+stf+" rolled</span>"
        +"<button class='roll-btn' id='rKeep'>Keep Results</button>"
        +(voidStance&&stf>0?"<span class='r-summary'>Void stance: ▲ on kept dice give no strife</span>":"")
        +"</div>";
    }
    res.innerHTML=""
      +"<div class='verdict "+(pass?"pass":"fail")+"'>"+(pass?"Success":"Failure")+" &mdash; "+totalSu+" vs TN "+tn+"</div>"
      +(rollCtx&&rollCtx.source?"<div class='r-source'>via "+rollCtx.source+(rollCtx.activation?" — "+rollCtx.activation:"")+"</div>":"")
      +(bok?"<div class='r-bok'>+"+bok+" bonus success from <b>Blood of the Kami</b></div>":"")
      +"<div class='tallies'><span>Kept <b>"+keptBase()+"/"+curKeep+"</b>"+(bonusKept?" <em>+"+bonusKept+" bonus die</em>":"")+"</span><span>Successes <b class='sym su' style='color:#3f8f5a'>"+totalSu+"</b>"+(bok?" <em>(incl +"+bok+")</em>":"")+"</span><span>Opportunity <b class='sym op' style='color:#c08a1e'>"+op+"</b></span><span>Strife <b class='sym st' style='color:#b0642a'>"+stf+"</b></span></div>"
      +applyBar;
    if(!rollLogged){
      document.getElementById("rKeep").addEventListener("click",function(){
        var amt=Math.max(0,Math.min(stf,parseInt(document.getElementById("rStrife").value||"0",10)));
        keepResults(amt, totalSu, op, stf, tn, pass, bok);
      });
    }
  }

  function keepResults(strifeAmt, su, op, stfRolled, tn, pass, bokBonus){
    if(RO) return;
    st.strife=Math.min(S.trackers.strife.max, (st.strife||0)+strifeAmt); save(); syncTracker("strife");
    var kept=pool.filter(function(d){ return d.kept; });
    var keptBaseCount=kept.filter(function(d){ return !d.bonus; }).length;
    var bonusKept=kept.filter(function(d){ return d.bonus; }).length;
    var noteEl=document.getElementById("rNote");
    var note=noteEl && noteEl.value ? noteEl.value.trim() : "";
    var m=rollMeta||{};
    rollLog.unshift({
      n: rollLog.length+1,
      note: note,
      ring: m.ring||st.ring, ringN: (m.ringN!=null?m.ringN:ringN()),
      skillLabel: m.skillLabel!==undefined ? m.skillLabel : (st.skill?(SKILL_NAMES[st.skill]||cap(st.skill)):null),
      skillN: m.skillN,
      assistSkill: m.assistSkill||0, assistRing: m.assistRing||0, voidSpent: !!m.voidSpent,
      keepLimit: (m.keepLimit!=null?m.keepLimit:curKeep),
      keptBaseCount: keptBaseCount, bonusKept: bonusKept,
      keptFewer: keptBaseCount < (m.keepLimit!=null?m.keepLimit:curKeep),
      initial: m.initial||[], events: m.events||[],
      source: m.source||null, activation: m.activation||null, bokBonus: bokBonus||0,
      tn: tn, su: su, op: op, strifeRolled: stfRolled, strifeApplied: strifeAmt, pass: pass,
      inConflict: !!m.inConflict, stance: m.stance||null, conflictType: m.conflictType||null,
      kept: kept.map(function(d){ return { type:d.type, key:d.key, bonus:!!d.bonus }; }),
      when: nowStr()
    });
    saveLog();
    updateLogCount();
    renderLog();
    resetRoll();
  }

  // Clear the Roll & Keep interface for the next roll.
  function resetRoll(){
    pool=[]; rollMeta=null; rollCtx=null; rollLogged=false;
    cfg={ assistSkill:0, assistRing:0, voidSpend:false };
    var dice=document.getElementById("rDice"); if(dice) dice.innerHTML="";
    var res=document.getElementById("rResult"); if(res){ res.classList.remove("show"); res.innerHTML=""; }
    var note=document.getElementById("rNote"); if(note) note.value="";
    var vc=document.getElementById("rVoid"); if(vc) vc.checked=false;
    var tn=document.getElementById("rTN"); if(tn) tn.value="2";
    document.querySelectorAll(".roller .stepper .st-val").forEach(function(v){ v.textContent="0"; });
    syncRoller();
    var sum=document.getElementById("rSummary"); if(sum) sum.innerHTML="✓ Roll kept &amp; logged — ready for the next.";
  }

  function updateLogCount(){ var e=document.getElementById("rLogCount"); if(e) e.textContent=rollLog.length?("("+rollLog.length+")"):""; }
  function logDie(k){ return "<img class='logdie "+k.type+(k.bonus?" bonus":"")+"' src='../assets/dice/"+k.key+".svg' alt=''>"; }
  function diceRow(list){ return (list||[]).map(function(k){ return logDie(k); }).join(""); }
  function renderLog(){
    var host=document.getElementById("rLog"); if(!host) return;
    if(!rollLog.length){ host.innerHTML="<p class='r-hint'>No rolls kept yet. Roll, then <b>Keep Results</b> to record one here.</p>"; return; }
    host.innerHTML="<div class='log-actions'><span class='r-summary'>"+rollLog.length+" recorded</span><button class='link-btn' id='logClear'>Clear log</button></div>";
    var EVICON={condition:"☷",social:"❖",stake:"⚑",strife:"▲",fatigue:"✦",voidp:"◇","void":"◇",technique:"❁"};
    rollLog.forEach(function(e){
      if(e.kind==="event"){
        var ev=el("div","log-event cat-"+(e.cat||"misc"));
        ev.innerHTML="<span class='le-cat'>"+(EVICON[e.cat]||"·")+" "+cap(e.cat||"event")+"</span>"
          +"<span class='le-desc'>"+escapeHTML(e.desc||"")+"</span>"
          +(e.when?"<span class='log-when'>"+e.when+"</span>":"");
        host.appendChild(ev); return;
      }
      var d=el("div","log-entry "+(e.pass?"pass":"fail"));

      // config chips: keep, assist, void
      var chips=[];
      if(e.keepLimit!=null){
        var kc="Kept "+(e.keptBaseCount!=null?e.keptBaseCount:(e.kept?e.kept.length:0))+" of "+e.keepLimit;
        if(e.bonusKept) kc+=" +"+e.bonusKept+" bonus";
        chips.push("<span class='logchip"+(e.keptFewer?" warn":"")+"'>"+kc+(e.keptFewer?" — fewer than allowed":"")+"</span>");
      }
      if(e.assistSkill) chips.push("<span class='logchip'>Assist +"+e.assistSkill+" skilled</span>");
      if(e.assistRing) chips.push("<span class='logchip'>Assist +"+e.assistRing+" unskilled</span>");
      if(e.voidSpent) chips.push("<span class='logchip void'>Void point spent</span>");
      if(e.conflictType) chips.push("<span class='logchip'>"+cap(e.conflictType)+"</span>");

      // reroll / explode events
      var evRows="";
      (e.events||[]).forEach(function(ev){
        if(ev.kind==="reroll") evRows+="<div class='log-ev'><span class='ev-tag'>↻ reroll</span>"+logDie({type:ev.type,key:ev.from})+"<span class='ev-arrow'>→</span>"+logDie({type:ev.type,key:ev.to})+"</div>";
        else if(ev.kind==="explode") evRows+="<div class='log-ev'><span class='ev-tag'>✦ explode</span>"+logDie({type:ev.type,key:ev.source})+"<span class='ev-arrow'>→</span>"+logDie({type:ev.type,key:ev.result,bonus:true})+"</div>";
      });

      d.innerHTML=""
        +"<div class='log-head'><span class='log-verdict'>"+(e.pass?"Success":"Failure")+"</span>"
        +"<span class='log-approach'>"+cap(e.ring)+" "+e.ringN+(e.skillLabel?" · "+e.skillLabel+(e.skillN!=null?" "+e.skillN:""):"")+(e.stance?" · "+cap(e.stance)+" stance":"")+"</span>"
        +(e.when?"<span class='log-when'>"+e.when+"</span>":"")+"</div>"
        +(e.source?"<div class='log-source'>via "+e.source+(e.activation?" — "+e.activation:"")+(e.bokBonus?" · +"+e.bokBonus+" Blood of the Kami":"")+"</div>":"")
        +(e.note?"<div class='log-note'>"+escapeHTML(e.note)+"</div>":"")
        +(chips.length?"<div class='log-chips'>"+chips.join("")+"</div>":"")
        +(e.initial&&e.initial.length?"<div class='log-line'><span class='log-lbl'>Rolled</span><span class='log-dice'>"+diceRow(e.initial)+"</span></div>":"")
        +(evRows?"<div class='log-events'>"+evRows+"</div>":"")
        +"<div class='log-line'><span class='log-lbl'>Kept</span><span class='log-dice'>"+diceRow(e.kept)+"</span></div>"
        +"<div class='log-tally'>"+e.su+" vs TN "+e.tn+"  ·  <span class='sym op'>◈</span> "+e.op+"  ·  <span class='sym st'>▲</span> "+e.strifeApplied+" applied"+(e.strifeRolled!==e.strifeApplied?" (of "+e.strifeRolled+" rolled)":"")+"</div>";
      host.appendChild(d);
    });
    var c=document.getElementById("logClear");
    if(c) c.addEventListener("click",function(){ if(RO) return; rollLog=[]; saveLog(); updateLogCount(); renderLog(); });
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
