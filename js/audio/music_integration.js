window.startHarborLedger=function(){
if(window._harborLedgerStarted)return;
window._harborLedgerStarted=true;
const a=new Audio('assets/audio/music/HarborLedger.mp3');
a.loop=true;
a.volume=0.4;
a.play().catch(()=>{});
window.HarborLedger=a;
};