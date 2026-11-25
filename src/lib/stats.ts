import {portfolioStartYear} from "../data/stats.ts";

export function getActiveYears(startYear:number,currentYear:number):number {
  return Math.max(0,currentYear-startYear);
}

export function getPortfolioStats(
  projects:readonly {id:string}[],
  technologies:readonly {id:string}[],
  currentYear:number,
) {
  return {
    projectCount:new Set(projects.map(project=>project.id)).size,
    technologyCount:new Set(technologies.map(technology=>technology.id)).size,
    yearsActive:getActiveYears(portfolioStartYear,currentYear),
  };
}
