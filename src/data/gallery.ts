export interface GalleryItem {
  label: string;
  href: string;
  category?: string;
}

export const galleryItems: GalleryItem[] = [
  {
    label: "Travel",
    href: "/gallery/sample1.png",
    category: "web"
  },
  {
    label: "B&W",
    href: "/gallery/sample2.png",
    category: "design"
  },
  {
    label: "Street",
    href: "/gallery/sample3.png",
    category: "web"
  },
  {
    label: "Landscape",
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