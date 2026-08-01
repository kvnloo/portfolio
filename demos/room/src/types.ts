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
  /** boplog project id when synced from build-log data */
  boplogId?: string
  date?: string
  company?: string
  portfolio?: string
  portfolioName?: string
  product?: string
  productName?: string
  featured?: boolean
  featuredRank?: number
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
  /** Parallel archive: same public project data as boplog */
  boplogUrl?: string
  projects: Project[]
}
