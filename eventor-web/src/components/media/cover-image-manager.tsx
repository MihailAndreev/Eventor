"use client";

import type React from "react";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { EventActionState } from "@/app/events/[id]/types";
import type { GroupActionState } from "@/app/groups/types";

type ActionState = EventActionState | GroupActionState;

type CoverImageManagerProps = {
  title?: string;
  currentUrl: string | null;
  uploadAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
  removeAction: (state: ActionState) => Promise<ActionState>;
};

const initialState: ActionState = { ok: true, message: "" };

export function CoverImageManager({
  title = "Cover image",
  currentUrl,
  uploadAction,
  removeAction,
}: CoverImageManagerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadState, uploadFormAction] = useActionState(uploadAction, initialState);
  const [removeState, removeFormAction] = useActionState(removeAction, initialState);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  const status = uploadState.message ? uploadState : removeState.message ? removeState : null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div
        className={`mt-4 grid gap-4 sm:items-start ${
          previewUrl || currentUrl ? "sm:grid-cols-[180px_minmax(0,1fr)]" : ""
        }`}
      >
        {previewUrl || currentUrl ? <CoverPreview src={previewUrl ?? currentUrl} /> : null}
        <div className="grid gap-3">
          <form action={uploadFormAction} className="grid gap-3">
            <input
              type="file"
              name="coverImage"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600 file:mr-3 file:h-10 file:rounded-md file:border-0 file:bg-slate-950 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
              required
            />
            <SubmitButton>Upload cover</SubmitButton>
          </form>
          {currentUrl ? (
            <form action={removeFormAction}>
              <SubmitButton variant="secondary">Remove cover</SubmitButton>
            </form>
          ) : null}
          {status?.message ? (
            <p
              role="status"
              className={`rounded-md px-3 py-2 text-sm ${
                status.ok ? "bg-[#EAF5F8] text-[#004F6E]" : "bg-red-50 text-red-700"
              }`}
            >
              {status.message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function CoverImage({
  src,
  alt,
  size = "card",
}: {
  src: string | null;
  alt: string;
  size?: "card" | "hero" | "thumb";
}) {
  if (!src) {
    return null;
  }

  const classes = {
    card: "h-32 w-full",
    hero: "h-56 w-full sm:h-64",
    thumb: "h-24 w-full sm:h-full sm:w-32",
  };

  return (
    <div
      className={`overflow-hidden rounded-md border border-slate-200 bg-[#EAF5F8] ${classes[size]}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}

function CoverPreview({ src }: { src: string | null }) {
  return <CoverImage src={src} alt="" size="card" />;
}

function SubmitButton({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();
  const classes =
    variant === "primary"
      ? "bg-slate-950 text-white hover:bg-slate-800 disabled:bg-slate-500"
      : "border border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 disabled:text-red-400";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-10 w-fit items-center justify-center rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed ${classes}`}
    >
      {pending ? "Saving..." : children}
    </button>
  );
}
