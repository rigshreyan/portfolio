export const ROUTES = [
  { href: "/", label: "Portfolio" },
  { href: "/about", label: "About" },
] as const;


export const PERSONAL_INFO = {
  name: "Shreyan Sengupta",
  title: "Shreyan Sengupta",
  subtitle: "Portfolio & Projects",
  role: "Developer & Creator",
  contact: "mailto:hello@shreyansengupta.com",
  avatar: "/avatar.png",
  about: `I'm a developer who builds things for the web. This is where I keep my work: photos, projects, and experiments. Some of it's practical, some of it's just for fun.`,
} as const;

export const SEO_INFO = [
  {
    name: "description",
    content: "Portfolio and projects by Shreyan Sengupta - Developer & Creator",
  },
  { name: "keywords", content: "Portfolio, Web Development, Projects, Software Engineer" },
  { name: "author", content: PERSONAL_INFO.name },
];
