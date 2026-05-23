// ═══════════════════════════════════════
// MODULO: INPUT
// ═══════════════════════════════════════
const pan={attivo:false,startX:0,startY:0,camStartX:0,camStartY:0,mosso:false};

// ── MOBILE DRAWER ──
function isMobile(){ return window.innerWidth<=600; }
function isLandscapeMobile(){ return window.innerHeight<=500 && window.innerWidth>window.innerHeight; }

function togglePannelloMobile(){
  const aperto=document.body.classList.toggle('pannello-aperto');
  document.getElementById('pannello-dx').classList.toggle('aperto',aperto);
  document.getElementById('btn-toggle-pannello').textContent=aperto?'✕':'☰';
}
function chiudiPannelloMobile(){
  document.body.classList.remove('pannello-aperto');
  document.getElementById('pannello-dx').classList.remove('aperto');
  const btn=document.getElementById('btn-toggle-pannello');
  if(btn) btn.textContent='☰';
}
function impostaMobile(){
  const btn=document.getElementById('btn-toggle-pannello');
  const pannello=document.getElementById('pannello-dx');
  if(isLandscapeMobile()){
    // Landscape mobile: pannello laterale sempre visibile, drawer disabilitato
    btn.style.display='none';
    document.body.classList.remove('pannello-aperto');
    pannello.classList.remove('aperto');
  } else if(isMobile()){
    // Portrait mobile: drawer attivo
    btn.style.display='flex';
    pannello.classList.remove('aperto');
    document.body.classList.remove('pannello-aperto');
  } else {
    // Desktop: nasconde toggle
    btn.style.display='none';
    document.body.classList.remove('pannello-aperto');
  }
}

// ═══════════════════════════════════════════════════
// PATHFINDING A* — movimento pirati verso edifici
// ═══════════════════════════════════════════════════
