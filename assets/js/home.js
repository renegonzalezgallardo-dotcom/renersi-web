
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

  // Estado de sincronización vídeo/scroll.
  // Evita lanzar muchos seeks simultáneos, algo que en Chrome puede dejar
  // congelado el fotograma aunque la barra de progreso siga avanzando.
  let targetTime = 0;
  let seekPending = false;
  let videoReady = false;
  const SEEK_EPSILON = 0.06;

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
    if(idx<0){card.classList.remove('visible');return;}

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

  function performSeek(){
    if(!video || !videoReady) return;
    if(!Number.isFinite(video.duration) || video.duration<=0) return;
    if(video.seeking || seekPending) return;

    const t = clamp(targetTime, 0, Math.max(0, video.duration - 0.001));
    if(Math.abs(video.currentTime - t) <= SEEK_EPSILON) return;

    seekPending = true;
    try{
      video.currentTime = t;
    }catch(_){
      seekPending = false;
    }
  }

  function syncVideo(p){
    if(!video || !videoReady) return;
    if(!Number.isFinite(video.duration) || video.duration<=0) return;

    targetTime = clamp(p,0,1) * video.duration;
    performSeek();
  }

  function render(){
    raf=0;
    const p=getProgress();
    progress.style.width=(p*100)+'%';
    cue.style.opacity=String(clamp(1-p*9,0,1));
    renderCard(p);
    syncVideo(p);
  }

  function requestRender(){
    if(!raf) raf=requestAnimationFrame(render);
  }

  addEventListener('scroll',requestRender,{passive:true});
  addEventListener('resize',()=>{
    activeIndex=-1;
    requestRender();
  },{passive:true});

  if(video){
    // Nos aseguramos de trabajar siempre en pausa; el vídeo solo cambia
    // de fotograma mediante el scroll.
    video.pause();

    video.addEventListener('loadedmetadata',()=>{
      videoReady = true;
      targetTime = getProgress() * video.duration;
      performSeek();
      requestRender();
    });

    video.addEventListener('canplay',()=>{
      videoReady = true;
      performSeek();
      requestRender();
    });

    video.addEventListener('seeked',()=>{
      seekPending = false;
      // Si el usuario siguió desplazándose mientras el navegador buscaba
      // el fotograma anterior, saltamos ahora al objetivo más reciente.
      if(Math.abs(video.currentTime-targetTime) > SEEK_EPSILON){
        requestAnimationFrame(performSeek);
      }
    });

    video.addEventListener('error',()=>{
      console.error('RSI: no se pudo cargar el vídeo del recorrido.');
    });

    // Si metadata ya estaba disponible cuando se ejecutó el script.
    if(video.readyState >= 1 && Number.isFinite(video.duration)){
      videoReady = true;
    }
  }

  render();
})();
