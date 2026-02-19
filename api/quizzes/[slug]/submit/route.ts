import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateScore } from "@/lib/score";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        const body = await request.json();
        const { nickname, answers } = body;

        if (!nickname || !Array.isArray(answers) || answers.length !== 10) {
            return NextResponse.json(
                { error: "nickname과 answers(10개)가 필요합니다." },
                { status: 400 }
            );
        }

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

        const { data: correctItems } = await supabase
            .from("quiz_items")
            .select("name, rank")
            .eq("quiz_id", quiz.id);

        const correctRankMap = new Map<string, number>();
        for (const item of correctItems || []) {
            correctRankMap.set(item.name, item.rank);
        }

        const score = calculateScore(correctRankMap, answers);

        const { data: submission, error: subError } = await supabase
            .from("submissions")
            .insert({
                quiz_id: quiz.id,
                nickname: String(nickname).trim().slice(0, 50),
                score,
            })
            .select("id")
            .single();

        if (subError) {
            console.error(subError);
            return NextResponse.json(
                { error: "제출에 실패했습니다." },
                { status: 500 }
            );
        }

        const submissionItems = answers.map(
            (a: { name: string; rank: number }) => ({
                submission_id: submission.id,
                name: String(a.name),
                selected_rank: a.rank,
            })
        );

        await supabase.from("submission_items").insert(submissionItems);

        return NextResponse.json({
            submissionId: submission.id,
            score,
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
