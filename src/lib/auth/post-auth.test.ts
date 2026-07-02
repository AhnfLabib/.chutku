import test from 'node:test'
import assert from 'node:assert/strict'

import { getPostAuthRedirect, shouldBootstrapWorkspace } from './post-auth.ts'

test('regular login bootstraps a workspace', () => {
  assert.equal(shouldBootstrapWorkspace(null), true)
  assert.equal(shouldBootstrapWorkspace('/dashboard'), true)
})

test('invite login skips initiator bootstrap', () => {
  assert.equal(shouldBootstrapWorkspace('/invite/abc123'), false)
})

test('regular login routes incomplete users to onboarding', () => {
  assert.equal(
    getPostAuthRedirect({ requestedNext: null, onboardingComplete: false }),
    '/onboarding',
  )
})

test('invite login preserves requested destination', () => {
  assert.equal(
    getPostAuthRedirect({ requestedNext: '/invite/abc123', onboardingComplete: false }),
    '/invite/abc123',
  )
})
