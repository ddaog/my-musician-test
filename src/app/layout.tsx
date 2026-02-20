import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
    title: "내 최애 아티스트를 맞춰봐 | my-musician-test",
    description: "내가 좋아하는 아티스트 1위~10위 맞추기 테스트. 친구들과 순위를 맞춰보세요!",
    metadataBase: new URL("https://my-musician-test.vercel.app"),
    openGraph: {
        title: "내 최애 아티스트를 맞춰봐",
        description: "내가 좋아하는 아티스트 1위~10위 맞추기 테스트",
        url: "https://my-musician-test.vercel.app",
        siteName: "My Musician Test",
        images: [
            {
                url: "/og-image-kakao2.jpeg",
                width: 800,
                height: 400,
                alt: "내 최애 아티스트를 맞춰봐",
            },
        ],
        locale: "ko_KR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "내 최애 아티스트를 맞춰봐",
        description: "내가 좋아하는 아티스트 1위~10위 맞추기 테스트",
        images: ["/og-image-kakao2.jpeg"],
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
                />
            </head>
            <body className="antialiased">
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-5RXN89H4V0"
                    strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());

                        gtag('config', 'G-5RXN89H4V0');
                    `}
                </Script>
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
                    {children}
                </div>
            </body>
        </html>
    );
}
