import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "내 최애 아티스트를 맞춰봐 | my-musician-test",
    description: "내가 좋아하는 아티스트 1위~10위 맞추기 테스트. 친구들과 순위를 맞춰보세요!",
    openGraph: {
        title: "내 최애 아티스트를 맞춰봐",
        description: "내가 좋아하는 아티스트 1위~10위 맞추기 테스트",
        images: ["/og-image-kakao.jpeg"], // Keeping existing image for now as requested to maintain file structure, but ideally should be replaced.
    },
};

export default function MusicianLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            style={
                {
                    "--color-primary": "#1DB954", // Spotify-like Green
                    "--color-primary-light": "#1ED760",
                    "--color-success": "#00C853",
                } as React.CSSProperties
            }
            className="min-h-screen w-full relative"
        >
            {/* Background blobs reusing the primary colors - scope them here if needed or relying on page.tsx to use vars */}
            {children}
        </div>
    );
}
