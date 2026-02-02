
# Plano: Correção da Importação CSV de Atividades

## Problemas Identificados

1. **Caracteres acentuados não exibidos corretamente** - O arquivo CSV não está sendo lido com encoding UTF-8
2. **Coluna "Origem de Recurso" mostrando dados errados** - O mapeamento das colunas do CSV está incorreto
3. **Descrição aparecendo na tabela** - A descrição deve ser removida da exibição
4. **Dimensões e origens de recurso não ficam disponíveis para empenhos** - O sistema usa apenas dimensões fixas

## Alterações Propostas

### 1. Corrigir encoding UTF-8 na leitura do CSV
**Arquivo:** `src/components/CsvImportDialog.tsx`

Alterar a função `readAsText` para especificar encoding UTF-8:
```typescript
reader.readAsText(selectedFile, 'UTF-8');
```

### 2. Melhorar normalização dos cabeçalhos CSV
**Arquivo:** `src/components/CsvImportDialog.tsx`

Adicionar função para normalizar cabeçalhos removendo acentos e espaços extras:
```typescript
function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
}
```

### 3. Corrigir mapeamento de colunas na importação de Atividades
**Arquivo:** `src/pages/Atividades.tsx`

Melhorar a função `handleCsvImport` para mapear corretamente as colunas com nomes alternativos mais robustos e normalização de chaves.

### 4. Remover descrição da tabela de Atividades
**Arquivo:** `src/pages/Atividades.tsx`

Na renderização da tabela, remover a linha que exibe `{atividade.descricao}` abaixo do nome da atividade.

### 5. Disponibilizar dimensões e origens dinâmicas para Empenhos
**Arquivo:** `src/pages/Empenhos.tsx`

Modificar os selects de "Dimensão" e "Origem de Recurso" para incluir valores únicos extraídos das atividades cadastradas, além das dimensões fixas:

```typescript
// Dimensões dinâmicas: fixas + das atividades
const dimensoesDisponiveis = useMemo(() => {
  const dimensoesAtividades = [...new Set(atividades.map(a => a.dimensao))];
  const dimensoesFixas = DIMENSOES.map(d => d.nome);
  return [...new Set([...dimensoesFixas, ...dimensoesAtividades])];
}, [atividades]);
```

## Resumo das Alterações por Arquivo

| Arquivo | Alterações |
|---------|------------|
| `CsvImportDialog.tsx` | Adicionar encoding UTF-8 e normalização de headers |
| `Atividades.tsx` | Corrigir mapeamento CSV e remover descrição da tabela |
| `Empenhos.tsx` | Usar dimensões e origens dinâmicas das atividades |

## Resultado Esperado

- Caracteres acentuados (ç, ã, é, etc.) serão exibidos corretamente
- Coluna "Origem de Recurso" mostrará apenas o código correto (ex: AD.20RL.231796.3)
- Tabela mostrará apenas o nome da atividade (sem descrição)
- Novas dimensões e origens importadas estarão disponíveis nos dropdowns de empenhos
