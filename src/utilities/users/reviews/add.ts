import { addDoc, collection } from "firebase/firestore";
import { reviewConverter } from "../../../converters/user";
import { db } from "../../../firebase/init";
import { TCompany } from "../../../types/companyTypes";
import { TJob } from "../../../types/jobTypes";
import { TReview } from "../../../types/userTypes";

export async function addReview(
  job: TJob,
  company: TCompany,
  employerName: string,
  reviewData: { stars: number; text: string }
) {
  const review: TReview = {
    ...reviewData,
    id: "",
    jobTitle: job.name,
    jobDescription: job.description,
    jobInfo: {
      start: job.jobInfo.start,
      end: job.jobInfo.end,
      percentage: job.jobInfo.percentage,
      numOfHours: job.jobInfo.numOfHours,
    },
    companyInfo: {
      name: company.name,
      employerName,
      logo: company.logo.url,
    },
    show: false,
    date: new Date(),
  };

  return await addDoc(
    collection(db, "users", job.freelancers[0].id, "reviews").withConverter(
      reviewConverter
    ),
    review
  )
    .then(() => true)
    .catch(() => false);
}
