import type { Metadata } from 'next';
import { AuthForm } from '../AuthForm';
export const metadata: Metadata = { title: 'Créer un compte', robots: { index: false } };
export default function Page() { return <AuthForm mode="register" />; }
