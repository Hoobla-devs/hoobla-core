export type TCompany = {
  id: string;
  name: string;
  ssn: string;
  phone: string;
  address: {
    address: string;
    postcode: string;
    city: string;
  };
  website: string;
  size: number;
  employees: DocumentReference<UserContext>[]; // TODO:   DocumentReference<TProgramWrite, DocumentData>;
  invites: TInvite[];
  jobs: DocumentReference<Job>[];
  logo: { url: string };
  creator: DocumentReference<UserContext>;
};

export type TInvite = {
  token: string;
  email: string;
  date: Date;
};
