/*post 부분 */
import multer from "multer"; // 프론트엔드에서 전달된 첨부파일 업로드 처리하기 위해 사용
import path from "path";

//파일이 저장 돌 위치 정하기
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); //첫번째 인자는 오류객체 넣는 곳 두번째는 파일이 저장될 폴더 경로 지정
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }, //파일 이름 설정 무작위 수를 반환 + 업로드된 원본 파일의 확장자 불러와 생성
});

export const upload = multer({ storage });
