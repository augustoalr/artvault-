# Manual de Usuario — ArtVault

Este documento describe las funcionalidades principales del sistema de gestión de colección ArtVault.

## 1. Acceso al Panel de Administración
- Inicie sesión con su correo y contraseña.
- Si su usuario tiene rol de **Admin**, verá opciones avanzadas en la barra lateral: "Configuración" y "Actividad".

## 2. Gestión de Obras
### Crear una Obra
1. Vaya a la sección **Obras** y haga clic en **Nueva Obra**.
2. Complete la **Ficha Técnica** (Página 1). Los campos obligatorios están marcados.
3. Suba la **Fotografía Principal** arrastrando un archivo a la zona de imagen derecha. El sistema comprimirá automáticamente la imagen para optimizar el espacio.
4. Continúe con las siguientes secciones: Historia, Valoración, Conservación.
5. Al finalizar, haga clic en **Guardar**.

### Editar una Obra
- Desde el listado de Obras, busque la obra y haga clic en el título o en **Editar**.
- Modifique los campos necesarios y guarde.

### Eliminar una Obra
- **Advertencia:** Esta acción es crítica.
- Al intentar eliminar una obra, se le solicitará la **Contraseña Maestra**. Solo el administrador conoce esta clave.

## 3. Búsqueda Avanzada
En la sección **Colección** (Obras), encontrará una barra de búsqueda rápida y un botón **Filtros**.
- **Búsqueda Rápida:** Escriba título, autor o número de inventario y presione Enter.
- **Filtros Avanzados:** Haga clic en "Filtros" para desplegar opciones detalladas:
    - Autor
    - Técnica
    - Categoría
    - Rango de Años
    - Procedencia

## 4. Exportación a PDF
Puede generar Fichas Técnicas en formato PDF para una obra individual o un grupo de obras.
- **Individual:** (Próximamente en detalle de obra).
- **Masiva:** Desde el listado de Obras, aplique los filtros deseados. Luego, haga clic en el botón **Exportar PDF**.
    - El sistema generará un documento único con las fichas de todas las obras filtradas (hasta 200 por lote).
    - El PDF incluye: Datos técnicos, Foto principal, Biografía y Tabla de Movimientos/Ubicaciones.

## 5. Copias de Seguridad (Backup)
Solo accesible para **Administradores** desde **Configuración**.
- **Generar Copia:** Haga clic en "Descargar Copia de Seguridad". Se descargará un archivo JSON con toda la información de la base de datos (textos, fechas, relaciones). Las imágenes no se incluyen en este archivo (residen en la nube), pero sus referencias sí.
- **Restaurar Copia:**
    1. Seleccione el archivo JSON previamente descargado.
    2. Ingrese la **Contraseña Maestra**.
    3. Confirme. El sistema actualizará la base de datos con la información del archivo.

## 6. Auditoría y Actividad
En la sección **Actividad**, los administradores pueden ver un historial cronológico de todas las acciones importantes:
- Creación/Edición de obras.
- Intentos de acceso.
- Cambios de configuración.
- Generación de backups.
Cada registro muestra quién realizó la acción y cuándo.
