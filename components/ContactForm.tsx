'use client';

import type { FormEvent } from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { contactInquiryTypeOptions } from '@/lib/labels';
import { FormSelect } from '@/components/FormSelect';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { uiText } from '@/lib/uiText';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';
import { getVisualToneClassName } from '@/lib/visualSemantics';

const missingFormspreeFormId = 'missing-formspree-form-id';

export function ContactForm() {
  const formEnabled = Boolean(env.formspreeFormId);
  const [state, handleSubmit] = useForm(env.formspreeFormId ?? missingFormspreeFormId);
  const handleFormSubmit = formEnabled
    ? handleSubmit
    : (event: FormEvent<HTMLFormElement>) => event.preventDefault();

  if (formEnabled && state.succeeded) {
    return (
      <div className={cn('border p-6', getVisualToneClassName('success'))}>
        <h3 className="text-sm font-semibold text-foreground mb-2">{uiText.contact.successTitle}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {uiText.contact.successMessage}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5 max-w-2xl">
      {!formEnabled && (
        <div className={cn('border p-4 text-sm', getVisualToneClassName('warning'))} role="status">
          {uiText.contact.formPending}
        </div>
      )}

      <fieldset
        disabled={state.submitting}
        className="m-0 space-y-5 border-0 p-0 disabled:opacity-60"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-foreground mb-2">
              {uiText.contact.name}
            </label>
            <Input
              id="name"
              type="text"
              name="name"
            />
          </div>
          <div>
            <label htmlFor="company" className="block text-xs font-medium text-foreground mb-2">
              {uiText.contact.company} <span className="text-muted-foreground/70">{uiText.contact.required}</span>
            </label>
            <Input
              id="company"
              type="text"
              name="company"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-medium text-foreground mb-2">
            {uiText.contact.email} <span className="text-muted-foreground/70">{uiText.contact.required}</span>
          </label>
          <Input
            id="email"
            type="email"
            name="email"
            required
          />
          <ValidationError prefix="Email" field="email" errors={state.errors} className="mt-1 text-xs text-tone-danger-text" />
        </div>

        <FormSelect
          id="inquiryType"
          name="inquiryType"
          label={uiText.contact.inquiryType}
          options={contactInquiryTypeOptions}
          defaultValue="adoption-consultation"
        />

        <div>
          <label htmlFor="message" className="block text-xs font-medium text-foreground mb-2">
            {uiText.contact.message} <span className="text-muted-foreground/70">{uiText.contact.required}</span>
          </label>
          <Textarea
            id="message"
            name="message"
            rows={6}
            required
          />
          <ValidationError prefix="Message" field="message" errors={state.errors} className="mt-1 text-xs text-tone-danger-text" />
        </div>

        <ValidationError errors={state.errors} className="text-xs text-tone-danger-text" />

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={!formEnabled || state.submitting}
            className="inline-flex items-center gap-2 rounded-md px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm w-fit"
          >
            {!formEnabled ? uiText.contact.setupPending : state.submitting ? uiText.contact.submitting : uiText.contact.submit}
          </button>
          <p className="text-xs text-muted-foreground">
            送信により
            <a href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors mx-0.5">
              プライバシーポリシー
            </a>
            に同意したものとみなします。
          </p>
        </div>
      </fieldset>
    </form>
  );
}
