import Link from "next/link";

type BigLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "red" | "black" | "light";
};

export function BigLink({ href, children, variant = "light" }: BigLinkProps) {
  const styles = {
    red: "bg-scoreRed text-white",
    black: "bg-scoreBlack text-white",
    light: "bg-white text-night border border-night/15",
  };

  return (
    <Link
      href={href}
      className={`flex min-h-16 items-center justify-center rounded-lg px-5 py-4 text-center text-xl font-black shadow-sm active:scale-[0.99] ${styles[variant]}`}
    >
      {children}
    </Link>
  );
}
