import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import PropertyDetail from '@/components/PropertyDetail';

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  return <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><a className="text-blue-700 underline underline-offset-2" href="/">← All listings</a><PropertyDetail id={id} /></main>;
}
