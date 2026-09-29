"use client";

import { formatBytes, publicApi } from "@/lib/format";
import { ProjectFile, ProjectFileCategory } from "@/lib/types";
import {
  CubeIcon,
  DownloadSimpleIcon,
  FilePdfIcon,
  FolderOpenIcon,
  LockSimpleIcon,
  PrinterIcon,
} from "@phosphor-icons/react";
import { useSession } from "./session";

const groups: {
  category: ProjectFileCategory;
  title: string;
  icon: typeof CubeIcon;
}[] = [
  { category: "tutorial", title: "Tutorial", icon: FilePdfIcon },
  { category: "model3d", title: "3D files", icon: CubeIcon },
  { category: "printing", title: "Printing files", icon: PrinterIcon },
  { category: "other", title: "Other files", icon: FolderOpenIcon },
];

export function ProjectFiles({
  slug,
  files,
}: {
  slug: string;
  files: ProjectFile[];
}) {
  const { user, ready, signIn } = useSession();
  const visible = groups
    .map((group) => ({
      ...group,
      files: files.filter((file) => file.category === group.category),
    }))
    .filter((group) => group.files.length > 0);

  if (visible.length === 0) {
    return null;
  }

  const unlocked = ready && Boolean(user);
  const locked = ready && !user;
  const api = publicApi().replace(/\/$/, "");

  return (
    <section className="mt-12">
      <h2 className="text-xl font-medium">Project files</h2>
      <div className="relative mt-6">
        <div
          className={`grid gap-8 rounded-3xl bg-panel p-4 sm:p-6 dark:bg-panel-dark ${
            unlocked ? "" : "pointer-events-none select-none"
          } ${locked ? "opacity-70" : ""}`}
          inert={!unlocked}
        >
          {visible.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.category}>
                <h3 className="font-medium">{group.title}</h3>
                <ul className="mt-3 grid gap-3">
                  {group.files.map((file) => {
                    const meta = file.extension
                      ? `${file.extension.toUpperCase()} · ${formatBytes(file.size)}`
                      : formatBytes(file.size);
                    const className =
                      "flex items-center gap-4 rounded-2xl bg-paper p-3 dark:bg-ink";
                    const body = (
                      <>
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-yt/10 text-yt">
                          <Icon size={22} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {file.name}
                          </span>
                          <span className="mt-1 block text-sm text-muted dark:text-muted-dark">
                            {meta}
                          </span>
                        </span>
                        <DownloadSimpleIcon
                          size={18}
                          className="shrink-0 text-muted dark:text-muted-dark"
                        />
                      </>
                    );

                    return (
                      <li key={file.id}>
                        {unlocked ? (
                          <a
                            href={`${api}/videos/${encodeURIComponent(slug)}/files/${encodeURIComponent(file.id)}`}
                            className={`${className} transition hover:-translate-y-0.5 hover:bg-black/6 dark:hover:bg-white/10`}
                          >
                            {body}
                          </a>
                        ) : (
                          <div className={className}>{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
        {locked ? (
          <div className="absolute inset-0 grid place-items-center rounded-3xl bg-paper/25 backdrop-blur-[2px] dark:bg-ink/25">
            <span className="grid size-14 place-items-center rounded-full bg-paper text-ink shadow-sm dark:bg-panel-dark dark:text-white">
              <LockSimpleIcon size={26} />
            </span>
          </div>
        ) : null}
      </div>
      {locked ? (
        <button
          type="button"
          onClick={signIn}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-yt px-6 py-3.5 text-base font-medium text-white transition hover:bg-yt-press"
        >
          Sign in to download FOR FREE
        </button>
      ) : null}
    </section>
  );
}
