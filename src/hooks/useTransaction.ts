// src/hooks/useTransaction.ts
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Transaction, TransactionFormData } from '../types';

export const useTransaction = (filterType: string, getAuthHeader: () => HeadersInit) => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'pengeluaran', amount: '', category: '', description: '', transaction_date: new Date().toISOString().split('T')[0]
  });

  // --- QUERIES ---
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['transactions', filterType], 
    queryFn: async () => { 
      const res = await fetch(`/api/transactions?filter=${filterType}`, { headers: getAuthHeader() }); 
      const json = await res.json(); 
      return json.data; 
    }
  });

  // --- MUTATIONS ---
  const submitTransaction = useMutation({
    mutationFn: async (payload: { id: number | null, data: Omit<Transaction, 'id'> }) => {
      const isEdit = payload.id !== null;
      const res = await fetch(isEdit ? `/api/transactions/${payload.id}` : '/api/transactions', { 
        method: isEdit ? 'PUT' : 'POST', 
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, 
        body: JSON.stringify(payload.data) 
      });
      return await res.json();
    },
    onSuccess: () => {
      setFormData({ type: 'pengeluaran', amount: '', category: '', description: '', transaction_date: new Date().toISOString().split('T')[0] });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['summary'] }); 
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: number) => { 
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE', headers: getAuthHeader() }); 
      return await res.json(); 
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['summary'] }); 
      queryClient.invalidateQueries({ queryKey: ['transactions'] }); 
    }
  });

  return {
    transactions,
    isLoadingTransactions,
    submitTransaction,
    deleteTransaction,
    formData,
    setFormData,
    editingId,
    setEditingId
  };
};