import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import type { EnhanceForm, FormSubmission } from '../../src/lib/context.svelte.ts';
import AuthCardFixture from './fixtures/AuthCardFixture.svelte';

const signIn = {
  title: 'Sign in',
  description: 'Welcome back.',
  submitLabel: 'Sign in',
  altHref: '/sign-up',
  altLabel: 'Create an account',
};

/** An enhancement that stops the native submit and hands the test the lifecycle hooks. */
const capturingEnhance = (): {
  enhance: EnhanceForm;
  submissions: FormSubmission[];
  teardown: () => void;
} => {
  const submissions: FormSubmission[] = [];
  const teardown = vi.fn<() => void>();
  const enhance: EnhanceForm = (form, submission) => {
    const onSubmit = (event: SubmitEvent): void => {
      event.preventDefault();
      if (submission === undefined) return;
      submissions.push(submission);
      submission.onSubmit();
    };
    form.addEventListener('submit', onSubmit);
    return () => {
      form.removeEventListener('submit', onSubmit);
      teardown();
    };
  };
  return { enhance, submissions, teardown };
};

test('names its heading, email field, sibling link and submit button', async () => {
  const screen = await render(AuthCardFixture, signIn);

  await expect.element(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
  const email = screen.getByRole('textbox', { name: /Email/ });
  await expect.element(email).toHaveAttribute('type', 'email');
  await expect.element(email).toHaveAttribute('autocomplete', 'email');
  await expect.element(email).toBeRequired();
  await expect
    .element(screen.getByRole('link', { name: 'Create an account' }))
    .toHaveAttribute('href', '/en/sign-up');
  await expect
    .element(screen.getByRole('button', { name: 'Sign in' }))
    .toHaveAttribute('type', 'submit');
});

test('headingLevel changes the heading level, and showEmail=false drops the email field', async () => {
  const screen = await render(AuthCardFixture, { ...signIn, headingLevel: 2, showEmail: false });

  await expect.element(screen.getByRole('heading', { level: 2, name: 'Sign in' })).toBeVisible();
  expect(screen.getByRole('textbox', { name: /Email/ }).elements()).toHaveLength(0);
});

test('form errors are alerts, and email errors describe the email field', async () => {
  const screen = await render(AuthCardFixture, {
    ...signIn,
    errors: ['Those details did not match.'],
    email: 'ada@example.com',
    emailErrors: ['Enter a valid email address.'],
  });

  await expect
    .element(screen.getByRole('alert').first())
    .toHaveTextContent('Those details did not match.');
  const email = screen.getByRole('textbox', { name: /Email/ });
  await expect.element(email).toHaveValue('ada@example.com');
  await expect.element(email).toHaveAttribute('aria-invalid', 'true');
  await expect.element(email).toHaveAccessibleDescription('Enter a valid email address.');
});

test('without enhancement it is a plain POST carrying the redirect target', async () => {
  const screen = await render(AuthCardFixture, { ...signIn, redirectTo: '/gardens' });
  const form = screen.container.querySelector('form');
  if (form === null) throw new Error('no form');
  let posted: FormData | undefined;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    posted = new FormData(form);
  });

  await userEvent.fill(screen.getByRole('textbox', { name: /Email/ }), 'ada@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(form.method).toBe('post');
  expect(posted?.get('redirectTo')).toBe('/gardens');
  expect(posted?.get('email')).toBe('ada@example.com');
  // No enhancement, so nothing ever settles: the button must not claim to be busy.
  await expect.element(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
});

test('the context enhance drives the pending state, and onResult sees the result', async () => {
  const { enhance, submissions } = capturingEnhance();
  const onResult = vi.fn<(result: { readonly type: string }) => void>();
  const screen = await render(AuthCardFixture, {
    ...signIn,
    pendingLabel: 'Signing in…',
    contextEnhance: enhance,
    onResult,
  });

  await userEvent.fill(screen.getByRole('textbox', { name: /Email/ }), 'ada@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  const busy = screen.getByRole('button', { name: 'Signing in…' });
  await expect.element(busy).toBeDisabled();
  await expect.element(busy).toHaveAttribute('aria-busy', 'true');
  expect(onResult).not.toHaveBeenCalled();

  submissions[0]?.onResult({ type: 'failure' });

  await expect.element(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  expect(onResult).toHaveBeenCalledWith({ type: 'failure' });
});

test('its own enhance wins over the context, and is torn down on unmount', async () => {
  const own = capturingEnhance();
  const fromContext = capturingEnhance();
  const screen = await render(AuthCardFixture, {
    ...signIn,
    enhance: own.enhance,
    contextEnhance: fromContext.enhance,
  });

  await userEvent.fill(screen.getByRole('textbox', { name: /Email/ }), 'ada@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(own.submissions).toHaveLength(1);
  expect(fromContext.submissions).toHaveLength(0);

  await screen.unmount();
  expect(own.teardown).toHaveBeenCalledTimes(1);
});
