import dotenv from "dotenv";
dotenv.config();

export const SECRET = process.env.SECRET;
export const EXPIRES_IN = process.env.EXPIRES_IN;

// 쿠키 설정
export const cookieOptions = {
  httpOnly: true, // XSS 공격으로부터 쿠키 보호됨 (자바스크립트 접근 불가)
  maxAge: 1000 * 60 * 60, // 1시간
  secure: true, // process.env.NODE_ENV === "production", //HTTPS 환경에서만 쿠키 전송, 민감 데이터 보호에 필수
  sameSite: "none", //process.env.NODE_ENV === "production" ? "none" : "strict", //크로스 사이트 요청 시 쿠키가 포함될 수 있는지
  /* 개발 중에는 엄격한 쿠키 정책으로 동작을 점검 (strict), 배포 후에는 실제 사용자 환경에 맞춰 유연하게 동작 (lax) */
  path: "/",
  // domain: ".yourdomain.com", // 필요 시 도메인 추가
};
