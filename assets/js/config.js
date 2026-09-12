
/* =========================================================================
   RSI WEB V2 — ZONA PRINCIPAL DE EDICIÓN
   =========================================================================
   AQUÍ SE EDITA CASI TODA LA HOME SIN TOCAR EL HTML.

   title/text         = textos visibles.
   primaryLabel       = texto botón principal.
   primaryHref        = enlace del botón principal.
   secondary...       = segundo botón opcional.
   x / y              = posición del cuadro:
                         x 0=izquierda, 50=centro, 100=derecha
                         y 0=arriba,     50=centro, 100=abajo
   align              = left / center / right.
   start / end        = tramo del scroll (0.00 → 1.00).

   CONSEJO:
   activa "GUÍA / EDITAR" en la Home. Verás ID + x/y del cuadro activo.
   ========================================================================= */

window.RSI_CONFIG = {
  videoPath: "assets/video/recorrido.mp4", // KLING FINAL: sustituir este archivo, mismo nombre.

  scenes: [
    {
      id:"CUADRO 01 · BARCELONA",
      start:0.00,end:0.13,
      eyebrow:"BARCELONA",
      title:"Reformas integrales con una visión completa.",
      text:"Coordinamos reforma, instalaciones y acabados desde un único punto.",
      primaryLabel:"Conocer RSI",
      primaryHref:"sobre-rsi.html",
      secondaryLabel:"Contactar",
      secondaryHref:"contacto.html",
      x:7,y:67,align:"left"
    },
    {
      id:"CUADRO 02 · FACHADA",
      start:0.13,end:0.27,
      eyebrow:"EXTERIORES",
      title:"Soluciones también fuera de tu vivienda.",
      text:"Rehabilitación, mantenimiento y trabajos especializados en edificios.",
      primaryLabel:"Ver exteriores",
      primaryHref:"servicios.html#exteriores",
      secondaryLabel:"Solicitar valoración",
      secondaryHref:"contacto.html",
      x:7,y:66,align:"left"
    },
    {
      id:"CUADRO 03 · SALÓN",
      start:0.27,end:0.42,
      eyebrow:"REFORMA INTEGRAL",
      title:"Un espacio. Un proyecto coordinado.",
      text:"Redistribución, pavimentos, pintura, iluminación e instalaciones.",
      primaryLabel:"Ver reformas",
      primaryHref:"servicios.html#reformas",
      secondaryLabel:"Contactar",
      secondaryHref:"contacto.html",
      x:7,y:65,align:"left"
    },
    {
      id:"CUADRO 04 · COCINA",
      start:0.42,end:0.56,
      eyebrow:"COCINAS",
      title:"Diseño que también funciona.",
      text:"Mobiliario, electricidad, fontanería e iluminación integrados.",
      primaryLabel:"Ver cocinas",
      primaryHref:"servicios.html#cocinas",
      secondaryLabel:"Pedir valoración",
      secondaryHref:"contacto.html",
      x:92,y:64,align:"right"
    },
    {
      id:"CUADRO 05 · BAÑO",
      start:0.56,end:0.69,
      eyebrow:"BAÑOS",
      title:"Renovamos también lo que no se ve.",
      text:"Fontanería, impermeabilización, revestimientos e iluminación.",
      primaryLabel:"Ver baños",
      primaryHref:"servicios.html#banos",
      secondaryLabel:"Pedir valoración",
      secondaryHref:"contacto.html",
      x:7,y:65,align:"left"
    },
    {
      id:"CUADRO 06 · SUITE",
      start:0.69,end:0.83,
      eyebrow:"INTERIORES",
      title:"Cada detalle forma parte del resultado.",
      text:"Distribución, carpintería, acabados e iluminación con una misma línea.",
      primaryLabel:"Ver interiores",
      primaryHref:"servicios.html#interiores",
      secondaryLabel:"Ver proyectos",
      secondaryHref:"proyectos.html",
      x:92,y:65,align:"right"
    },
    {
      id:"CUADRO 07 · CONFIANZA",
      start:0.83,end:1.01,
      eyebrow:"RSI · SOLUCIONES INTEGRALES",
      title:"En tu hogar no entra cualquiera.",
      text:"Confianza, responsabilidad y comunicación clara durante todo el trabajo.",
      primaryLabel:"Solicitar valoración",
      primaryHref:"contacto.html",
      secondaryLabel:"Sobre RSI",
      secondaryHref:"sobre-rsi.html",
      x:50,y:65,align:"center"
    }
  ]
};
