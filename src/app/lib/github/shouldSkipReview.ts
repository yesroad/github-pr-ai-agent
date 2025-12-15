import { IPullRequestReview } from "@/types/lib/github";
import { hasMarker } from "./reviewMarker";

interface IShouldSkipReviewByHeadSha {
  reviews: IPullRequestReview[];
  headSha: string;
}

function shouldSkipReviewByHeadSha({
  reviews,
  headSha,
}: IShouldSkipReviewByHeadSha): boolean {
  return reviews.some(
    (r) => typeof r.body === "string" && hasMarker({ body: r.body, headSha })
  );
}

export default shouldSkipReviewByHeadSha;
