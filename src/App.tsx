import Main from "./components/layout/Main";
import ModeShell from "./components/layout/ModeShell";

const App = () => {
  return (
    <div
      className="w-screen h-screen overflow-hidden bg-nota bg-cover 
        bg-center bg-no-repeat flex items-center justify-center flex-col gap-6"
    >
      <Main>
        <ModeShell />
      </Main>
    </div>
  );
};

export default App;
