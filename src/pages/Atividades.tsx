import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Atividade, DIMENSOES, NATUREZAS_DESPESA } from '@/types';
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const initialFormState = {
  dimensao: '',
  processo: '',
  atividade: '',
  descricao: '',
  valorTotal: 0,
  origemRecurso: '',
  naturezaDespesa: '',
  planoInterno: '',
};

export default function Atividades() {
  const { atividades, addAtividade, updateAtividade, deleteAtividade } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDimensao, setFilterDimensao] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAtividade, setSelectedAtividade] = useState<Atividade | null>(null);
  const [formData, setFormData] = useState(initialFormState);

  const filteredAtividades = atividades.filter((a) => {
    const matchesSearch =
      a.atividade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.origemRecurso.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDimensao = filterDimensao === 'all' || a.dimensao.includes(filterDimensao);
    return matchesSearch && matchesDimensao;
  });

  const handleOpenDialog = (atividade?: Atividade) => {
    if (atividade) {
      setSelectedAtividade(atividade);
      setFormData({
        dimensao: atividade.dimensao,
        processo: atividade.processo,
        atividade: atividade.atividade,
        descricao: atividade.descricao,
        valorTotal: atividade.valorTotal,
        origemRecurso: atividade.origemRecurso,
        naturezaDespesa: atividade.naturezaDespesa,
        planoInterno: atividade.planoInterno,
      });
    } else {
      setSelectedAtividade(null);
      setFormData(initialFormState);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (selectedAtividade) {
      updateAtividade(selectedAtividade.id, formData);
    } else {
      addAtividade(formData);
    }
    setIsDialogOpen(false);
    setFormData(initialFormState);
  };

  const handleDelete = () => {
    if (selectedAtividade) {
      deleteAtividade(selectedAtividade.id);
      setIsDeleteDialogOpen(false);
      setSelectedAtividade(null);
    }
  };

  const openDeleteDialog = (atividade: Atividade) => {
    setSelectedAtividade(atividade);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Atividades</h2>
          <p className="text-muted-foreground">Gerencie o planejamento orçamentário</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Atividade
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar atividades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterDimensao} onValueChange={setFilterDimensao}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar dimensão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as dimensões</SelectItem>
                {DIMENSOES.map((d) => (
                  <SelectItem key={d.codigo} value={d.codigo}>
                    {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredAtividades.length} atividade{filteredAtividades.length !== 1 ? 's' : ''} encontrada{filteredAtividades.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Atividade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Dimensão</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Origem de Recurso</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAtividades.map((atividade) => (
                  <tr key={atividade.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-sm">{atividade.atividade}</p>
                        <p className="text-xs text-muted-foreground mt-1">{atividade.descricao}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="secondary" className="whitespace-nowrap">
                        {atividade.dimensao.split(' - ')[0]}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">{atividade.origemRecurso}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-medium">{formatCurrency(atividade.valorTotal)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(atividade)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(atividade)}
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
              {selectedAtividade ? 'Editar Atividade' : 'Nova Atividade'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dimensao">Dimensão</Label>
              <Select
                value={formData.dimensao}
                onValueChange={(v) => setFormData({ ...formData, dimensao: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a dimensão" />
                </SelectTrigger>
                <SelectContent>
                  {DIMENSOES.map((d) => (
                    <SelectItem key={d.codigo} value={d.nome}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="processo">Processo</Label>
              <Input
                id="processo"
                value={formData.processo}
                onChange={(e) => setFormData({ ...formData, processo: e.target.value })}
                placeholder="Ex: 3 - Secretariado Executivo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="atividade">Atividade</Label>
              <Input
                id="atividade"
                value={formData.atividade}
                onChange={(e) => setFormData({ ...formData, atividade: e.target.value })}
                placeholder="Nome da atividade"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição detalhada da atividade"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="valorTotal">Valor Total (R$)</Label>
                <Input
                  id="valorTotal"
                  type="number"
                  value={formData.valorTotal}
                  onChange={(e) => setFormData({ ...formData, valorTotal: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="origemRecurso">Origem de Recurso</Label>
                <Input
                  id="origemRecurso"
                  value={formData.origemRecurso}
                  onChange={(e) => setFormData({ ...formData, origemRecurso: e.target.value })}
                  placeholder="Ex: GO.20RL.231796.3"
                />
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
            <div className="grid gap-2">
              <Label htmlFor="planoInterno">Plano Interno</Label>
              <Input
                id="planoInterno"
                value={formData.planoInterno}
                onChange={(e) => setFormData({ ...formData, planoInterno: e.target.value })}
                placeholder="Ex: L20RLP99GON"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {selectedAtividade ? 'Salvar' : 'Criar'}
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
              Tem certeza que deseja excluir a atividade "{selectedAtividade?.atividade}"? 
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
    </div>
  );
}
