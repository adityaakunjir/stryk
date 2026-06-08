import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, User, Trophy, XCircle, MinusCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Team Not Found | STRYK" };
}

export default async function TeamProfilePage({ params }: Props) {
  notFound();
}
