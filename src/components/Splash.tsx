import { useEffect, useState } from 'react';

interface Props {
  onDone: () => void;
}

/** Opening TiPi wordmark — orange→red gradient, fades into the app. */
export function Splash({ onDone }: Props) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 1500);
    const t2 = setTimeout(onDone, 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className={`splash ${leaving ? 'splash-leaving' : ''}`}
      onClick={() => {
        setLeaving(true);
        setTimeout(onDone, 400);
      }}
    >
      <div className="splash-mark">TiPi</div>
      <div className="splash-tag">Rentals, scored 1–10.</div>
    </div>
  );
}
