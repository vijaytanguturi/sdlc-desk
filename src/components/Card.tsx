import type { ReactNode } from 'react';

export function Card({
  children,
  className,
  as: Tag = 'section',
}: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article' | 'aside';
}) {
  return (
    <Tag className={['card', className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </Tag>
  );
}

export function CardHead({
  title,
  description,
  actions,
  id,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <div className="card__head">
      <div className="card__head-text">
        <h2 className="card__title" id={id}>
          {title}
        </h2>
        {description ? <p className="card__desc">{description}</p> : null}
      </div>
      {actions ? <div className="card__actions">{actions}</div> : null}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={['card__body', className ?? ''].filter(Boolean).join(' ')}>{children}</div>;
}

export function CardFoot({ children }: { children: ReactNode }) {
  return <div className="card__foot">{children}</div>;
}
