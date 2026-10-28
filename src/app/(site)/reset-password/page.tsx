import type { Metadata } from 'next';
import { AuthForm } from '../AuthForm';
export const metadata: Metadata = { title: 'Nouveau mot de passe', robots: { index: false } };
export default function Page() { return <AuthForm mode="reset" />; }
