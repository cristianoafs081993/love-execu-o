import { useMemo } from 'react';
import {
  Wallet,
  Receipt,
  TrendingUp,
  PiggyBank,
  ArrowDownRight,
  Target
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  AreaChart,
  Area,
  Line
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Dashboard() {
  const {
    atividades,
    empenhos,
    getTotalPlanejado,
    getTotalEmpenhado,
    getSaldoTotal
  } = useData();

  const totalPlanejado = getTotalPlanejado();
  const totalEmpenhado = getTotalEmpenhado();
  const saldoTotal = getSaldoTotal();
  const percentualExecutado = totalPlanejado > 0 ? (totalEmpenhado / totalPlanejado) * 100 : 0;

  // Calcular total Liquidado e Pago para o Funil
  const totalLiquidado = empenhos.reduce((acc, e) => acc + (e.valorLiquidado || 0), 0);
  const totalPago = empenhos.filter(e => e.status === 'pago').reduce((acc, e) => acc + e.valor, 0);

  // --- Processamento de Dados ---

  // 1. Resumo por Origem de Recurso (tabela)
  const dadosPorOrigem = useMemo(() => {
    const map = new Map<string, { planejado: number; empenhado: number }>();

    atividades.forEach((a) => {
      const existing = map.get(a.origemRecurso) || { planejado: 0, empenhado: 0 };
      existing.planejado += a.valorTotal;
      map.set(a.origemRecurso, existing);
    });

    empenhos.forEach((e) => {
      if (e.status !== 'cancelado') {
        const existing = map.get(e.origemRecurso) || { planejado: 0, empenhado: 0 };
        existing.empenhado += e.valor;
        map.set(e.origemRecurso, existing);
      }
    });

    return Array.from(map.entries())
      .map(([origem, values]) => ({
        origem,
        planejado: values.planejado,
        empenhado: values.empenhado,
        saldo: values.planejado - values.empenhado,
        percentual: values.planejado > 0 ? (values.empenhado / values.planejado) * 100 : 0
      }))
      .sort((a, b) => b.planejado - a.planejado);
  }, [atividades, empenhos]);

  // 2. Top 5 Componentes Funcionais
  const dadosPorComponente = useMemo(() => {
    const map = new Map<string, { planejado: number; empenhado: number }>();
    const normalize = (s: string) => s?.trim() || 'Não Informado';

    atividades.forEach((a) => {
      const key = normalize(a.componenteFuncional);
      const existing = map.get(key) || { planejado: 0, empenhado: 0 };
      existing.planejado += a.valorTotal;
      map.set(key, existing);
    });

    empenhos.forEach((e) => {
      if (e.status !== 'cancelado') {
        const key = normalize(e.componenteFuncional);
        const existing = map.get(key) || { planejado: 0, empenhado: 0 };
        existing.empenhado += e.valor;
        map.set(key, existing);
      }
    });

    return Array.from(map.entries())
      .map(([name, values]) => ({
        name,
        planejado: values.planejado,
        empenhado: values.empenhado,
      }))
      .sort((a, b) => b.planejado - a.planejado)
      .slice(0, 5); // TOP 5
  }, [atividades, empenhos]);

  // 3. Execução por Natureza de Despesa (Treemap/Barra)
  const dadosPorNatureza = useMemo(() => {
    const map = new Map<string, number>();
    empenhos.forEach((e) => {
      if (e.status !== 'cancelado') {
        const nature = e.naturezaDespesa.split(' - ')[0];
        map.set(nature, (map.get(nature) || 0) + e.valor);
      }
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  }, [empenhos]);

  // 4. Evolução Mensal (Timeline)
  const dadosMensais = useMemo(() => {
    const mapAcumulado = new Map<string, number>();

    // Sort empenhos by date
    const sortedEmpenhos = [...empenhos]
      .filter(e => e.status !== 'cancelado')
      .sort((a, b) => new Date(a.dataEmpenho).getTime() - new Date(b.dataEmpenho).getTime());

    // Aggregate values by month
    sortedEmpenhos.forEach(e => {
      const mes = format(new Date(e.dataEmpenho), 'MMM/yy', { locale: ptBR });
      mapAcumulado.set(mes, (mapAcumulado.get(mes) || 0) + e.valor);
    });

    // Calculate accumulation
    let acc = 0;
    return Array.from(mapAcumulado.entries()).map(([mes, val]) => {
      acc += val;
      return {
        name: mes,
        empenhado: val,
        acumulado: acc
      }
    });
  }, [empenhos]);

  // 5. Funil 
  const dadosFunil = [
    { name: 'Planejado', value: totalPlanejado, fill: '#1e5bb0' },
    { name: 'Empenhado', value: totalEmpenhado, fill: '#f59e0b' },
    { name: 'Liquidado', value: totalLiquidado, fill: '#3b82f6' },
    { name: 'Pago', value: totalPago, fill: '#22c55e' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      {/* Header Stats - KPIs Principais */}
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
        {/* Restaurado: Execução % */}
        <StatCard
          title="Execução"
          value={`${percentualExecutado.toFixed(1)}%`}
          subtitle="do orçamento executado"
          icon={TrendingUp}
          variant="default"
        />
      </div>

      {/* Restaurado: Progresso da Execução (Card Largo) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Progresso da Execução Orçamentária</CardTitle>
          <CardDescription>Visão geral do consumo do orçamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {formatCurrency(totalEmpenhado)} de {formatCurrency(totalPlanejado)}
              </span>
              <span className="font-medium text-primary">{percentualExecutado.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(percentualExecutado, 100)} className="h-4" />
            <div className="flex gap-6 text-sm justify-center sm:justify-start">
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

      {/* Row 3: Evolução e Funil */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Evolução Mensal */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Evolução da Execução</CardTitle>
            <CardDescription>Acumulado de empenhos ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosMensais} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e5bb0" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1e5bb0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Area
                    type="monotone"
                    dataKey="acumulado"
                    stroke="#1e5bb0"
                    fillOpacity={1}
                    fill="url(#colorAcumulado)"
                    name="Acumulado"
                  />
                  <Line type="monotone" dataKey="empenhado" stroke="#f59e0b" name="Mensal" strokeDasharray="5 5" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Funil de Execução */}
        <Card>
          <CardHeader>
            <CardTitle>Funil de Execução</CardTitle>
            <CardDescription>Eficiência (Plan -&gt; Emp -&gt; Liq -&gt; Pago)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosFunil} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                    {dadosFunil.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Top Componentes Funcionais e Natureza */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Componentes Funcionais */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Componentes Funcionais</CardTitle>
            <CardDescription>Maiores orçamentos planejados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorComponente} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="planejado" fill="#1e5bb0" name="Planejado" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="empenhado" fill="#f59e0b" name="Empenhado" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Natureza de Despesa */}
        <Card>
          <CardHeader>
            <CardTitle>Top Naturezas de Despesa</CardTitle>
            <CardDescription>Maiores gastos por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorNatureza} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#2a8f5c" name="Valor Gasto" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Resumo Detalhado por Origem */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo por Origem de Recurso</CardTitle>
          <CardDescription>Detalhamento da execução por fonte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Origem de Recurso</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Planejado</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Empenhado</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Saldo</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Execução</th>
                </tr>
              </thead>
              <tbody>
                {dadosPorOrigem.map((item, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium">{item.origem}</td>
                    <td className="py-3 px-4 text-sm text-right">{formatCurrency(item.planejado)}</td>
                    <td className="py-3 px-4 text-sm text-right">{formatCurrency(item.empenhado)}</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium ${item.saldo >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {formatCurrency(item.saldo)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={Math.min(item.percentual, 100)} className="w-16 h-2" />
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {item.percentual.toFixed(0)}%
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
