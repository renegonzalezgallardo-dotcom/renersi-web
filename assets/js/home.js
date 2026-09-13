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
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

  let activeIndex = -1;
  let raf = 0;
  let chaseRaf = 0;
  let videoReady = false;
  let videoPrimed = false;
  let priming = false;
  let targetTime = 0;
  let lastBackSeek = 0;
  let lastProgress = null;
  let scrollDirection = 0; // -1 retroceso, 0 estable, 1 avance

  const FORWARD_TOLERANCE = 0.10;
  const BACKWARD_TOLERANCE = 0.16;
  const BACK_SEEK_INTERVAL = 120;
  const BACK_KEYFRAME = 0.50;

  scenes.forEach((_,i)=>{
    const dot=document.createElement('span');
    dot.dataset.i=i;
    rail.appendChild(dot);
  });
  const dots=[...rail.children];

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
      dots.forEach(d=>d.classList.remove('active'));
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

  function stopPlayback(){
    if(!video) return;
    if(!video.paused) video.pause();
    try{ video.playbackRate = 1; }catch(_){}
  }

  function seekBackward(target, now){
    stopPlayback();
    if(video.seeking || now-lastBackSeek < BACK_SEEK_INTERVAL) return true;

    lastBackSeek=now;
    const maxTime=Math.max(0,video.duration-0.03);
    let next=Math.round(target/BACK_KEYFRAME)*BACK_KEYFRAME;
    next=clamp(next,0,maxTime);

    if(Math.abs(video.currentTime-target) <= BACK_KEYFRAME*0.65){
      next=target;
    }

    try{
      if(typeof video.fastSeek==='function') video.fastSeek(next);
      else video.currentTime=next;
    }catch(_){}

    return Math.abs(video.currentTime-target) > BACKWARD_TOLERANCE;
  }

  function chaseTarget(now=performance.now()){
    chaseRaf=0;
    if(!video || !videoReady || !videoPrimed) return;
    if(!Number.isFinite(video.duration) || video.duration<=0) return;

    const maxTime=Math.max(0,video.duration-0.03);
    const target=clamp(targetTime,0,maxTime);
    const diff=target-video.currentTime;

    // Durante un gesto de retroceso NUNCA volvemos a reproducir hacia delante.
    if(scrollDirection < 0){
      if(Math.abs(diff) <= BACKWARD_TOLERANCE){
        stopPlayback();
        return;
      }
      seekBackward(target,now);
      chaseRaf=requestAnimationFrame(chaseTarget);
      return;
    }

    // Avance: reproducción real para mantener fluidez.
    if(diff > FORWARD_TOLERANCE){
      const rate=clamp(0.85 + diff*0.55,0.85,3.2);
      try{video.playbackRate=rate;}catch(_){}
      if(video.paused){
        const p=video.play();
        if(p && typeof p.catch==='function') p.catch(()=>{});
      }
      chaseRaf=requestAnimationFrame(chaseTarget);
      return;
    }

    // Si el vídeo está por delante sin que el usuario esté avanzando,
    // corregimos con un seek único y permanecemos pausados.
    if(diff < -BACKWARD_TOLERANCE){
      stopPlayback();
      try{video.currentTime=target;}catch(_){}
      return;
    }

    stopPlayback();
  }

  function requestChase(){
    if(!chaseRaf) chaseRaf=requestAnimationFrame(chaseTarget);
  }

  async function primeVideo(){
    if(!video || !videoReady || videoPrimed || priming) return;
    priming=true;
    let safetyTimer=0;
    try{
      video.muted=true;
      video.playsInline=true;

      // Seguridad: el vídeo nunca puede quedar reproduciéndose solo durante el cebado.
      safetyTimer=setTimeout(()=>stopPlayback(),180);

      const p=video.play();
      if(p && typeof p.then==='function') await p;

      await Promise.race([
        new Promise(resolve=>{
          if('requestVideoFrameCallback' in video){
            video.requestVideoFrameCallback(()=>resolve());
          }else{
            setTimeout(resolve,80);
          }
        }),
        new Promise(resolve=>setTimeout(resolve,160))
      ]);

      stopPlayback();
      videoPrimed=true;
      targetTime=getProgress()*video.duration;

      // Al volver mediante Atrás/Adelante del navegador, mostramos directamente
      // el fotograma correspondiente a la posición restaurada, sin reproducir desde 0.
      if(Math.abs(video.currentTime-targetTime)>0.20){
        try{video.currentTime=targetTime;}catch(_){}
      }
      requestChase();
    }catch(err){
      stopPlayback();
      console.warn('RSI: inicialización de vídeo pendiente de interacción',err);
    }finally{
      clearTimeout(safetyTimer);
      priming=false;
    }
  }

  function render(){
    raf=0;
    const p=getProgress();

    if(lastProgress!==null){
      const delta=p-lastProgress;
      if(delta>0.00015) scrollDirection=1;
      else if(delta<-0.00015) scrollDirection=-1;
    }
    lastProgress=p;

    progress.style.width=(p*100)+'%';
    cue.style.opacity=String(clamp(1-p*9,0,1));
    renderCard(p);

    if(video && videoReady && Number.isFinite(video.duration) && video.duration>0){
      targetTime=p*video.duration;
      requestChase();
    }
  }

  function requestRender(){
    if(!raf) raf=requestAnimationFrame(render);
  }

  addEventListener('scroll',requestRender,{passive:true});
  addEventListener('resize',()=>{
    activeIndex=-1;
    requestRender();
  },{passive:true});

  // Corrige restauraciones de página (botón Atrás/Adelante, BFCache y cambio de pestaña).
  addEventListener('pageshow',()=>{
    stopPlayback();
    activeIndex=-1;
    lastProgress=null;
    scrollDirection=0;
    requestRender();
  });
  addEventListener('pagehide',stopPlayback);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) stopPlayback();
    else requestRender();
  });

  const userPrime=()=>primeVideo();
  addEventListener('touchstart',userPrime,{passive:true,once:true});
  addEventListener('pointerdown',userPrime,{passive:true,once:true});
  addEventListener('wheel',userPrime,{passive:true,once:true});

  if(video){
    video.muted=true;
    video.playsInline=true;
    video.preload='auto';

    const markReady=()=>{
      if(!Number.isFinite(video.duration) || video.duration<=0) return;
      videoReady=true;
      targetTime=getProgress()*video.duration;
      requestRender();
      primeVideo();
    };

    video.addEventListener('loadedmetadata',markReady,{once:true});
    video.addEventListener('loadeddata',markReady,{once:true});
    video.addEventListener('canplay',markReady,{once:true});
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
