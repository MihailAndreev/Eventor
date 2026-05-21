const PASSWORD_MIN_LENGTH = 8;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRegistrationInput(input: {
  name: string;
  email: string;
  password: string;
}): { ok: true; name: string; email: string; password: string } | { ok: false; message: string } {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);

  if (name.length < 2) {
    return { ok: false, message: "Enter your full name." };
  }

  if (!isValidEmail(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  if (input.password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    };
  }

  return { ok: true, name, email, password: input.password };
}

export function validateLoginInput(input: {
  email: string;
  password: string;
}): { ok: true; email: string; password: string } | { ok: false; message: string } {
  const email = normalizeEmail(input.email);

  if (!isValidEmail(email) || input.password.length === 0) {
    return { ok: false, message: "Invalid email or password." };
  }

  return { ok: true, email, password: input.password };
}
