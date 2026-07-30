export type Project = {
  id: string
  title: string
  menuName: string
  zone: string
  blurb: string
  tags: string[]
  demoUrl: string
  repoUrl: string
  accent: string
}

export type ShopData = {
  shopName: string
  tagline: string
  attribution: string
  contact: {
    github: string
    linkedin: string
    email: string
  }
  projects: Project[]
}
