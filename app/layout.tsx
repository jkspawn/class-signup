import type { Metadata } from "next";
import { Gowun_Dodum, Nanum_Pen_Script } from "next/font/google";
import "./globals.css";

// 제목: 펜 손글씨 / 본문: 부드러운 돋움
const hand = Nanum_Pen_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hand",
  preload: false,
});

const body = Gowun_Dodum({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-body",
  preload: false,
});

export const metadata: Metadata = {
  title: "원데이 클래스 신청",
  description: "정원이 정해진 원데이 클래스 신청 페이지",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${hand.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
