'use client';

import { use, useState, useRef } from 'react';
import { notFound } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import BackButton from '@/components/BackButton';
import { useTrips } from '@/context/TripsContext';
import { useLang } from '@/context/LanguageContext';

export default function PaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTrip, loading, addPayment, removePayment } = useTrips();
  const { t } = useLang();
  const trip = getTrip(id);

  // All hooks before early returns
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [paidById, setPaidById] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Early returns after all hooks
  if (loading) return (
    <MobileShell>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      </div>
    </MobileShell>
  );
  if (!trip) notFound();

  const total = trip.payments.reduce((sum, p) => sum + p.cost, 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);
  };

  const resetForm = () => {
    setName(''); setDescription(''); setCost(''); setPaidById('');
    setSelectedFile(null); setFileName(''); setSaveError('');
    setShowForm(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cost) return;
    setSaving(true);
    setSaveError('');
    try {
      const payer = trip.participants.find((p) => p.id === paidById);
      await addPayment(id, {
        name: name.trim(),
        description: description.trim() || undefined,
        cost: parseFloat(cost),
        paidById: payer?.id,
        paidByName: payer?.name,
      }, selectedFile ?? undefined);
      resetForm();
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileShell>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-2 pb-3 flex-shrink-0">
        <BackButton href={`/trips/${id}`} />
        <h1 className="text-xl font-semibold text-gray-900 flex-1">{t('payments')}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="w-9 h-9 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100"
          aria-label="Add payment"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">

        {/* Total banner */}
        {trip.payments.length > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-green-700">{t('total')}</span>
            <span className="text-lg font-bold text-green-800">
              {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleAdd} className="bg-blue-50 rounded-2xl p-4 mb-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-blue-900">{t('addPayment')}</p>

            {saveError && (
              <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{saveError}</p>
            )}

            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={t('paymentName')}
              required
              className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />

            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={t('paymentDescription')}
              rows={2}
              className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white resize-none"
            />

            <input
              type="number" value={cost} onChange={(e) => setCost(e.target.value)}
              placeholder={t('cost')}
              min="0" step="0.01" required
              className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />

            {trip.participants.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('paidBy')}</label>
                <select
                  value={paidById} onChange={(e) => setPaidById(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                >
                  <option value="">{t('unassigned')}</option>
                  {trip.participants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* File attachment */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('attachment')}</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-blue-300 px-3 py-2.5 text-sm text-blue-500 bg-white hover:bg-blue-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"/>
                </svg>
                <span className="truncate">{fileName || 'Choose file…'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
              />
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-60">
                {saving ? '…' : t('add')}
              </button>
              <button type="button" onClick={resetForm}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
                {t('cancel')}
              </button>
            </div>
          </form>
        )}

        {/* Empty state */}
        {trip.payments.length === 0 && !showForm && (
          <div className="flex flex-col items-center py-16 gap-3">
            <span className="text-5xl">💳</span>
            <p className="text-gray-400 text-sm text-center">{t('noPayments')}<br/>{t('addFirstPayment')}</p>
          </div>
        )}

        {/* Payment list */}
        <div className="flex flex-col gap-3">
          {trip.payments.map((pm) => (
            <div key={pm.id} className="bg-white rounded-2xl border border-gray-100 p-4 group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">💳</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{pm.name}</p>
                    <span className="text-sm font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full flex-shrink-0">
                      {pm.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {pm.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{pm.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {pm.paidByName && (
                      <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        👤 {pm.paidByName}
                      </span>
                    )}
                    {pm.attachmentUrl && (
                      <a
                        href={pm.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32"/>
                        </svg>
                        {t('viewAttachment')}
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removePayment(id, pm.id)}
                  className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  aria-label="Delete payment"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
