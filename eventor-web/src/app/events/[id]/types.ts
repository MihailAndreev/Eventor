export type EventActionState = {
  message: string;
  ok: boolean;
};

export const initialEventActionState = {
  message: "",
  ok: true,
} satisfies EventActionState;
