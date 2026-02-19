import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import QuizClient from "./QuizClient";

type Props = {
    params: Promise<{ slug: string }>;
};

async function getQuizFromDB(slug: string) {
    const { data: quiz } = await supabase
        .from("quizzes")
        .select("title, items")
        .eq("slug", slug)
        .single();

    if (!quiz) return null;

    const { data: items } = await supabase
        .from("quiz_items")
        .select("name, rank")
        .eq("quiz_id", (quiz as any).id)
        .order("rank", { ascending: true });

    return {
        ...quiz,
        items: (items || []).map((i) => i.name)
    };
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const { slug } = await params;

    const { data: quiz } = await supabase
        .from("quizzes")
        .select("title")
        .eq("slug", slug)
        .single();

    if (!quiz) {
        return {
            title: "퀴즈를 찾을 수 없습니다",
        };
    }

    let ogTitle = quiz.title;
    if (quiz.title.includes("의 최애 아티스트 TOP 10")) {
        const name = quiz.title.split("의 최애 아티스트 TOP 10")[0];
        ogTitle = `${name}의 최애 아티스트를 맞춰봐`;
    }

    return {
        title: ogTitle,
        openGraph: {
            title: ogTitle,
            description: "친구의 음악 취향을 얼마나 잘 알고 있나요? 지금 도전해보세요!",
            images: [
                {
                    url: "/og-image-kakao2.jpeg",
                    width: 800,
                    height: 400,
                    alt: "내 최애 아티스트를 맞춰봐"
                }
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: ogTitle,
            description: "친구의 음악 취향을 얼마나 잘 알고 있나요? 지금 도전해보세요!",
            images: ["/og-image-kakao2.jpeg"],
        },
    };
}

export default async function Page({ params }: Props) {
    const { slug } = await params;
    const quiz = await getQuizFromDB(slug);

    return <QuizClient slug={slug} initialData={quiz} />;
}
