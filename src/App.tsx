import Main from "./components/layout/Main";
import TerminalContainer from "./components/terminal/TerminalContainer";

const App = () => {
  return (
    <div
      className="w-screen h-screen overflow-hidden bg-nota bg-contain 
        bg-center flex items-center justify-center flex-col gap-6"
    >
      <Main>
        <TerminalContainer />
      </Main>
    </div>
  );
};

export default App;
