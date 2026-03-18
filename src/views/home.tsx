import type { FC } from 'hono/jsx';
import { Layout } from './layout';
import type { Category } from '../types';

interface HomeProps {
  categories: Category[];
  error: string;
  isCfError: boolean;
}

export const HomePage: FC<HomeProps> = ({ categories, error, isCfError }) => (
  <Layout title="VOZ Reader">
    {error ? (
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <p class="error-text">{error}</p>
        {isCfError && (
          <p class="error-sub">
            Bạn cần <a href="/settings">cập nhật cookie</a> từ trình duyệt.
          </p>
        )}
        <a href="/" class="btn btn-primary">Thử lại</a>
      </div>
    ) : (
      <div class="home-page">
        {categories.map((cat) => (
          <section class="category">
            <h2 class="category-title">{cat.title}</h2>
            <div class="forum-list">
              {cat.forums.map((forum) => (
                <a href={`/box/${forum.id}`} class="forum-card">
                  <div class="forum-card-title">{forum.title}</div>
                  {forum.description && (
                    <div class="forum-card-desc">{forum.description}</div>
                  )}
                  {forum.subForums.length > 0 && (
                    <div class="forum-card-subs">
                      {forum.subForums.map((sub) => (
                        <span class="sub-tag">{sub.title}</span>
                      ))}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    )}
  </Layout>
);
