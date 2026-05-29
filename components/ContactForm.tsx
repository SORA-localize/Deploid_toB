'use client';

import type { FormEvent } from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { contactInquiryTypeLabels, contactInquiryTypeOrder } from '@/lib/labels';
const formspreeFormId = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID?.trim();
const missingFormspreeFormId = 'missing-formspree-form-id';

export function ContactForm() {
  const formEnabled = Boolean(formspreeFormId);
  const [state, handleSubmit] = useForm(formspreeFormId ?? missingFormspreeFormId);
  const handleFormSubmit = formEnabled
    ? handleSubmit
    : (event: FormEvent<HTMLFormElement>) => event.preventDefault();

  if (formEnabled && state.succeeded) {
    return (
      <div className="border border-neutral-300 bg-neutral-50 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-2">送信しました</h3>
        <p className="text-sm text-neutral-600 leading-relaxed">
          お問い合わせありがとうございます。内容を確認のうえ折り返しご連絡します。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5 max-w-2xl">
      {!formEnabled && (
        <div className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="status">
          お問い合わせフォームは現在準備中です。設定完了後に送信できます。
        </div>
      )}

      <fieldset
        disabled={!formEnabled || state.submitting}
        className="m-0 space-y-5 border-0 p-0 disabled:opacity-60"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-neutral-900 mb-2">
              お名前
            </label>
            <input
              id="name"
              type="text"
              name="name"
              className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm text-neutral-900 focus:outline-none focus:border-neutral-500"
            />
          </div>
          <div>
            <label htmlFor="company" className="block text-xs font-medium text-neutral-900 mb-2">
              会社名・組織名
            </label>
            <input
              id="company"
              type="text"
              name="company"
              className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm text-neutral-900 focus:outline-none focus:border-neutral-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-medium text-neutral-900 mb-2">
            メールアドレス <span className="text-neutral-400">（必須）</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm text-neutral-900 focus:outline-none focus:border-neutral-500"
          />
          <ValidationError prefix="Email" field="email" errors={state.errors} className="mt-1 text-xs text-red-700" />
        </div>

        <div>
          <label htmlFor="inquiryType" className="block text-xs font-medium text-neutral-900 mb-2">
            ご相談の種別
          </label>
          <select
            id="inquiryType"
            name="inquiryType"
            defaultValue="adoption-consultation"
            className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm text-neutral-900 focus:outline-none focus:border-neutral-500"
          >
            {contactInquiryTypeOrder.map((type) => (
              <option key={type} value={contactInquiryTypeLabels[type]}>
                {contactInquiryTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-xs font-medium text-neutral-900 mb-2">
            内容 <span className="text-neutral-400">（必須）</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            required
            className="w-full px-3 py-2 border border-neutral-300 bg-white text-sm text-neutral-900 focus:outline-none focus:border-neutral-500"
          />
          <ValidationError prefix="Message" field="message" errors={state.errors} className="mt-1 text-xs text-red-700" />
        </div>

        <ValidationError errors={state.errors} className="text-xs text-red-700" />

        <button
          type="submit"
          disabled={!formEnabled || state.submitting}
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {!formEnabled ? 'フォーム設定待ち' : state.submitting ? '送信中…' : '送信する'}
        </button>
      </fieldset>
    </form>
  );
}
