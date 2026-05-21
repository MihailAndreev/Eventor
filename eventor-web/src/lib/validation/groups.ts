export function validateGroupInput(input: {
  title: string;
  description: string;
}): { ok: true; title: string; description: string | null } | { ok: false; message: string } {
  const title = input.title.trim();
  const description = input.description.trim();

  if (title.length === 0) {
    return { ok: false, message: "Enter a group title." };
  }

  if (title.length > 180) {
    return { ok: false, message: "Group titles must be 180 characters or less." };
  }

  if (description.length > 1000) {
    return {
      ok: false,
      message: "Group descriptions must be 1000 characters or less.",
    };
  }

  return {
    ok: true,
    title,
    description: description.length > 0 ? description : null,
  };
}
