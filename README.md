# Frontend La Isla Café Picnic

Aplicación React para el sitio público y el panel administrativo de La Isla Café Picnic.

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS

## Configuración

```bash
npm install
cp .env.example .env
```

Ejemplo de producción:

```env
VITE_API_BASE_URL=https://api.laislacafepicnic.com/api
```

El dominio real de la API debe reemplazar el ejemplo cuando esté definido.

## Comandos

```bash
npm run dev
npm run build
npm run preview
```

## Producción en Hostinger

1. Configurar `VITE_API_BASE_URL` con el dominio real del backend.
2. Ejecutar `npm run build`.
3. Subir el contenido de `dist/` a Hostinger.
4. Apuntar `laislacafepicnic.com` hacia el hosting.
5. Verificar sitio público, login administrativo y llamadas a la API.

Si Hostinger sirve la app como SPA, configura redirección/fallback para que rutas como `/admin/login` o `/reservar/mesa` carguen `index.html`.
