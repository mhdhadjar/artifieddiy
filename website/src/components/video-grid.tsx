"use client";

import { formatDate } from "@/lib/format";
import { Video } from "@/lib/types";
import { PlayIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import Link from "next/link";

export function VideoGrid({ videos }: { videos: Video[] }) {
  if (videos.length === 0) {
    return (
      <p className="rounded-2xl bg-panel px-6 py-16 text-center text-muted dark:bg-panel-dark dark:text-muted-dark">
        Videos will show up here once they are published.
      </p>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video, index) => (
        <motion.article
          key={video.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index * 0.06, 0.42), duration: 0.45 }}
        >
          <Link href={`/videos/${video.slug}`} className="group block">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-panel shadow-sm dark:bg-panel-dark">
              <img
                src={video.thumbnail}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
              />
              <span className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-yt text-white shadow-lg">
                  <PlayIcon size={22} weight="fill" className="-ml-0.5" />
                </span>
              </span>
              {video.duration ? (
                <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                  {video.duration}
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 line-clamp-2 text-base font-medium leading-snug group-hover:text-yt">
              {video.title}
            </h2>
            <p className="mt-1 text-sm text-muted dark:text-muted-dark">
              {formatDate(video.publishedAt)}
              {video.channelTitle ? ` · ${video.channelTitle}` : ""}
            </p>
            {video.tags.length > 0 ? (
              <p className="mt-1 text-xs text-muted dark:text-muted-dark">
                {video.tags.map((tag) => tag.name).join(" · ")}
              </p>
            ) : null}
          </Link>
        </motion.article>
      ))}
    </div>
  );
}
