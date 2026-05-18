export type AuthActionState = {
  message: string;
};

export const initialAuthActionState = {
  message: "",
} satisfies AuthActionState;
