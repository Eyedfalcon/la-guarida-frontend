# La Guarida - Guia de despliegue

## 1. Antes de subir

La contrasena de Supabase y la clave JWT estuvieron en archivos del proyecto. Antes de publicar:

- Cambia la contrasena de la base de datos en Supabase.
- Crea una nueva clave JWT larga y secreta.
- No subas secretos reales a GitHub.

## 2. Variables del backend

En Render, Railway u otro hosting para .NET, configura estas variables:

```txt
ConnectionStrings__DefaultConnection=Host=TU_HOST_SUPABASE;Port=6543;Database=postgres;Username=TU_USUARIO;Password=TU_PASSWORD;SSL Mode=Require;Trust Server Certificate=true
Jwt__Key=UNA_CLAVE_MUY_LARGA_Y_SECRETA
Jwt__Issuer=LaGuaridaApi
Jwt__Audience=LaGuaridaFrontend
Cors__AllowedOrigins__0=https://TU_FRONTEND.vercel.app
```

Comando de build recomendado:

```txt
dotnet publish -c Release
```

Comando de start recomendado:

```txt
dotnet backend.dll
```

Tambien puedes desplegar el backend con el `Dockerfile` incluido en la carpeta `backend`.

## 3. Variables del frontend

En Vercel o Netlify, dentro del proyecto frontend, configura:

```txt
VITE_API_BASE_URL=https://TU_BACKEND.onrender.com/api
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

## 4. Local

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

## 5. Prueba final

Antes de compartir el enlace:

- Crear una reserva desde movil.
- Iniciar sesion como cliente.
- Probar recuperar contrasena.
- Entrar como admin y confirmar/cancelar una reserva.
- Entrar como barbero y revisar citas del dia.
- Revisar que las imagenes carguen desde `/assets`.
