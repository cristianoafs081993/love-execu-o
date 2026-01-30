import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Atividade, Empenho, ResumoOrcamentario } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface DataContextType {
  atividades: Atividade[];
  empenhos: Empenho[];
  addAtividade: (atividade: Omit<Atividade, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAtividade: (id: string, atividade: Partial<Atividade>) => void;
  deleteAtividade: (id: string) => void;
  addEmpenho: (empenho: Omit<Empenho, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEmpenho: (id: string, empenho: Partial<Empenho>) => void;
  deleteEmpenho: (id: string) => void;
  getResumoOrcamentario: () => ResumoOrcamentario[];
  getTotalPlanejado: () => number;
  getTotalEmpenhado: () => number;
  getSaldoTotal: () => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial sample data
const initialAtividades: Atividade[] = [
  {
    id: '1',
    dimensao: 'GO - Governança',
    processo: '3 - Secretariado Executivo',
    atividade: 'Contratação de serviços postais',
    descricao: 'Contratação de serviços postais',
    valorTotal: 1000,
    origemRecurso: 'GO.20RL.231796.3',
    naturezaDespesa: '339039 - Outros Serviços de Terceiros - Pessoa Jurídica',
    planoInterno: 'L20RLP99GON',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    dimensao: 'GO - Governança',
    processo: '5 - Gestão de Diárias e Passagens',
    atividade: 'Diárias para eventos institucionais',
    descricao: 'Diárias para eventos institucionais',
    valorTotal: 25000,
    origemRecurso: 'GO.20RL.231796.3',
    naturezaDespesa: '339014 - Diárias - Civil',
    planoInterno: 'L20RLP99GON',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    dimensao: 'EN - Ensino',
    processo: 'Política de Ensino',
    atividade: 'Reuniões e atividades de integração',
    descricao: 'Realizar reuniões e atividades de integração, articulação e formação continuada',
    valorTotal: 7095,
    origemRecurso: 'EN.21B3.231798.3',
    naturezaDespesa: '339014 - Diárias - Civil',
    planoInterno: 'L21B3P19ENN',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    dimensao: 'PE - Pesquisa',
    processo: 'Fomento à Pesquisa',
    atividade: 'Bolsas de Iniciação Científica',
    descricao: 'Pagamento de bolsas para alunos de iniciação científica',
    valorTotal: 50000,
    origemRecurso: 'PE.20RL.231796.3',
    naturezaDespesa: '339018 - Auxílio Financeiro a Estudantes',
    planoInterno: 'L20RLP99PEN',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const initialEmpenhos: Empenho[] = [
  {
    id: '1',
    numero: '2024NE000123',
    descricao: 'Empenho para serviços postais',
    valor: 500,
    dimensao: 'GO - Governança',
    origemRecurso: 'GO.20RL.231796.3',
    naturezaDespesa: '339039 - Outros Serviços de Terceiros - Pessoa Jurídica',
    dataEmpenho: new Date('2024-03-15'),
    status: 'liquidado',
    atividadeId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    numero: '2024NE000124',
    descricao: 'Empenho para diárias - Reunião CONIF',
    valor: 5000,
    dimensao: 'GO - Governança',
    origemRecurso: 'GO.20RL.231796.3',
    naturezaDespesa: '339014 - Diárias - Civil',
    dataEmpenho: new Date('2024-04-10'),
    status: 'pago',
    atividadeId: '2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    numero: '2024NE000125',
    descricao: 'Empenho para integração docente',
    valor: 2500,
    dimensao: 'EN - Ensino',
    origemRecurso: 'EN.21B3.231798.3',
    naturezaDespesa: '339014 - Diárias - Civil',
    dataEmpenho: new Date('2024-05-20'),
    status: 'pendente',
    atividadeId: '3',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [atividades, setAtividades] = useState<Atividade[]>(initialAtividades);
  const [empenhos, setEmpenhos] = useState<Empenho[]>(initialEmpenhos);

  const addAtividade = useCallback((atividade: Omit<Atividade, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAtividade: Atividade = {
      ...atividade,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAtividades((prev) => [...prev, newAtividade]);
  }, []);

  const updateAtividade = useCallback((id: string, updates: Partial<Atividade>) => {
    setAtividades((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a))
    );
  }, []);

  const deleteAtividade = useCallback((id: string) => {
    setAtividades((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addEmpenho = useCallback((empenho: Omit<Empenho, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEmpenho: Empenho = {
      ...empenho,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setEmpenhos((prev) => [...prev, newEmpenho]);
  }, []);

  const updateEmpenho = useCallback((id: string, updates: Partial<Empenho>) => {
    setEmpenhos((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e))
    );
  }, []);

  const deleteEmpenho = useCallback((id: string) => {
    setEmpenhos((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getResumoOrcamentario = useCallback((): ResumoOrcamentario[] => {
    const resumoMap = new Map<string, ResumoOrcamentario>();

    // Agrupa atividades por dimensão e origem de recurso
    atividades.forEach((a) => {
      const key = `${a.dimensao}|${a.origemRecurso}`;
      const existing = resumoMap.get(key);
      if (existing) {
        existing.valorPlanejado += a.valorTotal;
      } else {
        resumoMap.set(key, {
          dimensao: a.dimensao,
          origemRecurso: a.origemRecurso,
          valorPlanejado: a.valorTotal,
          valorEmpenhado: 0,
          saldoDisponivel: 0,
          percentualExecutado: 0,
        });
      }
    });

    // Soma empenhos por dimensão e origem de recurso
    empenhos.forEach((e) => {
      if (e.status !== 'cancelado') {
        const key = `${e.dimensao}|${e.origemRecurso}`;
        const existing = resumoMap.get(key);
        if (existing) {
          existing.valorEmpenhado += e.valor;
        }
      }
    });

    // Calcula saldo e percentual
    resumoMap.forEach((resumo) => {
      resumo.saldoDisponivel = resumo.valorPlanejado - resumo.valorEmpenhado;
      resumo.percentualExecutado =
        resumo.valorPlanejado > 0
          ? (resumo.valorEmpenhado / resumo.valorPlanejado) * 100
          : 0;
    });

    return Array.from(resumoMap.values());
  }, [atividades, empenhos]);

  const getTotalPlanejado = useCallback(() => {
    return atividades.reduce((sum, a) => sum + a.valorTotal, 0);
  }, [atividades]);

  const getTotalEmpenhado = useCallback(() => {
    return empenhos
      .filter((e) => e.status !== 'cancelado')
      .reduce((sum, e) => sum + e.valor, 0);
  }, [empenhos]);

  const getSaldoTotal = useCallback(() => {
    return getTotalPlanejado() - getTotalEmpenhado();
  }, [getTotalPlanejado, getTotalEmpenhado]);

  const value = useMemo(
    () => ({
      atividades,
      empenhos,
      addAtividade,
      updateAtividade,
      deleteAtividade,
      addEmpenho,
      updateEmpenho,
      deleteEmpenho,
      getResumoOrcamentario,
      getTotalPlanejado,
      getTotalEmpenhado,
      getSaldoTotal,
    }),
    [
      atividades,
      empenhos,
      addAtividade,
      updateAtividade,
      deleteAtividade,
      addEmpenho,
      updateEmpenho,
      deleteEmpenho,
      getResumoOrcamentario,
      getTotalPlanejado,
      getTotalEmpenhado,
      getSaldoTotal,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
