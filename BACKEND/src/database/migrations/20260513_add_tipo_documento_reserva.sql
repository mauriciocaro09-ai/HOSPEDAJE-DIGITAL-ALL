-- Migration: add TipoDocumentoCliente to reserva table
ALTER TABLE reserva
ADD COLUMN TipoDocumentoCliente VARCHAR(10) DEFAULT NULL;
