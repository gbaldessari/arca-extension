# Política de privacidad

[English](PRIVACY.md)

Arca para Microsoft Edge, y la app de Arca con la que habla, las hace Giacomo Baldessari. Esta política dice qué acceden y a dónde van esos datos. Última actualización: 1 de octubre de 2026.

## Para qué sirve Arca

La extensión rellena, sugiere y guarda contraseñas del sitio que tenés abierto. Lo hace hablando con la app de Arca en la misma computadora. No hay cuenta de Arca ni servidor de Arca.

La misma extensión se puede instalar en otros navegadores. El tratamiento de tus datos no cambia.

## Qué se accede

En un formulario de inicio de sesión o de registro, la extensión lee los campos de usuario y contraseña, y la dirección de la pestaña actual. El usuario puede ser un correo o un nombre. No lee el resto de la página.

Si desbloqueás Arca desde la extensión, la contraseña maestra que escribís se envía a la app en esta computadora. La extensión no la guarda. Si usás Windows Hello, la extensión solo le pide a la app que se desbloquee. El PIN, la huella o la cara se quedan en Windows.

Cuando elegís una entrada, la app devuelve el usuario y la contraseña de ese sitio, y solo mientras la bóveda está desbloqueada. La extensión los escribe en el formulario. El sitio los recibe igual que si los hubieras escrito vos.

## Dónde se guarda

La bóveda es un archivo cifrado en tu computadora, en `%APPDATA%\com.arca.vault\arca.db`. La extensión no guarda una copia y no la descifra.

Un usuario y una contraseña que acabás de enviar quedan en el almacenamiento de sesión del navegador hasta 3 minutos, para que la extensión pueda preguntar si se guardan. Esa copia se borra cuando guardás, cuando descartás el aviso, cuando se cierra la pestaña, o cuando pasan esos 3 minutos.

La extensión también guarda una preferencia en esta computadora: si Windows Hello es la forma por defecto de desbloquear. Esa preferencia no es una contraseña.

Copiar una contraseña lo hace la app. La app limpia el portapapeles a los 30 segundos.

## Qué sale de esta computadora

Nada de lo que lee la extensión se envía a Giacomo Baldessari, a Microsoft ni a ningún otro servidor. La extensión no tiene analítica, publicidad ni reportes de errores.

El único programa que recibe tus contraseñas es la app de Arca en esta computadora, por el host local `com.arca.vault`. La clave de ese canal cambia cada vez que Arca se inicia.

Arca no vende, no alquila y no comparte tus datos. No los usa para crédito, préstamos ni publicidad, y no los usa para nada que no sea rellenar, sugerir y guardar tus propias contraseñas.

## Tus controles

Podés desactivar la integración con el navegador en Ajustes de la app. Podés descartar un aviso de guardado. Podés editar o borrar entradas en la app. Podés quitar la extensión de Microsoft Edge. Quitarla no borra la bóveda.

Tus datos se quedan en tu computadora. No hay una copia remota para pedir o borrar. Si olvidás la contraseña maestra, la bóveda no se puede abrir.

## Menores

Arca no está dirigida a menores de 13 años.

## Cambios

Si esta política cambia, el texto nuevo se publica en esta misma dirección, con una fecha nueva.

## Contacto

Las preguntas van al [listado de issues](https://github.com/gbaldessari/arca-extension/issues).
