/**
 * Laravel rejects a form in English. The dashboard is in Swahili or English
 * at the owner's choice, so the server's own wording is matched against a
 * table of rules and replaced with the sentence the owner should read.
 *
 * The match is on wording rather than on one exact sentence because Laravel
 * names the field inside the sentence ("The pharmacies.0.region field is
 * required."), so the same rule reads differently depending on which branch
 * it failed on.
 */

// Ordered: the first pattern that matches the message wins.
const MESSAGE_RULES = [
  [/email has already been taken/i, 'emailTaken'],
  [/phone( number)? has already been taken/i, 'phoneTaken'],
  [/password confirmation does not match/i, 'passwordMismatch'],
  [/must be at least 8 characters/i, 'passwordMin8'],
  [/uppercase letter and one number/i, 'passwordFormat'],
  [/must be a valid email address/i, 'emailInvalid'],
  [/pharmacy name field is required/i, 'pharmacyNameRequired'],
  [/region field is required/i, 'regionRequired'],
  [/district field is required/i, 'districtRequired'],
  [/ward field is required/i, 'wardRequired'],
  [/licen[cs]e expiry date must be a date after today/i, 'licenseFuture'],
  [/subscription plan is invalid/i, 'planInvalid'],
  [/country field is required/i, 'countryRequired'],
  [/name field is required/i, 'nameRequired'],
  [/email field is required/i, 'emailRequired'],
  [/phone field is required/i, 'phoneRequired'],
  [/password field is required/i, 'passwordRequired'],
  [/opening capital field must be at least 0/i, 'capitalNegative'],
  [/must be at least 2 characters/i, 'tooShort'],
  [/may not be greater than/i, 'tooLong'],
]

/**
 * Turns one server message into the dashboard's language.
 *
 * Anything the table does not know is passed through unchanged: a message
 * that is merely in English is still more use than a wrong one.
 */
export function translateServerError(message, t) {
  if (!message) return message

  const text = String(message)

  for (const [pattern, key] of MESSAGE_RULES) {
    if (!pattern.test(text)) continue

    const path = `authPages.serverErrors.${key}`
    const translated = t(path)
    // t() hands back the path itself when the key is missing, so a missing
    // translation falls through to the next rule and finally to the original
    // message.
    if (translated && translated !== path) return translated
  }

  return text
}

/**
 * The banner the owner reads when the form is rejected.
 */
export function translateServerErrors(messages, t) {
  if (!messages) return ''
  const first = Array.isArray(messages) ? messages[0] : messages
  return translateServerError(first, t)
}
