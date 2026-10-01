ALTER TABLE carritos MODIFY estado ENUM('activo','fusionado','convertido','confirmado','actualizado') NOT NULL DEFAULT 'activo';
