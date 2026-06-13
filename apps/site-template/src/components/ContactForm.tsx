'use client';

import { useState } from 'react';
import type { FormField } from '@/schema/config';

type ContactFormProps = {
  fields: FormField[];
  siteDomain: string;
};

type FormState = 'idle' | 'sending' | 'success' | 'error';

export function ContactForm({ fields, siteDomain }: ContactFormProps) {
  const [state, setState] = useState<FormState>('idle');
  const [values, setValues] = useState<Record<string, string>>({});

  function handleChange(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    setState('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'form', site_domain: siteDomain, payload: values }),
      });
      setState(res.ok ? 'success' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-xl font-bold text-green-900 mb-2">Message envoyé!</h3>
        <p className="text-green-700">Nous vous répondrons sous 24h les jours ouvrables.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <FieldInput
          key={field.name}
          field={field}
          value={values[field.name] ?? ''}
          onChange={(v) => handleChange(field.name, v)}
          disabled={state === 'sending'}
        />
      ))}

      {state === 'error' && (
        <p className="text-red-600 text-sm">Une erreur est survenue. Réessayez ou appelez-nous directement.</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={state === 'sending'}
        className="btn-primary w-full disabled:opacity-60"
      >
        {state === 'sending' ? 'Envoi en cours…' : 'Envoyer la demande'}
      </button>
    </div>
  );
}

// ─── Field sub-component ──────────────────────────────────────────────────────

type FieldInputProps = {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
};

function FieldInput({ field, value, onChange, disabled }: FieldInputProps) {
  const base = 'w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400';

  const label = (
    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
      {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  if (field.type === 'textarea') {
    return (
      <div>
        {label}
        <textarea
          id={field.name}
          rows={4}
          className={base}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={field.required}
        />
      </div>
    );
  }

  if (field.type === 'select' && field.options) {
    return (
      <div>
        {label}
        <select
          id={field.name}
          className={base}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={field.required}
        >
          <option value="">— Sélectionner —</option>
          {field.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      {label}
      <input
        id={field.name}
        type={field.type}
        className={base}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={field.required}
      />
    </div>
  );
}
