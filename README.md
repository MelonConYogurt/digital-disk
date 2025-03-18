# Digital Disk - Editor de Píxeles

Visita la pagina web:
https://digital-disk.vercel.app/

Una aplicación web para crear y editar arte de píxeles (pixel art) con múltiples capas y herramientas.

## Características

- 🖌️ Herramientas de dibujo y borrado
- 🎨 Selector de colores
- 📑 Sistema de capas
- ↩️ Deshacer/Rehacer por capa
- 🔍 Zoom in/out
- 📏 Tamaño de píxel ajustable
- 📸 Importación de imágenes
- 🎯 Vista previa en tiempo real

## Configuración del Canvas

- Presets predefinidos:
  - Favicon (16x16)
  - Small (32x32)
  - Medium (64x64)
  - Large (128x128)
  - Emoji (48x48)
- Tamaño personalizado:
  - Ancho: 1-300 píxeles
  - Alto: 1-300 píxeles
- Tamaño de celda ajustable: 1-32 píxeles

## Herramientas

### Dibujo

- Pincel con tamaño ajustable
- Selector de color RGB
- Interpolación entre puntos para trazos suaves

### Borrador

- Borrador con tamaño ajustable
- Elimina píxeles en capas activas

### Sistema de Capas

- Crear/eliminar capas
- Activar/desactivar visibilidad
- Vista previa de contenido
- Selección de capa activa
- Historial independiente por capa

### Navegación

- Zoom con rueda del ratón
- Zoom desde controles
- Vista porcentual del zoom

### Importación

- Soporte para formatos de imagen
- Arrastrar y soltar imágenes
- Conversión automática a píxeles

## Tecnologías

- React.js
- Tailwind CSS
- HTML Canvas API

## Uso

1. Configura el tamaño del canvas
2. Selecciona una herramienta (pincel/borrador)
3. Ajusta el color y tamaño del pincel
4. Dibuja en la capa activa
5. Gestiona capas según necesites
6. Usa deshacer/rehacer para corregir
7. Importa imágenes si lo deseas

## Instalación

```bash
# Clonar repositorio
git clone [url-repositorio]

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Licencia

MIT
