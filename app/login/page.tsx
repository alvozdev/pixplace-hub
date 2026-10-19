import LoginForm from "./form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto mt-16 max-w-sm space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Вход в пульт</h1>
        <p className="mt-1 text-sm text-muted">Панель закрыта паролем: в ней хранятся ключи от всех площадок.</p>
      </div>
      <LoginForm next={next ?? "/"} />
    </div>
  );
}
