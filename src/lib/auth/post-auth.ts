const INVITE_PATH_PREFIX = '/invite/'

function sanitizeRequestedNext(requestedNext: string | null | undefined): string | null {
  if (!requestedNext?.startsWith('/')) return null
  return requestedNext
}

export function shouldBootstrapWorkspace(requestedNext: string | null | undefined): boolean {
  const safeNext = sanitizeRequestedNext(requestedNext)
  return !(safeNext && safeNext.startsWith(INVITE_PATH_PREFIX))
}

export function getPostAuthRedirect(
  { requestedNext, onboardingComplete }: { requestedNext: string | null | undefined; onboardingComplete: boolean }
): string {
  const safeNext = sanitizeRequestedNext(requestedNext)

  if (safeNext && safeNext !== '/dashboard') {
    return safeNext
  }

  return onboardingComplete ? '/dashboard' : '/onboarding'
}
