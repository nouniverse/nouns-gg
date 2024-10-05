import { twMerge } from "tailwind-merge";
import Link from "./Link";
import { Check, Sparkles, Timer } from "lucide-react";

export default function QuestCard(props: {
  id: string;
  name: string;
  description: string;
  image: string;
  xp: number;
  community: {
    id: string;
    name: string;
    image: string;
  };
  completed: boolean;
  className?: string;
}) {
  return (
    <div
      className={twMerge(
        "relative flex flex-col bg-grey-800 hover:bg-grey-600 transition-colors rounded-xl overflow-hidden w-full group aspect-[5/6]",
        props.className
      )}
    >
      <Link
        href={`/quests/${props.id}`}
        className="absolute z-10 top-0 left-0 w-full h-full"
      />
      <div className="flex flex-shrink-0 w-full h-[40%] overflow-hidden">
        <img
          src={`${props.image}?img-height=200&img-onerror=redirect`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
      </div>
      <div className="flex flex-col justify-between p-4 gap-4 h-full">
        <div className="flex flex-col gap-4">
          <p className="text-white text-2xl leading-tight font-bebas-neue line-clamp-2 h-[2lh]">
            {props.name}
          </p>
        </div>
        <div className="flex justify-between items-center">
          <Link
            href={`https://warpcast.com/~/channel/${props.community.id}`}
            newTab
            className="relative z-20 bg-grey-500 hover:bg-grey-400 transition-colors py-2 pl-2 pr-3 rounded-full flex text-white items-center gap-2 text-sm font-semibold w-fit whitespace-nowrap"
          >
            <img src={props.community.image} className="w-5 h-5 rounded-full" />
            {props.community.name}
          </Link>
          {props.completed ? (
            <div className="font-semibold text-sm flex items-center gap-1 text-green">
              <Check className="w-4 h-4" />
              Done
            </div>
          ) : (
            <div className="text-white font-semibold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green" />
              {props.xp}00
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
