export const categorySlug=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const toolHref = (tool: {slug: string; href?: string}) => tool.href || `/${tool.slug}`;
