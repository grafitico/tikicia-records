# Instrucciones del proyecto — Tikicia Records

## Flujo de trabajo preferido por el usuario

Cuando se pida un cambio en el sitio, aplicarlo de punta a punta sin pausar a
pedir confirmación entre pasos: implementar el cambio, probarlo, hacer commit,
push, crear el pull request y **fusionarlo (merge) a `main`** en la misma
tarea — todo en cadena. No detenerse a preguntar "¿quieres que lo fusione?"
salvo que el usuario indique lo contrario para ese pedido puntual, o que haya
conflictos, fallos de CI, o algo ambiguo que realmente requiera su decisión.
