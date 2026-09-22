const hex=h=>{const s=h.replace('#','');return [0,2,4].map(i=>parseInt(s.slice(i,i+2),16));};
const lum=h=>hex(h).map(v=>v/255).map(v=>v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[0.2126,0.7152,0.0722][i],0);
const r=(a,b)=>{const[x,y]=[lum(a),lum(b)].sort((m,n)=>n-m);return (x+0.05)/(y+0.05);};
const P={ink:'#eaf2ed',ink2:'#b7c6bd',muted:'#8fa396',paper:'#0a1410',surface:'#121f19',
  turin300:'#76d894',turin200:'#ade9bd',warn:'#e8a62e',warnSoft:'#2e2415',bad:'#f2827d',badSoft:'#321d1d',
  info:'#7fb0f2',infoSoft:'#17233a',turinSoft:'#16311f',line:'#2a3d33'};
const checks=[
 ['ink/surface',P.ink,P.surface,4.5],['ink/paper',P.ink,P.paper,4.5],
 ['ink-2/surface',P.ink2,P.surface,4.5],['muted/surface',P.muted,P.surface,4.5],['muted/paper',P.muted,P.paper,4.5],
 ['turin-300/surface (link)',P.turin300,P.surface,4.5],['turin-300/paper',P.turin300,P.paper,4.5],
 ['turin-300/turin-soft (tag)',P.turin300,P.turinSoft,4.5],
 ['tinta escura sobre botao',  '#12211a',P.turin300,4.5],
 ['warn/surface',P.warn,P.surface,4.5],['warn/warn-soft',P.warn,P.warnSoft,4.5],
 ['bad/surface',P.bad,P.surface,4.5],['bad/bad-soft',P.bad,P.badSoft,4.5],
 ['info/surface',P.info,P.surface,4.5],['info/info-soft',P.info,P.infoSoft,4.5],
 ['anel de foco',P.turin300,P.paper,3],['borda',P.line,P.surface,1.2],
];
let f=0;
for(const[n,a,b,m]of checks){const v=r(a,b);if(v<m)f++;console.log((v>=m?'  ok ':'FALHA'),v.toFixed(2)+':1','(min '+m+')',n);}
console.log(`\n${checks.length-f}/${checks.length} aprovados no ESCURO do painel.`);
process.exit(f?1:0);
