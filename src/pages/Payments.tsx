import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, AppData, Transaction, Player } from '../lib/api';
import { motion } from 'motion/react';
import { Save, CheckCircle2, XCircle, MessageCircle, Wallet, TrendingUp, TrendingDown, Plus, Trash2, FileText } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Payments() {
  const { role } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [payments, setPayments] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'mensalidades' | 'fluxo'>('mensalidades');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTx, setNewTx] = useState<Partial<Transaction>>({ type: 'income', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    if (role !== 'Diretoria') {
      window.location.href = '/';
      return;
    }
    loadData();
  }, [role]);

  const loadData = async () => {
    try {
      const res = await api.getData();
      setData(res);
      setPayments(res.monthly_payments[year] || {});
      setTransactions(res.transactions || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data) {
      setPayments(data.monthly_payments[year] || {});
    }
  }, [year, data]);

  const handleToggle = (playerId: string, month: string) => {
    setPayments(prev => {
      const playerPayments = prev[playerId] || {};
      const currentStatus = playerPayments[month] || 'Atrasada';
      const newStatus = currentStatus === 'Paga' ? 'Atrasada' : 'Paga';
      
      return {
        ...prev,
        [playerId]: {
          ...playerPayments,
          [month]: newStatus
        }
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.savePayments(year, payments);
      alert('Mensalidades salvas com sucesso!');
      loadData();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar mensalidades');
    } finally {
      setSaving(false);
    }
  };

  const handleCobrar = (player: Player, monthName: string) => {
    const message = `Fala ${player.name}, a mensalidade de ${monthName} está pendente! Fortalece o São Jorge aí! 👊`;
    const phone = player.phone ? player.phone.replace(/\D/g, '') : '';
    if (phone) {
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleSaveTx = async () => {
    if (!newTx.description || !newTx.amount || !newTx.category) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    
    const tx: Transaction = {
      id: newTx.id || crypto.randomUUID(),
      date: newTx.date || new Date().toISOString().split('T')[0],
      description: newTx.description,
      type: newTx.type as 'income' | 'expense',
      category: newTx.category,
      amount: Number(newTx.amount)
    };

    try {
      await api.saveTransaction(tx);
      setShowTxModal(false);
      setNewTx({ type: 'income', date: new Date().toISOString().split('T')[0] });
      loadData();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar transação');
    }
  };

  const handleDeleteTx = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta transação?')) return;
    try {
      await api.deleteTransaction(id);
      loadData();
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir transação');
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    const filteredTx = transactions.filter(tx => {
      const txDate = new Date(tx.date).getTime();
      const start = new Date(reportStartDate).getTime();
      const end = new Date(reportEndDate).getTime();
      return txDate >= start && txDate <= end;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalInc = filteredTx.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExp = filteredTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const bal = totalInc - totalExp;

    doc.setFontSize(18);
    doc.text('Relatório de Fluxo de Caixa - São Jorge FC', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Período: ${new Date(reportStartDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a ${new Date(reportEndDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'})}`, 14, 30);

    doc.text(`Entradas: R$ ${totalInc.toFixed(2)}`, 14, 40);
    doc.text(`Saídas: R$ ${totalExp.toFixed(2)}`, 14, 46);
    doc.text(`Saldo do Período: R$ ${bal.toFixed(2)}`, 14, 52);

    const tableData = filteredTx.map(tx => [
      new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
      tx.description,
      tx.category,
      tx.type === 'income' ? 'Entrada' : 'Saída',
      `R$ ${tx.amount.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 60;

    let sigY = finalY + 40;
    if (sigY + 80 > doc.internal.pageSize.height) {
      doc.addPage();
      sigY = 40;
    }
    
    doc.line(60, sigY, 150, sigY);
    doc.text('Diretoria', 105, sigY + 5, { align: 'center' });

    sigY += 30;
    doc.line(60, sigY, 150, sigY);
    doc.text('Jogador (Testemunha 1)', 105, sigY + 5, { align: 'center' });

    sigY += 30;
    doc.line(60, sigY, 150, sigY);
    doc.text('Jogador (Testemunha 2)', 105, sigY + 5, { align: 'center' });

    doc.save(`relatorio-caixa-${reportStartDate}-a-${reportEndDate}.pdf`);
    setShowReportModal(false);
  };

  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const years = Array.from({ length: 7 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Financeiro</h1>
        
        <div className="flex bg-zinc-900 rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('mensalidades')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'mensalidades' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Mensalidades
          </button>
          <button 
            onClick={() => setActiveTab('fluxo')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'fluxo' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Fluxo de Caixa
          </button>
        </div>
      </div>

      {activeTab === 'mensalidades' && (
        <div className="space-y-4">
          <div className="flex justify-end items-center gap-4">
            <select 
              value={year}
              onChange={e => setYear(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors"
            >
              <Save size={20} />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4 font-medium sticky left-0 bg-zinc-950 z-10">Jogador</th>
                    {months.map(m => (
                      <th key={m} className="px-4 py-4 font-medium text-center">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {data.players.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-6 py-8 text-center text-zinc-500">
                        Nenhum jogador cadastrado.
                      </td>
                    </tr>
                  ) : (
                    data.players.map(player => (
                      <tr key={player.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-white sticky left-0 bg-zinc-900 z-10 border-r border-zinc-800">
                          {player.name}
                        </td>
                        {months.map((m, i) => {
                          const monthKey = (i + 1).toString();
                          const status = payments[player.id]?.[monthKey] || 'Atrasada';
                          const isPaid = status === 'Paga';
                          
                          return (
                            <td key={m} className="px-2 py-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleToggle(player.id, monthKey)}
                                  className={`p-1.5 rounded-full transition-colors ${
                                    isPaid ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-zinc-600 hover:bg-zinc-800'
                                  }`}
                                >
                                  {isPaid ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                </button>
                                {!isPaid && (
                                  <button
                                    onClick={() => handleCobrar(player, m)}
                                    className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-full transition-colors"
                                    title="Cobrar via WhatsApp"
                                  >
                                    <MessageCircle size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fluxo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
              <div className="flex items-center gap-3 text-emerald-500 mb-2">
                <TrendingUp size={24} />
                <h3 className="font-medium text-zinc-400">Entradas</h3>
              </div>
              <p className="text-3xl font-bold text-white">R$ {totalIncome.toFixed(2)}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
              <div className="flex items-center gap-3 text-red-500 mb-2">
                <TrendingDown size={24} />
                <h3 className="font-medium text-zinc-400">Saídas</h3>
              </div>
              <p className="text-3xl font-bold text-white">R$ {totalExpense.toFixed(2)}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
              <div className="flex items-center gap-3 text-indigo-500 mb-2">
                <Wallet size={24} />
                <h3 className="font-medium text-zinc-400">Saldo Atual</h3>
              </div>
              <p className={`text-3xl font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                R$ {balance.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Histórico de Transações</h2>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FileText size={20} />
                Gerar Relatório PDF
              </button>
              <button 
                onClick={() => setShowTxModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={20} />
                Nova Transação
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Data</th>
                  <th className="px-6 py-4 font-medium">Descrição</th>
                  <th className="px-6 py-4 font-medium">Categoria</th>
                  <th className="px-6 py-4 font-medium text-right">Valor</th>
                  <th className="px-6 py-4 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                      Nenhuma transação registrada.
                    </td>
                  </tr>
                ) : (
                  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                    <tr key={tx.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 text-zinc-300">
                        {new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </td>
                      <td className="px-6 py-4 text-white font-medium">{tx.description}</td>
                      <td className="px-6 py-4 text-zinc-400">{tx.category}</td>
                      <td className={`px-6 py-4 text-right font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleDeleteTx(tx.id)}
                          className="text-zinc-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showTxModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold mb-6">Nova Transação</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Tipo</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      value="income" 
                      checked={newTx.type === 'income'}
                      onChange={e => setNewTx({...newTx, type: e.target.value as 'income'})}
                      className="text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-emerald-500 font-medium">Entrada</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      value="expense" 
                      checked={newTx.type === 'expense'}
                      onChange={e => setNewTx({...newTx, type: e.target.value as 'expense'})}
                      className="text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-red-500 font-medium">Saída</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Data</label>
                <input 
                  type="date" 
                  value={newTx.date}
                  onChange={e => setNewTx({...newTx, date: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Descrição</label>
                <input 
                  type="text" 
                  value={newTx.description || ''}
                  onChange={e => setNewTx({...newTx, description: e.target.value})}
                  placeholder="Ex: Compra de bolas"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Categoria</label>
                <select 
                  value={newTx.category || ''}
                  onChange={e => setNewTx({...newTx, category: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Selecione...</option>
                  {newTx.type === 'income' ? (
                    <>
                      <option value="Mensalidade">Mensalidade</option>
                      <option value="Patrocínio">Patrocínio</option>
                      <option value="Rifa">Rifa</option>
                      <option value="Outros">Outros</option>
                    </>
                  ) : (
                    <>
                      <option value="Juiz">Pagamento de Juiz</option>
                      <option value="Campo">Aluguel do Campo</option>
                      <option value="Lavagem">Lavagem de Uniforme</option>
                      <option value="Bolas">Compra de Bolas</option>
                      <option value="Outros">Outros</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={newTx.amount || ''}
                  onChange={e => setNewTx({...newTx, amount: parseFloat(e.target.value)})}
                  placeholder="0.00"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowTxModal(false)}
                className="flex-1 py-3 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveTx}
                className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors text-white"
              >
                Salvar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold mb-6">Gerar Relatório PDF</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Data Inicial</label>
                <input 
                  type="date" 
                  value={reportStartDate}
                  onChange={e => setReportStartDate(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Data Final</label>
                <input 
                  type="date" 
                  value={reportEndDate}
                  onChange={e => setReportEndDate(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-3 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={generatePDF}
                className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors text-white"
              >
                Gerar PDF
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
