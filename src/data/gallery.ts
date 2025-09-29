export interface GalleryItem {
  label: string;
  href: string;
  category?: string;
}

export const galleryItems: GalleryItem[] = [
  {
    label: "E-Commerce Platform",
    href: "/gallery/sample1.png",
    category: "web"
  },
  {
    label: "Brand Identity Design",
    href: "/gallery/sample2.png",
    category: "design"
  },
  {
    label: "React Dashboard",
    href: "/gallery/sample3.png",
    category: "web"
  },
  {
    label: "Mobile App UI",
    href: "/gallery/sample4.png",
    category: "mobile"
  }
];

export const categories = [
  { value: "all", label: "All" },
  { value: "web", label: "Web Development" },
  { value: "design", label: "Design" },
  { value: "mobile", label: "Mobile Apps" }
];