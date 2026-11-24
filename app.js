function $(i){return document.getElementById(i)}
function mix(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}

// ---- navigation
var inits={};
// The phone's back button: opening a game adds a history entry, so "back" returns to the
// home screen instead of leaving the app (or the store page the game is shown in).
function inGame(){return !!(history.state&&history.state.s)}
function show(id,fromHistory){
  hideWin();
  Array.prototype.forEach.call(document.querySelectorAll('.screen'),function(s){s.hidden=s.id!==id});
  if(inits[id])inits[id]();
  if(id==='puz'||id==='shp'){ac();vinit();vplay(id==='puz'?'w:__pz':'w:__drag')}
  else if(id==='cls'){ac();vinit()}
  if(!fromHistory&&id!=='home'){try{if(inGame())history.replaceState({s:id},'');else history.pushState({s:id},'')}catch(e){}}
  window.scrollTo(0,0);
}
Array.prototype.forEach.call(document.querySelectorAll('[data-go]'),function(b){b.onclick=function(){
  // the on-screen back arrow does the same as the phone's back button, so the history stays in step
  if(b.dataset.go==='home'&&inGame())history.back();else show(b.dataset.go);
}});
window.addEventListener('popstate',function(e){show((e.state&&e.state.s)||'home',true)});

// ---- 1. picture puzzle
var IMGS=[{"n": "البحر", "u": "assets/puzzle-01-ade94223.jpg"}, {"n": "الحظيرة", "u": "assets/puzzle-02-895d4aa2.jpg"}, {"n": "الروضة", "u": "assets/puzzle-03-5870d970.jpg"}, {"n": "الشاطئ", "u": "assets/puzzle-04-64b62b81.jpg"}, {"n": "الصحراء", "u": "assets/puzzle-05-c75dea90.jpg"}, {"n": "الغابة", "u": "assets/puzzle-06-692d8d89.jpg"}, {"n": "القرية", "u": "assets/puzzle-07-5910f673.jpg"}, {"n": "الكعبة", "u": "assets/puzzle-08-a7180aa3.jpg"}, {"n": "المدينة", "u": "assets/puzzle-09-d69b5650.jpg"}, {"n": "المسجد", "u": "assets/puzzle-10-c5b75ab8.jpg"}, {"n": "الملعب", "u": "assets/puzzle-11-0c4f374a.jpg"}];
var uri='',curI=-1;
var gn=2,pz=[],tiles=[],lvl=0,busy=false,drag=null;
// ---- saved puzzle progress (localStorage may be unavailable, e.g. private mode)
var PKEY='rkn_puzzle_level';
try{var pl=parseInt(localStorage.getItem(PKEY),10);if(pl>0&&pl<1000)lvl=pl}catch(e){}
function psave(){try{localStorage.setItem(PKEY,String(lvl))}catch(e){}}
function setPB(n,f){f=Math.max(0,Math.min(1,f));var b=$('pbf'+n);b.style.transform='scaleX('+f+')';b.parentNode.setAttribute('aria-valuenow',Math.round(f*100))}
function prog1(){var N=gn*gn,c=0;for(var i=0;i<N-1;i++)if(pz[i]===i)c++;setPB(1,c/(N-1))}
function cfg(l){return l<5?{n:2,m:5+Math.floor(Math.random()*4)}:{n:3,m:Math.min(60,6+(l-5)*3)}}
function cxy(c){return [c%gn,Math.floor(c/gn)]}
function neigh(c){var p=cxy(c),r=[];if(p[0]>0)r.push(c-1);if(p[0]<gn-1)r.push(c+1);if(p[1]>0)r.push(c-gn);if(p[1]<gn-1)r.push(c+gn);return r}
function place(el,c){var p=cxy(c);el.style.left=(p[0]*100/gn)+'%';el.style.top=(p[1]*100/gn)+'%'}
function isSolved(){for(var i=0;i<gn*gn-1;i++)if(pz[i]!==i)return false;return true}
function info(id){
  var cell=pz.indexOf(id),b=pz.indexOf(-1);
  if(neigh(cell).indexOf(b)<0)return null;
  var p=cxy(cell),q=cxy(b);
  return {t:tiles[id],id:id,cell:cell,b:b,ux:q[0]-p[0],uy:q[1]-p[1],d:0,moved:false,cs:$('board').clientWidth/gn};
}
function commit(D){
  var t=D.t,W=$('board').clientWidth,p=cxy(D.cell);
  t.style.transition='none';
  t.style.left=(p[0]*100/gn+D.ux*D.d/W*100)+'%';
  t.style.top=(p[1]*100/gn+D.uy*D.d/W*100)+'%';
  t.style.transform='';t.style.zIndex='';
  void t.offsetWidth;t.style.transition='';
  pz[D.b]=D.id;pz[D.cell]=-1;place(t,D.b);prog1();
  if(isSolved())win();
}
function win(){
  lvl++;psave();busy=true;
  var last=tiles[gn*gn-1];place(last,gn*gn-1);
  last.style.opacity=0;last.style.display='block';void last.offsetWidth;
  last.style.transition='opacity .5s';last.style.opacity=1;
  $('m1').textContent='أحسنت! اكتملت صورة '+IMGS[curI].n+' 🎉';
  ac();vload('w:'+IMGS[curI].n);var done=false,idx=curI;function after(){if(done)return;done=true;if($('puz').hidden||!isSolved())return;showWin();setTimeout(function(){if(!$('win').hidden)nameShow(IMGS[idx].n)},2200)}praise(after);setTimeout(after,3500);
}
function attach(t,id){
  t.onpointerdown=function(e){
    if(busy||drag)return; // one finger at a time: a second touch would leave the first tile stuck
    var D=info(id);
    if(!D){t.classList.remove('no');void t.offsetWidth;t.classList.add('no');return}
    D.x=e.clientX;D.y=e.clientY;drag=D;
    t.setPointerCapture(e.pointerId);t.style.transition='none';t.style.zIndex=2;
  };
  t.onpointermove=function(e){
    if(!drag||drag.t!==t)return;
    var dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    drag.d=Math.max(0,Math.min(drag.cs,dx*drag.ux+dy*drag.uy));
    if(Math.abs(dx)+Math.abs(dy)>6)drag.moved=true;
    t.style.transform='translate('+(drag.ux*drag.d)+'px,'+(drag.uy*drag.d)+'px)';
  };
  t.onpointerup=function(){
    if(!drag||drag.t!==t)return;
    var D=drag;drag=null;
    if(!D.moved||D.d>D.cs*0.35){commit(D)}
    else{t.style.transition='transform .15s';t.style.transform='translate(0,0)';t.style.zIndex='';setTimeout(function(){t.style.transition='';t.style.transform=''},170)}
  };
  t.onpointercancel=function(){
    if(!drag||drag.t!==t)return;
    drag=null;t.style.transition='';t.style.transform='';t.style.zIndex='';
  };
  t.onkeydown=function(e){
    if(busy||(e.key!=='Enter'&&e.key!==' '))return;
    e.preventDefault();var D=info(id);if(D)commit(D);
  };
}
function build(){
  var c=cfg(lvl),B=$('board'),i,N;
  gn=c.n;N=gn*gn;busy=false;drag=null;B.innerHTML='';tiles=[];
  $('m1').textContent='';$('hintimg').style.display='none';B.style.display='';
  $('lvt1').textContent=(lvl+1);
  for(i=0;i<N;i++){
    var t=document.createElement('button');
    t.className='tile';t.setAttribute('aria-label','مربع '+(i+1));
    t.style.width=(100/gn)+'%';t.style.height=(100/gn)+'%';
    t.style.backgroundImage=uri;
    t.style.backgroundSize=(gn*100)+'% '+(gn*100)+'%';
    t.style.backgroundPosition=((i%gn)*100/(gn-1))+'% '+(Math.floor(i/gn)*100/(gn-1))+'%';
    if(i===N-1)t.style.display='none';
    attach(t,i);B.appendChild(t);tiles.push(t);
  }
  do{
    pz=[];for(i=0;i<N;i++)pz.push(i===N-1?-1:i);
    var b=N-1,last=-1;
    for(var k=0;k<c.m;k++){
      var nb=neigh(b).filter(function(x){return x!==last});
      var nx=nb[Math.floor(Math.random()*nb.length)];
      pz[b]=pz[nx];pz[nx]=-1;last=b;b=nx;
    }
  }while(isSolved());
  for(i=0;i<N;i++)if(pz[i]>=0)place(tiles[pz[i]],i);
  prog1();
}
inits.puz=function(){
  var i;do{i=Math.floor(Math.random()*IMGS.length)}while(i===curI);
  curI=i;uri='url("'+IMGS[i].u+'")';build();
};
$('prestart').onclick=function(){
  if(lvl>0&&!confirm('هل تريد البدء من المرحلة الأولى؟ سيُمسح تقدمك المحفوظ.'))return;
  lvl=0;psave();build();
};
$('nextimg').onclick=inits.puz;
$('hint').onclick=function(){
  var h=$('hintimg');h.src=IMGS[curI].u;h.style.display='block';$('board').style.display='none';
  setTimeout(function(){h.style.display='none';$('board').style.display=''},2000);
};


// ---- voice clips (praise + place names)
var VW={"المدينة": "assets/name-01-fb76c207.mp3", "القرية": "assets/name-02-874348ca.mp3", "الصحراء": "assets/name-03-093edb70.mp3", "الروضة": "assets/name-04-35ef5e66.mp3", "الملعب": "assets/name-05-e9a94c34.mp3", "المسجد": "assets/name-06-44058add.mp3", "الكعبة": "assets/name-07-3e6bbb0e.mp3", "الحظيرة": "assets/name-08-36e67a40.mp3", "البحر": "assets/name-09-214a0b38.mp3", "الغابة": "assets/name-10-b84133c5.mp3", "الشاطئ": "assets/name-11-cb769ef9.mp3", "__drag": "assets/intro-shapes-69217849.mp3", "__pz": "assets/intro-puzzle-9dc9ab63.mp3"};
var VP=["assets/praise-01-169614e2.mp3", "assets/praise-02-c0291ee8.mp3", "assets/praise-03-378aa3ee.mp3", "assets/praise-04-103ffafb.mp3"];
var vcur=null,vpi=-1,VB={},VL={},vinited=false;
function vsrc(key){return key.charAt(0)==='p'?VP[+key.slice(2)]:VW[key.slice(2)]}
/* memory: each clip is fetched and decoded only when first needed, not all at once */
function vload(key){
  if(VB[key])return Promise.resolve(VB[key]);
  if(VL[key])return VL[key];
  var u=vsrc(key);if(!u||!ac())return Promise.resolve(null);
  VL[key]=fetch(u).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})
    .then(function(ab){return new Promise(function(res,rej){AC.decodeAudioData(ab,res,rej)})})
    .then(function(buf){VB[key]=buf;return buf})
    .catch(function(){delete VL[key];return null});
  return VL[key];
}
/* the short clips that play right away (intros + praise) are prepared after the first tap */
function vinit(){
  if(vinited||!AC)return;vinited=true;
  ['w:__pz','w:__drag'].concat(VP.map(function(u,i){return 'p:'+i})).forEach(vload);
}
['pointerdown','touchend','keydown','click'].forEach(function(ev){document.addEventListener(ev,function(){ac();vinit()},{passive:true})});
function vplay(key,cb){
  var t0=Date.now();
  vload(key).then(function(buf){
    /* too late (slow network): skip the clip instead of speaking out of turn */
    if(!buf||!ac()||Date.now()-t0>3000){if(cb)cb();return}
    try{
      if(vcur){try{vcur.onended=null;vcur.stop()}catch(e){}}
      var s=AC.createBufferSource(),g=AC.createGain();
      g.gain.value=1;s.buffer=buf;s.connect(g);g.connect(AC.destination);
      vcur=s;s.onended=function(){if(vcur===s)vcur=null;if(cb)cb()};s.start(0);
    }catch(e){if(cb)cb()}
  });
}
function praise(cb){
  var i;do{i=Math.floor(Math.random()*VP.length)}while(i===vpi&&VP.length>1);
  vpi=i;vplay('p:'+i,cb);
}
function sayName(n){vplay('w:'+n)}
function nameShow(n){
  var t=$('wintxt');t.textContent='اكتملت صورة '+n+' 🎉';
  t.style.animation='none';void t.offsetWidth;t.style.animation='';
  sayName(n);
}

// ---- winning celebration: full picture + sparkles + sounds
var AC=null,NB=null,SUS=0,MUTED=false;
try{MUTED=localStorage.getItem('rkn_muted')==='1'}catch(e){}
/* sound on/off button (top-left of each game); the choice is remembered */
function paintSnd(){Array.prototype.forEach.call(document.querySelectorAll('[data-snd]'),function(b){
  b.classList.toggle('muted',MUTED);b.setAttribute('aria-pressed',String(!MUTED));
  b.setAttribute('aria-label',MUTED?'تشغيل الصوت':'كتم الصوت');b.title=b.getAttribute('aria-label')})}
Array.prototype.forEach.call(document.querySelectorAll('[data-snd]'),function(b){b.onclick=function(){
  MUTED=!MUTED;try{localStorage.setItem('rkn_muted',MUTED?'1':'0')}catch(e){}
  if(MUTED){if(vcur){try{vcur.onended=null;vcur.stop()}catch(e){}vcur=null}if(AC){clearTimeout(SUS);try{AC.suspend()}catch(e){}}}
  else{ac();vinit()}
  paintSnd();
}});
paintSnd();
function ac(){
  if(MUTED)return null;
  try{
    if(!AC){var C=window.AudioContext||window.webkitAudioContext;if(C)AC=new C()}
    if(AC&&AC.state==='suspended')AC.resume();
  }catch(e){}
  if(AC)idle();
  return AC;
}
/* battery: a running audio context keeps the phone's audio hardware awake even in silence,
   so it is paused 4s after the last tap or sound (and resumed by the next one) */
function idle(){
  clearTimeout(SUS);
  SUS=setTimeout(function(){if(!AC||AC.state!=='running')return;if(vcur){idle();return}try{AC.suspend()}catch(e){}},4000);
}
document.addEventListener('visibilitychange',function(){if(document.hidden&&AC){clearTimeout(SUS);try{AC.suspend()}catch(e){}}});
function tone(f,t0,d,type,vol){
  var T=AC.currentTime+t0,o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.value=f;
  g.gain.setValueAtTime(0.0001,T);
  g.gain.exponentialRampToValueAtTime(vol,T+0.02);
  g.gain.exponentialRampToValueAtTime(0.0001,T+d);
  o.connect(g);g.connect(AC.destination);o.start(T);o.stop(T+d+0.05);
}
function clap(t0,vol){
  if(!NB){
    NB=AC.createBuffer(1,AC.sampleRate*0.2,AC.sampleRate);
    var a=NB.getChannelData(0);for(var i=0;i<a.length;i++)a[i]=Math.random()*2-1;
  }
  var T=AC.currentTime+t0,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();
  s.buffer=NB;f.type='bandpass';f.frequency.value=1500+Math.random()*2500;f.Q.value=0.8;
  g.gain.setValueAtTime(vol,T);g.gain.exponentialRampToValueAtTime(0.0001,T+0.07);
  s.connect(f);f.connect(g);g.connect(AC.destination);s.start(T);s.stop(T+0.1);
}
function winSound(){
  if(!ac())return;
  try{
    [523.25,659.25,783.99,1046.5].forEach(function(f,i){tone(f,i*0.13,0.4,'triangle',0.22)});
    [523.25,659.25,783.99,1046.5,1318.5].forEach(function(f){tone(f,0.56,1.1,'triangle',0.13)});
    for(var i=0;i<12;i++)tone(2000+Math.random()*2400,0.7+i*0.1,0.2,'sine',0.06);
    for(var j=0;j<34;j++)clap(0.6+j*0.065+Math.random()*0.05,0.1+Math.random()*0.08);
  }catch(e){}
}
function sparks(){
  var S=$('spark'),i,e,cols=['#ffd23f','#fff','#ff8fb1','#7be0ff','#b9a6ff','#8dffb0'],sy=['✦','✧','⭐','✨','★'];
  S.innerHTML='';
  for(i=0;i<32;i++){
    e=document.createElement('span');e.className='sp';e.textContent=sy[i%sy.length];
    e.style.left=(Math.random()*96)+'%';e.style.top=(Math.random()*96)+'%';
    e.style.fontSize=(14+Math.random()*28)+'px';e.style.color=cols[i%cols.length];
    e.style.animationDelay=(Math.random()*1.4)+'s';e.style.animationDuration=(0.9+Math.random()*1.1)+'s';
    S.appendChild(e);
  }
  for(i=0;i<26;i++){
    e=document.createElement('span');e.className='cf';
    e.style.left=(Math.random()*100)+'%';e.style.background=cols[i%cols.length];
    e.style.animationDuration=(2.2+Math.random()*2.2)+'s';e.style.animationDelay=(Math.random()*1.2)+'s';
    S.appendChild(e);
  }
}
function showWin(){
  if($('puz').hidden||!busy||!isSolved())return;
  $('winimg').src=IMGS[curI].u;
  $('wintxt').textContent='';
  /* the picture file is fetched now so "save" can share it straight from the tap */
  var i=curI;WB=null;fetch(IMGS[i].u).then(function(r){return r.ok?r.blob():null}).then(function(b){if(b&&i===curI)WB={i:i,b:b}}).catch(function(){});
  sparks();$('win').hidden=false;winSound();
  $('winnext').focus();
}
function hideWin(){var w=$('win');if(w)w.hidden=true}
$('winnext').onclick=function(){hideWin();inits.puz()};
$('winpic').onclick=function(){winSound();nameShow(IMGS[curI].n)};
var WB=null;
$('winsave').onclick=function(){
  var n=IMGS[curI].n,u=IMGS[curI].u,b=WB&&WB.i===curI?WB.b:null,mt=(b&&b.type)||'image/jpeg',f;
  var ext=mt.indexOf('png')>=0?'png':mt.indexOf('webp')>=0?'webp':'jpg';
  try{if(b)f=new File([b],n+'.'+ext,{type:mt})}catch(e){}
  function dl(){
    try{
      var a=document.createElement('a');a.href=b?URL.createObjectURL(b):u;a.download=n+'.'+ext;a.style.display='none';
      document.body.appendChild(a);a.click();
      setTimeout(function(){if(b)URL.revokeObjectURL(a.href);a.remove()},4000);
    }catch(e){opn()}
  }
  function opn(){
    var w=null;try{w=window.open('','_blank')}catch(e){}
    if(w){w.document.write('<title>'+n+'</title><body style="margin:0;background:#111;text-align:center"><img src="'+u+'" style="max-width:100%"><p style="color:#fff;font-family:sans-serif">اضغط مطولاً على الصورة لحفظها</p>');w.document.close()}
    else{$('winpic').querySelector('img').style.outline='4px solid #fff';alert('اضغط مطولاً على الصورة لحفظها')}
  }
  if(f&&navigator.canShare&&navigator.canShare({files:[f]})){
    navigator.share({files:[f],title:n}).catch(function(e){if(!e||e.name!=='AbortError')dl()});
  }else dl();
};

// ---- 2. shape matching
var SH=[
 {id:'c',col:'#ef476f',d:'<circle cx="50" cy="46" r="38"/>',
  art:'<ellipse cx="50" cy="91" rx="28" ry="5" fill="rgba(0,0,0,.2)"/><circle cx="50" cy="46" r="38" fill="url(#gC)" stroke="#8c1b3a" stroke-width="3.5"/><ellipse cx="35" cy="27" rx="12" ry="7" fill="#fff" opacity=".65" transform="rotate(-35 35 27)"/>'},
 {id:'s',col:'#118ab2',d:'<polygon points="50,10 88,28 88,70 50,88 12,70 12,28"/>',
  art:'<g stroke="#0a4f69" stroke-width="3.5" stroke-linejoin="round"><polygon points="12,28 50,46 50,88 12,70" fill="#1aa3cf"/><polygon points="50,46 88,28 88,70 50,88" fill="#0b6585"/><polygon points="50,10 88,28 50,46 12,28" fill="#7fdcf5"/></g><path d="M24 27 L48 17" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".75"/><path d="M19 38 L19 56" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>'},
 {id:'t',col:'#06a77d',d:'<polygon points="50,8 90,78 45,92 10,78"/>',
  art:'<g stroke="#04523d" stroke-width="3.5" stroke-linejoin="round"><polygon points="50,8 10,78 45,92" fill="#3ddc9b"/><polygon points="50,8 45,92 90,78" fill="#06a77d"/></g><path d="M44 30 L26 64" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".6"/>'},
 {id:'st',col:'#f4a000',d:'<polygon points="50,8 61,38 93,38 67,57 77,90 50,70 23,90 33,57 7,38 39,38"/>',
  art:'<ellipse cx="50" cy="95" rx="24" ry="3.5" fill="rgba(0,0,0,.2)"/><polygon points="50,8 61,38 93,38 67,57 77,90 50,70 23,90 33,57 7,38 39,38" fill="url(#gS)" stroke="#a85a00" stroke-width="3.5" stroke-linejoin="round"/><polygon points="50,8 61,38 93,38 67,57 77,90 50,70 23,90 33,57 7,38 39,38" fill="#fff" opacity=".4" transform="translate(50 46) scale(.5) translate(-50 -46)"/>'}
];
var PICS=[{"n": "مرشّة", "g": "ob", "u": "assets/pic-01-3dc7d8df.webp"}, {"n": "شجرة", "g": "na", "u": "assets/pic-02-ef5b338f.webp"}, {"n": "صاروخ", "g": "ve", "u": "assets/pic-03-110b93b4.webp"}, {"n": "حقيبة", "g": "ob", "u": "assets/pic-04-cdba5af5.webp"}, {"n": "شمعة", "g": "ob", "u": "assets/pic-05-1d057a34.webp"}, {"n": "ضفدع", "g": "an", "u": "assets/pic-06-9fd48f06.webp"}, {"n": "مفتاح", "g": "ob", "u": "assets/pic-07-57982387.webp"}, {"n": "غواصة", "g": "ve", "u": "assets/pic-08-49d62e1b.webp"}, {"n": "يد", "g": "ob", "u": "assets/pic-09-30db606a.webp"}, {"n": "مركب شراعي", "g": "ve", "u": "assets/pic-10-c57aa3a7.webp"}, {"n": "شمس", "g": "na", "u": "assets/pic-11-ae546d01.webp"}, {"n": "عنزة", "g": "an", "u": "assets/pic-12-dd59f608.webp"}, {"n": "زهرة", "g": "na", "u": "assets/pic-13-f8178121.webp"}, {"n": "الكعبة", "g": "bu", "u": "assets/pic-14-0a1ed925.webp"}, {"n": "نملة", "g": "an", "u": "assets/pic-15-eee56e46.webp"}, {"n": "دراجة", "g": "ve", "u": "assets/pic-16-47bf46d8.webp"}, {"n": "عنكبوت", "g": "an", "u": "assets/pic-17-4416aae3.webp"}, {"n": "فراشة", "g": "an", "u": "assets/pic-18-5ba1898b.webp"}];
var cur=null,left=0,gdrag=null,srun=0,slv=0,SKEY='rkn_shapes_level';
try{slv=Math.max(0,parseInt(localStorage.getItem(SKEY),10)||0)}catch(e){}
function ssave(){try{localStorage.setItem(SKEY,String(slv))}catch(e){}}
function scount(l){return l<3?2:l<6?4:l<9?6:8}
function art(x){return '<svg viewBox="0 0 100 100" aria-hidden="true">'+x.art+'</svg>'}
function sil(x){return '<svg viewBox="0 0 100 100" aria-hidden="true"><g class="o" fill="">'+x.d+'</g></svg>'}
inits.shp=function(){
  var P=$('pieces'),S=$('slots'),m=$('m2'),slots=[];
  P.innerHTML='';S.innerHTML='';cur=null;gdrag=null;m.textContent='';
  var N=scount(slv),ns=Math.min(SH.length,Math.ceil(N/2)),np=N-ns,pk=[],seen={};
  mix(PICS).forEach(function(x){if(pk.length<np&&!seen[x.g]){seen[x.g]=1;pk.push(x)}});
  mix(PICS).forEach(function(x){if(pk.length<np&&pk.indexOf(x)<0)pk.push(x)});
  var items=mix(SH).slice(0,ns).concat(pk.map(function(p){return {id:p.n,n:p.n,u:p.u}}));
  var run=++srun;$('lvt2').textContent=(slv+1);
  left=items.length;var total=items.length;setPB(2,0);
  function hit(x,y){
    for(var i=0;i<slots.length;i++){var r=slots[i].el.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return slots[i]}
    return null;
  }
  function clearOver(){slots.forEach(function(o){o.el.classList.remove('over')})}
  function solve(pb,sl,s){
    sl.classList.remove('over');sl.classList.add('ok');
    if(!s.u)sl.innerHTML=art(s);
    pb.classList.add('done');pb.classList.remove('sel');cur=null;left--;setPB(2,(total-left)/total);
    if(left){m.textContent=s.n?'صح! هذه '+s.n+' 👍':'صح! 👍';praise()}
    else{
      slv++;ssave();m.textContent='ممتاز! أكملت المرحلة '+slv+' 🎉';winSound();
      setTimeout(function(){if(run===srun&&!$('shp').hidden)inits.shp()},3200);
    }
  }
  function wrong(sl){
    sl.classList.remove('no');void sl.offsetWidth;sl.classList.add('no');
    m.textContent='جرّب مكاناً آخر';
  }
  mix(items).forEach(function(s){
    var b=document.createElement('button');b.dataset.id=s.id;b.setAttribute('aria-label','شكل ملوّن');
    b.innerHTML=s.u?'<img class="im" alt="" src="'+s.u+'">':art(s);
    function back(){
      b.classList.remove('drag');b.style.transition='transform .2s';b.style.transform='';
      setTimeout(function(){b.style.transition=''},230);
    }
    b.onpointerdown=function(e){
      if(gdrag||b.classList.contains('done'))return; // one finger at a time
      gdrag={b:b,x:e.clientX,y:e.clientY};
      b.setPointerCapture(e.pointerId);b.style.transition='none';b.classList.add('drag');
    };
    b.onpointermove=function(e){
      if(!gdrag||gdrag.b!==b)return;
      b.style.transform='translate('+(e.clientX-gdrag.x)+'px,'+(e.clientY-gdrag.y)+'px) scale(1.12)';
      var t=hit(e.clientX,e.clientY);
      slots.forEach(function(o){o.el.classList.toggle('over',o===t&&!o.el.classList.contains('ok'))});
    };
    b.onpointerup=function(e){
      if(!gdrag||gdrag.b!==b)return;
      var t=hit(e.clientX,e.clientY);gdrag=null;clearOver();
      if(t&&!t.el.classList.contains('ok')){
        if(t.s.id===s.id){b.classList.remove('drag');b.style.transition='';b.style.transform='';solve(b,t.el,s);return}
        wrong(t.el);
      }
      back();
    };
    b.onpointercancel=function(){if(gdrag&&gdrag.b===b){gdrag=null;clearOver();back()}};
    b.onclick=function(e){ /* keyboard only (Enter/Space) */
      if(e.detail)return;
      Array.prototype.forEach.call(P.children,function(x){x.classList.remove('sel')});
      cur=s.id;b.classList.add('sel');
    };
    P.appendChild(b);
  });
  mix(items).forEach(function(s){
    var b=document.createElement('button');b.className='slot';b.setAttribute('aria-label','مكان الشكل');
    // picture slots: a light silhouette with an outline, like the geometric shapes (the picture's own
    // outline is used as a mask); the real picture appears once the piece is placed
    b.innerHTML=s.u?'<span class="psw" aria-hidden="true"><span class="ps" style="-webkit-mask-image:url('+s.u+');mask-image:url('+s.u+')"></span></span><img class="im sil" alt="" src="'+s.u+'">':sil(s);
    b.onclick=function(e){ /* keyboard only */
      if(e.detail||!cur||b.classList.contains('ok'))return;
      if(cur===s.id)solve(P.querySelector('[data-id="'+cur+'"]'),b,s);else wrong(b);
    };
    slots.push({el:b,s:s});S.appendChild(b);
  });
};
$('again').onclick=inits.shp;
$('restart').onclick=function(){slv=0;ssave();inits.shp()};

// ---- 3. sort the pictures: drag each picture into the box it belongs to
var CK='rkn_sort_level',clv=0,crun=0,cdrag=null,csel=false;
try{clv=Math.max(0,parseInt(localStorage.getItem(CK),10)||0)}catch(e){}
function csave(){try{localStorage.setItem(CK,String(clv))}catch(e){}}
function csvg(x){return '<svg viewBox="0 0 48 48" aria-hidden="true">'+x+'</svg>'}
// box ids: an/ve/na/ob match the "g" field of PICS; pl = the places of the picture puzzle
var CATS={
  an:{n:'حيوانات',ic:csvg('<ellipse cx="24" cy="32" rx="10" ry="8" fill="#f08454" stroke="#c9602f" stroke-width="2.5"/><circle cx="11" cy="22" r="4.5" fill="#f08454" stroke="#c9602f" stroke-width="2.5"/><circle cx="19" cy="13" r="4.5" fill="#f08454" stroke="#c9602f" stroke-width="2.5"/><circle cx="29" cy="13" r="4.5" fill="#f08454" stroke="#c9602f" stroke-width="2.5"/><circle cx="37" cy="22" r="4.5" fill="#f08454" stroke="#c9602f" stroke-width="2.5"/>')},
  ve:{n:'مركبات',ic:csvg('<path d="M5 31l5-11h28l5 11v7H5z" fill="#54c0cc" stroke="#2f8fa0" stroke-width="2.5" stroke-linejoin="round"/><path d="M13 22h22l3 8H10z" fill="#e6f6fa"/><circle cx="14" cy="39" r="5" fill="#26364a" stroke="#fff" stroke-width="1.5"/><circle cx="34" cy="39" r="5" fill="#26364a" stroke="#fff" stroke-width="1.5"/>')},
  na:{n:'طبيعة',ic:csvg('<path d="M9 38C9 21 20 10 39 9c0 19-9 30-26 30z" fill="#8bc34a" stroke="#5e9a2e" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 36L30 18" stroke="#5e9a2e" stroke-width="2.5" stroke-linecap="round"/>')},
  ob:{n:'أدوات',ic:csvg('<rect x="21" y="16" width="7" height="26" rx="2.5" fill="#f08454" stroke="#c9602f" stroke-width="2" transform="rotate(25 24 28)"/><rect x="9" y="8" width="30" height="11" rx="3" fill="#fcc946" stroke="#e29a1c" stroke-width="2.5" transform="rotate(25 24 28)"/>')},
  pl:{n:'أماكن',ic:csvg('<path d="M6 24L24 8l18 16z" fill="#f08454" stroke="#c9602f" stroke-width="2.5" stroke-linejoin="round"/><rect x="11" y="24" width="26" height="17" rx="2" fill="#fcc946" stroke="#e29a1c" stroke-width="2.5"/><rect x="20" y="30" width="8" height="11" rx="2" fill="#1f6e9e"/>')}
};
// the hand is not a tool and the barn picture shows animals, so both are left out to avoid confusion
function cpool(id){
  if(id==='pl')return IMGS.filter(function(x){return x.n!=='الحظيرة'});
  return PICS.filter(function(p){return p.g===id&&p.n!=='يد'});
}
function ccfg(l){return l<2?{k:2,n:4}:l<5?{k:3,n:6}:{k:4,n:8}}
// a round: k boxes, 2 pictures for each; nature and places never share a round (the sea, the forest... are both)
function cround(){
  var c=ccfg(clv),all=mix(['an','ve','na','ob','pl']),ids=[],items=[],i,id;
  for(i=0;i<all.length&&ids.length<c.k;i++){
    id=all[i];
    if((id==='na'&&ids.indexOf('pl')>=0)||(id==='pl'&&ids.indexOf('na')>=0))continue;
    ids.push(id);
  }
  ids.forEach(function(d){mix(cpool(d)).slice(0,c.n/c.k).forEach(function(x){items.push({n:x.n,u:x.u,c:d})})});
  return {ids:ids,items:mix(items)};
}
inits.cls=function(){
  var B=$('cboxes'),P=$('cstage'),m=$('m3'),run=++crun,r=cround(),boxes=[],total=r.items.length,done=0,idx=-1,locked=false;
  B.innerHTML='';P.innerHTML='';m.textContent='';cdrag=null;csel=false;
  B.style.setProperty('--k',r.ids.length);
  $('lvt3').textContent=(clv+1);setPB(3,0);
  function hit(x,y){
    for(var i=0;i<boxes.length;i++){var q=boxes[i].el.getBoundingClientRect();if(x>=q.left&&x<=q.right&&y>=q.top&&y<=q.bottom)return boxes[i]}
    return null;
  }
  function clearOver(){boxes.forEach(function(o){o.el.classList.remove('over')})}
  function good(b,t,s){
    locked=true;csel=false;t.el.classList.remove('over','hit');void t.el.offsetWidth;t.el.classList.add('hit');
    b.classList.remove('drag','sel');b.style.transition='opacity .25s';b.style.opacity='0';
    done++;setPB(3,done/total);
    if(done<total){
      m.textContent='صح! هذه '+s.n+' 👍';
      if(s.c==='pl')sayName(s.n);else praise();
      setTimeout(function(){if(run===crun&&!$('cls').hidden)next()},450);
    }else{
      clv++;csave();m.textContent='ممتاز! أكملت المرحلة '+clv+' 🎉';winSound();
      setTimeout(function(){if(run===crun&&!$('cls').hidden)inits.cls()},3200);
    }
  }
  function wrong(el){
    el.classList.remove('no');void el.offsetWidth;el.classList.add('no');
    m.textContent='جرّب صندوقاً آخر';
  }
  function next(){
    P.innerHTML='';csel=false;locked=false;idx++;
    if(idx>=total)return;
    var s=r.items[idx],b=document.createElement('button');
    b.className='cpic';b.setAttribute('aria-label','صورة '+s.n);
    b.innerHTML='<img class="im" alt="" src="'+s.u+'">';
    function back(){
      b.classList.remove('drag');b.style.transition='transform .2s';b.style.transform='';
      setTimeout(function(){b.style.transition=''},230);
    }
    b.onpointerdown=function(e){
      if(locked||cdrag)return; // one finger at a time
      cdrag={b:b,x:e.clientX,y:e.clientY};
      b.setPointerCapture(e.pointerId);b.style.transition='none';b.classList.add('drag');
    };
    b.onpointermove=function(e){
      if(!cdrag||cdrag.b!==b)return;
      b.style.transform='translate('+(e.clientX-cdrag.x)+'px,'+(e.clientY-cdrag.y)+'px) scale(1.1)';
      var t=hit(e.clientX,e.clientY);
      boxes.forEach(function(o){o.el.classList.toggle('over',o===t)});
    };
    b.onpointerup=function(e){
      if(!cdrag||cdrag.b!==b)return;
      var t=hit(e.clientX,e.clientY);cdrag=null;clearOver();
      if(t){
        if(t.id===s.c){b.style.transition='';good(b,t,s);return}
        wrong(t.el);
      }
      back();
    };
    b.onpointercancel=function(){if(cdrag&&cdrag.b===b){cdrag=null;clearOver();back()}};
    b.onclick=function(e){ /* keyboard only (Enter/Space) */
      if(e.detail||locked)return;
      csel=true;b.classList.add('sel');
    };
    P.appendChild(b);
  }
  r.ids.forEach(function(id){
    var el=document.createElement('button');
    el.className='cbox';el.setAttribute('aria-label','صندوق '+CATS[id].n);
    el.innerHTML=CATS[id].ic+'<span>'+CATS[id].n+'</span>';
    el.onclick=function(e){ /* keyboard only */
      if(e.detail||locked||!csel)return;
      var s=r.items[idx],b=P.firstChild;
      if(!s||!b)return;
      if(s.c===id)good(b,{el:el,id:id},s);else wrong(el);
    };
    B.appendChild(el);boxes.push({el:el,id:id});
  });
  next();
};
$('cagain').onclick=inits.cls;
$('crestart').onclick=function(){clv=0;csave();inits.cls()};



setTimeout(function(){var sp=$('splash');sp.classList.add('out');setTimeout(function(){sp.remove()},450)},3000);
// after a reload the app always starts on the home screen, so forget a game entry left in history
try{if(inGame())history.replaceState(null,'')}catch(e){}
show('home');

// ---- offline support: only works over https (or localhost)
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('sw.js').catch(function(){});
  });
}
