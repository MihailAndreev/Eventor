export type GroupActionState = {
  message: string;
  ok: boolean;
};

export type GroupInviteActionState = GroupActionState & {
  invitePath?: string;
};

export type GroupMemberActionState = GroupActionState & {
  targetUserId?: number;
};

export const initialGroupActionState = {
  message: "",
  ok: true,
} satisfies GroupActionState;

export const initialGroupInviteActionState = {
  message: "",
  ok: true,
} satisfies GroupInviteActionState;

export const initialGroupMemberActionState = {
  message: "",
  ok: true,
} satisfies GroupMemberActionState;
