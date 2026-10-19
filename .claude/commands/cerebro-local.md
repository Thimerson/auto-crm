---
description: Responde preguntas cruzando datos del CRM local (SQLite) en modo solo-lectura
argument-hint: [pregunta sobre clientes, deals o actividades]
allowed-tools: Read, Bash
---

# Cerebro local del CRM

Responde la pregunta del usuario consultando la base local `data/crm.db`, en una sola pasada. Todo se queda en la máquina: no uses servicios externos ni conectores en vivo.

## Reglas

- Solo lecturas. Usa `sqlite3 -readonly`. Nada de INSERT, UPDATE, DELETE, DROP ni ALTER.
- Si un dato no está en la base, dilo. No lo inventes ni lo busques fuera.
- No envíes datos a ningún servicio externo.

## Proceso

### Paso 1: Inventario

Revisa las tablas disponibles y sus columnas:
```bash
sqlite3 -readonly data/crm.db ".tables"
sqlite3 -readonly data/crm.db ".schema contacts" ".schema deals" ".schema activities" ".schema pipeline_stages"
```

Tablas clave:
- `contacts`: clientes (name, email, phone, company, source, temperature, score, notes, created_at)
- `deals`: oportunidades (title, value en céntimos, stage_id, contact_id, probability, notes, created_at)
- `activities`: interacciones (type, description, contact_id, deal_id, scheduled_at, completed_at)
- `pipeline_stages`: etapas (name, order, is_won, is_lost)

### Paso 2: Plan antes de consultar

Antes de correr consultas, dile al usuario qué tablas vas a cruzar y enseña el SQL. Espera su visto bueno si la pregunta es ambigua.

### Paso 3: Consultar

Corre solo SELECT, por ejemplo:
```bash
sqlite3 -readonly -header -column data/crm.db "SELECT c.name, c.company, d.title, d.value / 100.0 AS valor_eur FROM deals d JOIN contacts c ON c.id = d.contact_id ORDER BY d.value DESC LIMIT 10;"
```

Los valores están en céntimos. Conviértelos a euros al mostrarlos.

### Paso 4: Responder

- Tabla ordenada por prioridad o por valor.
- Una línea de qué no se puede responder con la base local.
- Si hay datos viejos (fechas antiguas), dilo explícitamente.
