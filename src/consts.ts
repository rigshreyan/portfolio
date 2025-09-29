export const ROUTES = [
  { href: "/", label: "Portfolio" },
] as const;


export const PERSONAL_INFO = {
  name: "Shreyan Sengupta",
  title: "Shreyan Sengupta",
  subtitle: "Portfolio & Projects",
  role: "Developer & Creator",
  contact: "mailto:hello@shreyansengupta.com",
  avatar: "/avatar.png",
} as const;

export const SEO_INFO = [
  {
    name: "description",
    content: "Portfolio and projects by Shreyan Sengupta - Developer & Creator",
  },
  { name: "keywords", content: "Portfolio, Web Development, Projects, Software Engineer" },
  { name: "author", content: PERSONAL_INFO.name },
];
