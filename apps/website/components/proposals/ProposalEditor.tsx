"use client";

import { useMemo, useState } from "react";
import TextInput from "../form/TextInput";
import Button from "../Button";
import { createProposal } from "@/server/mutations/createProposal";
import { $generateHtmlFromNodes } from "@lexical/html";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import LimitMeter from "../LimitMeter";
import { updateProposal } from "@/server/mutations/updateProposal";
import dynamic from "next/dynamic";
import Shimmer from "../Shimmer";
import { useAction } from "next-safe-action/hooks";
import type { getRoundWithProposal } from "@/server/queries/rounds";
import { Trash2 } from "lucide-react";
import PinImage from "../PinImage";
import VideoPlayer from "../VideoPlayer";
import { env } from "~/env";

const Markdown = dynamic(() => import("../lexical/Markdown"), {
  ssr: false,
  loading: () => <Shimmer />,
});

export default function ProposalEditor(props: {
  round: NonNullable<Awaited<ReturnType<typeof getRoundWithProposal>>>;
  user: string;
}) {
  const proposal =
    props.round.proposals.length > 0 ? props.round.proposals[0] : undefined;

  const [title, setTitle] = useState(proposal?.title ?? "");
  const [image, setImage] = useState(proposal?.image ?? undefined);
  const [video, setVideo] = useState(proposal?.video ?? undefined);

  const validVideo = useMemo(() => {
    if (!video) return;

    // Youtube: https://www.youtube.com/embed/sqRntu1k6AE
    // Google Drive: https://drive.google.com/file/d/1obXK4mr1yTVS7ruAWba__6k6D5b_ORgs/preview

    try {
      const url = new URL(video);

      // User Input: https://clips.twitch.tv/BlueExquisiteBaconHeyGuys-vynEsLJMItjIbj9m
      // Output: https://clips.twitch.tv/embed?clip=BlueExquisiteBaconHeyGuys-vynEsLJMItjIbj9m&parent=nouns.gg
      if (url.hostname.includes("clips.twitch.tv")) {
        if (url.pathname.length > 1)
          return `https://clips.twitch.tv/embed?clip=${url.pathname.replace("/", "")}`;
      }

      // User Input: https://www.youtube.com/watch?v=sqRntu1k6AE
      // Output: https://www.youtube.com/embed/sqRntu1k6AE
      if (url.hostname.includes("youtube.com")) {
        if (url.searchParams.get("v") !== null) {
          return `https://www.youtube.com/embed/${url.searchParams.get("v")}`;
        }
      }

      // User Input: https://drive.google.com/file/d/1obXK4mr1yTVS7ruAWba__6k6D5b_ORgs/view
      // Output: https://drive.google.com/file/d/1obXK4mr1yTVS7ruAWba__6k6D5b_ORgs/preview
      if (url.hostname.includes("drive.google.com")) {
        return video.replace("/view", "/preview").split("?")[0];
      }
    } catch {}

    return;
  }, [video]);

  const [editorState, setEditorState] = useState(
    proposal?.content ??
      JSON.stringify({
        children: [
          {
            children: [],
            direction: null,
            format: "",
            indent: 0,
            type: "paragraph",
            version: 1,
            textFormat: 0,
          },
        ],
        direction: null,
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      })
  );

  const [parsedMarkdown, setParsedMarkdown] = useState(proposal?.content ?? "");

  const router = useRouter();

  const createProposalAction = useAction(createProposal);
  const updateProposalAction = useAction(updateProposal);

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-luckiest-guy text-white text-2xl">Title</h2>
          <LimitMeter
            type="character"
            value={title.length}
            min={15}
            max={100}
          />
        </div>
        <TextInput
          placeholder="Enter a title for your proposal"
          onChange={(value) => {
            if (value.length <= 100) setTitle(value);
          }}
          value={title}
        />
      </div>
      {
        {
          image: (
            <>
              <div className="flex flex-col gap-3 max-w-[400px]">
                <div className="flex items-center justify-between mt-4">
                  <h2 className="font-luckiest-guy text-white text-2xl">
                    Image
                  </h2>
                  {image ? (
                    <button
                      onClick={() => setImage(undefined)}
                      className="text-red flex items-center gap-1 hover:opacity-70 transition-opacity"
                    >
                      Remove
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
                <PinImage image={image} setImage={setImage} />
              </div>
            </>
          ),
          markdown: (
            <>
              <div className="flex flex-col gap-3 max-w-[400px]">
                <div className="flex items-center justify-between mt-4">
                  <h2 className="font-luckiest-guy text-white text-2xl">
                    Cover Image
                  </h2>
                  {image ? (
                    <button
                      onClick={() => setImage(undefined)}
                      className="text-red flex items-center gap-1 hover:opacity-70 transition-opacity"
                    >
                      Remove
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
                <PinImage image={image} setImage={setImage} />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-luckiest-guy text-white text-2xl">
                    Proposal
                  </h2>
                  <LimitMeter
                    type="word"
                    value={parsedMarkdown.split(" ").length - 1}
                    min={150}
                    max={Infinity}
                  />
                </div>
                <div className="relative bg-grey-800 border border-grey-600 rounded-xl overflow-hidden p-2 min-h-60">
                  <Markdown
                    markdown={editorState}
                    readOnly={false}
                    onChange={(state, editor) => {
                      state.read(() => {
                        setEditorState(
                          JSON.stringify(editor.toJSON().editorState.root)
                        );
                        setParsedMarkdown(
                          $generateHtmlFromNodes(editor).replaceAll(
                            /<[^>]*>/g,
                            ""
                          )
                        );
                      });
                    }}
                  />
                </div>
              </div>
            </>
          ),
          video: (
            <>
              <div className="flex flex-col gap-3 max-w-[400px]">
                <div className="flex items-center justify-between mt-4">
                  <h2 className="font-luckiest-guy text-white text-2xl">
                    Cover Image
                  </h2>
                  {image ? (
                    <button
                      onClick={() => setImage(undefined)}
                      className="text-red flex items-center gap-1 hover:opacity-70 transition-opacity"
                    >
                      Remove
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
                <PinImage image={image} setImage={setImage} />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between max-w-[400px]">
                  <h2 className="font-luckiest-guy text-white text-2xl">
                    Video
                  </h2>
                  {video && validVideo ? (
                    <button
                      onClick={() => setVideo(undefined)}
                      className="text-red flex items-center gap-1 hover:opacity-70 transition-opacity"
                    >
                      Remove
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
                {video && validVideo ? (
                  <div className="max-w-[400px]">
                    <VideoPlayer url={validVideo} />
                  </div>
                ) : (
                  <TextInput
                    placeholder="Link to Twitch Clip, YouTube Video, or Google Drive File"
                    onChange={(value) => setVideo(value)}
                    value={video}
                  />
                )}
                {video && !validVideo ? (
                  <small className="text-red">Not a valid video url</small>
                ) : null}
              </div>
            </>
          ),
        }[props.round.type]
      }

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="font-luckiest-guy text-white text-2xl">Submit</h2>
          <p>
            Double check to make sure your poposal includes all necessary
            requirements
          </p>
        </div>
        <Button
          loading={
            createProposalAction.isPending || updateProposalAction.isPending
          }
          disabled={
            createProposalAction.isPending ||
            updateProposalAction.isPending ||
            title.length < 15 ||
            {
              markdown: parsedMarkdown.split(" ").length - 1 < 150,
              image: !image,
              video: !video && !validVideo && !image,
            }[props.round.type]
          }
          onClick={async () => {
            if (!props.user) return;

            if (proposal) {
              const result = await updateProposalAction.executeAsync({
                round: props.round.id,
                title,
                content: editorState,
                image: image,
                video: validVideo,
              });

              if (result?.serverError) {
                return toast.error(result.serverError);
              }

              toast.success("Successfully updated proposal");
              return router.push(`/rounds/${props.round.id}`);
            }

            const result = await createProposalAction.executeAsync({
              title,
              content: editorState,
              round: props.round.id,
              image: image,
              video: validVideo,
            });

            if (result?.serverError) {
              return toast.error(result.serverError);
            }

            toast.success("Successfully created proposal");
            return router.push(`/rounds/${props.round.id}`);
          }}
        >
          {proposal ? "Update Proposal" : "Create Proposal"}
        </Button>
      </div>
    </div>
  );
}
