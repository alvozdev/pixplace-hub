import { GlowAvatar, Reveal } from "@/components/fx";
import LoginForm from "./form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <Reveal className="mx-auto mt-10 max-w-sm sm:mt-20">
      <div className="glass-card space-y-6 p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <GlowAvatar label="px" size={64} />
          <div>
            <h1 className="text-gradient font-display text-2xl font-semibold tracking-tight">pix place hub</h1>
            <p className="mt-0.5 font-mono text-[11px] text-muted">генерация · публикация · ниши</p>
          </div>
        </div>
        <p className="text-sm text-muted">Панель закрыта паролем: в ней хранятся ключи от всех площадок.</p>
        <LoginForm next={next ?? "/"} />
      </div>
    </Reveal>
  );
}
