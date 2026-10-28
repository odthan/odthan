import type { Metadata } from 'next';
import { AuthForm } from '../AuthForm';
export const metadata: Metadata = { title: 'Connexion', robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string; error?: string }> }) {
  const sp = await searchParams;
  return <AuthForm mode="login" next={sp.next} notice={sp.reset ? 'reset' : sp.error ? 'link' : undefined} />;
}
