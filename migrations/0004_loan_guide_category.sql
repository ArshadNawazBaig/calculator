UPDATE blog_posts
SET category = 'Finance', updated_at = now(), version = version + 1
WHERE slug = 'loan-calculator-extra-payments' AND category = 'Math';
