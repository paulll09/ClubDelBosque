# 🎾 Club del Bosque Pádel - Frontend

![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.0-purple?style=for-the-badge&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Mercado Pago](https://img.shields.io/badge/Mercado_Pago-Integration-light_blue?style=for-the-badge&logo=mercadopago)

Aplicación web moderna y responsiva para la gestión de reservas de canchas de pádel del **Club del Bosque**. Desarrollada con tecnologías de vanguardia para ofrecer una experiencia de usuario (UX) premium, rápida y segura.

---

## ✨ Características Principales

### 👤 ***Experiencia de Usuario (Cliente)***
- **Reservas en Tiempo Real**: Visualización interactiva de disponibilidad de canchas y horarios.
- **Autenticación Segura**: Registro e inicio de sesión de usuarios con validación de datos y recuperación de contraseña.
- **Pagos Integrados**: Integración directa con **Mercado Pago** para abonar señas y confirmar turnos automáticamente.
- **Perfil de Usuario**: Gestión de datos personales e historial de reservas ("Mis Turnos").
- **Interfaz "Pro Max"**: Diseño *Glassmorphism*, animaciones fluidas y modo oscuro nativo para una estética elegante.
- **Feedback Visual**: Sistema de notificaciones *Toast* para confirmar acciones (pagos, errores, login).

### 🛠 ***Gestión y Administración***
- **Panel Administrativo**: Acceso exclusivo para administradores.
- **Gestión de Bloqueos**: Herramientas para bloquear horarios por mantenimiento o torneos.
- **Configuración Dinámica**: Ajuste de precios, horarios de apertura/cierre y señas desde el frontend.

---

## 🚀 Tecnologías

Este proyecto utiliza un stack tecnológico robusto y optimizado:

- **Frontend Core**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) + Custom CSS Animations
- **Iconos**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: Fetch API con interceptores personalizados (`httpClient.js`)
- **Estado Global**: React Context API (`UserContext`, `ToastContext`)
- **Pagos**: SDK / API de Mercado Pago

---

## 📦 Instalación y Configuración

Sigue estos pasos para levantar el proyecto en tu entorno local:

### 1. Clonar el repositorio
```bash
git clone https://github.com/paulll09/ClubDelBosque.git
cd ClubDelBosque
```

### 2. Instalar dependencias
Asegúrate de tener [Node.js](https://nodejs.org/) instalado.
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto basándote en el siguiente ejemplo:

```env
# URL de la API Backend (PHP/Laravel/CodeIgniter)
VITE_API_URL=http://localhost:8080

# Otras configuraciones (opcional)
VITE_MP_PUBLIC_KEY=TU_CLAVE_PUBLICA_MP
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

---

## 🛠 Comandos Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo. |
| `npm run build` | Compila la aplicación para producción en la carpeta `dist`. |
| `npm run preview` | Previsualiza localmente la build de producción. |
| `npm run lint` | Ejecuta el linter para buscar errores de código. |

---

## 📂 Estructura del Proyecto

```
src/
├── components/      # Componentes UI reutilizables (Botones, Modales, Gráficos)
├── context/         # Estado global (UserProvider, ToastProvider)
├── hooks/           # Custom Hooks (Lógica de negocio encapsulada)
├── services/        # Capa de comunicación con la API (Auth, Reservas)
├── helpers/         # Funciones de utilidad y formateo
├── App.jsx          # Componente raíz y orquestador de rutas
└── main.jsx         # Punto de entrada de la aplicación
```

---

## 🔒 Buenas Prácticas Implementadas

- **Clean Architecture**: Separación clara entre UI, Lógica (Hooks) y Datos (Services).
- **Error Handling**: Manejo centralizado de errores con *Error Boundaries* y *Toast Notifications*.
- **Security**: Sanitización de sesiones de usuario y protección contra datos corruptos (Auto-Healing).
- **Performance**: Code splitting y carga diferida (lazy loading) donde aplica.

---

## 📞 Contacto

**Desarrollado por:** Paul Aquino
- **GitHub**: [paulll09](https://github.com/paulll09)
- **Email**: aquinopaul2002@gmail.com

---

© 2026 Club del Bosque Pádel. Todos los derechos reservados.
