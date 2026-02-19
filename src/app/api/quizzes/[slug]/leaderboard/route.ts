import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .select("id")
        .eq("slug", slug)
        .single();

    if (quizError || !quiz) {
        return NextResponse.json(
            { error: "퀴즈를 찾을 수 없습니다." },
            { status: 404 }
        );
    }

    const { data: rows, error } = await supabase
        .from("submissions")
        .select("nickname, score, created_at")
        .eq("quiz_id", quiz.id)
        .order("score", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(100);

    if (error) {
        return NextResponse.json(
            { error: "리더보드를 불러오는데 실패했습니다." },
            { status: 500 }
        );
    }

    const response = NextResponse.json({
        rows: (rows || []).map((r) => ({
            nickname: r.nickname,
            score: r.score,
        })),
    });

    response.headers.set("Cache-Control", "s-maxage=60, stale-while-revalidate");
    return response;
}
