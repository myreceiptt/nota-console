import { FC, useState, useCallback } from "react";
import { getCommandNames } from "../../const/commands";

interface PromptProps {
  text: string;
  showCursor: boolean;
}

const Prompt: FC<PromptProps> = (props) => {
  const [cmdNames] = useState<string[]>(getCommandNames());

  const formatText = (text: string): string => {
    const split = text.split(" ");

    if (cmdNames.includes(split[0])) {
      split[0] = `<span class="text-nota-yellow relative">${split[0]}</span>`;
    }

    split[0] = `
      ${split[0]}<span class="text-nota-text-muted/[.75] absolute">
        ${getAutoCompleteText(text.trim())}
      </span>
    `;

    return split.join("&nbsp;");
  };

  const getAutoCompleteText = useCallback(
    (text: string): string => {
      if (text === "") {
        return "";
      }

      const filtered = [...cmdNames].filter((cmd) => cmd.startsWith(text));
      if (text === filtered[0]) {
        return "";
      }

      return filtered.length > 0 ? filtered[0].slice(text.length) : "";
    },
    [cmdNames]
  );

  return (
    <div className="flex flex-col relative">
      <div
        className="ml-5 before:content[''] before:h-[2px] before:w-5 
          before:bg-nota-blue before:absolute before:top-1/4 before:left-0.5
          after:content[''] after:h-1/2 after:w-[2px] after:bg-nota-blue
          after:absolute after:left-0.5 after:translate-y-1/2 
          before:-translate-y-[2px] select-none font-bold"
      >
        <span className="text-nota-blue">(</span>
        <span className="text-nota-red">root🤫nota</span>
        <span className="text-nota-blue">)-[</span>
        <span className="text-nota-white">~</span>
        <span className="text-nota-blue">]</span>
      </div>

      <div
        className="ml-3 before:content[''] before:h-[2px] before:w-3 
          before:bg-nota-blue before:absolute before:top-[75%] before:left-0.5
          before:-translate-y-[2px] flex items-center gap-0"
      >
        <span className="text-nota-white ml-0.5 select-none font-bold">#</span>

        <div
          className={`text-nota-gray text-sm relative 
            ${
              props.showCursor &&
              `after:content[''] after:h-4 after:w-2 after:absolute 
              after:bg-nota-blue/[.8] after:translate-y-[10%] 
              after:animate-blink after:text-black`
            }`}
        >
          <span
            className="ml-2"
            dangerouslySetInnerHTML={{
              __html: formatText(props.text),
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Prompt;
