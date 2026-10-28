import type { Metadata } from 'next';
import { AuthForm } from '../AuthForm';
export const metadata: Metadata = { title: 'Mot de passe oublié', robots: { index: false } };
export default function Page() { return <AuthForm mode="forgot" />; }
