# Sitio Cecilia Rosso

Sitio estatico con funciones serverless de Netlify para checkout, Mercado Pago y envios.

## Estructura

- `index.html`, `links.html`, `legales.html`: paginas publicas servidas desde la raiz.
- `assets/images/`: imagenes publicas del sitio.
- `src/css/`: estilos del frontend.
- `src/js/`: scripts del frontend.
- `netlify/functions/`: funciones serverless y servicios auxiliares.
- `tests/`: scripts de prueba manual.
- `tests/fixtures/`: respuestas y payloads JSON de prueba.
- `docs/`: notas o archivos auxiliares que no forman parte del runtime.

## Comandos

```bash
npm run dev
```

Inicia el entorno local de Netlify.

## Variables de entorno

Configurar en `.env` o en Netlify segun corresponda:

- `MP_ACCESS_TOKEN`
- `ZIPPIN_API_KEY`
- `ZIPPIN_API_SECRET`
- `SELLER_EMAIL`: remitente y destinatario principal de las notificaciones de venta.
- `SELLER_COPY_EMAIL`: destinatario adicional opcional, configurado fuera del repositorio.
- `SELLER_COPY_NAME`: nombre opcional del destinatario adicional.
- Variables SMTP o de notificaciones si se usan en los webhooks.
