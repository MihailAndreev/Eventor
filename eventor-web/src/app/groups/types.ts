export type GroupActionState = {
  message: string;
  ok: boolean;
};

export const initialGroupActionState = {
  message: "",
  ok: true,
} satisfies GroupActionState;
