# Arca para el navegador

Extensión que rellena, sugiere y guarda contraseñas usando la app de escritorio [Arca](https://github.com/gbaldessari/arca-app). Funciona en Chrome, Edge y Firefox. No tiene servidor: habla con la app de este equipo y solo mientras esa app está abierta.

Este repositorio se publica para que el código se pueda leer y auditar. La extensión es software libre bajo la [GNU GPL v3](LICENSE), solo la versión 3, igual que la app. Se puede usar, estudiar, modificar y compartir. Quien distribuya una versión modificada tiene que publicar el código fuente bajo la misma licencia. Copyright (C) 2026 Giacomo Baldessari.

## Qué hace

En un formulario de acceso ofrece las entradas de Arca para ese sitio. En un formulario de alta puede proponer una contraseña generada por la app y repetirla en el campo de confirmación. Después de enviar un formulario nuevo, o de cambiar una contraseña que ya estaba guardada, pregunta si se guarda en la bóveda.

El popup de la extensión lista las entradas del sitio abierto, rellena la pestaña, copia una contraseña y genera una contraseña segura. Copiar usa el portapapeles de la app: queda fuera del historial de Windows y se borra a los 30 segundos.

La extensión no descifra nada y no guarda la bóveda. Si Arca está cerrada, bloqueada o con la integración desactivada, no hay contraseñas que mostrar.

## Cómo se conecta

```
página  →  content.js  →  background.js  →  native messaging  →  arca.exe
                                                                      │
                                                               127.0.0.1 (cifrado)
                                                                      │
                                                                 app de Arca
```

`content.js` corre en páginas `https` y en `http://localhost` y `http://127.0.0.1`. Detecta campos de usuario y contraseña, pero no lee otras contraseñas de la página hasta que la persona envía el formulario o pide rellenar.

`background.js` es el service worker en Chrome y Edge, y el script de fondo en Firefox. Es el único que puede usar native messaging. La página no le escribe directo: el content script manda el mensaje y el fondo descarta cualquiera que no venga de esta misma extensión.

El host se llama `com.arca.vault`. La app lo registra en el registro del usuario al activar la integración, para Chrome, Edge y Firefox, y lo borra al desactivarla. El ejecutable que arranca el navegador no abre la ventana: solo reenvía el mensaje a la app que ya está corriendo, por un puerto local cuyo número y clave cambian en cada arranque. El detalle del cifrado y de qué puede pedir cada sitio está en el README de la app, en `src-tauri/src/bridge.rs`.

## Qué puede pedir

| Mensaje | Cuándo | Qué devuelve la app |
| --- | --- | --- |
| `logins` | Al enfocar un campo de acceso | Título y usuario de ese sitio, sin contraseñas |
| `fill` | Al elegir una entrada | Usuario y contraseña, solo si la entrada es de ese sitio |
| `generate` | Al pedir una contraseña segura | 20 caracteres, con el generador de la app |
| `captured` y `save` | Tras enviar un formulario | Nada, una entrada nueva o una actualización |
| `copy` | Desde el popup | La app copia la contraseña y no la devuelve |

La URL la pone el navegador (`sender.url` o la pestaña activa), no la página. Una página no puede pedir las contraseñas de otro sitio cambiando el mensaje.

## Cómo está hecha la interfaz

El menú y el aviso de guardar viven en un shadow DOM cerrado, dentro de un elemento `arca-helper`. La página no puede leerlo ni recorrerlo. Esos controles solo reaccionan a clics y teclas marcados como reales por el navegador (`isTrusted`). Los iconos se dibujan con el DOM, sin `innerHTML`, para no depender de la política de contenido de la página.

El estilo sigue el modo claro u oscuro del sistema. El popup está en `popup.html`, `popup.css` y `popup.js`.

## Instalarla para probarla

1. Instala y abre la app de Arca, desbloquea la bóveda y activa **Integración con el navegador** en Ajustes.
2. Chrome o Edge: `chrome://extensions` o `edge://extensions`, activa el modo desarrollador y elige **Cargar descomprimida** sobre esta carpeta.
3. Firefox 128 o posterior: `about:debugging#/runtime/this-firefox` y elige **Cargar complemento temporal** sobre `manifest.json`.

El campo `key` del manifiesto es la clave pública que fija el identificador de Chrome y Edge en `jnjphfockignkgdhnlpmobbcgchmbeab`. La app solo acepta ese origen, y en Firefox solo el id `arca@arca.vault`. Si se quita `key`, el navegador calcula otro id y native messaging deja de coincidir. La clave privada de ese par no está en este repositorio.

Hace falta la app de esta misma versión del protocolo. La extensión no funciona sola.

## Permisos

- `nativeMessaging`: hablar con el host `com.arca.vault`.
- `storage`: guardar en memoria de la sesión, durante unos minutos, el usuario y la contraseña que se acaban de enviar, hasta que la persona confirme si se guardan. Se borra al cerrar la pestaña o al responder.
- `activeTab`: el popup necesita la URL de la pestaña actual.

No pide permiso para leer el historial, las pestañas en segundo plano ni el contenido de todas las páginas. El content script sí está declarado para todo `https`, porque no hay forma de saber de antemano en qué sitio hay un formulario.

## Para auditar

Conviene leer en este orden: `manifest.json`, `background.js`, `content.js` y, en la app, `src-tauri/src/bridge.rs` y `bridge_request` en `src-tauri/src/lib.rs`.

Límites del diseño:

- Cuando la persona elige una contraseña, el content script la escribe en el input. Desde ese momento el JavaScript de la página puede leerla. Es el mismo límite de cualquier autocompletado.
- Con la integración activa, un programa del mismo usuario de Windows puede hablar con el puerto local de la app. El navegador solo impide que otra extensión use el host.
- `generate` y copiar texto no exigen la bóveda desbloqueada. No leen entradas.
- La coincidencia de sitios trata los subdominios como el mismo sitio y no usa la lista de sufijos públicos. El README de la app describe la regla exacta.
- El aviso de guardar recuerda la contraseña recién enviada en `storage.session` hasta tres minutos. No se escribe en disco.
- No hay tienda ni paquete firmado. Cargarla en modo desarrollador es la forma prevista de probarla.
