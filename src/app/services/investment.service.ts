import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, deleteDoc, doc, query, where, orderBy, Timestamp, getDocs, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Transaction, MonthlyRate, Investor } from '../models';

@Injectable({ providedIn: 'root' })
export class InvestmentService {
  constructor(private fs: Firestore) { }

  investorsCol() { return collection(this.fs, 'investors'); }
  investorDoc(id: string) { return doc(this.fs, 'investors', id); }

  async addInvestor(name: string) {
    const ref = doc(this.investorsCol()); // auto id
    await setDoc(ref, { name });
    return ref.id;
  }

  listInvestors(): Observable<Investor[]> {
    return collectionData(this.investorsCol(), { idField: 'id' }) as Observable<Investor[]>;
  }

  transactionsCol(investorId: string) { return collection(this.fs, `investors/${investorId}/transactions`); }

  addTransaction(tx: Omit<Transaction, 'id'>) {
    return addDoc(this.transactionsCol(tx.investorId), tx);
  }

  listTransactions(investorId: string): Observable<Transaction[]> {
    const q = query(this.transactionsCol(investorId), orderBy('date', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Transaction[]>;
  }

  async deleteTransaction(investorId: string, id: string) {
    const d = doc(this.fs, `investors/${investorId}/transactions/${id}`);
    await deleteDoc(d);
  }

  ratesCol() { return collection(this.fs, 'monthlyRates'); } // doc id 'YYYY-MM'
  setMonthlyRate(rate: MonthlyRate) {
    const d = doc(this.fs, 'monthlyRates', rate.monthKey);
    return setDoc(d, { monthKey: rate.monthKey, rate: rate.rate });
  }
  listRates(): Observable<MonthlyRate[]> {
    return collectionData(this.ratesCol(), { idField: 'id' }) as Observable<MonthlyRate[]>;
  }

  // Helper to format month key
  toMonthKey(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  }

  // Compute monthly balances for an investor on the client
  async computeBalances(investorId: string, investorName: string, startMonthKey?: string, endMonthKey?: string) {
    // fetch transactions
    const txSnap = await getDocs(query(this.transactionsCol(investorId), orderBy('date', 'asc')));
    const txs = txSnap.docs.map(d => d.data() as any as Transaction);

    // fetch rates
    const ratesSnap = await getDocs(this.ratesCol());
    const rates: Record<string, number> = {};
    ratesSnap.forEach(d => {
      const rd = d.data() as any as MonthlyRate;
      rates[rd.monthKey] = rd.rate ?? 0;
    });

    if (txs.length === 0) return [] as any[];

    const firstDate = new Date((txs[0].date as any).toDate?.() ?? txs[0].date);
    const start = startMonthKey ? new Date(startMonthKey + '-01') : new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    const today = new Date();
    const end = endMonthKey ? new Date(endMonthKey + '-01') : new Date(today.getFullYear(), today.getMonth(), 1);

    const months: string[] = [];
    let cursor = new Date(start);
    while (cursor <= end) {
      const key = this.toMonthKey(cursor);
      months.push(key);
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    // group transactions by monthKey
    const txByMonth: Record<string, Transaction[]> = {};
    for (const tx of txs) {
      const d = (tx.date as any).toDate ? (tx.date as any).toDate() : new Date(tx.date);
      const key = this.toMonthKey(d);
      (txByMonth[key] = txByMonth[key] || []).push(tx);
    }

    let balance = 0;
    const rows: any[] = [];
    for (const mk of months) {
      const monthTxs = txByMonth[mk] || [];
      let delta = 0;
      for (const t of monthTxs) {
        delta += t.type === 'invest' ? t.amount : -t.amount;
      }
      balance = (balance + delta) * (1 + (rates[mk] ?? 0));
      rows.push({ investorId, investorName, monthKey: mk, rate: rates[mk] ?? 0, delta, balance: Math.round(balance * 100) / 100 });
    }
    return rows;
  }

  listTransactionsByInvestor(investorId: string): Observable<Transaction[]> {
    return this.listTransactions(investorId);
  }

}
