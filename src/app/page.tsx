"use client"
import { useEffect, useState } from "react";

export default function Home() {
  const [state,  setState] = useState<string>("");

  useEffect(() => queueMicrotask(async () => {
    const res = await (await fetch('/api/hello')).json();

    setState(res.message);
  }));

  return <h1>{state}</h1>;
}
