'use client';

import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import BackButton from '@/components/BackButton';
import { useTrips } from '@/context/TripsContext';
import { useLang } from '@/context/LanguageContext';
import { Task } from '@/lib/types';

export default function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTrip, loading, addTask, updateTask, removeTask } = useTrips();
  const { t } = useLang();
  const trip = getTrip(id);

  // All hooks must be declared before any early returns (Rules of Hooks)
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (loading) return (
    <MobileShell>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      </div>
    </MobileShell>
  );
  if (!trip) notFound();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const assignee = trip.participants.find((p) => p.id === assigneeId);
    await addTask(id, {
      title: title.trim(),
      description: description.trim() || undefined,
      status: 'new',
      assigneeId: assignee?.id,
      assigneeName: assignee?.name,
    });
    setTitle(''); setDescription(''); setAssigneeId(''); setSaving(false); setShowForm(false);
  };

  const toggleStatus = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const next: Task['status'] = task.status === 'done' ? 'new' : 'done';
    await updateTask(id, task.id, { status: next });
    // Update selectedTask if it's open
    if (selectedTask?.id === task.id) {
      setSelectedTask({ ...selectedTask, status: next });
    }
  };

  const handleDelete = async (taskId: string) => {
    await removeTask(id, taskId);
    setSelectedTask(null);
  };

  const newTasks = trip.tasks.filter((t) => t.status === 'new');
  const doneTasks = trip.tasks.filter((t) => t.status === 'done');

  const TaskCard = ({ task }: { task: Task }) => (
    <button
      onClick={() => setSelectedTask(task)}
      className="bg-white rounded-2xl border border-gray-100 p-3.5 w-full text-left hover:border-gray-200 hover:shadow-sm transition-all active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        {/* Tap circle to toggle status — stopPropagation so it doesn't open the modal */}
        <button
          onClick={(e) => toggleStatus(task, e)}
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors ${
            task.status === 'done' ? 'bg-green-400 border-green-400' : 'border-gray-300 hover:border-blue-400'
          }`}
          aria-label="Toggle status"
        >
          {task.status === 'done' && (
            <svg className="w-full h-full p-0.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
          )}
          {task.assigneeName && (
            <span className="inline-block text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1.5">
              👤 {task.assigneeName}
            </span>
          )}
        </div>
        <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
        </svg>
      </div>
    </button>
  );

  return (
    <MobileShell>
      <div className="flex items-center gap-3 px-5 pt-2 pb-3 flex-shrink-0">
        <BackButton href={`/trips/${id}`} />
        <h1 className="text-xl font-semibold text-gray-900 flex-1">{t('tasks')}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="w-9 h-9 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100"
          aria-label="Add task"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {showForm && (
          <form onSubmit={handleAdd} className="bg-blue-50 rounded-2xl p-4 mb-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-blue-900">{t('addTask')}</p>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={t('taskName')} required autoFocus
              className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={t('taskDescription')} rows={2}
              className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white resize-none"
            />
            {trip.participants.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('assignee')}</label>
                <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
                  <option value="">{t('unassigned')}</option>
                  {trip.participants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-60">
                {saving ? '…' : t('add')}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
                {t('cancel')}
              </button>
            </div>
          </form>
        )}

        {trip.tasks.length === 0 && !showForm && (
          <div className="flex flex-col items-center py-16 gap-3">
            <span className="text-5xl">✅</span>
            <p className="text-gray-400 text-sm text-center">{t('noTasks')}<br/>{t('addFirstTask')}</p>
          </div>
        )}

        {newTasks.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {t('statusNew')}
              </span>
              <span className="text-[11px] text-gray-400">{newTasks.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {newTasks.map((task) => <TaskCard key={task.id} task={task} />)}
            </div>
          </div>
        )}

        {doneTasks.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                {t('statusDone')}
              </span>
              <span className="text-[11px] text-gray-400">{doneTasks.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {doneTasks.map((task) => <TaskCard key={task.id} task={task} />)}
            </div>
          </div>
        )}
      </div>

      {/* Task detail bottom sheet */}
      {selectedTask && (
        <div className="absolute inset-0 bg-black/50 flex items-end z-50" onClick={() => setSelectedTask(null)}>
          <div className="w-full bg-white rounded-t-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

            {/* Status + title */}
            <div className="flex items-start gap-3 mb-4">
              <button
                onClick={(e) => toggleStatus(selectedTask, e)}
                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors ${
                  selectedTask.status === 'done' ? 'bg-green-400 border-green-400' : 'border-gray-300'
                }`}
                aria-label="Toggle status"
              >
                {selectedTask.status === 'done' && (
                  <svg className="w-full h-full p-0.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-base font-semibold ${selectedTask.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {selectedTask.title}
                </p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${
                  selectedTask.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {selectedTask.status === 'done' ? t('statusDone') : t('statusNew')}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-3">
              {selectedTask.description && (
                <div className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-lg">📝</span>
                  <p className="text-sm text-gray-700">{selectedTask.description}</p>
                </div>
              )}
              {selectedTask.assigneeName && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-lg">👤</span>
                  <div>
                    <p className="text-xs text-gray-400">{t('assignee')}</p>
                    <p className="text-sm font-medium text-gray-800">{selectedTask.assigneeName}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => handleDelete(selectedTask.id)}
                className="flex-1 py-3 rounded-2xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50"
              >
                {t('delete')}
              </button>
              <button
                onClick={() => setSelectedTask(null)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
