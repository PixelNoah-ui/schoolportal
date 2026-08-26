import Image from "next/image";

// Place this file at: components/auth/brand-panel.tsx

export function BrandPanel({
  eyebrow = "School Portal",
}: {
  eyebrow?: string;
  blurb?: string;
}) {
  return (
    <div className="relative hidden lg:flex flex-col justify-between bg-foreground text-background p-12 overflow-hidden">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 bg-primary" />
        <span className="text-sm tracking-[0.2em] uppercase text-background/70">
          {eyebrow}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 gap-8">
        <Image
          src="/logo.svg"
          alt="School Portal logo"
          width={320}
          height={213}
          className="w-72 h-auto"
          priority
        />
        <div className="text-center">
          <p className="text-3xl font-semibold tracking-wide">EDUCATION</p>
          <p className="mt-1 text-xs tracking-[0.3em] text-primary uppercase">
            PixelNoah
          </p>
        </div>
      </div>
    </div>
  );
}

export function MobileBrandMark({
  eyebrow = "School Portal",
}: {
  eyebrow?: string;
}) {
  return (
    <div className="mb-10 flex items-center gap-2 lg:hidden">
      <Image
        src="/logo.svg"
        alt="School Portal logo"
        width={56}
        height={37}
        className="w-14 h-auto"
        priority
      />
      <span className="text-sm font-semibold tracking-wide text-foreground">
        {eyebrow}
      </span>
    </div>
  );
}
