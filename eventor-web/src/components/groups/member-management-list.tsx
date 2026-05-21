"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  demoteGroupMemberAction,
  promoteGroupMemberAction,
  removeGroupMemberAction,
} from "@/app/groups/actions";
import { initialGroupMemberActionState } from "@/app/groups/types";

export type ManagedMember = {
  id: number;
  name: string;
  email: string;
  isManager: boolean;
  joinedAt: string;
};

type MemberManagementListProps = {
  groupId: number;
  currentUserId: number;
  members: ManagedMember[];
};

export function MemberManagementList({
  groupId,
  currentUserId,
  members,
}: MemberManagementListProps) {
  const managerCount = useMemo(
    () => members.filter((member) => member.isManager).length,
    [members],
  );

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="hidden min-w-full md:block">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <TableHeader>Member</TableHeader>
              <TableHeader>Role</TableHeader>
              <TableHeader>Joined</TableHeader>
              <TableHeader align="right">Actions</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {members.map((member) => (
              <MemberTableRow
                key={member.id}
                groupId={groupId}
                currentUserId={currentUserId}
                managerCount={managerCount}
                member={member}
              />
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid divide-y divide-slate-200 md:hidden">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            groupId={groupId}
            currentUserId={currentUserId}
            managerCount={managerCount}
            member={member}
          />
        ))}
      </ul>
    </div>
  );
}

function MemberTableRow({
  groupId,
  currentUserId,
  managerCount,
  member,
}: {
  groupId: number;
  currentUserId: number;
  managerCount: number;
  member: ManagedMember;
}) {
  return (
    <tr>
      <td className="max-w-[260px] px-4 py-4 align-top">
        <MemberIdentity member={member} />
      </td>
      <td className="px-4 py-4 align-top">
        <RoleBadge isManager={member.isManager} />
      </td>
      <td className="px-4 py-4 align-top text-sm text-slate-600">
        {formatJoinedDate(member.joinedAt)}
      </td>
      <td className="px-4 py-4 align-top">
        <MemberActions
          groupId={groupId}
          currentUserId={currentUserId}
          managerCount={managerCount}
          member={member}
          align="end"
        />
      </td>
    </tr>
  );
}

function MemberCard({
  groupId,
  currentUserId,
  managerCount,
  member,
}: {
  groupId: number;
  currentUserId: number;
  managerCount: number;
  member: ManagedMember;
}) {
  return (
    <li className="grid gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <MemberIdentity member={member} />
        <RoleBadge isManager={member.isManager} />
      </div>
      <p className="text-sm text-slate-600">
        Joined {formatJoinedDate(member.joinedAt)}
      </p>
      <MemberActions
        groupId={groupId}
        currentUserId={currentUserId}
        managerCount={managerCount}
        member={member}
      />
    </li>
  );
}

function MemberActions({
  groupId,
  currentUserId,
  managerCount,
  member,
  align = "start",
}: {
  groupId: number;
  currentUserId: number;
  managerCount: number;
  member: ManagedMember;
  align?: "start" | "end";
}) {
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const [promoteState, promoteAction] = useActionState(
    promoteGroupMemberAction.bind(null, groupId, member.id),
    initialGroupMemberActionState,
  );
  const [demoteState, demoteAction] = useActionState(
    demoteGroupMemberAction.bind(null, groupId, member.id),
    initialGroupMemberActionState,
  );
  const [removeState, removeAction] = useActionState(
    removeGroupMemberAction.bind(null, groupId, member.id),
    initialGroupMemberActionState,
  );
  const latestState = [removeState, demoteState, promoteState].find(
    (state) => state.targetUserId === member.id && state.message.length > 0,
  );
  const isCurrentUser = member.id === currentUserId;
  const isOnlyManager = member.isManager && managerCount <= 1;

  return (
    <div
      className={`grid gap-2 ${
        align === "end" ? "justify-items-end" : "justify-items-start"
      }`}
    >
      <div
        className={`flex flex-wrap gap-2 ${
          align === "end" ? "justify-end" : "justify-start"
        }`}
      >
        {member.isManager ? (
          <form action={demoteAction}>
            <ActionButton
              disabled={isOnlyManager}
              variant="secondary"
              pendingText="Demoting..."
            >
              Demote
            </ActionButton>
          </form>
        ) : (
          <form action={promoteAction}>
            <ActionButton pendingText="Promoting...">Promote</ActionButton>
          </form>
        )}

        {isConfirmingRemove ? (
          <>
            <form action={removeAction}>
              <ActionButton
                disabled={isCurrentUser || isOnlyManager}
                variant="danger"
                pendingText="Removing..."
              >
                Confirm Remove
              </ActionButton>
            </form>
            <button
              type="button"
              onClick={() => setIsConfirmingRemove(false)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-[#0B6B8A] hover:text-[#004F6E]"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={isCurrentUser || isOnlyManager}
            onClick={() => setIsConfirmingRemove(true)}
            className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            Remove
          </button>
        )}
      </div>

      {isCurrentUser ? (
        <p className="max-w-xs text-xs leading-5 text-slate-500">
          Use Leave Group to remove yourself.
        </p>
      ) : null}
      {isOnlyManager ? (
        <p className="max-w-xs text-xs leading-5 text-amber-800">
          This group needs at least one manager.
        </p>
      ) : null}
      {latestState ? (
        <p
          role="status"
          className={`max-w-xs rounded-md px-3 py-2 text-xs leading-5 ${
            latestState.ok
              ? "bg-[#EAF5F8] text-[#004F6E]"
              : "bg-red-50 text-red-700"
          }`}
        >
          {latestState.message}
        </p>
      ) : null}
    </div>
  );
}

function ActionButton({
  children,
  disabled = false,
  pendingText,
  variant = "primary",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  pendingText: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();
  const className =
    variant === "danger"
      ? "inline-flex h-9 items-center justify-center rounded-md bg-red-700 px-3 text-xs font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300"
      : variant === "secondary"
        ? "inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 transition hover:border-[#0B6B8A] hover:text-[#004F6E] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        : "inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500";

  return (
    <button type="submit" disabled={disabled || pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}

function MemberIdentity({ member }: { member: ManagedMember }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-slate-950">
        {member.name}
      </p>
      <p className="truncate text-xs text-slate-500">{member.email}</p>
    </div>
  );
}

function RoleBadge({ isManager }: { isManager: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
        isManager
          ? "bg-[#EAF5F8] text-[#004F6E] ring-[#B8D7E2]"
          : "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {isManager ? "Manager" : "Member"}
    </span>
  );
}

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function formatJoinedDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}
