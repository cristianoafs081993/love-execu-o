
# Plano: Correção do Parser CSV para Campos com Vírgulas

## Problema Identificado

A função `parseCSVLine` atual não trata corretamente o caso de **aspas escapadas** (`""`). No padrão CSV (RFC 4180), quando um campo contém vírgulas, ele é envolvido em aspas duplas. E quando há aspas dentro do campo, elas são representadas como duas aspas seguidas.

**Exemplo problemático:**
```csv
"Texto com, vírgula","Outro campo"
```

A implementação atual funciona para casos simples, mas falha quando há:
- Aspas duplas escapadas dentro de campos (`""`)
- Combinação de aspas e vírgulas

## Solução

### Arquivo: `src/components/CsvImportDialog.tsx`

Atualizar a função `parseCSVLine` para tratar aspas escapadas corretamente:

```typescript
const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Handle escaped quotes ("") within a quoted field
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle the inQuotes flag
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === ';') && !inQuotes) {
      // If a comma/semicolon is encountered outside quotes, it's a delimiter
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  // Add the last value
  values.push(current.trim());
  return values;
};
```

## Mudança Principal

| Antes | Depois |
|-------|--------|
| Aspas simplesmente alternavam o estado `inQuotes` | Verifica se há duas aspas seguidas (`""`) e as trata como uma aspa literal escapada |

## Resultado Esperado

- Campos com vírgulas envolvidos em aspas (`"Texto com, vírgula"`) serão parseados corretamente
- Campos com aspas escapadas (`"Texto com ""aspas""") serão parseados corretamente
- As colunas serão mapeadas adequadamente independente do conteúdo do texto
