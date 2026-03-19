import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, AppData, Transaction, Player } from '../lib/api';
import { motion } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';
import { MessageCircle, Plus, FileText } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

// Componentes Modulares
import { FinancialSummary } from '../components/payments/FinancialSummary';
import { TransactionModal } from '../components/payments/TransactionModal';
import { ReportModal } from '../components/payments/ReportModal';
import { PaymentTable } from '../components/payments/PaymentTable';
import { CashFlow } from '../components/payments/CashFlow';

export function Payments() {
  const { role, canAccess } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [payments, setPayments] = useState<Record<string, Record<string, string>>>({});
  
  const [activeTab, setActiveTab] = useState<'mensalidades' | 'fluxo'>('mensalidades');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTx, setNewTx] = useState<any>({ type: 'income', date: new Date().toISOString().split('T')[0], amount: '' });

  useEffect(() => {
    if (!canAccess('payments')) {
      window.location.href = '/';
      return;
    }
    loadData();
  }, [role, canAccess]);

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

  const handleToggle = async (player: Player, monthKey: string, monthName: string) => {
    const currentStatus = payments[player.id]?.[monthKey] || 'Atrasada';
    const isPaid = currentStatus === 'Paga';
    const newStatus = isPaid ? 'Atrasada' : 'Paga';
    
    if (newStatus === 'Paga') {
      const fullMonthNames: Record<string, string> = {
        "Jan": "Janeiro", "Fev": "Fevereiro", "Mar": "Março", "Abr": "Abril",
        "Mai": "Maio", "Jun": "Junho", "Jul": "Julho", "Ago": "Agosto",
        "Set": "Setembro", "Out": "Outubro", "Nov": "Novembro", "Dez": "Dezembro"
      };
      const fullMonth = fullMonthNames[monthName] || monthName;
      
      const amountStr = window.prompt(`Qual o valor da mensalidade de ${player.name} para ${fullMonth}?`, "35");
      if (amountStr === null) return;
      
      const amount = parseFloat(amountStr.replace(',', '.')) || 35;
      
      const tx: Transaction = {
        id: uuidv4(),
        date: new Date().toISOString().split('T')[0],
        description: `${player.name} - MENSALIDADE ${fullMonth.toUpperCase()}`,
        type: 'income',
        category: 'Mensalidade',
        amount: amount
      };
      
      try {
        const loadingToast = toast.loading('Salvando pagamento...');
        await api.saveSinglePayment(year, player.id, monthKey, newStatus);
        await api.saveTransaction(tx);
        toast.dismiss(loadingToast);
        toast.success('Pagamento registrado!');
        loadData();
      } catch (error) {
        console.error(error);
        toast.error('Erro ao salvar pagamento');
      }
    } else {
      try {
        await api.saveSinglePayment(year, player.id, monthKey, newStatus);
        toast.success('Status atualizado');
        loadData();
      } catch (error) {
        console.error(error);
        toast.error('Erro ao atualizar status');
      }
    }
  };

  const handleCobrar = (player: Player, monthName: string) => {
    const fullMonthNames: Record<string, string> = {
      "Jan": "Janeiro", "Fev": "Fevereiro", "Mar": "Março", "Abr": "Abril",
      "Mai": "Maio", "Jun": "Junho", "Jul": "Julho", "Ago": "Agosto",
      "Set": "Setembro", "Out": "Outubro", "Nov": "Novembro", "Dez": "Dezembro"
    };
    const fullMonth = fullMonthNames[monthName] || monthName;
    const message = `Fala ${player.name}, a mensalidade de ${fullMonth} está pendente! Fortalece o São Jorge aí! 👊`;
    const phone = player.phone ? player.phone.replace(/\D/g, '') : '';
    if (phone) {
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleSaveTx = async () => {
    const amountValue = typeof newTx.amount === 'string' 
      ? parseFloat(newTx.amount.replace(',', '.')) 
      : newTx.amount;

    if (!newTx.description || isNaN(amountValue) || !newTx.category) {
      toast.error('Preencha todos os campos corretamente');
      return;
    }
    
    const tx: Transaction = {
      id: newTx.id || uuidv4(),
      date: newTx.date || new Date().toISOString().split('T')[0],
      description: newTx.description.toUpperCase(),
      type: newTx.type as 'income' | 'expense',
      category: newTx.category,
      amount: amountValue
    };

    try {
      const loadingToast = toast.loading('Salvando transação...');
      await api.saveTransaction(tx);
      toast.dismiss(loadingToast);
      toast.success('Transação salva!');
      setShowTxModal(false);
      setNewTx({ type: 'income', date: new Date().toISOString().split('T')[0], amount: '' });
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar transação');
    }
  };

  const handleDeleteTx = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta transação?')) return;
    try {
      await api.deleteTransaction(id);
      toast.success('Transação excluída');
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir transação');
    }
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    
    const filteredTx = transactions.filter(tx => {
      const txDate = new Date(tx.date).getTime();
      const start = new Date(reportStartDate).getTime();
      const end = new Date(reportEndDate).getTime();
      return txDate >= start && txDate <= end;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalInc = filteredTx.filter(t => t.type === 'income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const totalExp = filteredTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const bal = totalInc - totalExp;

    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      const base64 = await new Promise<string>((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            reject(new Error('Canvas context null'));
          }
        };
        img.onerror = reject;
        img.src = 'https://raw.githubusercontent.com/gabrielxrm-lab/S-O-JORGE-FUTEBOL/main/logo_sao_jorge.png';
      });
      doc.addImage(base64, 'PNG', 165, 10, 30, 30);
    } catch (error) {
      console.error('Erro ao carregar logo para o PDF:', error);
    }

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
      `R$ ${(Number(tx.amount) || 0).toFixed(2)}`
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

  const totalIncome = transactions.reduce((acc, t) => t.type === 'income' ? acc + (Number(t.amount) || 0) : acc, 0);
  const totalExpense = transactions.reduce((acc, t) => t.type === 'expense' ? acc + (Number(t.amount) || 0) : acc, 0);
  const balance = totalIncome - totalExpense;

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!data) return null;

  const playersForPayments = data.players.filter(p => p.position !== 'GOLEIRO');

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
          <div className="flex justify-between items-center gap-4">
            <button 
              onClick={() => {
                const pendingPlayers = playersForPayments.filter(p => {
                  const currentMonth = new Date().getMonth() + 1;
                  return payments[p.id]?.[currentMonth.toString()] !== 'Paga';
                });
                
                if (pendingPlayers.length === 0) {
                  alert('Todos os jogadores estão em dia com a mensalidade do mês atual!');
                  return;
                }

                const currentMonthName = months[new Date().getMonth()];
                const fullMonthNames: Record<string, string> = {
                  "Jan": "Janeiro", "Fev": "Fevereiro", "Mar": "Março", "Abr": "Abril",
                  "Mai": "Maio", "Jun": "Junho", "Jul": "Julho", "Ago": "Agosto",
                  "Set": "Setembro", "Out": "Outubro", "Nov": "Novembro", "Dez": "Dezembro"
                };
                const fullMonth = fullMonthNames[currentMonthName] || currentMonthName;

                const message = `Fala galera! A mensalidade de ${fullMonth} está pendente para alguns jogadores. Fortalece o São Jorge aí! 👊`;
                
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <MessageCircle size={20} />
              <span className="hidden sm:inline">Cobrar Todos (Mês Atual)</span>
            </button>

            <div className="flex items-center gap-4">
              <select 
                value={year}
                onChange={e => setYear(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <PaymentTable 
            players={playersForPayments}
            months={months}
            payments={payments}
            onToggle={handleToggle}
            onCobrar={handleCobrar}
          />
        </div>
      )}

      {activeTab === 'fluxo' && (
        <div className="space-y-6">
          <FinancialSummary 
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
          />

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

          <CashFlow 
            transactions={transactions}
            onDelete={handleDeleteTx}
          />
        </div>
      )}

      <TransactionModal 
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        onSave={handleSaveTx}
        newTx={newTx}
        setNewTx={setNewTx}
      />

      <ReportModal 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onGenerate={generatePDF}
        startDate={reportStartDate}
        setStartDate={setReportStartDate}
        endDate={reportEndDate}
        setEndDate={setReportEndDate}
      />
    </motion.div>
  );
}