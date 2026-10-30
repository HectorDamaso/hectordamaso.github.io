# Herramientas · Héctor Dámaso

Web de herramientas gratis para los clientes y seguidores de Héctor Dámaso (coaching 1 a 1). Se publica con GitHub Pages en https://hectordamaso.github.io/ desde la rama `main`, en la carpeta raíz. No hace falta compilar nada.

| Dirección | Qué es | Código |
|---|---|---|
| `/` | Portada con todas las herramientas | `index.html` |
| `/calorias/` | Calculadora de calorías: mantenimiento (fórmulas de la hoja «FORMULAS METABOLISMO», las mismas de APP-1-1), objetivo, plan de déficit o volumen con comida, pasos y cardio | `js/calorias.js`, `js/calorias-ui.js` |
| `/equivalencias/` | Calculadora de equivalencias de alimentos y compensación de grasas | `js/calculo.js`, `js/reglas.js`, `js/app.js`, `datos/alimentos.json` |
| `/subo-o-bajo/` | ¿Subo o bajo calorías? Ajuste semanal según peso, cintura y cumplimiento | `js/ajuste.js`, `js/subo-o-bajo.js` |
| `/fin-de-semana/` | Modo fin de semana: encajar una comida fuera sin compensar | `js/finde.js`, `js/fin-de-semana.js` |
| `/minicut/` | Guía del minicut: test, plan y guía paso a paso | `js/minicut.js`, `js/minicut-ui.js` |

Todo es HTML, CSS y JavaScript estático: sin servidor, sin base de datos, sin cookies y sin recoger datos. La lógica de cada herramienta está separada de la interfaz y tiene pruebas.

Las direcciones antiguas (`hectordamaso.github.io/calculadora-equivalencias/…`) siguen funcionando: el repo `calculadora-equivalencias` solo tiene redirecciones a estas.

## Pruebas

```bash
npm test
```

Sirven Node 22 o posterior.

## Cambiar alimentos de la calculadora de equivalencias

1. Sustituye `herramientas/catalogo-app-1-1.json` por la versión nueva del catálogo de la app de coaching.
2. Ejecuta `npm run catalogo`. Regenera `datos/alimentos.json` aplicando `herramientas/correcciones.mjs` (nombres, categorías, alimentos quitados y sinónimos).
3. Ejecuta `npm test`.

## Verla en local

```bash
npm run local
```

Abre http://127.0.0.1:4400.

Las fuentes Anton y Space Grotesk tienen licencia SIL Open Font License.
