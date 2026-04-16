#!/bin/bash

TARGET_DIR=${1:-.}
MODULES_SEEN=0

# Trova tutti i file ignorando le cartelle di build e i file non testuali
find "$TARGET_DIR" -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/.svelte-kit/*" \
  -not -name "favicon.svg" \
  -not -name "*.ico" \
  -not -name "*.css" \
  -not -name "fork.ts" \
  -not -name "join.ts" \
  -not -name "hyperparameter.ts" \
  -not -name "*.png" | sort | while read -r file; do

  # Controlla se il file si trova dentro la cartella Modules
  if [[ "$file" == *"/Modules/"* ]]; then
    # Se abbiamo già visto 2 moduli, salta questo file
    if [ "$MODULES_SEEN" -ge 0 ]; then
      continue
    fi
    # Altrimenti incrementa il contatore
    MODULES_SEEN=$((MODULES_SEEN + 1))
  fi

  echo "File: $file"

  # Stampa il contenuto del file
  cat "$file"

  echo ""
done
