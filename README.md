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

Instalar las dependencias la primera vez:

```bash
npm install
```

### Ver la app en esta PC

```bash
npm run dev
```

Inicia el entorno local de Netlify. La app queda disponible normalmente en
`http://localhost:8888`.

### Ver la app desde un celular

1. Conectar el celular y esta PC a la misma red Wi-Fi.
2. Desde la carpeta del proyecto, iniciar Netlify en el puerto `8888`:

   ```bash
   npm run dev -- --port 8888 --no-open
   ```

3. En otra terminal, consultar la IP local de esta PC:

   ```bash
   hostname -I
   ```

4. Usar la primera IP de la red local que aparezca (normalmente comienza con
   `192.168.` o `10.`) y abrir esta dirección en el navegador del celular:

   ```text
   http://IP_DE_ESTA_PC:8888
   ```

   Por ejemplo, si la IP es `192.168.1.25`, abrir
   `http://192.168.1.25:8888`.

Mantener la terminal con Netlify abierta mientras se usa la app. Si el celular
no puede conectarse, comprobar que el firewall de la PC permita conexiones al
puerto `8888` y que la red Wi-Fi no tenga activado el aislamiento de
dispositivos.

## Variables de entorno

Configurar en `.env` o en Netlify segun corresponda:

- `MP_ACCESS_TOKEN`
- `ZIPPIN_API_KEY`
- `ZIPPIN_API_SECRET`
- `SELLER_EMAIL`: remitente y destinatario principal de las notificaciones de venta.
- `SELLER_COPY_EMAIL`: destinatario adicional opcional, configurado fuera del repositorio.
- `SELLER_COPY_NAME`: nombre opcional del destinatario adicional.
- Variables SMTP o de notificaciones si se usan en los webhooks.
