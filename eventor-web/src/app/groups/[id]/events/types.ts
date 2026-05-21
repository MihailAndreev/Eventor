export type EventManagementActionState = {
  message: string;
  ok: boolean;
};

export const initialEventManagementActionState = {
  message: "",
  ok: true,
} satisfies EventManagementActionState;
