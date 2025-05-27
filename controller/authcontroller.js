// 회원가입
export const register = async (req, res) => {
  const { email, nickname, password } = req.body; // 요청받은 데이터

  try {
    const exists = await User.findOne({ email }); // 중복 이메일 확인
    if (exists)
      return res.status(409).json({ message: "이미 사용 중인 이메일입니다." });

    // 중복된 이메일이 없다면
    const hashed = await bcrypt.hash(password, parseInt(SALT)); // 비밀번호 암호화(SALT이용)
    await new User({ email, nickname, password: hashed }).save(); // user에 저장

    return res.status(201).json({ message: "회원가입 성공" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "서버 에러" });
  }
};

// 로그인
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(409).json({ message: "등록된 이메일이 없습니다." });
    const match = await bcrypt.compare(password, user.password); // 입력한 비번과 해시된 비번 비교
    if (!match)
      return res
        .status(409)
        .json({ message: "등록된 이메일에 패스워드가 다릅니다." });
    else {
      const { _id, email, nickname } = user; // mongoDb에서 가져옴
      const payload = { email, nickname }; // JWT 페이로드 생성//
      const token = jwt.sign(payload, SECRET, {
        expiresIn: EXPIRES_IN,
      });
      res.cookie("token", token, cookieOptions).json({ email, nickname, _id });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "서버 에러" });
  }
};

//프로필 조회

export const getProfile = async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ message: "인증 토큰이 없습니다" });
  }

  try {
    const decoded = jwt.verify(token, SECRET); //토큰 유효한지 검증 후 복호화 해서 꺼내옴  iat : 토큰 발급시간 exp : 토큰 만료시간
    const { email } = decoded;
    const user = await User.findOne({ email }).select("-password"); // 비밀번호 제외하고 가져옴 (비밀번호는 프론트에 전달 시 보안 문제)
    if (!user) {
      return res
        .status(404)
        .json({ message: "사용자 정보를 찾을 수 없습니다" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "유효하지 않은 토큰입니다" });
  }
};

//로그아웃
export const logout = async (req, res) => {
  res
    .clearCookie("token", {
      ...cookieOptions,
      maxAge: 0,
    })
    .json({ message: "로그아웃 되었습니다" });
};
