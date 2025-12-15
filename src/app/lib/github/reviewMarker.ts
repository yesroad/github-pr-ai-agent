interface IMarkerToBody {
  body: string;
  headSha: string;
}

/**
 * @description PR 리뷰 본문에 숨겨서 남길 마커
 */
export function makeReviewMarker(headSha: string): string {
  return `<!-- pr-ai-reviewer headSha:${headSha} -->`;
}

export function attachMarkerToBody({ body, headSha }: IMarkerToBody): string {
  const marker = makeReviewMarker(headSha);

  return `${body}\n\n${marker}\n`;
}

export function hasMarker({ body, headSha }: IMarkerToBody): boolean {
  const marker = makeReviewMarker(headSha);

  return body.includes(marker);
}
