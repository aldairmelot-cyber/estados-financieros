# Estados Financieros Districlínicas

Aplicación web para generar, a partir del Libro de Inventario / Balance de prueba mensual, los estados financieros bajo NIIF para Pymes (ESF, ERI, ECP, EFE, indicadores, notas, certificación), además de impuestos, conciliaciones bancarias, cartera de proveedores y la verificación de la facturación electrónica de la DIAN contra el libro auxiliar.

## Verificación DIAN

En **Verificación DIAN → Resumen y carga de archivos** se sueltan juntos el reporte de documentos electrónicos de la DIAN (Excel, emitidos y recibidos) y el **Libro Auxiliar por Nit** de MantisWeb del mismo período. La app verifica que cada factura de venta, nota, documento soporte y factura de proveedor esté registrada con el mismo valor, IVA, tercero y mes; lista lo que falta por registrar y lo que está en el software sin soporte en la DIAN, y exporta todo a Excel. El primer cruce puede ser acumulado (enero a septiembre); luego se hace mes a mes y los pendientes se arrastran solos. El libro se procesa en el navegador; en la base de datos solo se guardan el resumen y las novedades.

## Años cerrados (2023 y 2024)

Los años que no están mensualizados van **aparte del histórico mensual**, en el menú **Años cerrados**. Se carga el balance por tercero (**FunBalanceTotalNit**, Libro de Inventario por Nit) del 1 de enero al 31 de diciembre; también se puede soltar en Datos → Cargar archivos, y la app lo envía allí. Cada año guarda:

- el balance por cuenta, con el que se arman situación financiera, resultados (comparado con el año anterior si está cargado), cambios en el patrimonio, flujos de efectivo, indicadores y notas, con descarga en PDF y Excel;
- el **detalle por tercero de todas las cuentas** (saldo inicial, débitos, créditos y saldo final, con dirección, teléfono, correo y ciudad), en **Saldos por tercero (DIAN)**: filtros por cuentas y tercero, accesos rápidos (ingresos, costos y gastos, cartera, proveedores, retenciones, IVA), NIT con dígito de verificación, control de cuentas cuyo detalle no da el total y exportación a Excel.

Se guarda en las colecciones `anuales` y `anualesPartes`. No toca el histórico mensual (`meses`) ni la cartera mensual (`terceros`).

## Requerimientos DIAN

En **Requerimientos DIAN** se suelta el PDF del requerimiento tal como llega (si es escaneado se lee con OCR en el navegador, Tesseract.js) y la app llena número, fecha, expediente, año, correos y cada numeral, con el documento que lo responde y su botón de descarga. El libro mayor y balances y la certificación de diferencia en cambio salen en PDF diseñado, con folios y firmas. También se puede registrar a mano (número, fecha, expediente, año, fecha de notificación y plazo) con sus numerales, a partir del modelo de requerimiento ordinario de renta. Para cada numeral se lleva el estado, el responsable y notas, y se guarda el PDF recibido (colecciones `requerimientos` y `requerimientosPdf`).

Con el balance por tercero del año (Años cerrados), el libro auxiliar (Consulta de movimientos) y la declaración de renta, la app genera los anexos en Excel, una hoja por numeral, cada una cuadrada contra el renglón declarado:

- balance de prueba por tercero y mayor y balances;
- pasivos (R45) con fecha de inicio, aumentos, abonos y saldo;
- ingresos brutos (R58) y devoluciones (R59) por tercero;
- compras de inventario por proveedor y juego de inventarios;
- costos y gastos (R62 a R66) por concepto y tercero, con el 50 % del GMF y las provisiones presentadas en el renglón 66;
- otras retenciones (R106) por agente retenedor con base y valor;
- entidades financieras a las que hay que pedir el certificado tributario;
- diferencia en cambio.

También genera el borrador de la carta de respuesta en Word, con marcas [COMPLETAR] en lo que debe revisar el contador.

## Declaraciones de renta

En **Impuestos → Declaraciones de renta presentadas (110)** se cargan los PDF del formulario 110 que descarga la DIAN. La app lee todos los renglones, verifica la lectura con la aritmética del propio formulario y guarda también el PDF original (colecciones `renta` y `rentaPdf`). Muestra los años lado a lado, el cruce de cada declaración con la contabilidad del año y exporta a Excel. Si hay corrección, queda vigente la de fecha más reciente. La proyección de renta toma automáticamente los valores de la declaración del año anterior.

## Consulta del libro auxiliar

En **Consulta de movimientos** se carga el **Libro Auxiliar por Cta** de MantisWeb (todas las cuentas, en Excel), un archivo por año o varios (por meses o trimestres). Permite:

- **Movimientos por cuenta:** filtrar por cuenta, tercero, tipo y número de comprobante, fechas, texto o valor; ver el saldo corrido de una cuenta; agrupar por cuenta, tercero, tipo o mes; exportar a Excel.
- **Comprobantes:** cada comprobante completo con todas sus líneas y si cuadra (débitos = créditos).
- **Cuadre con el balance:** partida doble del año, comprobantes descuadrados y comparación cuenta por cuenta (saldo inicial, débitos, créditos y saldo final) contra el balance de prueba cargado en el histórico.

El Excel se lee en el navegador por partes (aguanta libros de cientos de miles de movimientos) y se guarda comprimido en las colecciones `auxiliar` (resumen de cada archivo) y `auxiliarPartes` (el libro en trozos de menos de 1 MB). Cada año se descarga solo cuando se consulta.

> **Fechas en el Excel de MantisWeb:** cuando el libro pasa de unos 34.000 movimientos, el Excel deja vacía la columna Fecha del resto (se le acaban los formatos de celda permitidos). La app completa esas fechas con la de otra línea del mismo comprobante (exacta) y, si el comprobante no tiene ninguna, con la fecha de creación del registro (aproximada, marcada con ≈). Los saldos y totales no se afectan. Para tener todas las fechas exactas, exporte el año por meses y cargue los archivos juntos.

Es un sitio estático: un solo `index.html` que se ejecuta completo en el navegador. Los archivos contables se procesan en el equipo de quien los carga; no se suben al repositorio.

## Publicar en GitHub Pages

1. Cree un repositorio en GitHub (por ejemplo `estados-financieros`) y suba estos archivos a la rama `main`.
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guarde.
3. En uno o dos minutos la app queda en `https://SU-USUARIO.github.io/estados-financieros/`. Comparta ese enlace.

> En el plan gratuito de GitHub, Pages solo funciona con repositorios **públicos**. El código queda visible, pero los datos contables no, porque no están en el repositorio. Si quiere el código privado, necesita GitHub Pro/Team, o publicar en Netlify, Cloudflare Pages o Vercel desde un repositorio privado.

## Dónde se guardan los datos

La app trae dos modos; se elige en `config.js`. **Esta instalación usa el modo compartido** (proyecto Firebase `estados-financieros-a0e3b`).

Para dar acceso a una persona nueva: agregue su correo de Google en `firestore.rules` y en Firebase → Firestore Database → Reglas, y pulse **Publicar**.

### Modo local

Cada persona trabaja con los datos de su propio navegador (IndexedDB). No necesita servidor ni cuentas.

- Abajo a la derecha aparecen **Respaldar** y **Restaurar**: generan y leen un archivo `.json` con toda la información (meses cargados, parámetros, notas, impuestos, conciliaciones, proveedores).
- Para pasarle el trabajo a un compañero, respalde y envíele el archivo.
- Borrar los datos del navegador elimina la información: respalde con regularidad.

### Modo compartido (Firebase)

Todo el equipo ve y edita los mismos datos en tiempo real, con inicio de sesión de Google y una lista de correos autorizados.

1. Cree un proyecto gratuito en <https://console.firebase.google.com>.
2. **Authentication → Sign-in method**: active **Google**. En **Authentication → Settings → Authorized domains**, agregue `SU-USUARIO.github.io`.
3. **Firestore Database → Crear base de datos** (modo producción, región `southamerica-east1` o la más cercana).
4. **Firestore → Reglas**: pegue el contenido de `firestore.rules`, ponga los correos autorizados y publique.
5. **Configuración del proyecto → Tus apps → Web (`</>`)**: registre la app y copie el objeto `firebaseConfig` en `config.js`, en el campo `firebase`.
6. Suba el cambio de `config.js` a GitHub.

La configuración de Firebase en `config.js` no es secreta; quien no esté en la lista de `firestore.rules` no puede leer ni escribir nada.

En ambos modos, los botones **Respaldar** y **Restaurar** (abajo a la derecha) descargan o cargan un archivo `.json` con toda la información. Sirven para copias de seguridad y para pasar datos de un modo a otro.

## Probar en su computador

```bash
npx serve .          # o: python -m http.server 8000
```

Abra la dirección que indique. No abra `index.html` con doble clic: algunos navegadores bloquean el almacenamiento con `file://`.

## Estructura

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La app completa (interfaz, motor de cálculo, exportación a PDF y Excel). |
| `plataforma.js` | Adaptador de almacenamiento y descargas (modo local o Firebase). |
| `config.js` | Elige el modo y guarda la configuración de Firebase. |
| `firestore.rules` | Reglas de seguridad para el modo compartido. |

Librerías externas (CDN): SheetJS 0.18.5, jsPDF 2.5.1, jsPDF-AutoTable 3.8.2 y, en modo compartido, Firebase 10.

## Trabajar en el código con otras personas

- Invite colaboradores en **Settings → Collaborators**.
- Haga cambios en una rama y abra un *pull request* para revisarlos antes de pasarlos a `main`; cada cambio en `main` se publica solo.
- No suba archivos contables (`.xlsx`, `.xls`) ni respaldos (`respaldo-*.json`): el `.gitignore` ya los excluye.
