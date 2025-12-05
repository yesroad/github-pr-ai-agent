import { createAppJwt } from "./appAuthentication";

/**
 * 단순히 JWT가 잘 만들어지는지 콘솔에 찍어보는 테스트 함수.
 * (실제 API 호출은 다음 단계에서 구현)
 */
export function logAppJwt() {
  const jwt = createAppJwt();
  console.log("GitHub App JWT:", jwt);
}
