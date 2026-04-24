# Plan de Mejoras por Módulos para IA

Este documento organiza las mejoras extraídas de `mejoras-web-ceci.txt` en módulos incrementales. Cada módulo contiene pasos precisos formulados como instrucciones (prompts) que puedes copiar y pegar a una IA para que realice los cambios de forma segura y progresiva.

---

## Módulo 1: Seguridad Crítica del Checkout
**Objetivo:** Evitar que los usuarios puedan manipular precios, envíos o cantidades desde el navegador antes de pagar.

**Paso 1.1: Catálogo en el Backend (checkout.js)**
> "IA, modifica `netlify/functions/checkout.js`. Actualmente confía en el `item.price` y `item.title` que envía el frontend. Necesito que crees un objeto `PRODUCTS` en el backend con el precio real del libro. El frontend solo debe enviar el `productId` y la cantidad, y el backend debe reconstruir los items de Mercado Pago usando el precio del servidor."

**Paso 1.2: Recálculo de Envío en Backend**
> "IA, en `checkout.js` se está usando el `shippingCost` que viene del frontend. Esto es inseguro. Necesito que recalcules el costo de envío dentro de `checkout.js` basándote en el código postal recibido, antes de crear la preferencia de Mercado Pago."

**Paso 1.3: Validación Estricta de Datos (checkout.js)**
> "IA, agrega validaciones robustas en `checkout.js`. Verifica que el carrito no esté vacío, que `quantity` sea un entero positivo (máximo 10), que `delivery` sea 'shipping' o 'pickup', y que el email, teléfono, DNI y CP tengan formatos válidos. Si algo falla, devuelve un error 400."

**Paso 1.4: Protección del Carrito en Frontend (cart.js)**
> "IA, en `js/cart.js`, actualmente el carrito se vacía antes de confirmar si Mercado Pago devolvió el `init_point` correctamente. Mueve la lógica que vacía el carrito (`cart = []; updateCartUI();`) para que solo se ejecute dentro del bloque `if (response.ok && data.init_point)`."

**Paso 1.5: Bloqueo de Doble Submit**
> "IA, en el proceso de checkout del frontend, asegúrate de deshabilitar realmente el botón de 'Pagar' (`btn.disabled = true`) apenas se hace clic, para evitar que el usuario cree múltiples preferencias de pago por error. Restaúralo si hay un error."

---

## Módulo 2: Webhooks, Emails y Órdenes
**Objetivo:** Asegurar que los pagos se procesen una sola vez, asegurar los emails contra inyección HTML y tener un registro de ventas.

**Paso 2.1: Escapar Datos en Emails y Separar Templates (webhook.js)**
> "IA, en `netlify/functions/webhook.js` los datos del cliente se insertan directamente en el HTML de los emails. Crea una función `escapeHtml` para sanitizar todas las variables del usuario (nombre, dirección, DNI) y evitar inyección HTML. Además, organiza los strings de los emails en funciones separadas."

**Paso 2.2: Privacidad en Logs (webhook.js)**
> "IA, en `webhook.js` se está logueando el body completo del webhook, exponiendo datos personales. Cambia los `console.log` para que solo impriman datos técnicos (payment_id, status, delivery_type, errores) y NUNCA logueen nombre, DNI, dirección o teléfono completo."

**Paso 2.3: Validación de Firma de Mercado Pago**
> "IA, implementa la validación de firma (x-signature) en `webhook.js` siguiendo la documentación oficial de Mercado Pago, utilizando un secret configurado en las variables de entorno de Netlify, para evitar requests falsos."

**Paso 2.4: Idempotencia del Webhook**
> "IA, el webhook de Mercado Pago puede ejecutarse varias veces para un mismo pago. Propón e implementa un sistema simple (como Netlify Blobs o Supabase) en `webhook.js` para guardar los `payment_id` procesados y evitar enviar correos duplicados."

---

## Módulo 3: Performance y Optimización
**Objetivo:** Hacer que la página cargue más rápido, especialmente en celulares.

**Paso 3.1: Optimización de Imágenes**
> "IA, las imágenes como `Libro.png` y `cecilia.png` son muy pesadas. Dame instrucciones para convertirlas a formato WebP/AVIF. Luego, modifica el `index.html` para usar la etiqueta `<picture>` con diferentes resoluciones (`srcset`), agregando `width`, `height` y `loading=\"lazy\"` a las imágenes."

**Paso 3.2: Reemplazo de Tailwind CDN**
> "IA, la web usa el CDN de Tailwind CSS, lo cual no es ideal para producción. Configura un entorno de build para Tailwind: crea `tailwind.config.js`, agrega los scripts necesarios en `package.json` para compilar un archivo CSS minificado, y actualiza `index.html` para usar ese archivo local en lugar del CDN."

**Paso 3.3: Fijar Dependencias Externas**
> "IA, en `index.html` se están cargando los íconos de Lucide usando `@latest`. Cambia la URL para usar una versión fija específica para evitar que actualizaciones futuras rompan el diseño."

---

## Módulo 4: Experiencia de Usuario (UX)
**Objetivo:** Mejorar la navegación, manejo de errores y recuperar carritos.

**Paso 4.1: Persistir el Carrito**
> "IA, modifica `js/cart.js` para que guarde el estado del arreglo `cart` en `localStorage` cada vez que se modifique. Al cargar la página, debe inicializar el carrito leyendo el `localStorage`. Así el usuario no pierde su compra si recarga la página."

**Paso 4.2: Manejo de Estados de Pago**
> "IA, el frontend solo muestra un modal de éxito si se vuelve de Mercado Pago con `status=approved`. Agrega lógica en la página de retorno para detectar `status=failure` (mostrando botón de reintento) y `status=pending` (mostrando que el pago está procesándose)."

**Paso 4.3: Mejorar Errores de Envío**
> "IA, en la función `calculateShipping`, en lugar de usar un `alert()` genérico cuando falla el código postal, modifica el DOM para mostrar mensajes de error amigables en texto rojo debajo del campo del código postal."

**Paso 4.4: Textos Legales y Links de WhatsApp**
> "IA, revisa `index.html` y `links.html` para buscar placeholders como 'Sitio web: tu dominio' o números de WhatsApp de prueba y reemplázalos por variables o indica dónde poner los reales. También, centraliza el número de WhatsApp en una sola variable JavaScript."

---

## Módulo 5: Refactorización y Mantenimiento del Código
**Objetivo:** Dejar el código ordenado para el futuro.

**Paso 5.1: Eliminar Onclick Inline**
> "IA, en `index.html` hay muchos atributos `onclick` en los botones. Pasa todos esos eventos a código JavaScript usando `addEventListener` (usando atributos `data-action` en el HTML para identificarlos)."

**Paso 5.2: Reducir innerHTML**
> "IA, revisa los archivos JS y reemplaza el uso de `innerHTML` por `textContent` o `document.createElement` donde se estén insertando datos dinámicos, para minimizar el riesgo de vulnerabilidades XSS."

**Paso 5.3: Centralizar Configuración**
> "IA, crea un objeto `SITE_CONFIG` en un nuevo archivo `config.js` (y expórtalo/inclúyelo) que contenga el número de WhatsApp, el dominio, URLs de redes sociales, etc., y refactoriza el resto del código para que lea de esta configuración única."
