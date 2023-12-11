export default function getInformation(): {
  email: {
    owner: string;
  };
  url: {
    linkedIn: string;
    githubAccount: string;
    githubRepository: string;
    githubOrganization: string;
    githubFreeGamesCatcherCore: string;
    sizeUpDocumentation: string;
  };
} {
  return {
    email: {
      owner: "pillot.anthony@gmail.com",
    },
    url: {
      linkedIn: "https://www.linkedin.com/in/anthony-pillot",
      githubAccount: "https://github.com/anthonypillot",
      githubRepository: "https://github.com/anthonypillot/anthonypillotOS",
      githubOrganization: "https://github.com/size-up",
      githubFreeGamesCatcherCore: "https://github.com/size-up/freegamescatcher-core",
      sizeUpDocumentation: "https://docs.sizeup.cloud",
    },
  };
}
