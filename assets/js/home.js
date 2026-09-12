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

  // Estrategia V2:
  // - hacia delante: reproducción real y velocidad variable (sin seeks continuos)
  // - hacia atrás: seeks limitados, solo cuando hace falta
  // Esto evita congelar el decodificador en primera carga, especialmente en móvil.
  const FORWARD_TOLERANCE = 0.10;
  const BACKWARD_TOLERANCE = 0.18;
  const BACK_SEEK_INTERVAL = 120; // ms

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

  function chaseTarget(now=performance.now()){
    chaseRaf=0;
    if(!video || !videoReady || !videoPrimed) return;
    if(!Number.isFinite(video.duration) || video.duration<=0) return;

    const maxTime=Math.max(0,video.duration-0.03);
    const target=clamp(targetTime,0,maxTime);
    const diff=target-video.currentTime;

    // Objetivo por delante: avanzar reproduciendo de verdad.
    if(diff > FORWARD_TOLERANCE){
      const rate=clamp(0.85 + diff*0.55, 0.85, 3.2);
      try{ video.playbackRate=rate; }catch(_){}
      if(video.paused){
        const p=video.play();
        if(p && typeof p.catch==='function') p.catch(()=>{});
      }
      chaseRaf=requestAnimationFrame(chaseTarget);
      return;
    }

    // Objetivo por detrás: retroceso mediante seeks espaciados.
    if(diff < -BACKWARD_TOLERANCE){
      stopPlayback();
      if(now-lastBackSeek >= BACK_SEEK_INTERVAL && !video.seeking){
        lastBackSeek=now;
        try{ video.currentTime=target; }catch(_){}
      }
      chaseRaf=requestAnimationFrame(chaseTarget);
      return;
    }

    // Ya estamos suficientemente cerca: congelamos ese fotograma.
    stopPlayback();
  }

  function requestChase(){
    if(!chaseRaf) chaseRaf=requestAnimationFrame(chaseTarget);
  }

  async function primeVideo(){
    if(!video || !videoReady || videoPrimed || priming) return;
    priming=true;
    try{
      video.muted=true;
      video.playsInline=true;
      const p=video.play();
      if(p && typeof p.then==='function') await p;

      // Esperamos a que el navegador haya presentado al menos un fotograma real.
      await new Promise(resolve=>{
        if('requestVideoFrameCallback' in video){
          video.requestVideoFrameCallback(()=>resolve());
        }else{
          setTimeout(resolve,90);
        }
      });

      video.pause();
      videoPrimed=true;
      targetTime=getProgress()*video.duration;
      requestChase();
    }catch(err){
      // En algún navegador móvil puede requerir gesto del usuario.
      console.warn('RSI: inicialización de vídeo pendiente de interacción',err);
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

  // Fallback si un móvil bloquea la primera reproducción automática.
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
      // Intentamos preparar el decodificador en la primera carga, sin esperar al scroll.
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
