# Guia paso a paso: mover backend de Render a Railway

## Objetivo

- Backend en Railway.
- Frontend en Vercel.
- Render apagado solo despues de confirmar que Railway funciona.

## 1. Subir cambios a GitHub

Railway solo vera los cambios cuando esten en GitHub.

Archivos importantes:

- `backend/Program.cs`
- `backend/railway.json`
- `DEPLOYMENT.md`

## 2. Crear el backend en Railway

1. Entra a Railway.
2. Crea un servicio nuevo desde GitHub.
3. Selecciona el repo `la-guarida`.
4. Nombra el servicio `la-guarida-backend`.
5. En `Settings`, configura:

```txt
Root Directory: backend
Builder: Dockerfile
Healthcheck Path: /health
```

Si ya tienes un servicio llamado `la-guarida-frontend` en Railway, no lo uses para el backend con ese nombre/configuracion. Puedes eliminarlo o cambiarle el nombre y poner `Root Directory: backend`.

## 3. Variables en Railway

En el servicio backend de Railway, abre `Variables` y agrega:

```txt
ConnectionStrings__DefaultConnection=Host=TU_HOST_SUPABASE;Port=6543;Database=postgres;Username=TU_USUARIO;Password=TU_PASSWORD;SSL Mode=Require;Trust Server Certificate=true
Jwt__Key=UNA_CLAVE_MUY_LARGA_Y_SECRETA
Jwt__Issuer=LaGuaridaApi
Jwt__Audience=LaGuaridaFrontend
Cors__AllowedOrigins__0=https://TU_FRONTEND.vercel.app
```

Usa la URL real de tu frontend de Vercel en `Cors__AllowedOrigins__0`.

## 4. Desplegar y obtener URL de Railway

1. Presiona `Deploy`.
2. Espera a que termine el build.
3. Ve a `Networking`.
4. Genera un dominio publico.

Prueba esta URL:

```txt
https://TU_BACKEND_RAILWAY.up.railway.app/health
```

Debe responder:

```json
{"status":"ok"}
```

## 5. Cambiar Vercel para usar Railway

En Vercel:

1. Abre el proyecto frontend.
2. Ve a `Settings > Environment Variables`.
3. Cambia o crea:

```txt
VITE_API_BASE_URL=https://TU_BACKEND_RAILWAY.up.railway.app/api
```

4. Guarda.
5. Haz redeploy del frontend.

Esto es necesario porque Vite copia las variables `VITE_` durante el build.

## 6. Pruebas antes de apagar Render

Prueba desde la URL real de Vercel:

- Crear una reserva.
- Iniciar sesion como cliente.
- Entrar al panel admin.
- Confirmar o cancelar una reserva.
- Entrar al panel barbero.
- Refrescar rutas como `/admin`, `/barbero` y `/reservar`.

## 7. Que hacer con Render

No borres Render hasta que las pruebas anteriores funcionen.

Cuando todo este correcto:

1. Pausa el servicio backend en Render.
2. Espera unos minutos.
3. Vuelve a probar Vercel.
4. Si todo sigue funcionando, puedes eliminar el servicio de Render.

Si algo falla despues de pausar Render, Vercel todavia esta apuntando a Render o hay alguna URL antigua guardada en variables/configuracion.

## 8. Checklist rapido

```txt
[ ] Cambios subidos a GitHub
[ ] Railway usa Root Directory = backend
[ ] Railway tiene variables completas
[ ] /health responde en Railway
[ ] Vercel usa VITE_API_BASE_URL con Railway + /api
[ ] Frontend redeploy hecho en Vercel
[ ] Reservas/login/admin/barbero probados
[ ] Render pausado despues de validar
```
