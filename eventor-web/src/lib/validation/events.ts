export type EventManagementFormInput = {
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  location: string;
  capacity: string;
  canceled?: boolean;
};

export function validateEventManagementInput(
  input: EventManagementFormInput,
):
  | {
      ok: true;
      title: string;
      description: string | null;
      eventDate: string;
      eventTime: string;
      location: string | null;
      capacity: number | null;
      canceled: boolean;
    }
  | { ok: false; message: string } {
  const title = input.title.trim();
  const description = input.description.trim();
  const location = input.location.trim();
  const eventDate = input.eventDate.trim();
  const eventTime = input.eventTime.trim();
  const capacity = input.capacity.trim();

  if (title.length === 0) {
    return { ok: false, message: "Enter an event title." };
  }

  if (title.length > 180) {
    return { ok: false, message: "Event titles must be 180 characters or less." };
  }

  if (description.length > 2000) {
    return {
      ok: false,
      message: "Event descriptions must be 2000 characters or less.",
    };
  }

  if (!isValidDateInput(eventDate)) {
    return { ok: false, message: "Enter a valid event date." };
  }

  if (!isValidTimeInput(eventTime)) {
    return { ok: false, message: "Enter a valid event time." };
  }

  if (location.length > 240) {
    return { ok: false, message: "Locations must be 240 characters or less." };
  }

  const parsedCapacity = parseCapacityInput(capacity);

  if (!parsedCapacity.ok) {
    return parsedCapacity;
  }

  return {
    ok: true,
    title,
    description: description.length > 0 ? description : null,
    eventDate,
    eventTime,
    location: location.length > 0 ? location : null,
    capacity: parsedCapacity.capacity,
    canceled: input.canceled ?? false,
  };
}

export function validateCommentText(
  text: string,
): { ok: true; text: string } | { ok: false; message: string } {
  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    return { ok: false, message: "Enter a comment before saving." };
  }

  if (trimmedText.length > 1000) {
    return { ok: false, message: "Comments must be 1000 characters or less." };
  }

  return { ok: true, text: trimmedText };
}

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidTimeInput(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function parseCapacityInput(
  value: string,
): { ok: true; capacity: number | null } | { ok: false; message: string } {
  if (value.length === 0) {
    return { ok: true, capacity: null };
  }

  const capacity = Number(value);

  if (!Number.isInteger(capacity) || capacity < 1) {
    return { ok: false, message: "Capacity must be empty or a positive integer." };
  }

  if (capacity > 100000) {
    return { ok: false, message: "Capacity is too large." };
  }

  return { ok: true, capacity };
}
