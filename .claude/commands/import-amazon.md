# Importar pedidos de Amazon (EUR)

Carga el reporte de pedidos de Amazon Seller Central al CRM. Cada pedido nuevo crea (o reutiliza) un contacto y un deal en la etapa ganada, en EUR.

## Requisitos

- El CRM corriendo en `http://localhost:3000` (`npm run dev`)
- El reporte de pedidos en CSV (Seller Central → Pedidos → Descargar informe de pedidos)
- Al menos una etapa marcada como ganada en el pipeline

## Proceso

### Paso 1: Pedir el archivo

Pide al usuario la ruta del CSV. No lo envíes a ningún servicio externo: se procesa en local.

### Paso 2: Revisar antes de cargar

Cuenta filas y columnas para confirmar que es el reporte de pedidos:
```bash
head -n 1 "RUTA_DEL_CSV"
wc -l "RUTA_DEL_CSV"
```
Las columnas que se usan son `amazon-order-id`, `purchase-date`, `buyer-name`, `buyer-email`, `product-name`, `item-price`, `currency` y `order-status`. Si faltan, avisa al usuario.

### Paso 3: Cargar

```bash
curl -s -X POST -H "Content-Type: text/csv" --data-binary @"RUTA_DEL_CSV" http://localhost:3000/api/import/amazon | python3 -m json.tool
```

La respuesta trae:
- `contactsCreated`: contactos nuevos
- `dealsCreated`: pedidos importados como deals
- `duplicates`: pedidos que ya estaban en el CRM (no se vuelven a importar)
- `skipped`: pedidos omitidos, con motivo (cancelados, moneda distinta de EUR, precio no válido)

### Paso 4: Resumir al usuario

Dile cuántos pedidos entraron, cuántos ya estaban y cuántos se omitieron, con los motivos. Si hay omitidos por moneda, dilo explícitamente.

## Notas

- `item-price` se toma como total de la línea (precio × cantidad). Confírmalo con un reporte real la primera vez.
- Los emails de compradores de Amazon suelen ser de reenvío. Si un comprador aparece con dos emails, quedan como dos contactos.
