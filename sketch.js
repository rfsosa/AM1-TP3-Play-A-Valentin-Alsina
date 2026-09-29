/* ---------------------------------------------------------
   Play a Valentín Alsina — sketch interactivo (Pantalla Completa)
--------------------------------------------------------- */

const escena1 = {
  fondoImg: 'fondo.png',
  objetos: [
    { id:'iglesia',      nombre:'Iglesia',       img:'iglesia.png',      audio:'loros.mp3',     x:10,   y:330,  escala:0.45, rotacion:0 },
    { id:'puente',       nombre:'Puente',        img:'puente.png',       audio:'bandoneon.mp3', x:90,   y:90,   escala:0.85, rotacion:0 },
    { id:'colectivo128', nombre:'Colectivo 128', img:'128colecivo.png',  audio:'acordeon.mp3',  x:266,  y:590,  escala:0.56, rotacion:0.5 },
    { id:'abuelos',      nombre:'Abuelos',       img:'abuelos.png',      audio:'tango.mp3',     x:640,  y:530,  escala:0.71, rotacion:0 },
    { id:'jovenes',      nombre:'Jóvenes',       img:'jovenes.png',      audio:'punk.mp3',      x:980,  y:590,  escala:0.82, rotacion:0 },
  ]
};

// ESCENA 2: escalaX y escalaY desacoplados para corregir el estiramiento horizontal
const escena2 = {
  fondoImg: 'fondo_02.png',
  objetos: [
    // Empanadas
    { id:'empanadas', nombre:'Empanadas',          img:'empanadas.png', audio:'radio.mp3',   x:70,   y:120,  escalaX:0.75, escalaY:0.95, rotacion:0 },

    // Cassette de Sandro
    { id:'cassette',  nombre:'Cassette de Sandro', img:'cassete.png',   audio:'trigal.mp3',  x:680,  y:180, escalaX:0.55, escalaY:0.70, rotacion:5 },

    // Plato de merluza
    { id:'plato',     nombre:'Merluza',            img:'plato.png',     audio:'feria.mp3',   x:500,  y:440, escalaX:0.62, escalaY:0.80, rotacion:0 },

    // Vasos
    { id:'vasos',     nombre:'Vasos',              img:'vasos.png',     audio:'drums.mp3',   x:1000, y:450, escalaX:0.64, escalaY:0.80, rotacion:0 },
  ]
};

const escenas = [escena1, escena2];
let escenaActual = 0;
let objetos;

let fondoColor, fondoGris, fondoRevelacion;
let revelacionFade = 0;
let cnv, cnvElt;
let juegoIniciado = false;

function preload(){
  escenas.forEach((esc)=>{
    esc.fondoColor = loadImage(esc.fondoImg, null, () => console.error('NO SE PUDO CARGAR: ' + esc.fondoImg));
    if(esc.fondoRevelacionImg){
      esc.fondoRevelacionColor = loadImage(esc.fondoRevelacionImg, null, () => console.error('NO SE PUDO CARGAR: ' + esc.fondoRevelacionImg));
    }
    esc.objetos.forEach(o=>{
      o.color = loadImage(o.img, null, () => console.error('NO SE PUDO CARGAR: ' + o.img));
    });
  });
}

function cargarSonidos(esc){
  esc.objetos.forEach(o=>{
    if(!o.audio || o.sonido) return;
    loadSound(o.audio,
      snd => { 
        o.sonido = snd; 
        o.sonido.stop();
        o.sonido.setVolume(0); 
        o.sonido.playMode('sustain'); 
      },
      () => console.error('NO SE PUDO CARGAR: ' + o.audio)
    );
  });
}

function setup(){
  cnv = createCanvas(escena1.fondoColor.width, escena1.fondoColor.height);
  cnv.parent('canvas-holder');
  cnvElt = cnv.elt;
  cnv.style('cursor', 'pointer');
  cnv.style('touch-action', 'none');
  pixelDensity(1);

  redimensionarCanvasPantalla();
  vincularBotonesInterfaz();
  cargarEscena(0);
}

function redimensionarCanvasPantalla(){
  const wOriginal = escena1.fondoColor.width;
  const hOriginal = escena1.fondoColor.height;
  const ratioOriginal = wOriginal / hOriginal;
  const ratioVentana = windowWidth / windowHeight;

  let nuevoW, nuevoH;

  if (ratioVentana > ratioOriginal) {
    nuevoW = windowWidth;
    nuevoH = windowWidth / ratioOriginal;
  } else {
    nuevoH = windowHeight;
    nuevoW = windowHeight * ratioOriginal;
  }

  cnv.style('width', nuevoW + 'px');
  cnv.style('height', nuevoH + 'px');
}

function windowResized(){
  redimensionarCanvasPantalla();
}

function vincularBotonesInterfaz(){
  const aislarBoton = (el) => {
    if (!el) return;
    ['click', 'pointerdown', 'mousedown', 'touchstart', 'touchend'].forEach(evt => {
      el.addEventListener(evt, (e) => e.stopPropagation());
    });
  };

  // 1. Botón OK de instrucciones
  const btnOk = document.getElementById('btn-ok-instrucciones');
  if(btnOk){
    aislarBoton(btnOk);
    btnOk.addEventListener('click', (e) => {
      e.stopPropagation();
      userStartAudio();
      const modal = document.getElementById('modal-instrucciones');
      if(modal) modal.classList.add('oculto');
      setTimeout(() => { juegoIniciado = true; }, 250);
    });
  }

  // 2. Botón Volver
  const btnVolver = document.getElementById('btn-volver');
  if(btnVolver){
    aislarBoton(btnVolver);
    btnVolver.addEventListener('click', (e) => {
      e.stopPropagation();
      detenerSonidos();
      window.location.href = 'index.html';
    });
  }

  // 3. Botón Siguiente (Pasa a la escena 2)
  const btnSiguiente = document.getElementById('btn-siguiente');
  if(btnSiguiente){
    aislarBoton(btnSiguiente);
    btnSiguiente.addEventListener('click', (e) => {
      e.stopPropagation();
      const activos = objetos ? objetos.filter(o => o.activo).length : 0;
      if(escenaActual === 0 && activos === objetos.length){
        cargarEscena(1);
      }
    });
  }

  // 4. Botón Finalizar (Abre el modal del Ticket)
  const btnFinalizar = document.getElementById('btn-finalizar');
  if(btnFinalizar){
    aislarBoton(btnFinalizar);
    btnFinalizar.addEventListener('click', (e) => {
      e.stopPropagation();
      const activos = objetos ? objetos.filter(o => o.activo).length : 0;
      if(escenaActual === 1 && activos === objetos.length){
        const modalTicket = document.getElementById('modal-ticket');
        if(modalTicket) modalTicket.classList.remove('oculto');
      }
    });
  }

  // 5. Botón Reiniciar dentro del Ticket
  const btnReiniciar = document.getElementById('btn-reiniciar');
  if(btnReiniciar){
    aislarBoton(btnReiniciar);
    btnReiniciar.addEventListener('click', (e) => {
      e.stopPropagation();
      const modalTicket = document.getElementById('modal-ticket');
      if(modalTicket) modalTicket.classList.add('oculto');
      detenerSonidos();
      cargarEscena(0);
    });
  }

  // 6. Botón Inicio dentro del Ticket
  const btnInicioTicket = document.getElementById('btn-inicio-ticket');
  if(btnInicioTicket){
    aislarBoton(btnInicioTicket);
    btnInicioTicket.addEventListener('click', (e) => {
      e.stopPropagation();
      detenerSonidos();
      window.location.href = 'index.html';
    });
  }
}

function cargarEscena(indice){
  if(objetos){
    objetos.forEach(o=>{
      o.activo = false;
      if(o.sonido){
        o.sonido.stop();
        o.sonido.setVolume(0);
      }
    });
  }

  escenaActual = indice;
  const esc = escenas[indice];
  objetos = esc.objetos;

  fondoColor = esc.fondoColor;
  if(!esc._grisListo){
    esc.fondoGris = fondoColor.get();
    esc.fondoGris.filter(GRAY);
    esc._grisListo = true;
  }
  fondoGris = esc.fondoGris;
  fondoRevelacion = esc.fondoRevelacionColor || null;
  revelacionFade = 0;

  objetos.forEach(o=>{
    if(!o.gris){
      o.gris = o.color.get();
      o.gris.filter(GRAY);
    }
    o.activo = false;
    o.fade = 0;
  });

  resizeCanvas(fondoColor.width, fondoColor.height);
  redimensionarCanvasPantalla();
  cargarSonidos(esc);
  actualizarEstadoSiguiente();
}

function actualizarEstadoSiguiente(){
  const btnSiguiente = document.getElementById('btn-siguiente');
  const btnFinalizar = document.getElementById('btn-finalizar');
  if(!btnSiguiente || !btnFinalizar) return;

  const activos = objetos ? objetos.filter(o => o.activo).length : 0;
  const completos = (activos === objetos.length);

  if(escenaActual === 0){
    btnFinalizar.style.display = 'none';
    btnSiguiente.style.display = 'block';

    if(completos){
      btnSiguiente.classList.remove('bloqueado');
      btnSiguiente.classList.add('desbloqueado');
    } else {
      btnSiguiente.classList.add('bloqueado');
      btnSiguiente.classList.remove('desbloqueado');
    }
  } else {
    btnSiguiente.style.display = 'none';
    btnFinalizar.style.display = 'block';

    if(completos){
      btnFinalizar.classList.remove('bloqueado');
      btnFinalizar.classList.add('desbloqueado');
    } else {
      btnFinalizar.classList.add('bloqueado');
      btnFinalizar.classList.remove('desbloqueado');
    }
  }
}

function draw(){
  try {
    dibujarEscena();
  } catch(err){
    console.error('ERROR EN DRAW: ' + (err && err.message ? err.message : String(err)));
  }
}

function dibujarEscena(){
  const activos = objetos.filter(o=>o.activo).length;
  const fraccion = activos / objetos.length;

  tint(255, 255);
  image(fondoGris, 0, 0);
  if(fraccion > 0){
    tint(255, fraccion * 255);
    image(fondoColor, 0, 0);
  }
  noTint();

  if(fondoRevelacion){
    revelacionFade += ((fraccion >= 1 ? 1 : 0) - revelacionFade) * 0.03;
    if(revelacionFade > 0.01){
      tint(255, revelacionFade * 255);
      image(fondoRevelacion, 0, 0);
      noTint();
    }
  }

  objetos.forEach(o=>{
    if(!o.gris || !o.color) return;
    o.fade += ((o.activo ? 1 : 0) - o.fade) * 0.08;

    // Proporciones independientes para ancho y alto
    const factorX = (o.escalaX !== undefined) ? o.escalaX : o.escala;
    const factorY = (o.escalaY !== undefined) ? o.escalaY : o.escala;
    const w = o.color.width * factorX;
    const h = o.color.height * factorY;

    push();
    translate(o.x + w/2, o.y + h/2);
    rotate(radians(o.rotacion || 0));
    imageMode(CENTER);

    tint(255, 255);
    image(o.gris, 0, 0, w, h);
    if(o.fade > 0.01){
      tint(255, o.fade * 255);
      image(o.color, 0, 0, w, h);
    }
    noTint();
    pop();
    imageMode(CORNER);
  });
}

function coordCanvas(px, py){
  if(!cnvElt) return { x:-1, y:-1 };
  const rect = cnvElt.getBoundingClientRect();
  const scaleX = width / rect.width, scaleY = height / rect.height;
  return { x:(px - rect.left) * scaleX, y:(py - rect.top) * scaleY };
}

function objetoEnPunto(mx, my){
  for(let i = objetos.length - 1; i >= 0; i--){
    const o = objetos[i];
    const factorX = (o.escalaX !== undefined) ? o.escalaX : o.escala;
    const factorY = (o.escalaY !== undefined) ? o.escalaY : o.escala;
    const w = o.color.width * factorX;
    const h = o.color.height * factorY;
    const cx = o.x + w/2, cy = o.y + h/2;

    let dx = mx - cx, dy = my - cy;
    const ang = -radians(o.rotacion || 0);
    const rx = dx * cos(ang) - dy * sin(ang);
    const ry = dx * sin(ang) + dy * cos(ang);

    const lx = Math.round((rx + w/2) / factorX);
    const ly = Math.round((ry + h/2) / factorY);

    if(lx < 0 || ly < 0 || lx >= o.color.width || ly >= o.color.height) continue;
    const c = o.color.get(lx, ly);
    if(c[3] > 20) return o;
  }
  return null;
}

function manejarToque(px, py){
  if(!juegoIniciado) return;
  userStartAudio();
  const p = coordCanvas(px, py);
  const o = objetoEnPunto(p.x, p.y);
  if(!o) return;
  toggleObjeto(o);
}

function mousePressed(){ 
  manejarToque(winMouseX, winMouseY); 
}

function touchStarted(){
  if(touches.length > 0 && cnvElt){
    const rect = cnvElt.getBoundingClientRect();
    manejarToque(touches[0].x + rect.left, touches[0].y + rect.top);
  }
  return false;
}

function toggleObjeto(o){
  o.activo = !o.activo;
  if(o.activo){
    if(o.sonido){
      o.sonido.setVolume(0);
      o.sonido.loop();
      o.sonido.fade(0.6, 0.6);
    }
  } else if(o.sonido){
    o.sonido.fade(0, 0.6);
    setTimeout(()=>{ if(!o.activo && o.sonido) o.sonido.stop(); }, 650);
  }
  actualizarEstadoSiguiente();
}

function detenerSonidos() {
  escenas.forEach(esc => {
    esc.objetos.forEach(o => {
      if (o.sonido) {
        o.sonido.stop();
        o.sonido.setVolume(0);
      }
      o.activo = false;
    });
  });
}