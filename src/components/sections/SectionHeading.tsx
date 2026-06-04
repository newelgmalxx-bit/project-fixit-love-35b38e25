type Props = {
  kicker?: string;
  title: string;
  description?: string;
  align?: "center" | "start";
};

export function SectionHeading({ kicker, title, description, align = "center" }: Props) {
  const isCenter = align === "center";
  return (
    <div className={isCenter ? "mx-auto max-w-2xl text-center" : "me-auto max-w-2xl text-start"}>
      {kicker && (
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          {kicker}
        </span>
      )}
      <h2 className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">
        {title}
      </h2>
      <div className={`mt-3 h-[3px] w-12 rounded-full bg-primary ${isCenter ? "mx-auto" : ""}`} />
      {description && (
        <p className="mt-4 text-sm text-muted-foreground sm:text-base">{description}</p>
      )}
    </div>
  );
}
