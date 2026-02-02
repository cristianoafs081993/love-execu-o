# Plano: Correção da Importação CSV de Atividades ✅ CONCLUÍDO

## Alterações Implementadas

1. ✅ **Encoding UTF-8** - `CsvImportDialog.tsx` agora lê arquivos com `readAsText(file, 'UTF-8')`
2. ✅ **Normalização de cabeçalhos** - Headers são normalizados (sem acentos, minúsculas, sem espaços)
3. ✅ **Mapeamento CSV corrigido** - `Atividades.tsx` usa chaves normalizadas
4. ✅ **Descrição removida da tabela** - Apenas o nome da atividade é exibido
5. ✅ **Dimensões e origens dinâmicas** - `Empenhos.tsx` agora usa valores das atividades cadastradas
