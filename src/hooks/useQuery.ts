import { useEffect, useRef, useState } from "react";

type State<T> = { data?: T; error?: string; loading: boolean };

export function useQuery<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [state, setState] = useState<State<T>>({ loading: true });
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    setState({ loading: true });
    fn()
      .then((data) => alive.current && setState({ loading: false, data }))
      .catch((e) => alive.current && setState({ loading: false, error: e?.message ?? "Error" }));
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
