/* ============================================================
   sheet.js — renders window.SHEET and runs an L5R5e Roll & Keep roller.
   Dice faces are the official Ring (d6) and Skill (d12) faces.
   ============================================================ */
(function () {
  "use strict";
  var S = window.SHEET;
  if (!S) return;
  var root = document.getElementById("sheet");
  var LSKEY = "pf-sheet-" + (S.id || "pc");

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
  var st = { strife:0, fatigue:0, "void":0, stance:S.stance||"void", ring:"earth", skill:null };
  try { var saved = JSON.parse(localStorage.getItem(LSKEY)); if (saved) Object.assign(st, saved); } catch(e){}
  function save(){ try { localStorage.setItem(LSKEY, JSON.stringify(st)); } catch(e){} }

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
    // stance
    cTrk.appendChild(el("h2",null,"Stance"));
    var stances = el("div","stances");
    RINGS.forEach(function(r){
      var b=el("button","stbtn"+(st.stance===r?" sel":""),cap(r));
      b.setAttribute("data-stance",r);
      b.addEventListener("click",function(){ st.stance=r; save(); syncStance(); });
      stances.appendChild(b);
    });
    cTrk.appendChild(stances);
    cTrk.appendChild(el("p","stance-note","Your stance sets the ring you roll with in a conflict. In <b>Void</b> stance you take no strife from ▲ on kept dice."));
    grid.appendChild(cTrk);

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

    // --- Roller (full width) ---
    root.appendChild(buildRoller());
  }

  function tracker(key,name,max,limit,warnAt){
    var wrap=el("div","trk"); wrap.setAttribute("data-key",key);
    wrap.innerHTML="<div class='trk-top'><span class='trk-name'>"+name+" <span class='warn' data-warn></span></span><span class='trk-val'></span></div>";
    var pips=el("div","pips");
    for(var i=1;i<=max;i++){ (function(n){ var p=el("div","pip"); p.addEventListener("click",function(){ st[key]=(st[key]===n?n-1:n); save(); syncTracker(key); }); pips.appendChild(p); })(i); }
    wrap.appendChild(pips);
    if(warnAt) wrap.appendChild(el("p","trk-note",warnAt));
    setTimeout(function(){ syncTracker(key); },0);
    return wrap;
  }
  function syncTracker(key){
    var wrap=root.querySelector('.trk[data-key="'+key+'"]'); if(!wrap) return;
    var v=st[key]||0;
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

  // ===================== ROLLER =====================
  var pool=[], keepLimit=0;
  function buildRoller(){
    var c=el("div","sh-card span2 roller");
    c.innerHTML=""
      +"<h2>Roll &amp; Keep</h2>"
      +"<div class='r-controls'>"
      +"  <div class='r-field'><label>Ring</label><span class='r-pick' id='rRing'></span></div>"
      +"  <div class='r-field'><label>Skill</label><span class='r-pick' id='rSkill'></span></div>"
      +"  <div class='r-field r-tn'><label>TN</label><input id='rTN' type='number' min='0' value='2'></div>"
      +"  <button class='roll-btn' id='rRoll'>Assemble &amp; Roll</button>"
      +"  <button class='roll-btn ghost' id='rClear'>Clear</button>"
      +"  <span class='r-summary' id='rSummary'></span>"
      +"</div>"
      +"<p class='r-hint' id='rHint'>Choose a ring and a skill above (or here), then roll. Keep up to your ring in dice — click dice to change what you keep.</p>"
      +"<div class='dice-row' id='rDice'></div>"
      +"<div class='r-result' id='rResult'></div>"
      +"<p class='legend'><span>Dark <b>d6</b> = Ring die</span><span>Light <b>d12</b> = Skill die</span><span>✦ = exploded (rolled again)</span><span>Keep up to your Ring; successes meet the TN, ▲ strife accrues.</span></p>";
    setTimeout(function(){
      c.querySelector("#rRoll").addEventListener("click",doRoll);
      c.querySelector("#rClear").addEventListener("click",function(){ pool=[]; renderDice(); document.getElementById("rResult").classList.remove("show"); });
      syncRoller();
    },0);
    return c;
  }
  function ringN(){ return S.rings[st.ring]||0; }
  function skillN(){ return st.skill?(S.skills[st.skill]||0):0; }
  function syncRoller(){
    var rr=document.getElementById("rRing"), rs=document.getElementById("rSkill"), sum=document.getElementById("rSummary");
    if(!rr) return;
    rr.textContent=cap(st.ring)+" "+ringN();
    rs.textContent=st.skill?((SKILL_NAMES[st.skill]||cap(st.skill))+" "+skillN()):"— none —";
    sum.innerHTML="Pool <b>"+(ringN()+skillN())+"</b> dice · keep up to <b>"+ringN()+"</b>";
  }
  function rollFace(type){
    var faces=type==="ring"?RING_FACES:SKILL_FACES;
    var i=Math.floor(Math.random()*faces.length);
    return Object.assign({type:type,kept:false,exploded:false}, faces[i]);
  }
  function doRoll(){
    pool=[];
    var i;
    for(i=0;i<ringN();i++) pool.push(rollFace("ring"));
    for(i=0;i<skillN();i++) pool.push(rollFace("skill"));
    // resolve explosions (chain)
    var q=pool.slice();
    while(q.length){
      var d=q.shift();
      var ex=d.ex||0;
      for(var k=0;k<ex;k++){ var nd=rollFace(d.type); nd.exploded=true; pool.push(nd); q.push(nd); }
    }
    autoKeep();
    renderDice();
    tally();
  }
  function autoKeep(){
    pool.forEach(function(d){ d.kept=false; });
    var order=pool.slice().sort(function(a,b){
      return succ(b)-succ(a) || (a.st||0)-(b.st||0) || (b.op||0)-(a.op||0);
    });
    order.slice(0,ringN()).forEach(function(d){ d.kept=true; });
  }
  function keptCount(){ return pool.filter(function(d){return d.kept;}).length; }
  function renderDice(){
    var row=document.getElementById("rDice"); row.innerHTML="";
    if(!pool.length) return;
    ["ring","skill"].forEach(function(type){
      var group=pool.filter(function(d){return d.type===type;});
      if(!group.length) return;
      row.appendChild(el("div","dice-group-label",(type==="ring"?"Ring Dice (d6)":"Skill Dice (d12)")));
      group.forEach(function(d){
        var die=el("div","die "+type+(d.kept?" kept":"")+(d.exploded?" exploded":""));
        die.innerHTML="<img class='face' src='../assets/dice/"+d.key+".svg' alt=''><span class='dtype'>"+(type==="ring"?"d6":"d12")+"</span>";
        die.title=faceTitle(d);
        die.addEventListener("click",function(){
          if(!d.kept && keptCount()>=ringN()) return; // keep limit
          d.kept=!d.kept; die.classList.toggle("kept",d.kept); tally();
        });
        row.appendChild(die);
      });
    });
  }
  function tally(){
    var kept=pool.filter(function(d){return d.kept;});
    var su=0,op=0,stf=0;
    kept.forEach(function(d){ su+=succ(d); op+=(d.op||0); stf+=(d.st||0); });
    var tn=parseInt(document.getElementById("rTN").value||"0",10);
    var res=document.getElementById("rResult");
    var pass=su>=tn;
    var strifeApplied = st.stance==="void" ? 0 : stf;
    res.className="r-result show";
    res.innerHTML=""
      +"<div class='verdict "+(pass?"pass":"fail")+"'>"+(pass?"Success":"Failure")+" — "+su+" vs TN "+tn+"</div>"
      +"<div class='tallies'><span>Kept <b>"+kept.length+"/"+ringN()+"</b></span><span>Successes <b class='sym su' style='color:#3f8f5a'>"+su+"</b></span><span>Opportunity <b class='sym op' style='color:#c08a1e'>"+op+"</b></span><span>Strife <b class='sym st' style='color:#b0642a'>"+stf+"</b></span></div>"
      +"<div class='applybar'><button class='roll-btn ghost' id='rApplyStrife'>Apply "+strifeApplied+" strife"+(st.stance==="void"&&stf>0?" (Void: 0)":"")+"</button><span class='r-summary'>"+(st.stance==="void"&&stf>0?"Void stance ignores ▲ on kept dice":"")+"</span></div>";
    document.getElementById("rApplyStrife").addEventListener("click",function(){
      st.strife=Math.min(S.trackers.strife.max, (st.strife||0)+strifeApplied); save(); syncTracker("strife");
    });
  }

  render();
})();
