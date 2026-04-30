import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  getPostBucketActor,
  getPostCoreActor,
  getUserActor,
} from "../lib/actors";

// Backend call surfaces are exported through React Context so call sites
// consume them via hook + provider boundary, not via direct module imports.
// Tests / mocks swap the provider value to substitute fake actors.
// Per decision #18.
export type ActorsValue = {
  getPostCoreActor: typeof getPostCoreActor;
  getUserActor: typeof getUserActor;
  getPostBucketActor: typeof getPostBucketActor;
};

const ActorsContext = createContext<ActorsValue | null>(null);

export function ActorsProvider({ children }: { children: ReactNode }) {
  const value = useMemo<ActorsValue>(
    () => ({ getPostCoreActor, getUserActor, getPostBucketActor }),
    [],
  );
  return <ActorsContext.Provider value={value}>{children}</ActorsContext.Provider>;
}

export function useActors(): ActorsValue {
  const v = useContext(ActorsContext);
  if (!v) {
    throw new Error("useActors() must be used inside <ActorsProvider>");
  }
  return v;
}
