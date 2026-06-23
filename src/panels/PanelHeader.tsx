type PanelHeaderProps = {
  title: string;
  description: string;
};

export function PanelHeader({ title, description }: PanelHeaderProps) {
  return (
    <header className="mb-6">
      <p className="font-rmc-mono text-xs tracking-[0.3em] text-rmc-aether uppercase">
        Cheat channel
      </p>
      <h3 className="mt-2 font-rmc-display text-3xl font-black text-rmc-mist">{title}</h3>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-rmc-slate">{description}</p>
    </header>
  );
}
