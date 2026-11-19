interface Crumb {
  label: string;
  href?: string;
}

/**
 * 全站统一的页面层级条：左侧返回上一级，右侧面包屑。
 * 页面内容仍由各页面自己的 .page 容器渲染，这里只负责导航。
 */
export function PageNav({ trail, back }: { trail: Crumb[]; back: { label: string; href: string } }) {
  return (
    <div class="container page-nav">
      <a class="page-back" href={back.href} aria-label={`返回${back.label}`}>
        返回{back.label}
      </a>
      <nav class="breadcrumbs" aria-label="面包屑">
        {trail.map((item, index) => (
          <span class="crumb" key={`${item.label}-${index}`}>
            {index > 0 && (
              <span class="crumb-sep" aria-hidden="true">
                /
              </span>
            )}
            {item.href ? (
              <a href={item.href}>{item.label}</a>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
}
