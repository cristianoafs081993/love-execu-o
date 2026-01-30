export interface Atividade {
  id: string;
  dimensao: string;
  processo: string;
  atividade: string;
  descricao: string;
  valorTotal: number;
  origemRecurso: string;
  naturezaDespesa: string;
  planoInterno: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Empenho {
  id: string;
  numero: string;
  descricao: string;
  valor: number;
  dimensao: string;
  origemRecurso: string;
  naturezaDespesa: string;
  dataEmpenho: Date;
  status: 'pendente' | 'liquidado' | 'pago' | 'cancelado';
  atividadeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumoOrcamentario {
  dimensao: string;
  origemRecurso: string;
  valorPlanejado: number;
  valorEmpenhado: number;
  saldoDisponivel: number;
  percentualExecutado: number;
}

export type Dimensao = {
  codigo: string;
  nome: string;
};

export const DIMENSOES: Dimensao[] = [
  { codigo: 'GO', nome: 'GO - Governança' },
  { codigo: 'EN', nome: 'EN - Ensino' },
  { codigo: 'PE', nome: 'PE - Pesquisa' },
  { codigo: 'EX', nome: 'EX - Extensão' },
  { codigo: 'AD', nome: 'AD - Administração' },
];

export const NATUREZAS_DESPESA = [
  '339014 - Diárias - Civil',
  '339033 - Passagens e Despesas com Locomoção',
  '339039 - Outros Serviços de Terceiros - Pessoa Jurídica',
  '339030 - Material de Consumo',
  '339036 - Outros Serviços de Terceiros - Pessoa Física',
  '449052 - Equipamentos e Material Permanente',
  '339000 - Não Especificado',
];
