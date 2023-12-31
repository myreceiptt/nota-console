import { FC } from "react";
import { BsTerminal } from "react-icons/bs";
import { GrFormClose } from "react-icons/gr";

interface TerminalTitleProps {
  closeTerminal: () => void;
}

const TerminalTitle: FC<TerminalTitleProps> = (props) => {
  return (
    <div
      className="bg-nota-black/[.70] rounded-tl-md rounded-tr-md 
        text-nota-white font-nota font-semibold flex items-center 
        justify-between py-2.5 px-4 border-b-2 border-solid border-black/[.4]
        select-none shadow-sm relative"
    >
      <div className="text-base">
        <BsTerminal />
      </div>

      <div className="w-fit h-fit absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        impromptu: root@nota: ~
      </div>

      <div className="text-sm flex items-center justify-center gap-2">
        <div
          className="w-4 h-4 bg-nota-green border 
            border-solid border-black/[.3] rounded-full"
        />

        <div
          className="w-4 h-4 bg-nota-green border 
            border-solid border-black/[.3] rounded-full"
        />

        <button
          type="button"
          onClick={props.closeTerminal}
          className="cursor-pointer text-black w-4 h-4 bg-nota-white 
            border border-solid border-black/[.5] rounded-full
            font-bold hover:bg-nota-red hover:text-nota-black
            transition-all duration-150 text-base relative"
        >
          <div className="w-fit h-fit absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <GrFormClose />
          </div>
        </button>
      </div>
    </div>
  );
};

export default TerminalTitle;
