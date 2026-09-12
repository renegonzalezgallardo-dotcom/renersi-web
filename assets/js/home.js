(() => {
  const cfg = window.RSI_CONFIG;
  if(!cfg) return;

  const video = document.getElementById('scrollVideo');
  const card = document.getElementById('storyCard');
  const eyebrow = document.getElementById('cardEyebrow');
  const title = document.getElementById('cardTitle');
  const text = document.getElementById('cardText');
  const primary = document.getElementById('cardPrimary');
  const secondary = document.getElementById('cardSecondary');
  const progress = document.getElementById('progress');
  const cue = document.getElementById('scrollCue');
  const rail = document.getElementById('sceneRail');

  const scenes = cfg.scenes;
  let activeIndex = -1;
  let raf = 0;
  let videoReady = false;
  let videoPrimed = false;
  let priming = false;
  let targetTime = 0;

  scenes.forEach((_,i)=>{
    const dot=document.createElement('span');
    dot.dataset.i=i;
    rail.appendChild(dot);
  });
  const dots=[...rail.children];

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function getProgress(){
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    return clamp(scrollY/max,0,1);
  }

  function setCardPosition(s){
    const x=clamp(s.x,2,98), y=clamp(s.y,8,90);
    card.style.top=y+'%';
    card.style.bottom='auto';

    if(s.align==='right'){
      card.style.left='auto';
      card.style.right=(100-x)+'%';
      card.style.transform='translateY(-50%)';
    }else if(s.align==='center'){
      card.style.left=x+'%';
      card.style.right='auto';
      card.style.transform='translate(-50%,-50%)';
    }else{
      card.style.left=x+'%';
      card.style.right='auto';
      card.style.transform='translateY(-50%)';
    }

    if(innerWidth<=760){
      card.style.left='14px';
      card.style.right='auto';
      card.style.top='auto';
      card.style.bottom='78px';
      card.style.transform='none';
    }
  }

  function renderCard(p){
    const idx=scenes.findIndex(s=>p>=s.start && p<s.end);
    if(idx<0){
      card.classList.remove('visible');
      return;
    }

    const s=scenes[idx];
    if(idx!==activeIndex){
      activeIndex=idx;
      eyebrow.textContent=s.eyebrow;
      title.textContent=s.title;
      text.textContent=s.text;

      primary.textContent=s.primaryLabel || 'Ver más';
      primary.href=s.primaryHref || '#';
      secondary.textContent=s.secondaryLabel || '';
      secondary.href=s.secondaryHref || '#';
      secondary.style.display=s.secondaryLabel ? 'inline-flex' : 'none';

      setCardPosition(s);
      dots.forEach((d,i)=>d.classList.toggle('active',i===idx));
    }
    card.classList.add('visible');
  }

  function seekToTarget(){
    if(!video || !videoReady || !videoPrimed) return;
    if(!Number.isFinite(video.duration) || video.duration<=0) return;

    const t=clamp(targetTime,0,Math.max(0,video.duration-0.001));
    if(Math.abs(video.currentTime-t) < 0.025) return;

    try{
      video.currentTime=t;
    }catch(err){
      console.warn('RSI: no se pudo mover el vídeo al tiempo objetivo',err);
    }
  }

  async function primeVideo(){
    if(!video || !videoReady || videoPrimed || priming) return;
    priming=true;

    try{
      video.muted=true;
      video.playsInline=true;
      await video.play();
      video.pause();
      videoPrimed=true;
      targetTime=getProgress()*video.duration;
      seekToTarget();
    }catch(err){
      console.warn('RSI: el navegador no permitió inicializar el vídeo todavía',err);
    }finally{
      priming=false;
    }
  }

  function render(){
    raf=0;
    const p=getProgress();

    progress.style.width=(p*100)+'%';
    cue.style.opacity=String(clamp(1-p*9,0,1));
    renderCard(p);

    if(video && videoReady && Number.isFinite(video.duration) && video.duration>0){
      targetTime=p*video.duration;
      seekToTarget();
    }
  }

  function requestRender(){
    if(!raf) raf=requestAnimationFrame(render);
  }

  function handleUserScroll(){
    primeVideo();
    requestRender();
  }

  addEventListener('scroll',handleUserScroll,{passive:true});
  addEventListener('wheel',primeVideo,{passive:true,once:true});
  addEventListener('touchstart',primeVideo,{passive:true,once:true});
  addEventListener('pointerdown',primeVideo,{passive:true,once:true});

  addEventListener('resize',()=>{
    activeIndex=-1;
    requestRender();
  },{passive:true});

  if(video){
    video.muted=true;
    video.preload='auto';
    video.pause();

    const markReady=()=>{
      if(!Number.isFinite(video.duration) || video.duration<=0) return;
      videoReady=true;
      targetTime=getProgress()*video.duration;
      requestRender();
    };

    video.addEventListener('loadedmetadata',markReady);
    video.addEventListener('loadeddata',markReady);
    video.addEventListener('canplay',markReady);
    video.addEventListener('error',()=>{
      console.error('RSI: no se pudo cargar el vídeo del recorrido.',video.error);
    });

    if(video.readyState>=2 && Number.isFinite(video.duration) && video.duration>0){
      markReady();
    }else{
      try{video.load();}catch(_){}
    }
  }

  render();
})();
