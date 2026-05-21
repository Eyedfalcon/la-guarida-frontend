# La Guarida - Guia de despliegue

Esta guia deja la app en dos servicios:

- Backend: Railway, usando la carpeta `backend`.
- Frontend: Vercel, usando la carpeta `frontend`.
- Render: mantenerlo encendido solo hasta confirmar que Railway funciona; despues pausarlo o eliminarlo.

## 1. Antes de subir

La contrasena de Supabase y la clave JWT estuvieron en archivos del proyecto. Antes de publicar:

- Cambia la contrasena de la base de datos en Supabase.
- Crea una nueva clave JWT larga y secreta.
- No subas secretos reales a GitHub.

## 2. Backend en Railway

### 2.1 Subir los cambios a GitHub

Railway despliega desde GitHub. Antes de tocar Railway, confirma que estos archivos esten subidos:

- `backend/Program.cs`
- `backend/railway.json`

### 2.2 Crear o corregir el servicio

En Railway, crea un servicio nuevo desde GitHub o corrige el servicio actual.

Configuracion recomendada:

```txt
Service name: la-guarida-backend
Root Directory: backend
Builder: Dockerfile
Healthcheck Path: /health
```

Si el servicio actual se llama `la-guarida-frontend`, no lo uses asi para el backend. Puedes eliminarlo y crear uno nuevo, o renombrarlo a `la-guarida-backend` y cambiarle el `Root Directory` a `backend`.

### 2.3 Variables del backend

En Railway, dentro del servicio backend, configura estas variables:

```txt
ConnectionStrings__DefaultConnection=Host=TU_HOST_SUPABASE;Port=6543;Database=postgres;Username=TU_USUARIO;Password=TU_PASSWORD;SSL Mode=Require;Trust Server Certificate=true
Jwt__Key=UNA_CLAVE_MUY_LARGA_Y_SECRETA
Jwt__Issuer=LaGuaridaApi
Jwt__Audience=LaGuaridaFrontend
Cors__AllowedOrigins__0=https://TU_FRONTEND.vercel.app
```

No pongas comillas alrededor de los valores en Railway.

### 2.4 Desplegar y probar

En Railway:

1. Presiona `Deploy`.
2. Espera a que el build termine.
3. En `Networking`, genera un dominio publico.
4. Abre:

```txt
https://TU_BACKEND_RAILWAY.up.railway.app/health
```

Debe responder:

```txt
{"status":"ok"}
```

La URL base del API sera:

```txt
https://TU_BACKEND_RAILWAY.up.railway.app/api
```

## 3. Frontend en Vercel

En Vercel, dentro del proyecto frontend, configura o reemplaza esta variable:

```txt
VITE_API_BASE_URL=https://TU_BACKEND_RAILWAY.up.railway.app/api
```

Build command:

```txt
npm run build
```

Output directory:

```txt
dist
```

El frontend ya incluye configuracion para que rutas como `/admin`, `/barbero` y `/reservar` funcionen al refrescar en Vercel o Netlify.

Despues de cambiar `VITE_API_BASE_URL`, haz redeploy en Vercel. Las variables `VITE_` se leen durante el build del frontend, asi que no basta con guardarlas.

## 4. Que hacer con Render

No apagues Render antes de probar Railway.

Orden recomendado:

1. Despliega Railway.
2. Prueba `/health` en Railway.
3. Cambia `VITE_API_BASE_URL` en Vercel a la URL de Railway.
4. Haz redeploy del frontend en Vercel.
5. Prueba reservas, login y panel admin/barbero desde la URL real de Vercel.
6. Cuando todo funcione, pausa o elimina el servicio backend en Render.

Si tienes un dominio propio apuntando al backend de Render, cambialo para que apunte a Railway. Si no usabas dominio propio y Vercel apuntaba directo a `onrender.com`, solo necesitas cambiar `VITE_API_BASE_URL`.

## 5. Local

Para trabajar localmente, el frontend puede seguir usando el proxy de Vite:

```txt
VITE_API_PROXY_TARGET=http://localhost:5134
```

Y el backend necesita las mismas variables de entorno del backend. En PowerShell se pueden poner para una terminal asi:

```powershell
$env:ConnectionStrings__DefaultConnection="TU_CONNECTION_STRING"
$env:Jwt__Key="TU_CLAVE_JWT"
$env:Jwt__Issuer="LaGuaridaApi"
$env:Jwt__Audience="LaGuaridaFrontend"
$env:Cors__AllowedOrigins__0="http://localhost:5173"
dotnet run --urls http://localhost:5134
```

## 6. Prueba final

Antes de compartir el enlace:

- Crear una reserva desde movil.
- Iniciar sesion como cliente.
- Probar recuperar contrasena.
- Entrar como admin y confirmar/cancelar una reserva.
- Entrar como barbero y revisar citas del dia.
- Revisar que las imagenes carguen desde `/assets`.
