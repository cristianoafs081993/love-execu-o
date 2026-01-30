import { useMemo } from 'react';
import { 
  Wallet, 
  Receipt, 
  TrendingUp, 
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const COLORS = ['#1e5bb0', '#2a8f5c', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const { 
    atividades, 
    empenhos, 
    getResumoOrcamentario, 
    getTotalPlanejado, 
    getTotalEmpenhado, 
    getSaldoTotal 
  } = useData();

  const totalPlanejado = getTotalPlanejado();
  const totalEmpenhado = getTotalEmpenhado();
  const saldoTotal = getSaldoTotal();
  const percentualExecutado = totalPlanejado > 0 ? (totalEmpenhado / totalPlanejado) * 100 : 0;

  const resumos = useMemo(() => getResumoOrcamentario(), [getResumoOrcamentario]);

  const dadosPorDimensao = useMemo(() => {
    const map = new Map<string, { planejado: number; empenhado: number }>();
    
    atividades.forEach((a) => {
      const existing = map.get(a.dimensao) || { planejado: 0, empenhado: 0 };
      existing.planejado += a.valorTotal;
      map.set(a.dimensao, existing);
    });

    empenhos.filter(e => e.status !== 'cancelado').forEach((e) => {
      const existing = map.get(e.dimensao) || { planejado: 0, empenhado: 0 };
      existing.empenhado += e.valor;
      map.set(e.dimensao, existing);
    });

    return Array.from(map.entries()).map(([name, values]) => ({
      name: name.split(' - ')[0],
      fullName: name,
      planejado: values.planejado,
      empenhado: values.empenhado,
      saldo: values.planejado - values.empenhado,
    }));
  }, [atividades, empenhos]);

  const statusEmpenhos = useMemo(() => {
    const counts = { pendente: 0, liquidado: 0, pago: 0, cancelado: 0 };
    empenhos.forEach((e) => {
      counts[e.status]++;
    });
    return [
      { name: 'Pendente', value: counts.pendente, color: '#f59e0b' },
      { name: 'Liquidado', value: counts.liquidado, color: '#3b82f6' },
      { name: 'Pago', value: counts.pago, color: '#22c55e' },
      { name: 'Cancelado', value: counts.cancelado, color: '#ef4444' },
    ].filter(s => s.value > 0);
  }, [empenhos]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Planejado"
          value={formatCurrency(totalPlanejado)}
          subtitle={`${atividades.length} atividades`}
          icon={Wallet}
          variant="primary"
        />
        <StatCard
          title="Total Empenhado"
          value={formatCurrency(totalEmpenhado)}
          subtitle={`${empenhos.filter(e => e.status !== 'cancelado').length} empenhos ativos`}
          icon={Receipt}
          variant="accent"
        />
        <StatCard
          title="Saldo Disponível"
          value={formatCurrency(saldoTotal)}
          subtitle={saldoTotal >= 0 ? 'Dentro do orçamento' : 'Orçamento excedido'}
          icon={saldoTotal >= 0 ? PiggyBank : ArrowDownRight}
          variant={saldoTotal >= 0 ? 'default' : 'warning'}
        />
        <StatCard
          title="Execução"
          value={`${percentualExecutado.toFixed(1)}%`}
          subtitle="do orçamento executado"
          icon={TrendingUp}
        />
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Progresso da Execução Orçamentária</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {formatCurrency(totalEmpenhado)} de {formatCurrency(totalPlanejado)}
              </span>
              <span className="font-medium text-primary">{percentualExecutado.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(percentualExecutado, 100)} className="h-3" />
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Empenhado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted" />
                <span className="text-muted-foreground">Disponível</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart - Por Dimensão */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Orçamento por Dimensão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorDimensao} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="planejado" fill="hsl(var(--primary))" name="Planejado" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="empenhado" fill="hsl(var(--accent))" name="Empenhado" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Status dos Empenhos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Status dos Empenhos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusEmpenhos}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusEmpenhos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo por Dimensão e Origem */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Resumo por Dimensão e Origem de Recurso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Dimensão</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Origem de Recurso</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Planejado</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Empenhado</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Saldo</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Execução</th>
                </tr>
              </thead>
              <tbody>
                {resumos.map((resumo, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium">{resumo.dimensao}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{resumo.origemRecurso}</td>
                    <td className="py-3 px-4 text-sm text-right">{formatCurrency(resumo.valorPlanejado)}</td>
                    <td className="py-3 px-4 text-sm text-right">{formatCurrency(resumo.valorEmpenhado)}</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium ${resumo.saldoDisponivel >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {formatCurrency(resumo.saldoDisponivel)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={Math.min(resumo.percentualExecutado, 100)} className="w-16 h-2" />
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {resumo.percentualExecutado.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
