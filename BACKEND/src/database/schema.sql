-- Schema completo de Hospedaje Digital
-- Incluye todas las columnas vigentes (migraciones 20260513 aplicadas)
-- Última actualización: 2026-05-15

CREATE DATABASE IF NOT EXISTS hospedaje;
USE hospedaje;

-- =============================================
-- ROLES
-- =============================================
CREATE TABLE IF NOT EXISTS roles (
    IDRol    INT AUTO_INCREMENT PRIMARY KEY,
    Nombre   VARCHAR(255),
    Estado   VARCHAR(50),
    IsActive TINYINT(1) DEFAULT 1
);

-- =============================================
-- PERMISOS
-- =============================================
CREATE TABLE IF NOT EXISTS permisos (
    IDPermiso      INT AUTO_INCREMENT PRIMARY KEY,
    NombrePermisos VARCHAR(255),
    EstadoPermisos VARCHAR(50),
    Descripcion    VARCHAR(255),
    IsActive       TINYINT(1) DEFAULT 1
);

-- =============================================
-- ROLES <-> PERMISOS
-- =============================================
CREATE TABLE IF NOT EXISTS rolespermisos (
    IDRolPermiso INT AUTO_INCREMENT PRIMARY KEY,
    IDRol        INT,
    IDPermiso    INT,
    FOREIGN KEY (IDRol)    REFERENCES roles(IDRol),
    FOREIGN KEY (IDPermiso) REFERENCES permisos(IDPermiso)
);

-- =============================================
-- USUARIOS (empleados / administradores)
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios (
    IDUsuario       INT AUTO_INCREMENT PRIMARY KEY,
    NombreUsuario   VARCHAR(255),
    Apellido        VARCHAR(255),
    Email           VARCHAR(255),
    Contrasena      VARCHAR(255),
    TipoDocumento   VARCHAR(50),
    NumeroDocumento INT,
    Telefono        VARCHAR(50),
    Pais            VARCHAR(100),
    Direccion       VARCHAR(255),
    IDRol           INT,
    IsActive        TINYINT(1) DEFAULT 1,
    FOREIGN KEY (IDRol) REFERENCES roles(IDRol)
);

-- =============================================
-- CLIENTES
-- =============================================
CREATE TABLE IF NOT EXISTS cliente (
    NroDocumento VARCHAR(50) PRIMARY KEY,
    Nombre       VARCHAR(50),
    Apellido     VARCHAR(50),
    Direccion    VARCHAR(50),
    Email        VARCHAR(50),
    Telefono     VARCHAR(50),
    Password     VARCHAR(255),
    Estado       TINYINT(1) DEFAULT 1,
    IDRol        INT,
    FOREIGN KEY (IDRol) REFERENCES roles(IDRol)
);

-- =============================================
-- HABITACIONES
-- =============================================
CREATE TABLE IF NOT EXISTS habitacion (
    IDHabitacion    INT AUTO_INCREMENT PRIMARY KEY,
    NombreHabitacion VARCHAR(30)  NOT NULL,
    ImagenHabitacion TEXT,
    Descripcion      VARCHAR(255) NOT NULL,
    Costo            FLOAT        NOT NULL,
    Estado           VARCHAR(30)  NOT NULL DEFAULT 'disponible'
);

-- =============================================
-- SERVICIOS
-- =============================================
CREATE TABLE IF NOT EXISTS servicio (
    IDServicio             INT AUTO_INCREMENT PRIMARY KEY,
    NombreServicio         VARCHAR(30)  NOT NULL,
    Descripcion            VARCHAR(255) NOT NULL,
    Duracion               VARCHAR(50),
    CantidadMaximaPersonas INT          NOT NULL,
    Costo                  FLOAT        NOT NULL,
    Estado                 TINYINT(1)   NOT NULL DEFAULT 1,
    Imagen                 TEXT,
    Horario                VARCHAR(100)
);

-- =============================================
-- PAQUETES
-- =============================================
CREATE TABLE IF NOT EXISTS paquetes (
    IDPaquete    INT AUTO_INCREMENT PRIMARY KEY,
    NombrePaquete VARCHAR(30)  NOT NULL,
    ImagenPaquete TEXT,
    Descripcion   TEXT         NOT NULL,
    IDHabitacion  INT          NOT NULL,
    IDServicio    INT          NOT NULL,
    Precio        FLOAT,
    Estado        TINYINT(1)   NOT NULL DEFAULT 1,
    FOREIGN KEY (IDHabitacion) REFERENCES habitacion(IDHabitacion),
    FOREIGN KEY (IDServicio)   REFERENCES servicio(IDServicio)
);

-- =============================================
-- ESTADOS DE RESERVA
-- =============================================
CREATE TABLE IF NOT EXISTS estadosreserva (
    IdEstadoReserva     INT AUTO_INCREMENT PRIMARY KEY,
    NombreEstadoReserva VARCHAR(30)
);

-- =============================================
-- MÉTODOS DE PAGO
-- =============================================
CREATE TABLE IF NOT EXISTS metodopago (
    IdMetodoPago  INT AUTO_INCREMENT PRIMARY KEY,
    NomMetodoPago VARCHAR(30)
);

-- =============================================
-- RESERVAS
-- (incluye columnas de migración 20260513)
-- =============================================
CREATE TABLE IF NOT EXISTS reserva (
    IdReserva            INT AUTO_INCREMENT PRIMARY KEY,
    NroDocumentoCliente  VARCHAR(50),
    IDHabitacion         INT,
    FechaReserva         DATETIME,
    FechaInicio          DATE,
    FechaFinalizacion    DATE,
    TipoDocumentoCliente VARCHAR(10),
    ContactoCliente      VARCHAR(50)  DEFAULT NULL,
    EmailCliente         VARCHAR(100) DEFAULT NULL,
    PaisCliente          VARCHAR(100) DEFAULT NULL,
    Sub_Total            FLOAT,
    Descuento            FLOAT        DEFAULT 0,
    IVA                  FLOAT        DEFAULT 0,
    Monto_Total          FLOAT,
    MetodoPago           INT,
    IdEstadoReserva      INT,
    id_usuario           INT,
    FOREIGN KEY (NroDocumentoCliente) REFERENCES cliente(NroDocumento),
    FOREIGN KEY (IDHabitacion)        REFERENCES habitacion(IDHabitacion),
    FOREIGN KEY (MetodoPago)          REFERENCES metodopago(IdMetodoPago),
    FOREIGN KEY (IdEstadoReserva)     REFERENCES estadosreserva(IdEstadoReserva),
    FOREIGN KEY (id_usuario)          REFERENCES usuarios(IDUsuario)
);

-- =============================================
-- DETALLE RESERVA — PAQUETES
-- =============================================
CREATE TABLE IF NOT EXISTS detallereservapaquetes (
    IDDetalleReservaPaquetes INT AUTO_INCREMENT PRIMARY KEY,
    IDReserva                INT,
    IDPaquete                INT,
    Cantidad                 INT,
    Precio                   FLOAT,
    Estado                   TINYINT(1) DEFAULT 1,
    FOREIGN KEY (IDReserva) REFERENCES reserva(IdReserva),
    FOREIGN KEY (IDPaquete) REFERENCES paquetes(IDPaquete)
);

-- =============================================
-- DETALLE RESERVA — SERVICIOS
-- =============================================
CREATE TABLE IF NOT EXISTS detallereservaservicio (
    IDDetalleReservaServicio INT AUTO_INCREMENT PRIMARY KEY,
    IDReserva                INT,
    IDServicio               INT,
    Cantidad                 INT,
    Precio                   FLOAT,
    Estado                   TINYINT(1) DEFAULT 1,
    FOREIGN KEY (IDReserva)  REFERENCES reserva(IdReserva),
    FOREIGN KEY (IDServicio) REFERENCES servicio(IDServicio)
);
