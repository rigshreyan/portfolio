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
  about: `Welcome to my portfolio. I'm a developer and creator passionate about building
    meaningful digital experiences. Explore my work, projects, and creative endeavors
    through this curated collection.`,
} as const;

export const SEO_INFO = [
  {
    name: "description",
    content: "Portfolio and projects by Shreyan Sengupta - Developer & Creator",
  },
  { name: "keywords", content: "Portfolio, Web Development, Projects, Software Engineer" },
  { name: "author", content: PERSONAL_INFO.name },
];
