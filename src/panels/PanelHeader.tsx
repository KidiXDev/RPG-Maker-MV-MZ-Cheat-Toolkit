type PanelHeaderProps = {
  title: string;
  description: string;
};

export function PanelHeader({ title, description }: PanelHeaderProps) {
  return (
    <header className="mb-4">
      <h3 className="font-rmc-display text-3xl font-bold text-rmc-mist">{title}</h3>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-rmc-slate">{description}</p>
    </header>
  );
}
