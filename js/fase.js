// Test «¿Defino o hago volumen?» (palabra FASE): decide la fase y da una pauta para empezar.
// Sin dependencias del navegador: se prueba con node --test.
//
// Criterio:
// - Indicador objetivo: cintura ÷ altura. La referencia de salud más usada es 0,5
//   (cintura menor que la mitad de la altura). Los cortes para decidir fase son
//   criterio de la herramienta: hombre ≤ 0,46 magro, ≤ 0,51 medio; mujer ≤ 0,48 / ≤ 0,53.
// - Se cruza con la silueta que elige en la escala visual (la cinta engaña con mucho músculo
//   y la autopercepción también: por eso se miran las dos).
// - Ritmos del método: perder 0,25–0,8 % del peso a la semana; volumen subiendo
//   un 1–2 % al mes con +200 kcal; minicut 800–1.000 kcal menos, 8–10 % del peso en 4–8 semanas (minicut.js).
// - Proteína: 1,8–2 g/kg en déficit; 1,6–1,8 g/kg en volumen o mantenimiento.

import { gasto, objetivo, zonas, MINIMO_KCAL } from './calorias.js';
import { PERDIDA, SEMANAS } from './minicut.js';

export const CORTES = { hombre: [0.46, 0.51], mujer: [0.48, 0.53] };
export const SALIDA_DEFINICION = { hombre: 0.47, mujer: 0.49 }; // cintura/altura para pasar a volumen
export const TOPE_VOLUMEN = 0.5; // cintura/altura: si se llega, se para el volumen

const r50 = (n) => Math.round(n / 50) * 50;
const r1 = (n) => Math.round(n * 10) / 10;

// Escalas visuales de Héctor (hombres, 6 siluetas) y Mel (mujeres, 7 siluetas): rango y nivel.
export const SILUETAS = {
  hombre: { A: ['8-12 %', 0], B: ['13-15 %', 0], C: ['16-19 %', 1], D: ['20-24 %', 1], E: ['25-30 %', 2], F: ['31-40 %', 2] },
  mujer: { A: ['≈ 15 %', 0], B: ['16-20 %', 0], C: ['21-25 %', 1], D: ['26-30 %', 1], E: ['31-35 %', 2], F: ['36-40 %', 2], G: ['41-45 %', 2] },
};

/**
 * Nivel de grasa 0 (bajo), 1 (medio), 2 (alto). Cruza la silueta elegida con cintura/altura:
 * si casi coinciden (diferencia de 1), manda la silueta; si se contradicen del todo, nivel medio.
 */
export function nivelGrasa({ sexo, cintura, altura, silueta }) {
  const s = sexo === 'mujer' ? 'mujer' : 'hombre';
  const ratio = cintura / altura;
  const porCintura = ratio <= CORTES[s][0] ? 0 : ratio <= CORTES[s][1] ? 1 : 2;
  const fila = SILUETAS[s][silueta];
  if (!fila) return { nivel: porCintura, ratio, porCintura, porSilueta: null, rango: null };
  const porSilueta = fila[1];
  const nivel = Math.abs(porSilueta - porCintura) === 2 ? 1 : porSilueta;
  return { nivel, ratio, porCintura, porSilueta, rango: fila[0] };
}

const cm = (n) => (Math.round(n * 10) / 10).toLocaleString('es-ES');

/**
 * Señal para cambiar de fase, partiendo de la cintura REAL de la persona.
 * El objetivo sale de la altura (cintura/altura), pero solo se da si tiene sentido:
 * si ya está por debajo (o por encima en volumen), la señal pasa a ser la silueta.
 * Devuelve { actual, objetivo, diferencia, texto }.
 */
export function senalCambio(fase, sexo, cintura, altura) {
  const s = sexo === 'mujer' ? 'mujer' : 'hombre';
  const actual = cintura;
  if (fase === 'definir' || fase === 'minicut') {
    const objetivo = Math.round(SALIDA_DEFINICION[s] * altura);
    const diferencia = Math.round((actual - objetivo) * 10) / 10;
    const final = fase === 'minicut' ? ', o a las 8 semanas si llega antes, vuelves a volumen subiendo poco.' : ' y te veas en la silueta B, pasas a volumen.';
    if (diferencia >= 1) {
      return { actual, objetivo, diferencia, texto: `Partes de ${cm(actual)} cm de cintura. Cuando bajes a unos ${cm(objetivo)} cm (${cm(diferencia)} cm menos)${final}` };
    }
    return { actual, objetivo: null, diferencia: null, texto: fase === 'minicut'
      ? `Tu cintura (${cm(actual)} cm) ya está en buena zona para tu altura: lo que te sobra se ve más en la silueta que en la cinta. Haz las semanas del minicut y vuelves a volumen cuando te veas en la silueta B, sin pasar de ${cm(actual)} cm.`
      : `Tu cintura (${cm(actual)} cm) ya está en buena zona para tu altura: lo que te sobra se ve más en la silueta que en la cinta. Pasas a volumen cuando te veas en la silueta B, sin que la cintura pase de ${cm(actual)} cm.` };
  }
  if (fase === 'volumen') {
    const objetivo = Math.round(TOPE_VOLUMEN * altura);
    const diferencia = Math.round((objetivo - actual) * 10) / 10;
    if (diferencia >= 1) {
      return { actual, objetivo, diferencia, texto: `Partes de ${cm(actual)} cm de cintura. Si llegas a ${cm(objetivo)} cm (${cm(diferencia)} cm más), paras el volumen y haces un minicut corto.` };
    }
    return { actual, objetivo: null, diferencia: null, texto: `Tu cintura (${cm(actual)} cm) ya está en el límite para tu altura, aunque te veas definido: el músculo también suma. No dejes que pase de ${cm(actual)} cm; si sube, paras y haces un minicut corto.` };
  }
  return { actual, objetivo: null, diferencia: null, texto: `Partes de ${cm(actual)} cm de cintura. Si en 6 semanas baja de ahí y las cargas suben, sigue así. Si se estanca todo, toca elegir fase con datos.` };
}

/**
 * Datos: { sexo, edad, peso, altura, cintura, anos: 'menos1'|'1a3'|'mas3', dias (fuerza/semana),
 *   pasos, silueta: letra de la escala visual (A-F hombre, A-G mujer), tendencia: 'sube'|'igual'|'baja',
 *   ultima: 'volumen'|'definicion'|'nada', fuerza: 'sube'|'estancada'|'baja',
 *   comida: 'bien'|'finde'|'ansiedad', dudando: 'menos3'|'3a6'|'6a12'|'mas12' }
 * Devuelve { fase: 'definir'|'minicut'|'volumen'|'mantener', ... pauta }.
 */
export function evaluarFase(d) {
  if (!(d.cintura >= 50 && d.cintura <= 200)) throw new Error('Escribe tu cintura en cm, a la altura del ombligo.');
  const sexo = d.sexo === 'mujer' ? 'mujer' : 'hombre';
  const g = gasto({ sexo, edad: d.edad, peso: d.peso, altura: d.altura, pasos: d.pasos, fuerzaMin: (d.dias || 0) * 60 });
  const mant = g.mantenimiento;
  const { nivel, ratio, porCintura, porSilueta, rango } = nivelGrasa({ sexo, cintura: d.cintura, altura: d.altura, silueta: d.silueta });
  if (!rango) throw new Error('Elige la silueta que más se parece a ti.');
  const ansiedad = d.comida === 'ansiedad';
  const vieneDeSubir = d.ultima === 'volumen' || d.tendencia === 'sube';

  let fase;
  if (nivel === 2) fase = 'definir';
  else if (nivel === 0) fase = 'volumen';
  else if (vieneDeSubir && !ansiedad && d.anos !== 'menos1' && (d.dias || 0) >= 3) fase = 'minicut';
  else if (vieneDeSubir && ansiedad) fase = 'definir';
  else fase = 'mantener';

  const minimo = MINIMO_KCAL[sexo];
  const peso = d.peso;
  let kcal, proteina, pasos, duracion, salida;
  if (fase === 'definir') {
    const z = zonas(peso).bueno;
    kcal = [Math.max(minimo, r50(mant - z[1])), Math.max(minimo, r50(mant - z[0]))];
    proteina = [1.8, 2];
    pasos = Math.min(10000, Math.max(d.pasos || 0, Math.ceil(((d.pasos || 0) + 2000) / 500) * 500));
    duracion = { semanas: 8, texto: 'Un primer bloque de 8 semanas', kg: [r1(peso * 0.0025 * 8), r1(peso * 0.008 * 8)] };
    salida = senalCambio('definir', sexo, d.cintura, d.altura);
  } else if (fase === 'minicut') {
    kcal = [Math.max(minimo, r50(mant - 1000)), Math.max(minimo, r50(mant - 800))];
    proteina = [1.8, 2];
    pasos = 12000;
    duracion = { semanas: SEMANAS.max, texto: `Entre ${SEMANAS.min} y ${SEMANAS.max} semanas, nunca más`, kg: [r1(peso * PERDIDA.min / 100), r1(peso * PERDIDA.max / 100)] };
    salida = senalCambio('minicut', sexo, d.cintura, d.altura);
  } else if (fase === 'volumen') {
    kcal = [objetivo(mant, 'volumen'), objetivo(mant, 'volumen')];
    proteina = [1.6, 1.8];
    pasos = Math.max(d.pasos || 0, 8000);
    duracion = { semanas: null, texto: 'Mientras ganes más músculo que grasa', kg: [r1(peso * 0.01), r1(peso * 0.02)], porMes: true };
    salida = senalCambio('volumen', sexo, d.cintura, d.altura);
  } else {
    kcal = [objetivo(mant, 'mantener'), objetivo(mant, 'mantener')];
    proteina = [1.6, 1.8];
    pasos = Math.max(d.pasos || 0, 8000);
    duracion = { semanas: 6, texto: 'Un bloque de 6 semanas y repites el test', kg: null };
    salida = senalCambio('mantener', sexo, d.cintura, d.altura);
  }

  return {
    fase, nivel, ratio, porCintura, porSilueta, rango, silueta: d.silueta, ansiedad, mantenimiento: Math.round(mant),
    kcal, proteina, proteinaG: [Math.round(proteina[0] * peso), Math.round(proteina[1] * peso)],
    pasos, duracion, salida, dudando: d.dudando,
  };
}
