import { useState, useMemo, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, Filter, Calendar, Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Empenho, DIMENSOES, NATUREZAS_DESPESA } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { JsonImportDialog } from '@/components/JsonImportDialog';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const statusColors: Record<string, string> = {
  pendente: 'bg-warning/20 text-warning border-warning/30',
  liquidado: 'bg-info/20 text-info border-info/30',
  pago: 'bg-accent/20 text-accent border-accent/30',
  cancelado: 'bg-destructive/20 text-destructive border-destructive/30',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  liquidado: 'Liquidado',
  pago: 'Pago',
  cancelado: 'Cancelado',
};

const initialFormState: {
  numero: string;
  descricao: string;
  valor: number;
  dimensao: string;
  componenteFuncional: string;
  origemRecurso: string;
  naturezaDespesa: string;
  dataEmpenho: Date;
  status: 'pendente' | 'liquidado' | 'pago' | 'cancelado';
  atividadeId: string;
} = {
  numero: '',
  descricao: '',
  valor: 0,
  dimensao: '',
  componenteFuncional: '',
  origemRecurso: '',
  naturezaDespesa: '',
  dataEmpenho: new Date(),
  status: 'pendente',
  atividadeId: '',
};

export default function Empenhos() {
  const { empenhos, atividades, addEmpenho, updateEmpenho, deleteEmpenho } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDimensao, setFilterDimensao] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isUpdatingSaldos, setIsUpdatingSaldos] = useState(false);
  const saldosInputRef = useRef<HTMLInputElement>(null);
  const [selectedEmpenho, setSelectedEmpenho] = useState<Empenho | null>(null);
  const [formData, setFormData] = useState(initialFormState);

  const filteredEmpenhos = empenhos.filter((e) => {
    const matchesSearch =
      e.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
    const matchesDimensao = filterDimensao === 'all' || e.dimensao.includes(filterDimensao);
    return matchesSearch && matchesStatus && matchesDimensao;
  });

  const handleOpenDialog = (empenho?: Empenho) => {
    if (empenho) {
      setSelectedEmpenho(empenho);
      setFormData({
        numero: empenho.numero,
        descricao: empenho.descricao,
        valor: empenho.valor,
        dimensao: empenho.dimensao,
        componenteFuncional: empenho.componenteFuncional,
        origemRecurso: empenho.origemRecurso,
        naturezaDespesa: empenho.naturezaDespesa,
        dataEmpenho: empenho.dataEmpenho,
        status: empenho.status,
        atividadeId: empenho.atividadeId || '',
      });
    } else {
      setSelectedEmpenho(null);
      setFormData(initialFormState);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (selectedEmpenho) {
      updateEmpenho(selectedEmpenho.id, formData);
    } else {
      addEmpenho(formData);
    }
    setIsDialogOpen(false);
    setFormData(initialFormState);
  };

  const handleDelete = () => {
    if (selectedEmpenho) {
      deleteEmpenho(selectedEmpenho.id);
      setIsDeleteDialogOpen(false);
      setSelectedEmpenho(null);
    }
  };

  const openDeleteDialog = (empenho: Empenho) => {
    setSelectedEmpenho(empenho);
    setIsDeleteDialogOpen(true);
  };

  const handleJsonImport = (data: Record<string, string>[]) => {
    let importCount = 0;
    data.forEach((row) => {
      const parseDate = (dateStr: string): Date => {
        if (!dateStr) return new Date();
        const parts = dateStr.split(/[\/\-]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          }
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return new Date(dateStr);
      };

      const parseValor = (value: string): number => {
        if (!value || value === '0') return 0;
        const cleaned = value.replace(/R\$\s*/gi, '').replace(/\s/g, '').trim();
        if (cleaned.includes(',') && cleaned.includes('.')) {
          const lastComma = cleaned.lastIndexOf(',');
          const lastDot = cleaned.lastIndexOf('.');
          if (lastComma > lastDot) {
            return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
          }
          return parseFloat(cleaned.replace(/,/g, '')) || 0;
        }
        if (cleaned.includes(',')) {
          return parseFloat(cleaned.replace(',', '.')) || 0;
        }
        return parseFloat(cleaned) || 0;
      };

      const empenho = {
        numero: row['numero'] || '',
        descricao: row['descricao'] || '',
        valor: parseValor(row['valor'] || '0'),
        dimensao: row['dimensao'] || '',
        componenteFuncional: row['componentefuncional'] || row['componente'] || '',
        origemRecurso: row['origemrecurso'] || row['origem'] || '',
        naturezaDespesa: row['naturezadespesa'] || row['natureza'] || '',
        dataEmpenho: parseDate(row['dataempenho'] || row['data'] || ''),
        status: (row['status'] || 'pendente') as 'pendente' | 'liquidado' | 'pago' | 'cancelado',
        atividadeId: row['atividadeid'] || '',
      };
      if (empenho.numero && empenho.dimensao) {
        addEmpenho(empenho);
        importCount++;
      }
    });
    toast.success(`${importCount} empenho(s) importado(s) com sucesso!`);
  };

  const empenhosJsonFields = [
    'numero', 'descricao', 'valor', 'dimensao', 'componentefuncional', 'origemrecurso', 'naturezadespesa', 'dataempenho', 'status'
  ];

  // Função para importar saldos de planilha Excel
  const handleImportSaldos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUpdatingSaldos(true);

    try {
      // Import dinâmico do xlsx para evitar carregar a biblioteca na inicialização
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      let updatedCount = 0;
      let notFoundCount = 0;

      jsonData.forEach((row) => {
        // Procurar a coluna de empenho (case-insensitive)
        const empenhoKey = Object.keys(row).find(k =>
          k.toLowerCase().includes('empenho') || k.toLowerCase() === 'numero'
        );
        // Procurar a coluna de movimento/valor (case-insensitive)
        const movimentoKey = Object.keys(row).find(k =>
          k.toLowerCase().includes('movimento') || k.toLowerCase().includes('liquidado')
        );

        if (!empenhoKey || !movimentoKey) return;

        const numeroEmpenho = String(row[empenhoKey]).trim();
        const valorMovimento = typeof row[movimentoKey] === 'number'
          ? row[movimentoKey] as number
          : parseFloat(String(row[movimentoKey]).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

        // Encontrar o empenho correspondente
        const empenho = empenhos.find(e =>
          e.numero === numeroEmpenho ||
          e.numero.includes(numeroEmpenho) ||
          numeroEmpenho.includes(e.numero)
        );

        if (empenho) {
          // Acumular o valor no valorLiquidado existente
          const novoValorLiquidado = (empenho.valorLiquidado || 0) + valorMovimento;
          updateEmpenho(empenho.id, {
            valorLiquidado: novoValorLiquidado,
            status: novoValorLiquidado > 0 ? 'liquidado' : 'pendente',
          });
          updatedCount++;
        } else {
          notFoundCount++;
          console.warn(`Empenho não encontrado: ${numeroEmpenho}`);
        }
      });

      if (updatedCount > 0) {
        toast.success(`${updatedCount} saldo(s) atualizado(s) com sucesso!`);
      }
      if (notFoundCount > 0) {
        toast.warning(`${notFoundCount} empenho(s) da planilha não encontrado(s) no sistema`);
      }
      if (updatedCount === 0 && notFoundCount === 0) {
        toast.error('Nenhum dado válido encontrado na planilha. Verifique as colunas "Empenho" e "Movimento".');
      }
    } catch (error) {
      console.error('Erro ao importar planilha:', error);
      toast.error('Erro ao ler a planilha. Verifique o formato do arquivo.');
    } finally {
      setIsUpdatingSaldos(false);
      // Limpar o input para permitir reimportação do mesmo arquivo
      if (saldosInputRef.current) {
        saldosInputRef.current.value = '';
      }
    }
  };

  // Dynamic dimensions: fixed + from activities
  const dimensoesDisponiveis = useMemo(() => {
    const dimensoesAtividades = [...new Set(atividades.map(a => a.dimensao).filter(Boolean))];
    const dimensoesFixas = DIMENSOES.map(d => d.nome);
    return [...new Set([...dimensoesFixas, ...dimensoesAtividades])];
  }, [atividades]);

  // Dynamic origins: from activities filtered by selected dimension
  const origensDisponiveis = useMemo(() => {
    return [...new Set(
      atividades
        .filter(a => !formData.dimensao || a.dimensao === formData.dimensao)
        .map(a => a.origemRecurso)
        .filter(Boolean)
    )];
  }, [atividades, formData.dimensao]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Empenhos</h2>
          <p className="text-muted-foreground">Gerencie a execução orçamentária</p>
        </div>
        <div className="flex gap-2">
          {/* Input oculto para importar planilha de saldos */}
          <input
            type="file"
            ref={saldosInputRef}
            onChange={handleImportSaldos}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => saldosInputRef.current?.click()}
            className="gap-2"
            disabled={isUpdatingSaldos}
          >
            {isUpdatingSaldos ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4" />
                Atualizar Saldos
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Importar JSON
          </Button>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Empenho
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empenhos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterDimensao} onValueChange={setFilterDimensao}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Dimensão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas dimensões</SelectItem>
                {DIMENSOES.map((d) => (
                  <SelectItem key={d.codigo} value={d.codigo}>
                    {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="liquidado">Liquidado</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredEmpenhos.length} empenho{filteredEmpenhos.length !== 1 ? 's' : ''} encontrado{filteredEmpenhos.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Número</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Descrição</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Origem</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Dimensão</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Componente</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Empenhado</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Liquidado</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Saldo</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmpenhos.map((empenho) => (
                  <tr key={empenho.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm font-medium">{empenho.numero}</span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm">{empenho.descricao}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-muted-foreground">{empenho.origemRecurso}</p>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="secondary" className="whitespace-nowrap">
                        {empenho.dimensao.split(' - ')[0]}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm">{empenho.componenteFuncional}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-medium">{formatCurrency(empenho.valor)}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`font-medium ${(empenho.valorLiquidado || 0) > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                        {formatCurrency(empenho.valorLiquidado || 0)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {(() => {
                        const saldo = empenho.valor - (empenho.valorLiquidado || 0);
                        return (
                          <span className={`font-medium ${saldo > 0 ? 'text-green-600' : saldo < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {formatCurrency(saldo)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(empenho)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(empenho)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEmpenho ? 'Editar Empenho' : 'Novo Empenho'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="numero">Número do Empenho</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="Ex: 2024NE000123"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dataEmpenho">Data do Empenho</Label>
                <Input
                  id="dataEmpenho"
                  type="date"
                  value={format(new Date(formData.dataEmpenho), 'yyyy-MM-dd')}
                  onChange={(e) => setFormData({ ...formData, dataEmpenho: new Date(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do empenho"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dimensao">Dimensão</Label>
                <Select
                  value={formData.dimensao}
                  onValueChange={(v) => setFormData({ ...formData, dimensao: v, origemRecurso: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a dimensão" />
                  </SelectTrigger>
                  <SelectContent>
                    {dimensoesDisponiveis.map((dimensao) => (
                      <SelectItem key={dimensao} value={dimensao}>
                        {dimensao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="componenteFuncional">Componente Funcional</Label>
                <Input
                  id="componenteFuncional"
                  value={formData.componenteFuncional}
                  onChange={(e) => setFormData({ ...formData, componenteFuncional: e.target.value })}
                  placeholder="Ex: Gestão Administrativa"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="origemRecurso">Origem de Recurso</Label>
                <Select
                  value={formData.origemRecurso}
                  onValueChange={(v) => setFormData({ ...formData, origemRecurso: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {origensDisponiveis.map((origem) => (
                      <SelectItem key={origem} value={origem}>
                        {origem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="liquidado">Liquidado</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="naturezaDespesa">Natureza de Despesa</Label>
              <Select
                value={formData.naturezaDespesa}
                onValueChange={(v) => setFormData({ ...formData, naturezaDespesa: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a natureza de despesa" />
                </SelectTrigger>
                <SelectContent>
                  {NATUREZAS_DESPESA.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {selectedEmpenho ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o empenho "{selectedEmpenho?.numero}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* JSON Import Dialog */}
      <JsonImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleJsonImport}
        title="Importar Empenhos"
        expectedFields={empenhosJsonFields}
      />
    </div>
  );
}
