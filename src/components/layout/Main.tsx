import { FC, ReactElement } from "react";
import { Analytics } from '@vercel/analytics/react';

interface MainProps {
  children: ReactElement;
}

const Main: FC<MainProps> = ({ children }) => {
  return (
    <main className="h-[74%] w-[99%] md:w-[88%] lg:w-[77%] xl:w-[74%]">
      {children}
      <Analytics />
    </main>
  );
};

export default Main;
