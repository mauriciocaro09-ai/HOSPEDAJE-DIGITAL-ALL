-- Migration: add ContactoCliente, EmailCliente, PaisCliente to reserva
ALTER TABLE reserva 
  ADD COLUMN ContactoCliente VARCHAR(50) DEFAULT NULL,
  ADD COLUMN EmailCliente VARCHAR(100) DEFAULT NULL,
  ADD COLUMN PaisCliente VARCHAR(100) DEFAULT NULL;

SELECT 'Migración 20260513_add_contact_email_pais_reserva aplicada' AS resultado;
