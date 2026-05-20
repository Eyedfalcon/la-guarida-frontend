# Manual para publicar La Guarida por primera vez

Este manual es para subir la web completa:

- Frontend: la parte visual, reservas, login, admin y panel de barbero.
- Backend: la API que guarda reservas, usuarios, servicios, barberos, horarios y pagos.
- Base de datos: Supabase/PostgreSQL.

La idea recomendada es:

- GitHub: guardar el codigo.
- Supabase: base de datos.
- Render: backend .NET.
- Vercel: frontend React.

## 1. Muy importante antes de publicar

Antes de poner la pagina publica, cambia la contrasena de Supabase.

Motivo: la contrasena antigua estuvo escrita en archivos del proyecto antes de limpiarlo. Ya no esta en el codigo actual, pero por seguridad hay que cambiarla.

Tambien crea una nueva clave JWT. No uses la antigua.

Una clave JWT puede ser algo largo como:

```txt
LaGuarida_Produccion_2026_Cambia_Esto_Por_Una_Clave_Larga_De_60_Caracteres_123456
```

No tiene que ser una contrasena que recuerdes, solo una clave secreta larga.

## 2. Que archivos NO debes tocar con contrasenas reales

No pongas contrasenas reales dentro de estos archivos:

```txt
backend/appsettings.json
backend/appsettings.Development.json
backend/.env.example
frontend/.env.example
```

Los archivos `.example` son solo ejemplo.

Las contrasenas reales se ponen en las variables de entorno de Render y Vercel, no dentro del codigo.

## 3. Supabase: preparar la base de datos

Entra a Supabase y abre tu proyecto.

Busca la conexion PostgreSQL. Necesitas una cadena parecida a esta:

```txt
Host=TU_HOST_SUPABASE;Port=6543;Database=postgres;Username=TU_USUARIO;Password=TU_PASSWORD_NUEVA;SSL Mode=Require;Trust Server Certificate=true
```

Cambia estas partes:

```txt
TU_HOST_SUPABASE
TU_USUARIO
TU_PASSWORD_NUEVA
```

Ejemplo de como debe quedar, usando datos inventados:

```txt
Host=TU_HOST_REAL_DE_SUPABASE;Port=6543;Database=postgres;Username=TU_USUARIO_REAL;Password=MI_PASSWORD_NUEVA;SSL Mode=Require;Trust Server Certificate=true
```

Si la base de datos que usas ahora ya tiene reservas, barberos y servicios, no borres nada. Solo cambia la contrasena y actualiza la cadena de conexion.

## 4. Render: publicar el backend

El backend esta en esta carpeta:

```txt
backend
```

En Render:

1. Crea una cuenta o inicia sesion.
2. Pulsa `New`.
3. Elige `Web Service`.
4. Conecta tu GitHub.
5. Elige el repositorio:

```txt
Eyedfalcon/la-guarida-frontend
```

6. En configuracion del servicio, usa:

```txt
Root Directory: backend
Environment: Docker
```

El proyecto ya tiene:

```txt
backend/Dockerfile
```

Render deberia detectar el Dockerfile.

## 5. Variables que debes poner en Render

En Render, dentro del backend, busca `Environment` o `Environment Variables`.

Agrega estas variables:

```txt
ConnectionStrings__DefaultConnection
Jwt__Key
Jwt__Issuer
Jwt__Audience
Cors__AllowedOrigins__0
```

Valores:

```txt
ConnectionStrings__DefaultConnection=Host=TU_HOST_SUPABASE;Port=6543;Database=postgres;Username=TU_USUARIO;Password=TU_PASSWORD_NUEVA;SSL Mode=Require;Trust Server Certificate=true
Jwt__Key=TU_CLAVE_JWT_NUEVA_LARGA
Jwt__Issuer=LaGuaridaApi
Jwt__Audience=LaGuaridaFrontend
Cors__AllowedOrigins__0=https://TU_WEB_DE_VERCEL.vercel.app
```

Al principio todavia no tendras la URL de Vercel. Puedes poner temporalmente:

```txt
Cors__AllowedOrigins__0=http://localhost:5173
```

Despues de publicar Vercel, vuelves a Render y lo cambias por la URL real del frontend.

Cuando Render termine, te dara una URL parecida a:

```txt
https://la-guarida-backend.onrender.com
```

Guarda esa URL. La usaras en Vercel.

## 6. Probar que el backend responde

Abre en el navegador:

```txt
https://TU_BACKEND.onrender.com/api/Services
```

Si ves datos o una respuesta JSON, el backend esta vivo.

Si ves error 500, normalmente es por:

- Cadena de conexion mal escrita.
- Password de Supabase incorrecta.
- Variables de entorno faltantes.
- La base de datos no tiene tablas/migraciones.

## 7. Vercel: publicar el frontend

El frontend esta en esta carpeta:

```txt
frontend
```

En Vercel:

1. Crea una cuenta o inicia sesion.
2. Pulsa `Add New Project`.
3. Importa el repo:

```txt
Eyedfalcon/la-guarida-frontend
```

4. En configuracion del proyecto, cambia:

```txt
Root Directory: frontend
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

## 8. Variable que debes poner en Vercel

En Vercel, dentro del proyecto frontend, busca `Environment Variables`.

Agrega:

```txt
VITE_API_BASE_URL=https://TU_BACKEND.onrender.com/api
```

Ejemplo:

```txt
VITE_API_BASE_URL=https://la-guarida-backend.onrender.com/api
```

Importante: debe terminar en `/api`.

No pongas:

```txt
https://la-guarida-backend.onrender.com
```

Debe ser:

```txt
https://la-guarida-backend.onrender.com/api
```

## 9. Volver a Render y cambiar CORS

Cuando Vercel te de tu URL, por ejemplo:

```txt
https://la-guarida.vercel.app
```

Vuelve a Render y cambia:

```txt
Cors__AllowedOrigins__0=https://la-guarida.vercel.app
```

Luego redeploy/reinicia el backend.

Esto permite que el frontend pueda llamar al backend.

## 10. Prueba final antes de compartir

Abre la URL de Vercel y prueba:

1. Home carga bien en movil.
2. Boton reservar funciona.
3. Crear usuario funciona.
4. Iniciar sesion funciona.
5. Recuperar contrasena funciona.
6. Crear reserva funciona.
7. Enviar comprobante muestra reserva confirmada con pago pendiente de revision.
8. Panel admin abre.
9. Admin ve solo reservas del dia.
10. Admin puede confirmar pago.
11. Panel barbero abre.
12. Barbero ve sus citas.
13. Imagenes/logo cargan.

## 11. Si algo falla

### Error 404 al refrescar `/admin` o `/reservar`

El proyecto ya tiene:

```txt
frontend/vercel.json
frontend/public/_redirects
```

Si falla en Vercel, revisa que el `Root Directory` sea `frontend`.

### Error 502 o Failed to fetch

Normalmente significa que el backend no esta funcionando o Vercel apunta a una URL incorrecta.

Revisa:

```txt
VITE_API_BASE_URL
```

Debe ser:

```txt
https://TU_BACKEND.onrender.com/api
```

### Error de CORS

Revisa en Render:

```txt
Cors__AllowedOrigins__0
```

Debe ser exactamente la URL de Vercel, sin barra final.

Bien:

```txt
https://la-guarida.vercel.app
```

Mal:

```txt
https://la-guarida.vercel.app/
```

### Error de base de datos

Revisa en Render:

```txt
ConnectionStrings__DefaultConnection
```

Debe tener la contrasena nueva de Supabase.

## 12. Que cambiar cuando ya tengas tus URLs reales

Cuando tengas URL real del backend:

En Vercel cambia:

```txt
VITE_API_BASE_URL=https://TU_BACKEND_REAL/api
```

Cuando tengas URL real del frontend:

En Render cambia:

```txt
Cors__AllowedOrigins__0=https://TU_FRONTEND_REAL
```

Eso es lo principal para que todo funcione publico.

## 13. Resumen rapido

Orden recomendado:

1. Cambiar password de Supabase.
2. Subir backend a Render.
3. Copiar URL del backend.
4. Subir frontend a Vercel.
5. Poner en Vercel `VITE_API_BASE_URL=https://backend/api`.
6. Copiar URL del frontend.
7. Poner en Render `Cors__AllowedOrigins__0=https://frontend`.
8. Probar reserva completa.
9. Compartir la web.
