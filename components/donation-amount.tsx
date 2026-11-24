"use client";

import {useId, useState} from 'react';
import {Input} from './ui/input';
import {money, type Locale} from '@/lib/domain';

export function DonationAmount({amount, onChange, suggestions, locale}: {
  amount: number;
  onChange: (amount: number) => void;
  suggestions: number[];
  locale: Locale;
}) {
  const id = useId();
  const [custom, setCustom] = useState(!suggestions.includes(amount));
  const t = (fr: string, en: string, ar: string) => locale === 'en' ? en : locale === 'ar' ? ar : fr;
  return <fieldset className="donation-amount">
    <legend>{t('Choisissez votre montant', 'Set your donation amount', 'اختر مبلغ تبرعك')}</legend>
    <div className="amount-options" role="group" aria-label={t('Montants suggérés', 'Suggested amounts', 'المبالغ المقترحة')}>
      {suggestions.map(value => <button type="button" key={value} aria-pressed={!custom && amount === value} onClick={() => {setCustom(false); onChange(value);}}>{money(value * 100, locale)}</button>)}
    </div>
    <label className="field donation-custom-amount" htmlFor={id}>
      <span className="sr-only">{t('Autre montant (€)', 'Other amount (€)', 'مبلغ آخر (€)')}</span>
      <Input id={id} type="number" inputMode="decimal" min="1" max="100000" step="0.01" value={custom ? amount || '' : ''} placeholder={t('Autre montant (€)', 'Other amount (€)', 'مبلغ آخر (€)')} aria-required={custom} required={custom} onChange={event => {setCustom(true); onChange(Number(event.target.value));}}/>
    </label>
  </fieldset>;
}
