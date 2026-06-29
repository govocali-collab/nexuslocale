'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Prospect } from '@/lib/queries';
import { updateProspectStatus, deleteProspects } from '@/lib/actions';
import { ProspectPanel } from './prospect-panel';
import { PIPELINE_STATUSES, PIPELINE_LABELS, PIPELINE_ACCENT } from '@/lib/pipeline';

// Étapes du pipeline = source unique partagée (cf. @/lib/pipeline).
const COLUMNS       = PIPELINE_STATUSES;
const COLUMN_LABELS = PIPELINE_LABELS;
const COLUMN_ACCENT = PIPELINE_ACCENT;

type Board = Record<string, Prospect[]>;

function buildBoard(prospects: Prospect[]): Board {
  const board: Board = {};
  for (const col of COLUMNS) board[col] = [];
  for (const p of prospects) {
    const col = p.status in board ? p.status : 'new';
    board[col]!.push(p);
  }
  return board;
}

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-emerald-100 text-emerald-700' :
    score >= 40 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-600';
  return (
    <span className={`text-xs font-semibold mono rounded px-1.5 py-0.5 ${color}`}>
      {Math.round(score)}
    </span>
  );
}

interface DragState {
  id:     string;   // prospect being dragged
  col:    string;   // source column
  index:  number;   // source index
}

function ProspectCard({
  p, isDragging, isDropTarget, selected,
  onDragStart, onDragEnter, onClick, onToggleSelect,
}: {
  p: Prospect;
  isDragging: boolean;
  isDropTarget: boolean;
  selected: boolean;
  onDragStart: () => void;
  onDragEnter: () => void;
  onClick: () => void;
  onToggleSelect: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragEnter={onDragEnter}
      onClick={onClick}
      className={`bg-white border rounded-lg p-3 cursor-pointer
                  hover:shadow-sm hover:border-indigo-200 transition-all space-y-1.5 select-none
                  ${isDragging   ? 'opacity-40 scale-95' : ''}
                  ${selected ? 'border-indigo-400 ring-2 ring-indigo-300 bg-indigo-50'
                    : isDropTarget ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-[#e5e5e5]'}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-start gap-2 min-w-0">
          <input
            type="checkbox"
            checked={selected}
            onClick={e => e.stopPropagation()}
            onChange={onToggleSelect}
            className="mt-0.5 rounded border-[#d4d4d4] text-indigo-600 cursor-pointer flex-none"
            aria-label={`Sélectionner ${p.business_name}`}
          />
          <span className="font-medium text-[#0a0a0a] text-sm leading-snug">{p.business_name}</span>
        </div>
        {p.prospect_score != null && <ScorePill score={p.prospect_score} />}
      </div>
      <div className="text-xs text-[#a3a3a3]">{p.niche} · {p.city}</div>
      {p.rating != null && (
        <div className="text-xs text-amber-600">
          ⭐ {p.rating}
          {p.review_count != null && (
            <span className="text-[#a3a3a3] ml-1">({p.review_count})</span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between pt-0.5">
        {p.phone
          ? <span className="text-xs mono text-[#525252]">{p.phone}</span>
          : <span />}
        <div className="flex items-center gap-2">
          {p.notes && <span className="text-xs text-[#a3a3a3]" title="A des notes">📝</span>}
          {p.demo_url && (
            <a href={p.demo_url} target="_blank" rel="noopener noreferrer"
               className="text-xs text-indigo-600 hover:text-indigo-800"
               onClick={e => e.stopPropagation()}>
              ↗ démo
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function KanbanBoard({ prospects }: { prospects: Prospect[] }) {
  const [board, setBoard]               = useState<Board>(() => buildBoard(prospects));

  // Resynchronise le board quand les données serveur changent (ajout, suppression, refresh).
  useEffect(() => { setBoard(buildBoard(prospects)); }, [prospects]);
  const [drag, setDrag]                 = useState<DragState | null>(null);
  const [overCol, setOverCol]           = useState<string | null>(null);
  const [overIndex, setOverIndex]       = useState<number | null>(null);
  const [selected, setSelected]         = useState<Prospect | null>(null);
  const [sel, setSel]                   = useState<Set<string>>(new Set());
  const [deleting, startDelete]         = useTransition();
  const [, startTransition]             = useTransition();
  const router                          = useRouter();

  function toggleSelect(id: string) {
    setSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const allIds = Object.values(board).flatMap(c => (c ?? []).map(p => p.id));
  const allSelected = allIds.length > 0 && allIds.every(id => sel.has(id));
  function toggleSelectAll() {
    setSel(allSelected ? new Set() : new Set(allIds));
  }

  function deleteSelected() {
    const ids = [...sel];
    if (ids.length === 0) return;
    if (!confirm(`Supprimer ${ids.length} prospect(s) du pipeline ? Cette action est définitive.`)) return;
    startDelete(async () => {
      const r = await deleteProspects(ids);
      if (r.error) { alert('Échec de la suppression : ' + r.error); return; }
      setBoard(prev => {
        const next: Board = {};
        for (const col of Object.keys(prev)) next[col] = prev[col]!.filter(p => !sel.has(p.id));
        return next;
      });
      setSel(new Set());
      router.refresh();
    });
  }

  function handleDragStart(p: Prospect, col: string, index: number) {
    setDrag({ id: p.id, col, index });
  }

  function handleDrop(targetCol: string) {
    if (!drag) return;
    const { id, col: sourceCol } = drag;
    setDrag(null);
    setOverCol(null);
    setOverIndex(null);

    const card = board[sourceCol]!.find(p => p.id === id)!;
    const insertAt = overIndex ?? board[targetCol]!.length;

    setBoard(prev => {
      const next = { ...prev };
      // Remove from source
      next[sourceCol] = prev[sourceCol]!.filter(p => p.id !== id);
      // Insert into target at position
      const target = [...prev[targetCol]!.filter(p => p.id !== id)];
      target.splice(insertAt, 0, { ...card, status: targetCol });
      next[targetCol] = target;
      return next;
    });

    if (sourceCol !== targetCol) {
      startTransition(async () => {
        await updateProspectStatus(id, targetCol);
        router.refresh();
      });
    }
  }

  // Called by ProspectPanel after a successful save
  function handlePanelSaved(updated: Partial<Prospect> & { id: string }) {
    setBoard(prev => {
      const next = { ...prev };
      for (const col of Object.keys(next)) {
        const idx = next[col]!.findIndex(p => p.id === updated.id);
        if (idx !== -1) {
          const merged = { ...next[col]![idx]!, ...updated };
          // If status changed, move to new column
          if (updated.status && updated.status !== col) {
            next[col] = next[col]!.filter(p => p.id !== updated.id);
            next[updated.status] = [...(next[updated.status] ?? []), merged];
          } else {
            next[col] = next[col]!.map(p => p.id === updated.id ? merged : p);
          }
          break;
        }
      }
      return next;
    });
    setSelected(prev => prev?.id === updated.id ? { ...prev, ...updated } as Prospect : prev);
  }

  function handleCardClick(p: Prospect) {
    const fresh = Object.values(board).flat().find(c => c.id === p.id) ?? p;
    setSelected(fresh);
  }

  return (
    <>
      <div className={`sticky top-0 z-20 mb-2 flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
        sel.size > 0 ? 'bg-red-50 border-red-200' : 'bg-[#fafafa] border-[#e5e5e5]'
      }`}>
        <button onClick={toggleSelectAll} className="text-xs font-medium text-[#525252] hover:text-indigo-600 underline">
          {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
        </button>
        {sel.size > 0 && (
          <>
            <span className="text-sm font-medium text-red-700">{sel.size} sélectionné(s)</span>
            <button onClick={deleteSelected} disabled={deleting}
              className="rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-1 text-sm text-white transition-colors">
              {deleting ? 'Suppression…' : '🗑 Supprimer'}
            </button>
            <button onClick={() => setSel(new Set())} className="text-xs text-red-500 hover:text-red-700 underline">Annuler</button>
          </>
        )}
      </div>
      <div
        className="flex gap-3 overflow-x-auto pb-4"
        style={{ minHeight: 'calc(100vh - 140px)' }}
        onDragEnd={() => { setDrag(null); setOverCol(null); setOverIndex(null); }}
      >
        {COLUMNS.map(col => {
          const cards  = board[col] ?? [];
          const isOver = overCol === col;

          return (
            <div
              key={col}
              className="flex-shrink-0 w-60"
              onDragOver={e => { e.preventDefault(); if (overCol !== col) { setOverCol(col); setOverIndex(cards.length); } }}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setOverCol(null); setOverIndex(null);
                }
              }}
              onDrop={e => { e.preventDefault(); handleDrop(col); }}
            >
              {/* Header */}
              <div className={`card border-t-4 ${COLUMN_ACCENT[col]} px-3 py-2 mb-2 flex items-center justify-between`}>
                <span className="text-sm font-medium text-[#0a0a0a]">{COLUMN_LABELS[col]}</span>
                <span className="text-xs mono text-[#a3a3a3] bg-[#f4f4f4] rounded px-1.5 py-0.5">
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className={`space-y-2 min-h-24 rounded-lg p-1 transition-colors ${
                isOver && drag?.col !== col ? 'bg-indigo-50 ring-2 ring-indigo-200 ring-inset' : ''
              }`}>
                {cards.map((p, i) => (
                  <div
                    key={p.id}
                    onDragEnter={() => { setOverCol(col); setOverIndex(i); }}
                  >
                    {/* Drop indicator above */}
                    {isOver && overIndex === i && drag?.id !== p.id && (
                      <div className="h-1 bg-indigo-400 rounded mb-1.5" />
                    )}
                    <ProspectCard
                      p={p}
                      isDragging={drag?.id === p.id}
                      isDropTarget={false}
                      selected={sel.has(p.id)}
                      onDragStart={() => handleDragStart(p, col, i)}
                      onDragEnter={() => { setOverCol(col); setOverIndex(i); }}
                      onClick={() => handleCardClick(p)}
                      onToggleSelect={() => toggleSelect(p.id)}
                    />
                  </div>
                ))}

                {/* Drop indicator at bottom */}
                {isOver && (overIndex === cards.length || cards.length === 0) && (
                  <div className="h-1 bg-indigo-400 rounded mt-1" />
                )}

                {cards.length === 0 && !isOver && (
                  <div className="flex items-center justify-center h-16 text-xs text-[#d4d4d4]">
                    Vide
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-over panel */}
      <ProspectPanel
        prospect={selected}
        onClose={() => setSelected(null)}
        onSaved={handlePanelSaved}
      />
    </>
  );
}
